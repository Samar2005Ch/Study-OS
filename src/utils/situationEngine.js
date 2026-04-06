/**
 * utils/situationEngine.js
 *
 * Evaluates ALL active situations and returns banners + schedule adjustments.
 * This is the "brain" that connects insights to actual UI state.
 *
 * Returns: { banners, scheduleAdjustments, emergencyMode, userType }
 */

import { generateExamAlerts, generateInsights, calcExamReadiness } from "./insightsEngine";
import { classifyUserType, detectReturnPattern } from "./ghostDetector";

const today = () => new Date().toISOString().split("T")[0];
const fld   = (o, s, c) => o[s] ?? o[c] ?? null;
const isTrue = v => v === 1 || v === true;

/**
 * Main situation evaluator.
 * Call on app open / midnight / timetable change.
 */
export function evaluateSituations({ history, subjects, exams, timetable }) {
  const banners             = [];
  const scheduleAdjustments = {};
  let   emergencyMode       = false;
  let   emergencyExam       = null;

  // ── SITUATION 6: No subjects ───────────────────────────────────
  if (!subjects || subjects.length === 0) {
    banners.push({
      id:       "no_subjects",
      severity: "info",
      title:    "Add your first subject to begin.",
      message:  "Your schedule will auto-generate once you add subjects and exam dates.",
      action:   "add_subject",
      actionLabel: "Add Subject",
      dismissible: false,
    });
    return { banners, scheduleAdjustments, emergencyMode, userType: null };
  }

  // ── Exam alerts (SITUATIONS 3, 5, 16) ─────────────────────────
  const examAlerts = generateExamAlerts(exams, subjects, history);
  examAlerts.forEach(alert => {
    if (alert.severity === "emergency") {
      emergencyMode  = true;
      emergencyExam  = alert;
      scheduleAdjustments.emergencyFocusSubject = alert;
      banners.push({
        id:          "emergency_exam_" + alert.examName,
        severity:    "emergency",
        title:       alert.message,
        message:     alert.subMessage,
        action:      alert.action,
        actionLabel: "View Emergency Plan",
        dismissible: false,
        pulse:       true,
      });
    } else if (alert.severity === "danger") {
      banners.push({
        id:          "critical_exam_" + alert.examName,
        severity:    "danger",
        title:       `${alert.daysLeft} days to ${alert.examName} — no sessions this week`,
        message:     "Emergency plan activated. Focus sessions prioritised.",
        action:      alert.action,
        actionLabel: "See Plan",
        dismissible: true,
      });
    } else if (alert.type === "PAST_EXAM") {
      banners.push({
        id:          "past_exam_" + alert.examName,
        severity:    "info",
        title:       alert.message,
        message:     alert.subMessage,
        action:      "update_exam",
        actionLabel: "Update Date",
        dismissible: true,
      });
    }
  });

  // ── SITUATION 1: No free time ──────────────────────────────────
  const todayDay = timetable?.find?.(d => d.day === today());
  const busyMins = todayDay?.slots?.reduce((a, s) => {
    const start = s.s?.split?.(":")?.[0] * 60 + parseInt(s.s?.split?.(":")?.[1] || 0);
    const end   = s.e?.split?.(":")?.[0] * 60 + parseInt(s.e?.split?.(":")?.[1] || 0);
    return a + (end - start);
  }, 0) || 0;
  const totalDay  = (22 - 7) * 60; // 7am–10pm
  const freeMins  = Math.max(0, totalDay - busyMins);

  if (freeMins < 30 && subjects.length > 0) {
    banners.push({
      id:       "no_free_time",
      severity: "warning",
      title:    "You have no free slots today.",
      message:  "Consider reducing session lengths or removing lower priority subjects.",
      action:   "edit_timetable",
      actionLabel: "Edit Timetable",
      dismissible: true,
    });
  }

  // ── SITUATION 2: Too many subjects, too little time ────────────
  const SESSION_AVG_MINS = 30;
  const maxSessions      = Math.floor(freeMins / SESSION_AVG_MINS);
  if (subjects.length > maxSessions + 3 && freeMins < 120) {
    const top3 = subjects.slice(0, 3).map(s => s.name).join(", ");
    banners.push({
      id:       "overload",
      severity: "warning",
      title:    `You have ${subjects.length} subjects but only ${Math.round(freeMins/60)}h free.`,
      message:  `Showing top 3 priority sessions only: ${top3}`,
      action:   null,
      dismissible: true,
    });
    scheduleAdjustments.maxSubjectsToday = 3;
  }

  // ── SITUATION 7: All sessions completed early ──────────────────
  const todayHistory = history.filter(h => h.date === today());
  const todayScheduled = todayHistory.length;
  const todayDone      = todayHistory.filter(h => isTrue(h.completed)).length;
  if (todayScheduled >= 3 && todayDone === todayScheduled && todayDone > 0) {
    const hr = new Date().getHours();
    if (hr < 16) {
      banners.push({
        id:       "all_done_early",
        severity: "success",
        title:    "All sessions complete for today! 🔥",
        message:  "Want to add bonus sessions or rest and recover?",
        action:   "bonus_sessions",
        actionLabel: "Add Bonus Session",
        dismissible: true,
      });
    }
  }

  // ── Return pattern banners ─────────────────────────────────────
  const returnPattern = detectReturnPattern(history);
  if (returnPattern && returnPattern.situationId >= 32) {
    banners.push({
      id:       "return_" + returnPattern.daysSince,
      severity: returnPattern.situationId >= 33 ? "warning" : "info",
      title:    returnPattern.message,
      message:  returnPattern.situationId >= 34
        ? "Starting fresh — your past data and XP are preserved."
        : "Here's your updated schedule.",
      action:   returnPattern.action || null,
      actionLabel: returnPattern.action === "rebuild_schedule" ? "Rebuild Now" : "Continue",
      dismissible: true,
    });
  }

  // ── User type ─────────────────────────────────────────────────
  const userType = classifyUserType(history);
  scheduleAdjustments.userType = userType.type;

  // ── Type-specific schedule adjustments ─────────────────────────
  switch (userType.type) {
    case "SPRINTER":
      scheduleAdjustments.maxSessionMins   = 20;
      scheduleAdjustments.preferDaily      = true;
      break;
    case "OVERPLANNER":
      scheduleAdjustments.maxSessionsDay   = 3;
      break;
    case "WEEKEND_WARRIOR":
      scheduleAdjustments.heavyOnWeekend   = true;
      scheduleAdjustments.lightOnWeekday   = true;
      break;
    case "PARTIAL_WORKER":
      scheduleAdjustments.halveSessionLengths = true;
      break;
    case "GHOST":
      scheduleAdjustments.maxSessionsDay   = 2;
      break;
    default: break;
  }

  // Sort banners: emergency → danger → warning → info → success
  const order = { emergency: 0, danger: 1, warning: 2, info: 3, success: 4 };
  banners.sort((a, b) => (order[a.severity] || 5) - (order[b.severity] || 5));

  return {
    banners:             banners.slice(0, 5), // max 5 banners at once
    scheduleAdjustments,
    emergencyMode,
    emergencyExam,
    userType,
  };
}

/**
 * Situation 4: Timetable changed mid-week.
 * Compares old schedule tasks to new timetable and returns rescheduled count.
 */
export function detectTimetableChange(oldTasks, newTimetable) {
  if (!oldTasks?.length || !newTimetable?.length) return null;
  const rescheduled = oldTasks.filter(t => {
    const day = newTimetable.find(d => d.day === today());
    if (!day) return false;
    // Check if task's time slot conflicts with new timetable busy slots
    const taskStart = t.start?.split?.(":")?.[0] * 60 + parseInt(t.start?.split?.(":")?.[1] || 0);
    return day.slots.some(s => {
      const sStart = s.s?.split?.(":")?.[0] * 60 + parseInt(s.s?.split?.(":")?.[1] || 0);
      const sEnd   = s.e?.split?.(":")?.[0] * 60 + parseInt(s.e?.split?.(":")?.[1] || 0);
      return taskStart >= sStart && taskStart < sEnd;
    });
  });
  return rescheduled.length > 0 ? rescheduled.length : null;
}

/**
 * SITUATION 8: Pause abuse within a session.
 * Call this from PomodoroTimer when isMid-session.
 */
export function getInSessionSituation(pauseCount, studyMins, inactivityCount) {
  const situations = [];

  if (pauseCount >= 5) {
    situations.push({
      type:    "pause_abuse",
      message: `You've paused ${pauseCount} times. Consider taking a proper break instead of multiple small pauses.`,
    });
  }
  if (studyMins >= 120) {
    situations.push({
      type:    "long_study",
      message: "You've been studying for 2 hours. Take a 15-minute break. Your brain needs recovery.",
    });
  }
  if (inactivityCount >= 2) {
    situations.push({
      type:    "inactivity",
      message: "Multiple inactivity periods detected. Focus is dropping.",
    });
  }
  return situations;
}
