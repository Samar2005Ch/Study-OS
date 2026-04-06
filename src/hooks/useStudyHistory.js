import { useState, useEffect } from "react";
import { api } from "../api/client";

export function useStudyHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.getHistory().then(setHistory).catch(console.error);
  }, []);

  async function addEntry(entry) {
    try {
      await api.addHistory({
        sourceType:  entry.sourceType  || "exam",
        sourceId:    entry.sourceId    || entry.subjectId    || 0,
        subjectName: entry.subjectName || entry.subject_name || "",
        topic:       entry.topic,
        plannedMins: entry.plannedMins,
        actualMins:  entry.actualMins  || 0,
        completed:   entry.completed   ? 1 : 0,
        skipped:     entry.skipped     ? 1 : 0,
        ghosted:     entry.ghosted     ? 1 : 0,
        focusRating: entry.focusRating || 0,
        timeOfDay:   entry.timeOfDay   || "morning",
        xpEarned:    entry.xpEarned    || 0,
      });
      const updated = await api.getHistory();
      setHistory(updated);
    } catch(e) {
      console.error("Failed to save history:", e);
    }
  }

  return { history, addEntry };
}
