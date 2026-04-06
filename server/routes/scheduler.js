/**
 * server/routes/scheduler.js
 * The AI scheduling algorithm — runs on the server.
 * Frontend sends data, server returns a schedule.
 *
 * POST /api/schedule  — generate today's schedule
 *
 * REQUEST BODY:
 *   { userId? }  — in future will use userId to load data
 *
 * For now loads everything from DB directly.
 */

const express = require("express");
const router  = express.Router();
const db      = require("../database");

// ── Time helpers ──────────────────────────────────────────────────
const toMins = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  if (h === 0 && m === 0) return 24 * 60;
  return h * 60 + m;
};

const toTime = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const todayStr = () => DAYS[new Date().getDay()];

const hourLabel = (h) =>
  h < 6 ? "night" : h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";

const daysUntil = (d) =>
  Math.max(0, Math.ceil((new Date(d) - new Date()) / 86400000));

// ── XP formula ────────────────────────────────────────────────────
const calcXP = (difficulty, plannedMins, actualMins) => {
  const ratio = Math.min(actualMins / plannedMins, 1);
  if (ratio < 0.3) return 0;
  return Math.round(difficulty * plannedMins * 0.5 * ratio);
};

// ── Pattern learning from history ────────────────────────────────
function learnPattern(subjectId) {
  const history = db.prepare(
    "SELECT * FROM study_history WHERE subject_id = ?"
  ).all(subjectId);

  if (history.length < 3) {
    return { bestTime: null, worstTime: null, ghostRate: 0, avgCompletion: null, hasData: false };
  }

  const total       = history.length;
  const ghostRate   = history.filter(h => h.ghosted).length / total;
  const avgCompletion = history.filter(h => h.completed).length / total;

  const timeCounts = {}, ghostTimes = {};
  history.filter(h => h.completed).forEach(h => {
    timeCounts[h.time_of_day] = (timeCounts[h.time_of_day] || 0) + 1;
  });
  history.filter(h => h.ghosted).forEach(h => {
    ghostTimes[h.time_of_day] = (ghostTimes[h.time_of_day] || 0) + 1;
  });

  const bestTime  = Object.entries(timeCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;
  const worstTime = Object.entries(ghostTimes).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;

  return { bestTime, worstTime, ghostRate, avgCompletion, hasData: true };
}

// ── Score a subject ───────────────────────────────────────────────
function scoreSubject(subject, topics, exams, nowLabel) {
  const pattern = learnPattern(subject.id);

  // 1. Difficulty
  const diffScore = subject.difficulty / 5;

  // 2. Urgency — nearest exam for this subject
  const linkedExams = exams.filter(e => e.subjectIds.includes(subject.id));
  const allDates = linkedExams.flatMap(e => [
    e.date, ...(e.subExams || []).map(s => s.date)
  ]).filter(Boolean);
  const minDays = allDates.length ? Math.min(...allDates.map(daysUntil)) : 999;
  const urgency = minDays < 7 ? 3.0 : minDays < 14 ? 2.0 : minDays < 30 ? 1.5 : 1.0;

  // 3. Engagement
  const engagement = pattern.hasData
    ? Math.max(0.4, 1 - pattern.ghostRate * 0.5)
    : 1.0;

  // 4. Time of day bonus
  let timeMultiplier = 1.0;
  if (pattern.hasData) {
    if (pattern.bestTime  === nowLabel) timeMultiplier += 0.3;
    if (pattern.worstTime === nowLabel) timeMultiplier -= 0.2;
    if (pattern.avgCompletion !== null && pattern.avgCompletion < 0.4) timeMultiplier += 0.15;
  }

  // 5. Session + break lengths
  const bracket     = pattern.hasData ? Math.floor(pattern.ghostRate / 0.2) : 0;
  const sessionMins = Math.max(45, 90 - bracket * 10);
  const breakMins   = minDays < 7 ? 10 : minDays < 14 ? 15 : 20;

  const score = diffScore * urgency * engagement * timeMultiplier;
  return { score, sessionMins, breakMins, minDays, urgency, pattern };
}

// ── Get next topic not done recently ─────────────────────────────
function getNextTopic(subject, topics, usedToday) {
  if (!topics.length) return { name: "General Study", difficulty: "medium", isRevision: false };

  const recentDone = new Set(
    db.prepare(
      "SELECT topic FROM study_history WHERE subject_id = ? AND completed = 1 ORDER BY date DESC LIMIT 20"
    ).all(subject.id).map(r => r.topic)
  );

  const next = topics.find(t => !recentDone.has(t.name) && !usedToday.has(t.name));
  if (next) return { name: next.name, difficulty: next.difficulty, isRevision: false };

  // All done — revision mode, hardest first
  const hardest = [...topics].sort((a,b) => {
    const order = { hard:3, medium:2, easy:1 };
    return (order[b.difficulty]||2) - (order[a.difficulty]||2);
  })[0];
  return { name: hardest.name, difficulty: hardest.difficulty, isRevision: true };
}

// ── Build AI reason string ────────────────────────────────────────
function buildReason(subject, meta, topicInfo) {
  const parts = [];
  if (meta.urgency >= 2)                           parts.push(`exam in ${meta.minDays}d`);
  if (topicInfo.difficulty === "hard")             parts.push("hard topic prioritised");
  if (topicInfo.isRevision)                        parts.push("revision mode");
  if (meta.pattern.hasData && meta.pattern.bestTime) parts.push("your best focus time");
  if (meta.pattern.hasData && meta.pattern.ghostRate > 0.3) parts.push("short session (past patterns)");
  if (subject.difficulty >= 4 && !parts.length)   parts.push("high difficulty subject");
  return parts.join(" · ") || "scheduled by priority engine";
}

// ── Main schedule builder ─────────────────────────────────────────
function buildSchedule() {
  // Load everything from DB
  const settings = db.prepare("SELECT * FROM user_settings WHERE id = 1").get();
  const subjects  = db.prepare("SELECT * FROM subjects").all();
  const allTopics = db.prepare("SELECT * FROM topics").all();
  const exams     = db.prepare("SELECT * FROM exams ORDER BY date").all().map(e => ({
    ...e,
    subjectIds: db.prepare("SELECT subject_id FROM exam_subjects WHERE exam_id = ?")
                  .all(e.id).map(r => r.subject_id),
    subExams:   db.prepare("SELECT * FROM sub_exams WHERE parent_id = ?").all(e.id),
  }));
  const slots = db.prepare(
    "SELECT * FROM timetable_slots WHERE day = ? ORDER BY start"
  ).all(todayStr());

  if (!subjects.length) return [];

  // Find free time today
  const wake  = toMins(settings?.wake_time  || "07:00");
  const sleep = toMins(settings?.sleep_time || "22:00");
  const free  = [];
  let cursor  = wake;

  for (const slot of slots) {
    if (cursor < toMins(slot.start)) free.push({ start: cursor, end: toMins(slot.start) });
    cursor = Math.max(cursor, toMins(slot.end));
  }
  if (cursor < sleep) free.push({ start: cursor, end: sleep });
  if (!free.length) return [];

  // Score subjects
  const nowLabel = hourLabel(new Date().getHours());
  const scored = subjects
    .map(s => ({
      ...s,
      topics: allTopics.filter(t => t.subject_id === s.id),
      _m: scoreSubject(s, allTopics.filter(t => t.subject_id === s.id), exams, nowLabel),
    }))
    .sort((a, b) => b._m.score - a._m.score);

  // Fill free slots
  const tasks = [];
  const usedTopics = {};
  let lastSubjectId = null;

  for (const slot of free) {
    let c = slot.start;
    let attempts = 0;

    while (c < slot.end && attempts < scored.length * 4) {
      attempts++;
      const candidate = scored.find(s => {
        if (s.id === lastSubjectId && scored.length > 1) return false;
        return c + s._m.sessionMins <= slot.end;
      });
      if (!candidate) break;

      if (!usedTopics[candidate.id]) usedTopics[candidate.id] = new Set();
      const topicInfo = getNextTopic(candidate, candidate.topics, usedTopics[candidate.id]);
      usedTopics[candidate.id].add(topicInfo.name);

      const meta = candidate._m;
      tasks.push({
        subjectId:    candidate.id,
        subjectName:  candidate.name,
        color:        candidate.color,
        topic:        topicInfo.name,
        topicDiff:    topicInfo.difficulty,
        isRevision:   topicInfo.isRevision,
        start:        toTime(c),
        end:          toTime(c + meta.sessionMins),
        durationMins: meta.sessionMins,
        breakMins:    meta.breakMins,
        score:        meta.score.toFixed(1),
        aiReason:     buildReason(candidate, meta, topicInfo),
        status:       "pending",
        pomoDone:     0,
        ghostCount:   0,
        locked:       false,
        actualMins:   0,
        xp:           Math.round(candidate.difficulty * meta.sessionMins * 0.5),
      });

      c += meta.sessionMins + meta.breakMins;
      lastSubjectId = candidate.id;
    }
  }

  return tasks;
}

// ── Route ─────────────────────────────────────────────────────────
router.post("/", (req, res) => {
  try {
    const schedule = buildSchedule();
    res.json(schedule);
  } catch (err) {
    console.error("Scheduler error:", err);
    res.status(500).json({ error: "Failed to generate schedule." });
  }
});

module.exports = router;
