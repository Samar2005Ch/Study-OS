/**
 * hooks/useTimetable.js
 * SWAPPED: localStorage → API calls to Node.js backend.
 *
 * WHAT CHANGED:
 *   Before: saved to localStorage directly
 *   Now:    calls api.getTimetable(), api.addSlot() etc
 *   Pages:  no change at all — same hook interface
 */

import { useState, useEffect } from "react";
import { api } from "../api/client";

const toMins = (t) => {
  const [h, m] = t.split(":").map(Number);
  if (h===0&&m===0) return 24*60;
  return h*60+m;
};
const toTime = (m) =>
  `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;

export function fmt12(time24) {
  const [h,m] = time24.split(":").map(Number);
  if (h===0&&m===0) return "12:00 AM";
  const p=h>=12?"PM":"AM", hr=h%12||12;
  return `${hr}:${String(m).padStart(2,"0")} ${p}`;
}

export function to24(hour, min, period) {
  let h = parseInt(hour);
  if (period==="AM"&&h===12) h=0;
  if (period==="PM"&&h!==12) h+=12;
  return `${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}`;
}

export function useTimetable() {
  const [slots,     setSlots]     = useState([]);
  const [wakeTime,  setWakeTime]  = useState("06:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [loading,   setLoading]   = useState(true);

  // Load everything from backend on mount
  useEffect(() => {
    async function load() {
      try {
        const [slotsData, settings] = await Promise.all([
          api.getTimetable(),
          api.getSettings(),
        ]);
        setSlots(slotsData);
        if (settings.wake_time)  setWakeTime(settings.wake_time);
        if (settings.sleep_time) setSleepTime(settings.sleep_time);
      } catch (e) {
        console.error("Failed to load timetable:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function addSlot(slot) {
    try {
      const newSlot = await api.addSlot(slot);
      setSlots(prev => [...prev, newSlot]);
      return null;
    } catch (e) {
      return e.message;
    }
  }

  async function removeSlot(id) {
    await api.deleteSlot(id);
    setSlots(prev => prev.filter(s => s.id !== id));
  }

  async function updateWake(t) {
    setWakeTime(t);
    await api.saveSetting("wake_time", t);
  }

  async function updateSleep(t) {
    setSleepTime(t);
    await api.saveSetting("sleep_time", t);
  }

  function getFreeSlots(day) {
    const daySlots = slots
      .filter(s => s.day===day)
      .sort((a,b) => toMins(a.start)-toMins(b.start));
    const free = [];
    let cursor = toMins(wakeTime);
    const limit = toMins(sleepTime);
    for (const s of daySlots) {
      const bs=toMins(s.start), be=toMins(s.end);
      if (cursor<bs) free.push({ start:toTime(cursor), end:toTime(bs), mins:bs-cursor });
      cursor = Math.max(cursor, be);
    }
    if (cursor<limit) free.push({ start:toTime(cursor), end:toTime(limit), mins:limit-cursor });
    return free;
  }

  return { slots, addSlot, removeSlot, getFreeSlots, wakeTime, sleepTime, updateWake, updateSleep, loading };
}
