/**
 * server/scheduler.js v8 — The Smart Scheduler
 *
 * LOGIC SUMMARY:
 *
 * 1. ASSESS — detect student type + day type from real data
 * 2. SCORE  — rank every subject by priority formula
 * 3. PICK   — select ONE best topic per subject per day
 * 4. ARRANGE — morning=hard, afternoon=medium, evening=light, night=revision
 * 5. RECOVER — never Hard→Hard back to back, always insert light after hard
 * 6. CAP    — respect daily target, override if exam is close
 *
 * PRIORITY FORMULA:
 * score = subjectWeight × weaknessScore × urgency × topicScore × timeBonus
 *
 * DAY TYPES:
 * foundation  → >14 days: easy topics first, build base
 * coverage    → 7-14 days: untouched topics urgently, medium first
 * prioritize  → 3-7 days:  hard+untouched only, high weight subjects
 * revision    → <3 days:   in_progress only, short sessions
 *
 * STUDENT TYPES (auto-detected from history):
 * topper       → completion >75%, ghost <10% → longer sessions, harder topics
 * average      → completion 50-75%           → standard sessions
 * struggling   → completion <40%             → short sessions, don't overwhelm
 * inconsistent → ghost rate >40%             → recovery subjects after hard ones
 * unknown      → <3 sessions                 → treat as average
 */

const toMins  = t => { const[h,m]=t.split(":").map(Number); return h*60+m; };
const toTime  = m => `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
const todayStr= () => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
const daysUntil=d => Math.max(0,Math.ceil((new Date(d)-new Date())/86400000));
const hourLabel=h => h<6?"night":h<12?"morning":h<17?"afternoon":h<21?"evening":"night";

// ─────────────────────────────────────────────────────────────────
// STEP 1 — ASSESS
// ─────────────────────────────────────────────────────────────────

function detectStudentType(history) {
  if (!history || history.length < 3) return "unknown";
  const recent = history.slice(-14);
  const total  = recent.length;
  const comp   = recent.filter(h=>h.completed===1).length / total;
  const ghost  = recent.filter(h=>h.ghosted===1).length  / total;

  if (comp >= 0.75 && ghost < 0.1)  return "topper";
  if (comp >= 0.5  && ghost < 0.3)  return "average";
  if (ghost > 0.4)                   return "inconsistent";
  if (comp >= 0.3)                   return "struggling";
  return "inconsistent";
}

function getDayType(minDays) {
  if (minDays > 14) return "foundation";
  if (minDays > 7)  return "coverage";
  if (minDays > 3)  return "prioritize";
  return "revision";
}

// ─────────────────────────────────────────────────────────────────
// STEP 2 — SCORE each subject
// ─────────────────────────────────────────────────────────────────

function subjectWeight(subject, exam) {
  const wtype = exam.weight_type || "equal";
  if (wtype === "equal") return 0.5;
  if (wtype === "questions") {
    // How many questions this subject has vs total in exam
    const total = 125; // default — we don't sum per-exam here easily
    return Math.min((subject.question_count||25) / total, 1.0);
  }
  if (wtype === "importance") {
    return { high:1.0, medium:0.6, low:0.3 }[subject.exam_weight||"medium"] || 0.6;
  }
  return 0.5;
}

function weaknessScore(level) {
  return { not_started:1.0, learning:0.7, strong:0.4, confident:0.1 }[level] || 0.7;
}

function topicPriorityScore(status, dayType) {
  // In revision mode — only in_progress topics matter
  if (dayType === "revision") {
    return { not_touched:0.1, in_progress:3.0, confident:1.0 }[status] || 1.0;
  }
  // In prioritize mode — untouched hard topics first
  if (dayType === "prioritize") {
    return { not_touched:3.0, in_progress:1.5, confident:0.2 }[status] || 1.5;
  }
  // Foundation — easy untouched first
  if (dayType === "foundation") {
    return { not_touched:2.0, in_progress:1.5, confident:0.3 }[status] || 1.5;
  }
  // Coverage — balanced
  return { not_touched:2.5, in_progress:1.5, confident:0.3 }[status] || 1.5;
}

function calcUrgency(exam) {
  const allDates = [exam.date, ...(exam.subExams||[]).map(s=>s.date)].filter(Boolean);
  const minDays  = allDates.length ? Math.min(...allDates.map(daysUntil)) : 999;
  if (minDays < 1)  return 5.0; // exam day
  if (minDays < 3)  return 4.0;
  if (minDays < 7)  return 3.0;
  if (minDays < 14) return 2.0;
  if (minDays < 30) return 1.5;
  return 1.0;
}

function scoreSubject(subject, exam, history, nowLabel, bestTime, worstTime, dayType) {
  const w  = subjectWeight(subject, exam);
  const wk = weaknessScore(subject.student_level || "not_started");
  const u  = calcUrgency(exam);

  // Time bonus — use student's stated preferences first, learned patterns second
  let timeBonus = 1.0;
  const subHistory = history.filter(x => x.source_id === subject.id);
  const learnedBest  = subHistory.length>=3 ? getBestTimeFromHistory(subHistory) : null;
  const learnedWorst = subHistory.length>=3 ? getWorstTimeFromHistory(subHistory) : null;
  const effectiveBest  = bestTime  || learnedBest;
  const effectiveWorst = worstTime || learnedWorst;
  if (effectiveBest  && effectiveBest===nowLabel)  timeBonus = 1.3;
  if (effectiveWorst && effectiveWorst===nowLabel) timeBonus = 0.75;

  // Ghost penalty — subjects ghosted a lot get shorter sessions
  const ghostRate = subHistory.length
    ? subHistory.filter(h=>h.ghosted===1).length / subHistory.length
    : 0;

  const score = w * wk * u * timeBonus;
  return { score, w, wk, urgency:u, timeBonus, ghostRate, minDays:getMinDays(exam) };
}

function getBestTimeFromHistory(history) {
  const counts = {};
  history.filter(h=>h.completed===1).forEach(h=>{ counts[h.time_of_day]=(counts[h.time_of_day]||0)+1; });
  return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
}
function getWorstTimeFromHistory(history) {
  const counts = {};
  history.filter(h=>h.ghosted===1).forEach(h=>{ counts[h.time_of_day]=(counts[h.time_of_day]||0)+1; });
  return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
}
function getMinDays(exam) {
  const dates = [exam.date,...(exam.subExams||[]).map(s=>s.date)].filter(Boolean);
  return dates.length ? Math.min(...dates.map(daysUntil)) : 999;
}

// ─────────────────────────────────────────────────────────────────
// STEP 3 — PICK best topic for this subject this session
// ─────────────────────────────────────────────────────────────────

function pickBestTopic(topics, dayType, usedToday, studentLevel) {
  if (!topics || !topics.length) {
    return { name:"General Study", difficulty:"medium", status:"in_progress", progress:0, isRevision:false };
  }

  // Filter out topics already used today
  const available = topics.filter(t => !usedToday.has(t.name));
  const pool = available.length ? available : topics; // fallback if all used

  // Sort topics based on day type strategy
  const sorted = [...pool].sort((a,b) => {
    const pa = a.progress || 0;
    const pb = b.progress || 0;
    const da = a.difficulty==="hard"?3:a.difficulty==="easy"?1:2;
    const db = b.difficulty==="hard"?3:b.difficulty==="easy"?1:2;
    const sa = a.status || "not_touched";
    const sb = b.status || "not_touched";

    if (dayType === "revision") {
      // In revision — prefer in_progress (finish what was started)
      // Skip not_touched (no time to learn new things)
      const ranka = sa==="in_progress"?0:sa==="confident"?1:2;
      const rankb = sb==="in_progress"?0:sb==="confident"?1:2;
      if (ranka !== rankb) return ranka - rankb;
      return pb - pa; // higher progress first
    }

    if (dayType === "prioritize") {
      // Hard + not_touched first — maximum urgency
      const scoreA = (3-da)*2 + (sa==="not_touched"?3:sa==="in_progress"?1:0);
      const scoreB = (3-db)*2 + (sb==="not_touched"?3:sb==="in_progress"?1:0);
      return scoreB - scoreA;
    }

    if (dayType === "foundation") {
      // Easy first — build base, then medium, then hard
      // Not touched first within each difficulty
      if (da !== db) return da - db; // easy first
      if (sa !== sb) return (sa==="not_touched"?0:sa==="in_progress"?1:2) - (sb==="not_touched"?0:sb==="in_progress"?1:2);
      return pa - pb;
    }

    // Coverage — medium topics, not touched first
    if (sa==="confident" && sb!=="confident") return 1;
    if (sb==="confident" && sa!=="confident") return -1;
    if (sa !== sb) return (sa==="not_touched"?0:1) - (sb==="not_touched"?0:1);
    if (da !== db) return db - da; // harder first within coverage
    return pa - pb;
  });

  const topic = sorted[0];
  if (!topic) return { name:"General Study", difficulty:"medium", status:"in_progress", progress:0, isRevision:false };

  return {
    name:             topic.name,
    difficulty:       topic.difficulty || "medium",
    status:           topic.status || "not_touched",
    progress:         topic.progress || 0,
    expectedProgress: Math.min((topic.progress||0) + 25, 100),
    isRevision:       (topic.progress||0) >= 75,
    id:               topic.id,
  };
}

// ─────────────────────────────────────────────────────────────────
// STEP 4 — SESSION LENGTH based on everything
// ─────────────────────────────────────────────────────────────────

function sessionLength(subject, slotLabel, dayType, studentType, ghostRate) {
  const diff  = subject.difficulty || 3; // 1-5 difficulty
  const level = subject.student_level || "not_started";

  // Night — always short
  if (slotLabel === "night") return 35;

  // Base duration by difficulty
  let base = diff <= 1 ? 40
           : diff === 2 ? 55
           : diff === 3 ? 70
           : diff === 4 ? 85
           : 95;

  // Already confident — shorter session
  if (level === "confident") base = Math.min(base, 45);

  // First time on subject — don't overwhelm
  if (level === "not_started") base = Math.min(base, 60);

  // Day type adjustments
  if (dayType === "revision")    base = Math.min(base, 50);
  if (dayType === "foundation")  base = Math.min(base, 65);
  if (dayType === "prioritize")  base = Math.min(base + 10, 90); // more focus when urgent

  // Student type adjustments
  if (studentType === "topper")      base = Math.min(base + 15, 110);
  if (studentType === "struggling")  base = Math.min(base, 50);
  if (studentType === "inconsistent")base = Math.min(base, 55);

  // Ghost rate penalty — high ghost rate = shorter sessions
  if (ghostRate > 0.4) base = Math.round(base * 0.75);
  if (ghostRate > 0.6) base = Math.round(base * 0.6);

  // Afternoon dip
  if (slotLabel === "afternoon") base = Math.round(base * 0.88);

  return Math.max(30, Math.round(base / 5) * 5); // min 30min, round to 5
}

function breakLength(minDays) {
  if (minDays < 3)  return 8;
  if (minDays < 7)  return 10;
  if (minDays < 14) return 15;
  return 20;
}

// ─────────────────────────────────────────────────────────────────
// STEP 5 — Is this a "light" subject (for recovery pattern)
// ─────────────────────────────────────────────────────────────────

function isLight(subject) {
  const level = subject.student_level || "not_started";
  const diff  = subject.difficulty || 3;
  return diff <= 2 || level === "confident" || level === "strong";
}

// ─────────────────────────────────────────────────────────────────
// STEP 6 — Build reason string (explains why this was scheduled)
// ─────────────────────────────────────────────────────────────────

function buildReason(subject, meta, topicInfo, dayType, slotLabel) {
  const parts = [];
  const days = meta.minDays;

  if (days <= 1)              parts.push("EXAM TOMORROW");
  else if (days <= 3)         parts.push(`exam in ${days}d — CRITICAL`);
  else if (days <= 7)         parts.push(`exam in ${days}d — urgent`);

  if (meta.wk >= 0.9)         parts.push("not started yet");
  else if (meta.wk >= 0.6)    parts.push("still learning");

  if (topicInfo.status==="not_touched")  parts.push("first session on this topic");
  if (topicInfo.isRevision)              parts.push("revision — nearly mastered");
  if (topicInfo.difficulty==="hard")     parts.push("hard topic");

  if (slotLabel==="morning")  parts.push("morning — best focus time");
  if (slotLabel==="night")    parts.push("light revision slot");

  if (dayType==="foundation")  parts.push("foundation mode — basics first");
  if (dayType==="revision")    parts.push("revision mode — exam soon");

  return parts.slice(0,3).join(" · ") || "scheduled by priority engine";
}

// ─────────────────────────────────────────────────────────────────
// MAIN — buildSchedule
// ─────────────────────────────────────────────────────────────────

function buildSchedule({
  examSubjects, skills=[], history=[],
  timetableSlots=[], wakeTime="07:00", sleepTime="22:00",
  bestTime=null, worstTime=null, dailyTargetHours=6,
}) {
  const nowMins   = new Date().getHours()*60 + new Date().getMinutes();
  const startFrom = Math.max(toMins(wakeTime), nowMins + 5);
  let sleepMins   = toMins(sleepTime);
  
  // If sleep time is numerically smaller than or equal to wake time, they sleep past midnight
  // E.g. wake 07:00 (420), sleep 00:00 (0) -> sleep becomes 24:00 (1440)
  if (sleepMins <= toMins(wakeTime)) {
    sleepMins += 24 * 60;
  }
  
  if (startFrom >= sleepMins) return [];

  // ── SEED USED TOPICS FROM HISTORY ───────────────────────
  // Ensure topics completed/ghosted today are not picked again
  const usedTopics = {}; 
  const today = new Date().toISOString().split("T")[0];
  history.filter(h => h.schedule_date === today || h.date === today).forEach(h => {
    if (!usedTopics[h.source_id]) usedTopics[h.source_id] = new Set();
    usedTopics[h.source_id].add(h.topic);
  });

  // Find free slots in today's timetable
  const busyToday = timetableSlots
    .filter(s => s.day === todayStr())
    .sort((a,b) => toMins(a.start)-toMins(b.start));

  const freeSlots = [];
  let cursor = startFrom;
  for (const b of busyToday) {
    const bs = toMins(b.start), be = toMins(b.end);
    if (be <= cursor) continue;
    if (cursor < bs)  freeSlots.push({ start:cursor, end:bs });
    cursor = Math.max(cursor, be);
  }
  if (cursor < sleepMins) freeSlots.push({ start:cursor, end:sleepMins });
  if (!freeSlots.length) return [];

  // ASSESS
  const studentType = detectStudentType(history);
  const allExams    = [...new Set(examSubjects.map(s=>s.exam).filter(Boolean))];
  const minDays     = allExams.length
    ? Math.min(...allExams.map(e=>getMinDays(e)))
    : 999;
  const dayType     = getDayType(minDays);

  // Smart daily target cap
  const recent   = history.slice(-14);
  const avgComp  = recent.length>3
    ? recent.filter(h=>h.completed===1).length / recent.length
    : 1.0;
  let maxMins = dailyTargetHours * 60;
  if (minDays < 3)                         maxMins = 10*60; // no cap near exam
  else if (avgComp < 0.5 && recent.length>5) maxMins = Math.max(120, Math.round(dailyTargetHours*60*avgComp*1.2));

  // SCORE all exam subjects
  const nowHour = new Date().getHours();
  const nowLabel = hourLabel(nowHour);

  const scored = examSubjects.map(s => {
    const meta = scoreSubject(s, s.exam, history, nowLabel, bestTime, worstTime, dayType);
    return { ...s, _meta:meta, _light:isLight(s) };
  }).sort((a,b) => b._meta.score - a._meta.score);

  // ── DE-DUPLICATE OVERLAPPING TOPICS ─────────────────────
  // If multiple exams have the same subject/topic, we only need to study it once.
  const seenTopics = new Set();
  const dedupedScored = [];
  for (const s of scored) {
    const uniqueTopics = (s.topics || []).filter(t => {
      const key = `${s.name.toLowerCase()}|${t.name.toLowerCase()}`;
      if (seenTopics.has(key)) {
        // Topic already covered by another exam subject.
        // We can give a "Synergy Bonus" to the first occurrence if we want,
        // but for now we just filter out duplicates to avoid redundant scheduling.
        return false;
      }
      seenTopics.add(key);
      return true;
    });
    // Add "Synergy Bonus" if this subject shares topics with others
    if (uniqueTopics.length < (s.topics?.length || 0)) {
      s._meta.score *= 1.25; // 25% priority boost for high-impact overlapping subjects
    }
    dedupedScored.push({ ...s, topics: uniqueTopics });
  }

  // Separate hard and light for recovery pattern
  const hardSubs  = dedupedScored.filter(s => !s._light);
  const lightSubs = dedupedScored.filter(s =>  s._light);

  // Add skills at the very end (leftover time only)
  const skillItems = skills.map(s => ({
    ...s,
    exam:            { date:"2099-01-01", weight_type:"equal", subExams:[] },
    exam_weight:     "low",
    question_count:  10,
    student_level:   "learning",
    difficulty:      2,
    _meta:           { score:0.1, w:0.1, wk:0.5, urgency:1.0, timeBonus:1.0, ghostRate:0, minDays:999 },
    _light:          true,
    sourceType:      "skill",
  }));

  // BUILD interleaved queue: Hard → Light → Hard → Light
  const buildQueue = () => {
    const q = [];
    const h = [...hardSubs], l = [...lightSubs, ...skillItems];
    let hi=0, li=0;
    while (hi < h.length || li < l.length) {
      if (hi < h.length) q.push(h[hi++]);
      if (li < l.length) q.push(l[li++]);
    }
    return q;
  };

  // SCHEDULE
  const tasks       = [];
  // usedTopics seeded above from history
  let totalScheduled = 0;
  let lastWasHard   = false;

  for (const slot of freeSlots) {
    let c = slot.start;
    const slotHour  = Math.floor(slot.start / 60);
    const slotLabel = hourLabel(slotHour);

    // For morning — put hardest+weakest first
    // For night — only light subjects
    let queue = buildQueue();
    if (slotLabel === "morning") {
      // Hardest+weakest subjects at the front
      queue = [
        ...hardSubs.sort((a,b) => b._meta.wk - a._meta.wk),
        ...lightSubs,
        ...skillItems,
      ];
    } else if (slotLabel === "night") {
      queue = [...lightSubs, ...skillItems];
      if (!queue.length) queue = [...scored, ...skillItems];
    } else if (slotLabel === "afternoon") {
      // Medium difficulty in afternoon — not the hardest
      queue = [
        ...scored.filter(s => (s.difficulty||3) === 3),
        ...scored.filter(s => (s.difficulty||3) !== 3),
        ...skillItems,
      ];
    }

    const scheduledThisSlot = new Set();

    while (c < slot.end && totalScheduled < maxMins) {
      // If last was hard, prefer light next (recovery)
      let pick = null;
      if (lastWasHard && lightSubs.length > 0) {
        pick = queue.find(s =>
          s._light &&
          !scheduledThisSlot.has(s.id) &&
          c + sessionLength(s, slotLabel, dayType, studentType, s._meta.ghostRate) + breakLength(s._meta.minDays) <= slot.end
        );
      }

      // If no light available or last wasn't hard, pick best available
      if (!pick) {
        pick = queue.find(s =>
          !scheduledThisSlot.has(s.id) &&
          c + sessionLength(s, slotLabel, dayType, studentType, s._meta.ghostRate) + breakLength(s._meta.minDays) <= slot.end
        );
      }

      // Last resort — fit whatever we can
      if (!pick) {
        pick = queue.find(s =>
          !scheduledThisSlot.has(s.id) &&
          c + 30 <= slot.end
        );
      }

      if (!pick) break;

      const meta      = pick._meta;
      const sessLen   = sessionLength(pick, slotLabel, dayType, studentType, meta.ghostRate);
      const brkLen    = breakLength(meta.minDays);
      const blockLen  = Math.min(sessLen, slot.end - c - brkLen, maxMins - totalScheduled);

      if (blockLen < 30) break;

      // Pick best topic for this subject today
      if (!usedTopics[pick.id]) usedTopics[pick.id] = new Set();
      const topicInfo = pickBestTopic(pick.topics||[], dayType, usedTopics[pick.id], pick.student_level);
      usedTopics[pick.id].add(topicInfo.name);

      scheduledThisSlot.add(pick.id);
      totalScheduled += blockLen;
      lastWasHard = !pick._light;

      const diffNum = topicInfo.difficulty==="hard"?3:topicInfo.difficulty==="easy"?1:2;
      const xp      = Math.round(diffNum * blockLen * 0.5);

      tasks.push({
        source_type:      pick.sourceType || "exam",
        source_id:        pick.id,
        subject_name:     pick.name,
        topic:            topicInfo.name,
        topic_diff:       topicInfo.difficulty,
        topic_status:     topicInfo.status,
        topic_progress:   topicInfo.progress,
        expected_progress:topicInfo.expectedProgress || 25,
        color:            pick.color || "#4f6ef7",
        start_time:       toTime(c),
        end_time:         toTime(c + blockLen),
        duration_mins:    blockLen,
        break_mins:       brkLen,
        score:            Math.round(meta.score * 1000) / 1000,
        ai_reason:        buildReason(pick, meta, topicInfo, dayType, slotLabel),
        xp,
        day_type:         dayType,
        student_type:     studentType,
        status:           "pending",
        schedule_date:    new Date().toISOString().split("T")[0],
      });

      c += blockLen + brkLen;
    }
  }

  return tasks;
}

// ─────────────────────────────────────────────────────────────────
// PREPARATION SCORE
// ─────────────────────────────────────────────────────────────────

function calcPreparationScore(examSubjects) {
  if (!examSubjects || !examSubjects.length) return 0;
  let totalWeight = 0;
  let earnedScore = 0;

  for (const subject of examSubjects) {
    const weight = subject.question_count || 25;
    totalWeight += weight;
    const topics = subject.topics || [];
    if (!topics.length) continue;
    const avgProgress = topics.reduce((a,t)=>a+(t.progress||0),0) / topics.length;
    earnedScore += (avgProgress / 100) * weight;
  }

  return totalWeight ? Math.round((earnedScore / totalWeight) * 100) : 0;
}

module.exports = {
  buildSchedule,
  calcPreparationScore,
  getDayType,
  detectStudentType,
  hourLabel,
};
