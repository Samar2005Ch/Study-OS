/**
 * utils/timeUtils.js
 * Pure time/date helper functions used throughout the app.
 * "Pure" = same input always gives same output. No side effects.
 */

/** "09:30" → 570 (total minutes since midnight) */
export const toMins = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** 570 → "09:30" */
export const toTime = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** 90 (seconds) → "01:30" for timer display */
export const fmtSecs = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/** "2025-08-10" → number of days from today */
export const daysLeft = (dateStr) =>
  Math.max(0, Math.ceil((new Date(dateStr) - new Date()) / 86400000));

/** 14 (hour number) → "afternoon" */
export const hourLabel = (h) =>
  h < 6 ? "night" : h < 12 ? "morning" : h < 17 ? "afternoon" : h < 21 ? "evening" : "night";

/** Returns today as "Mon", "Tue", "Wed", etc. */
export const todayStr = () =>
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
