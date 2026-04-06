/**
 * utils/scheduler.js
 * The AI priority scoring algorithm — core of the project.
 *
 * PRIORITY FORMULA:
 *   Score = difficulty × urgency × engagement × timeBonus
 *
 *   difficulty  = subject difficulty / 5
 *   urgency     = 3.0 if exam < 7 days | 2.0 < 14d | 1.5 < 30d | 1.0 else
 *   engagement  = 1 - (ghost_rate × 0.4)  [penalise ghost-prone subjects]
 *   timeBonus   = 1.3 if now matches student's best study time, else 1.0
 *
 * session length = 90min base, -15min per 20% ghost rate bracket
 */

import { toMins, toTime, daysLeft, hourLabel, todayStr } from "./timeUtils";

export function computeSubjectScore(subject, exams, history, currentHourLabel) {
  const h = history.filter((x) => x.subjectId === subject.id);
  const total = h.length || 1;

  const diffScore = subject.difficulty / 5;

  const relExams = exams.filter((e) => e.subjectIds?.includes(subject.id));
  const minDays  = relExams.length ? Math.min(...relExams.map((e) => daysLeft(e.date))) : 999;
  const urgency  = minDays < 7 ? 3.0 : minDays < 14 ? 2.0 : minDays < 30 ? 1.5 : 1.0;

  const ghostRate = h.filter((x) => x.ghosted).length / total;
  const engFactor = Math.max(0.5, 1 - ghostRate * 0.4);

  const timeCounts = {};
  h.filter((x) => x.completed).forEach((x) => {
    timeCounts[x.timeOfDay] = (timeCounts[x.timeOfDay] || 0) + 1;
  });
  const bestTime  = Object.entries(timeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "any";
  const timeBonus = bestTime === currentHourLabel || bestTime === "any" ? 1.3 : 1.0;

  const ghostBracket = Math.floor(ghostRate / 0.2);
  const sessionMins  = Math.max(45, 90 - ghostBracket * 15);
  const score        = diffScore * urgency * engFactor * timeBonus;

  return { score, sessionMins, bestTime, ghostRate: Math.round(ghostRate * 100) };
}

export function buildSchedule(subjects, exams, history, timetable) {
  const day    = timetable.find((d) => d.day === todayStr());
  const busy   = day ? [...day.slots].sort((a, b) => toMins(a.s) - toMins(b.s)) : [];
  const WAKE   = 7 * 60, SLEEP = 22 * 60;
  const free   = [];
  let cursor   = WAKE;

  for (const b of busy) {
    if (cursor < toMins(b.s)) free.push({ start: cursor, end: toMins(b.s) });
    cursor = Math.max(cursor, toMins(b.e));
  }
  if (cursor < SLEEP) free.push({ start: cursor, end: SLEEP });

  const nowLabel = hourLabel(new Date().getHours());
  const scored   = subjects
    .map((s) => ({ ...s, ...computeSubjectScore(s, exams, history, nowLabel) }))
    .sort((a, b) => b.score - a.score);

  const tasks = [];
  let si = 0;
  const BREAK = 15;

  for (const slot of free) {
    let c = slot.start;
    while (si < scored.length * 5) {
      const subj  = scored[si % scored.length];
      const tIdx  = Math.floor(si / scored.length) % subj.topics.length;
      const bLen  = subj.sessionMins;
      if (c + bLen > slot.end) break;
      tasks.push({
        id: Date.now() + tasks.length * 7,
        subjectId: subj.id, subjectName: subj.name, color: subj.color,
        topic: subj.topics[tIdx], start: toTime(c), end: toTime(c + bLen),
        durationMins: bLen, status: "pending", pomoDone: 0, ghostCount: 0,
        score: subj.score.toFixed(2),
      });
      c += bLen + BREAK;
      si++;
    }
  }
  return tasks;
}
