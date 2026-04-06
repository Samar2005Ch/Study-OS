/**
 * hooks/useScheduler.js — SWAPPED to API calls.
 * Algorithm now runs on backend. Frontend just asks for schedule.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../api/client";

export const hourLabel = (h) =>
  h<6?"night":h<12?"morning":h<17?"afternoon":h<21?"evening":"night";

/**
 * calcXP — backward-compatible wrapper.
 * Prefer importing calcXP from utils/xpEngine for full integrity scoring.
 * This simplified version is kept for legacy callers.
 */
export function calcXP(topicProgress, plannedMins, integrityScore) {
  if (typeof topicProgress !== "number") topicProgress = 100;
  const integMult = integrityScore !== undefined ? (integrityScore / 100) : 1;
  return Math.round((topicProgress / 100) * plannedMins * integMult * 4);
}

export { calcXP as calcXPLegacy };

const SchedulerContext = createContext();

export function SchedulerProvider({ children }) {
  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [message,  setMessage]  = useState("");

  const refreshTasks = useCallback(async () => {
    try {
      const t = await api.getTodayTasks();
      setTasks(t);
    } catch(e) {
      console.error("Failed to load tasks:", e);
    }
  }, []);

  useEffect(() => { refreshTasks(); }, [refreshTasks]);

  const generate = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await api.generateSchedule();
      setTasks(result.tasks);
      setMessage(result.message);
      return result;
    } catch(e) {
      setMessage(e.message || "Failed to generate schedule.");
      return { tasks: [], message: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (id, changes) => {
    setTasks(prev => prev.map(t => t.id===id ? {...t,...changes} : t));
    try {
      await api.updateTaskStatus(id, changes);
      await refreshTasks(); // Sync backend cascading shifts immediately
    } catch(e) {
      console.error("Failed to update task:", e);
    }
  }, [refreshTasks]);

  const activeTask = tasks.find(t => t.status === "active");

  return (
    <SchedulerContext.Provider value={{ tasks, activeTask, generate, updateTask, refreshTasks, loading, message }}>
      {children}
    </SchedulerContext.Provider>
  );
}

export function useScheduler() {
  return useContext(SchedulerContext);
}
