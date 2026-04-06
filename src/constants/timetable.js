/**
 * constants/timetable.js
 * Static data for the timetable feature.
 * DAYS and SLOT_LABELS never change, so they live here.
 */

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const SLOT_LABELS = [
  { value: "College",  color: "#5b8dee" },
  { value: "Coaching", color: "#f5a623" },
  { value: "Other",    color: "#a78bfa" },
];

// Default hours — student is awake 7am to 10pm
export const WAKE_HOUR  = 7;
export const SLEEP_HOUR = 22;
