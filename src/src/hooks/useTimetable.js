/**
 * hooks/useTimetable.js
 * Manages timetable slots in localStorage.
 *
 * A "slot" looks like:
 *   { id, day: "Mon", label: "College", start: "09:00", end: "12:00" }
 *
 * USAGE:
 *   const { slots, addSlot, removeSlot, getFreeSlots } = useTimetable();
 */

import { useState } from "react";
import { WAKE_HOUR, SLEEP_HOUR } from "../constants/timetable";

const STORAGE_KEY = "studyos_timetable";

// "09:00" → 540 (minutes since midnight)
const toMins = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// 540 → "09:00"
const toTime = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function useTimetable() {
  const [slots, setSlots] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  /** Save to state + localStorage together */
  function persist(newSlots) {
    setSlots(newSlots);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSlots));
  }

  /** Add a new slot. Returns error string if invalid, null if ok. */
  function addSlot(slot) {
    // Validation
    if (!slot.day || !slot.label || !slot.start || !slot.end) {
      return "Please fill in all fields.";
    }
    if (toMins(slot.start) >= toMins(slot.end)) {
      return "End time must be after start time.";
    }

    // Check overlap with existing slots on the same day
    const daySlots = slots.filter((s) => s.day === slot.day);
    const newStart = toMins(slot.start);
    const newEnd   = toMins(slot.end);
    const hasOverlap = daySlots.some((s) => {
      const sStart = toMins(s.start);
      const sEnd   = toMins(s.end);
      return newStart < sEnd && newEnd > sStart;
    });
    if (hasOverlap) return "This slot overlaps with an existing one.";

    persist([...slots, { ...slot, id: Date.now() }]);
    return null; // null = no error
  }

  /** Remove a slot by id */
  function removeSlot(id) {
    persist(slots.filter((s) => s.id !== id));
  }

  /**
   * Returns free time slots for a given day.
   * Free = gaps between busy slots, within wake/sleep hours.
   */
  function getFreeSlots(day) {
    const daySlots = slots
      .filter((s) => s.day === day)
      .sort((a, b) => toMins(a.start) - toMins(b.start));

    const free = [];
    let cursor = WAKE_HOUR * 60;
    const limit = SLEEP_HOUR * 60;

    for (const s of daySlots) {
      const bs = toMins(s.start);
      const be = toMins(s.end);
      if (cursor < bs) {
        free.push({ start: toTime(cursor), end: toTime(bs), mins: bs - cursor });
      }
      cursor = Math.max(cursor, be);
    }
    if (cursor < limit) {
      free.push({ start: toTime(cursor), end: toTime(limit), mins: limit - cursor });
    }
    return free;
  }

  return { slots, addSlot, removeSlot, getFreeSlots };
}
