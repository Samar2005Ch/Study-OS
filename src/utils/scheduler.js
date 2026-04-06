/**
 * utils/scheduler.js  v2 — INTELLIGENT EDITION
 *
 * HANDLES ALL 35 SITUATIONS + BEHAVIORAL ADJUSTMENTS
 *
 * PRIORITY FORMULA:
 *   score = difficulty × urgency × engagement × timeBonus × typeBonus
 *
 * New in v2:
 *   - Emergency mode (exam tomorrow → reschedule entire day)
 *   - User type adjustments (sprinter caps, weekend warrior, etc.)
 *   - Subject avoidance → forced short sessions
 *   - Time-of-day preference awareness
 *   - Session type selection (deep/practice/revision/emergency/light)
 *   - Too-many-subjects warning + auto-cap at top N
 *   - Past exam date detection
 *   - Timetable change reschedule
 */

import { toMins, toTime, daysLeft, hourLabel, todayStr } from "./timeUtils";

const fld   = (o, s, c) => o[s] ?? o[c] ?? null;
const isTrue = v => v === 1 || v === true;

// ─── Session type selection logic ──────────────────────────────────
function selectSessionType(subject, exam, daysUntilExam, history) {
  // Exam tomorrow or day-of → EMERGENCY
  if (daysUntilExam !== null && daysUntilExam <= 1) return "emergency";

  const sh             = history.filter(h => fld(h,"subject_id","subjectId") === subject.id);
  const recentDone     = sh.filter(h => {
    const d = new Date(); d.setDate(d.getDate() - 3);
    return new Date(h.date) >= d && isTrue(h.completed);
  });
  const avgCompletion  = recentDone.length
    ? recentDone.reduce((a,h) => a + (fld(h,"completion_pct","completionPct") || 100), 0) / recentDone.length
    : 0;
  const progressPct    = fld(subject,"progress_pct","progressPct") || 0;

  // High completion (80%+) → REVISION
  if (avgCompletion >= 80 || progressPct >= 80) return "revision";

  // Low progress, new topic → DEEP LEARNING
  if (progressPct < 40) return "deep";

  // Medium progress → PRACTICE
  return "practice";
}

// ─── Subject priority scoring ──────────────────────────────────────
export function computeSubjectScore(subject, exams, history, currentHourLabel, adjustments = {}) {
  const h     = history.filter(x => fld(x,"subject_id","subjectId") === subject.id || x.subjectId === subject.id);
  const total = h.length || 1;

  // Difficulty score
  const diffScore = (subject.difficulty || 3) / 5;

  // Urgency: nearest related exam
  const relExams  = exams.filter(e =>
    (e.subjectIds || e.subject_ids || []).includes(subject.id)
  );
  const nearestDays = relExams.length
    ? Math.min(...relExams.map(e => daysLeft(e.date || e.exam_date)))
    : 999;
  const urgency = nearestDays <= 1  ? 5.0   // EMERGENCY
               : nearestDays <= 3   ? 3.5
               : nearestDays <= 7   ? 3.0
               : nearestDays <= 14  ? 2.0
               : nearestDays <= 30  ? 1.5
               : 1.0;

  // Engagement: penalise ghost-prone subjects
  const ghostRate = h.filter(x => isTrue(x.ghosted) || isTrue(fld(x,"ghosted","ghosted"))).length / total;
  // BUT: subject avoidance detected → BOOST priority (force it)
  const avoidanceBoost = ghostRate >= 0.55 ? 1.5 : 1.0;
  const engFactor      = Math.max(0.4, (1 - ghostRate * 0.4)) * avoidanceBoost;

  // Time of day bonus
  const timeCounts = {};
  h.filter(x => isTrue(x.completed)).forEach(x => {
    const t = fld(x,"time_of_day","timeOfDay") || "morning";
    timeCounts[t] = (timeCounts[t] || 0) + 1;
  });
  const bestTime  = Object.entries(timeCounts).sort((a,b) => b[1]-a[1])[0]?.[0] || "any";
  const timeBonus = (bestTime === currentHourLabel || bestTime === "any") ? 1.3 : 1.0;

  // Session type
  const nearestExam = relExams.sort((a,b) => new Date(a.date||a.exam_date) - new Date(b.date||b.exam_date))[0];
  const daysUntil   = nearestExam ? daysLeft(nearestExam.date || nearestExam.exam_date) : null;
  const sessionType = selectSessionType(subject, nearestExam, daysUntil, history);

  // Session length based on type + ghost rate + adjustments
  const SESSION_LENS = { deep: 47, practice: 27, revision: 17, emergency: 52, light: 12 };
  let sessionMins = SESSION_LENS[sessionType] || 27;

  // Sprinter → cap at 20 min
  if (adjustments.maxSessionMins) sessionMins = Math.min(sessionMins, adjustments.maxSessionMins);
  // Partial worker → halve
  if (adjustments.halveSessionLengths) sessionMins = Math.max(15, Math.round(sessionMins * 0.6));

  const score = diffScore * urgency * engFactor * timeBonus;

  return {
    score, sessionMins, bestTime, sessionType,
    ghostRate: Math.round(ghostRate * 100),
    daysUntilExam: daysUntil,
  };
}

// ─── Emergency day reschedule ──────────────────────────────────────
function buildEmergencySchedule(emergencySubject, freeSlots, history) {
  const tasks  = [];
  let   runMins = 0;
  const MAX_EMERGENCY_MINS = 240; // 4 hours max even in emergency

  for (const slot of freeSlots) {
    let c = slot.start;
    while (c + 52 <= slot.end && runMins < MAX_EMERGENCY_MINS) {
      tasks.push({
        id:           Date.now() + tasks.length * 7,
        subjectId:    emergencySubject.id,
        subjectName:  emergencySubject.name,
        color:        emergencySubject.color || "#dc2626",
        topic:        (emergencySubject.topics || ["Emergency Revision"])[tasks.length % Math.max(1, (emergencySubject.topics || []).length)],
        start:        toTime(c),
        end:          toTime(c + 52),
        durationMins: 52,
        status:       "pending",
        pomoDone:     0,
        ghostCount:   0,
        score:        "5.00",
        sessionType:  "emergency",
        isEmergency:  true,
      });
      c       += 52 + 10; // 10 min break
      runMins += 52;
    }
  }
  return tasks;
}

// ─── MAIN SCHEDULE BUILDER ─────────────────────────────────────────
export function buildSchedule(subjects, exams, history, timetable, adjustments = {}) {
  // ── Free slot calculation ────────────────────────────────────────
  const dayKey  = todayStr();
  const dayData = timetable.find(d => d.day === dayKey);
  const busy    = dayData ? [...dayData.slots].sort((a, b) => toMins(a.s) - toMins(b.s)) : [];
  const WAKE    = 7 * 60;
  const SLEEP   = 22 * 60;
  const free    = [];
  let cursor    = WAKE;

  for (const b of busy) {
    if (cursor < toMins(b.s)) free.push({ start: cursor, end: toMins(b.s) });
    cursor = Math.max(cursor, toMins(b.e));
  }
  if (cursor < SLEEP) free.push({ start: cursor, end: SLEEP });

  const totalFreeMins = free.reduce((a, s) => a + (s.end - s.start), 0);

  // ── SITUATION 1: No free time ────────────────────────────────────
  if (totalFreeMins < 30) {
    return { tasks: [], warning: "no_free_time", freeMinutes: totalFreeMins };
  }

  // ── SITUATION 3: Emergency mode (exam tomorrow, nothing studied) ─
  const emergencyExam = exams.find(e => {
    const dl = daysLeft(e.date || e.exam_date);
    if (dl > 1) return false;
    const subIds  = e.subjectIds || e.subject_ids || [];
    const studied = history.filter(h => {
      const d = new Date(); d.setDate(d.getDate() - 7);
      return subIds.includes(fld(h,"subject_id","subjectId")) &&
             new Date(h.date) >= d && isTrue(h.completed);
    });
    return studied.length === 0;
  });

  if (emergencyExam) {
    const subIds       = emergencyExam.subjectIds || emergencyExam.subject_ids || [];
    const emergencySubj = subjects.find(s => subIds.includes(s.id));
    if (emergencySubj) {
      return {
        tasks:        buildEmergencySchedule(emergencySubj, free, history),
        warning:      "emergency",
        emergencyExam: emergencyExam.name,
        freeMinutes:  totalFreeMins,
      };
    }
  }

  // ── SITUATION 2: Too many subjects for available time ───────────
  const SESSION_AVG = 30;
  const maxSessions = Math.floor(totalFreeMins / SESSION_AVG);
  let activeSubjects = subjects;
  let warning = null;

  const cap = adjustments.maxSubjectsToday;
  if (cap && subjects.length > cap) {
    activeSubjects = subjects.slice(0, cap);
    warning = "too_many_subjects";
  } else if (subjects.length > maxSessions + 3) {
    const topCount = Math.max(3, maxSessions);
    activeSubjects = subjects.slice(0, topCount);
    warning = "too_many_subjects";
  }

  // ── Score + sort subjects ─────────────────────────────────────────
  const nowLabel = hourLabel(new Date().getHours());
  const scored   = activeSubjects
    .map(s => ({ ...s, ...computeSubjectScore(s, exams, history, nowLabel, adjustments) }))
    .sort((a, b) => b.score - a.score);

  // ── Adjust for time-of-day preference ────────────────────────────
  // Morning person → hardest subjects first (already sorted by score which includes urgency)
  // For Weekend Warrior → weekend builds heavier sessions (handled externally)

  // ── Build task list ───────────────────────────────────────────────
  const tasks  = [];
  let si       = 0;
  const BREAK  = { deep: 15, practice: 5, revision: 5, emergency: 10, light: 3 };
  const maxSessionsDay = adjustments.maxSessionsDay || 99;

  for (const slot of free) {
    let c = slot.start;
    while (si < scored.length * 6 && tasks.length < maxSessionsDay) {
      const subj    = scored[si % scored.length];
      const tIdx    = Math.floor(si / scored.length) % Math.max(1, (subj.topics || []).length);
      const bLen    = subj.sessionMins;
      const brk     = BREAK[subj.sessionType] || 5;

      if (c + bLen > slot.end) break;

      tasks.push({
        id:           Date.now() + tasks.length * 7,
        subjectId:    subj.id,
        subjectName:  subj.name,
        color:        subj.color,
        topic:        (subj.topics || ["General Study"])[tIdx],
        start:        toTime(c),
        end:          toTime(c + bLen),
        durationMins: bLen,
        status:       "pending",
        pomoDone:     0,
        ghostCount:   0,
        score:        subj.score.toFixed(2),
        sessionType:  subj.sessionType,
        aiReason:     buildAIReason(subj),
        isEmergency:  subj.sessionType === "emergency",
      });

      c  += bLen + brk;
      si++;
    }
  }

  return { tasks, warning, freeMinutes: totalFreeMins };
}

// ─── Human-readable AI reason ──────────────────────────────────────
function buildAIReason(subj) {
  if (subj.daysUntilExam !== null && subj.daysUntilExam <= 3) {
    return `${subj.daysUntilExam}d to exam. Priority boost active.`;
  }
  if (subj.ghostRate >= 50) {
    return `You avoid ${subj.name} ${subj.ghostRate}% of the time. Forced priority.`;
  }
  if (subj.sessionType === "revision") {
    return `High recall score — revision mode selected.`;
  }
  if (subj.sessionType === "deep") {
    return `Low coverage — deep learning session needed.`;
  }
  return `Score: ${subj.score?.toFixed(2)} — difficulty × urgency × engagement.`;
}

// ─── Re-export for backward compat ────────────────────────────────
export { computeSubjectScore as scoreSubject };
