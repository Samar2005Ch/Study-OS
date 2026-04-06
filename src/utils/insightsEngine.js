/**
 * utils/insightsEngine.js
 *
 * NIGHTLY INSIGHT ENGINE
 *
 * Run on app open / midnight. Produces MAX 3 insights.
 * Every insight has: WHAT + WHY + WHAT WE DID
 *
 * Rule: never just tell the user a problem.
 * Always tell them what the app did about it.
 */

import {
  classifyUserType,
  detectGhostPattern,
  detectSubjectAvoidance,
  detectReturnPattern,
  detectStudyTimePref,
  detectPauseAbuse,
  detectSessionLengthPreference,
} from "./ghostDetector";

const INSIGHT_STORE_KEY = "studyos_insights";

// ─── Insight types ─────────────────────────────────────────────────
// severity: "success" | "info" | "warning" | "danger" | "emergency"
// each insight: { id, severity, what, why, action_taken, cta? }

function saveInsights(insights) {
  try {
    localStorage.setItem(INSIGHT_STORE_KEY, JSON.stringify({
      insights,
      generatedAt: Date.now(),
      date: new Date().toISOString().split("T")[0],
    }));
  } catch {}
}

export function loadInsights() {
  try {
    const raw = JSON.parse(localStorage.getItem(INSIGHT_STORE_KEY) || "null");
    if (!raw) return [];
    // Only show insights generated today
    const today = new Date().toISOString().split("T")[0];
    if (raw.date !== today) return [];
    return raw.insights || [];
  } catch { return []; }
}

export function clearInsights() {
  try { localStorage.removeItem(INSIGHT_STORE_KEY); } catch {}
}

// ─── Exam readiness calculator ─────────────────────────────────────
export function calcExamReadiness(subjects, exams, history) {
  return subjects.map(s => {
    const relExams   = exams.filter(e => e.subjectIds?.includes(s.id) || e.subject_ids?.includes(s.id));
    const nearestExam= relExams.sort((a,b) => new Date(a.date) - new Date(b.date))[0];
    const daysLeft   = nearestExam
      ? Math.ceil((new Date(nearestExam.date) - new Date()) / 86400000)
      : null;

    const sh         = history.filter(h => (h.subject_id || h.subjectId) === s.id);
    const completed  = sh.filter(h => h.completed === 1 || h.completed === true);
    const totalMins  = completed.reduce((a,h) => a + (h.actual_mins || h.actualMins || h.planned_mins || h.plannedMins || 0), 0);
    const avgPct     = completed.length
      ? completed.reduce((a,h) => a + (h.completion_pct || h.completionPct || 100), 0) / completed.length
      : 0;

    // Readiness = weighted combination of time invested + self-reported completion
    const readiness  = Math.min(100, Math.round(avgPct * 0.6 + Math.min(totalMins / 120, 40)));

    // Project: at current pace, will they be ready?
    const sessionsThisWeek = sh.filter(h => {
      const d = new Date(); d.setDate(d.getDate() - 7);
      return new Date(h.date) >= d;
    }).length;
    const projectedAdditional = daysLeft ? Math.round((sessionsThisWeek / 7) * daysLeft * 12) : 0;
    const projectedReadiness  = Math.min(100, readiness + projectedAdditional / 4);

    return {
      id:                 s.id,
      name:               s.name,
      color:              s.color,
      readiness,
      projectedReadiness,
      daysLeft,
      examDate:           nearestExam?.date || null,
      totalMins,
      sessionsThisWeek,
      status: readiness >= 70 ? "ready" : readiness >= 45 ? "at_risk" : "critical",
    };
  });
}

// ─── Weekly summary ────────────────────────────────────────────────
export function calcWeeklySummary(history, prevHistory) {
  const today    = new Date();
  const weekAgo  = new Date(); weekAgo.setDate(today.getDate() - 7);
  const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(today.getDate() - 14);

  const thisWeek = history.filter(h => new Date(h.date) >= weekAgo);
  const lastWeek = (prevHistory || history).filter(h =>
    new Date(h.date) >= twoWeeksAgo && new Date(h.date) < weekAgo
  );

  const calc = (arr) => ({
    sessions:  arr.length,
    completed: arr.filter(h => h.completed === 1 || h.completed === true).length,
    totalMins: arr.filter(h => h.completed === 1 || h.completed === true)
                  .reduce((a,h) => a + (h.actual_mins || h.planned_mins || 0), 0),
    xp:        arr.reduce((a,h) => a + (h.xp_earned || h.xpEarned || 0), 0),
  });

  const tw = calc(thisWeek);
  const lw = calc(lastWeek);

  const streak = (() => {
    const doneDates = [...new Set(
      history.filter(h => h.completed === 1 || h.completed === true).map(h => h.date)
    )].sort().reverse();
    let s = 0;
    for (let i = 0; i < doneDates.length; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (doneDates[i] === d.toISOString().split("T")[0]) s++;
      else break;
    }
    return s;
  })();

  return { thisWeek: tw, lastWeek: lw, streak };
}

// ─── MAIN INSIGHTS GENERATOR ───────────────────────────────────────
/**
 * Generates up to 3 insights. Each must have:
 *   what       — what is happening
 *   why        — why it matters
 *   action_taken — what the app did
 *
 * @returns {Array} sorted by severity (max 3)
 */
export function generateInsights({ history, subjects, exams, streak = 0 }) {
  const insights = [];

  // ── 1. Return pattern ──────────────────────────────────────────
  const returnPattern = detectReturnPattern(history);
  if (returnPattern && returnPattern.situationId >= 32) {
    insights.push({
      id:           "return_" + returnPattern.situationId,
      severity:     returnPattern.situationId >= 34 ? "warning" : "info",
      what:         `You were away for ${returnPattern.daysSince} days.`,
      why:          "Your schedule has likely drifted. Sessions may be outdated.",
      action_taken: returnPattern.situationId >= 33
        ? "Your schedule has been rebuilt based on remaining topics and exam dates."
        : "Here's an updated plan based on what you missed.",
      rawSituationId: returnPattern.situationId,
    });
  }

  // ── 2. User type insight ───────────────────────────────────────
  const userType = classifyUserType(history);
  const typeInsights = {
    SPRINTER: {
      severity:     "info",
      what:         "You tend to study in bursts — 3 days on, 5 days off.",
      why:          "Inconsistent study patterns lead to poor retention and last-minute panic.",
      action_taken: "Your sessions have been capped at 20 min/day to build sustainable daily habits.",
    },
    OVERPLANNER: {
      severity:     "warning",
      what:         "You plan more than you complete. Many subjects, low completion rate.",
      why:          "Overloading leads to overwhelm and quitting entirely.",
      action_taken: "Daily sessions capped at 3 until your completion rate improves.",
    },
    WEEKEND_WARRIOR: {
      severity:     "info",
      what:         "You're most active on weekends — minimal activity on weekdays.",
      why:          "Concentrated study burns out faster and loses retention mid-week.",
      action_taken: "Heavier sessions moved to Saturday/Sunday. Lighter 15-min sessions on weekdays.",
    },
    GHOST: {
      severity:     "warning",
      what:         "You set up schedules but rarely complete sessions.",
      why:          "Ghost sessions give a false sense of productivity with no real progress.",
      action_taken: "Schedule simplified to 2 high-priority sessions/day only.",
    },
    PARTIAL_WORKER: {
      severity:     "info",
      what:         "You consistently complete 50–60% of sessions, rarely the full duration.",
      why:          "Partial completion is better than abandonment — but the system can work with it.",
      action_taken: "Session lengths reduced to match your natural rhythm. Better to complete 15 min than abandon 30.",
    },
  };
  if (typeInsights[userType.type]) {
    insights.push({ id: "usertype_" + userType.typeId, ...typeInsights[userType.type] });
  }

  // ── 3. Ghost sessions today ────────────────────────────────────
  const ghostPatterns = detectGhostPattern(history);
  const worstGhost = ghostPatterns.sort((a,b) => b.situationId - a.situationId)[0];
  if (worstGhost && worstGhost.situationId >= 14) {
    insights.push({
      id:           "ghost_" + worstGhost.situationId,
      severity:     worstGhost.situationId >= 15 ? "danger" : "warning",
      what:         worstGhost.message,
      why:          "Uncompleted sessions mean your AI scheduler can't learn your actual pace.",
      action_taken: worstGhost.situationId >= 15
        ? "Tomorrow's schedule rebuilt from scratch — simpler load."
        : "Tomorrow's session count reduced by 1.",
    });
  }

  // ── 4. Subject avoidance ───────────────────────────────────────
  const avoidance = detectSubjectAvoidance(history, subjects)[0];
  if (avoidance) {
    insights.push({
      id:           "avoid_" + avoidance.subjectId,
      severity:     "warning",
      what:         avoidance.message,
      why:          `${avoidance.subject} might be your exam weak point. Avoidance compounds over time.`,
      action_taken: `Added 2 short ${avoidance.subject} sessions daily. Breaking topics into 15-min chunks.`,
      subjectId:    avoidance.subjectId,
    });
  }

  // ── 5. Study time preference ───────────────────────────────────
  const timePref = detectStudyTimePref(history);
  if (timePref && timePref.dominance >= 60) {
    insights.push({
      id:           "timepref",
      severity:     "success",
      what:         `${timePref.dominance}% of your completed sessions are in the ${timePref.bestSlot}.`,
      why:          "Peak performance hours matter more than total hours.",
      action_taken: `All high-priority sessions moved to your ${timePref.bestSlot} slots.`,
    });
  }

  // ── 6. Consistency reward ──────────────────────────────────────
  if (streak >= 7) {
    insights.push({
      id:       "streak_elite",
      severity: "success",
      what:     `${streak}-day streak. You're in the top 10% of users.`,
      why:      "Consistency is the single biggest predictor of exam success.",
      action_taken: "Schedule complexity increased to match your level. Harder topics prioritized.",
    });
  } else if (streak >= 3) {
    insights.push({
      id:       "streak_good",
      severity: "success",
      what:     `${streak}-day streak. Building real momentum.`,
      why:      "Each consecutive day compounds your retention exponentially.",
      action_taken: "Streak bonus XP active. Keep going.",
    });
  }

  // ── 7. Pause abuse ────────────────────────────────────────────
  const pauses = detectPauseAbuse(history);
  if (pauses) {
    insights.push({
      id:           "pause_abuse",
      severity:     "warning",
      what:         pauses.message,
      why:          "Frequent pauses break flow state and reduce session quality score.",
      action_taken: "Inactivity nudge timer shortened to 7 minutes.",
    });
  }

  // ── 8. Session length adjustment ──────────────────────────────
  const lengthPref = detectSessionLengthPreference(history);
  if (lengthPref) {
    insights.push({
      id:           "session_length",
      severity:     "info",
      what:         lengthPref.message,
      why:          "A completed short session beats an abandoned long session every time.",
      action_taken: `Default session length reduced from ${lengthPref.avgPlanned}m to ${lengthPref.avgActual}m.`,
    });
  }

  // ── Deduplicate + sort by severity + cap at 3 ─────────────────
  const severityOrder = { emergency: 0, danger: 1, warning: 2, info: 3, success: 4 };
  const unique = [...new Map(insights.map(i => [i.id, i])).values()]
    .sort((a, b) => (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5));

  const final = unique.slice(0, 3);
  saveInsights(final);
  return final;
}

// ─── Exam readiness insight generator ─────────────────────────────
export function generateExamAlerts(exams, subjects, history) {
  const alerts = [];
  const now    = new Date();

  exams.forEach(exam => {
    const daysLeft = Math.ceil((new Date(exam.date) - now) / 86400000);

    // SITUATION 3: Exam tomorrow, nothing studied
    const subjectIds = exam.subjectIds || exam.subject_ids || [];
    const examHistory = history.filter(h =>
      subjectIds.includes(h.subject_id || h.subjectId)
    );
    const recentDone = examHistory.filter(h => {
      const d = new Date(); d.setDate(d.getDate() - 7);
      return new Date(h.date) >= d && (h.completed === 1 || h.completed === true);
    });

    if (daysLeft === 1 && recentDone.length === 0) {
      alerts.push({
        type:      "EMERGENCY",
        situationId: 3,
        examName:  exam.name,
        daysLeft,
        message:   `EXAM TOMORROW — EMERGENCY STUDY PLAN`,
        subMessage: `${exam.name} exam is tomorrow. No recent sessions detected. Emergency plan activated.`,
        action:    "emergency_reschedule",
        severity:  "emergency",
      });
    }
    // SITUATION 16: Exam in 3 days, zero sessions this week
    else if (daysLeft <= 3 && daysLeft > 0 && recentDone.length === 0) {
      alerts.push({
        type:      "CRITICAL",
        situationId: 16,
        examName:  exam.name,
        daysLeft,
        message:   `${daysLeft} days until ${exam.name} — no sessions this week`,
        subMessage: "Emergency plan activated. All other sessions temporarily reduced.",
        action:    "emergency_focus",
        severity:  "danger",
      });
    }
    // SITUATION 5: Past exam date
    else if (daysLeft < 0) {
      alerts.push({
        type:      "PAST_EXAM",
        situationId: 5,
        examName:  exam.name,
        daysLeft,
        message:   `${exam.name} exam date has passed.`,
        subMessage: "Mark as complete or update the date.",
        action:    "update_exam",
        severity:  "info",
      });
    }
  });

  return alerts;
}
