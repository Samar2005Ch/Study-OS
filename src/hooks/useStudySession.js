/**
 * hooks/useStudySession.js
 * Manages the active Pomodoro timer state.
 *
 * KEY CHANGE: tracks actualSecs so XP is based on real time,
 * not planned time. Even if student does 20/25 mins → gets 80% XP.
 */

import { useState, useEffect, useRef } from "react";

export const GHOST_SECS = 5 * 60;

export function useStudySession({ onPomoComplete, onGhost, workSecs = 25 * 60, breakSecs = 5 * 60, ghostSecs = GHOST_SECS }) {
  const [phase,      setPhase]      = useState("idle");
  const [secs,       setSecs]       = useState(workSecs);
  const [cdSecs,     setCdSecs]     = useState(ghostSecs);
  const [pomos,      setPomos]      = useState(0);
  const [actualSecs, setActualSecs] = useState(0); // total focused seconds

  const workRef = useRef(null);
  const cdRef   = useRef(null);
  const lastTick= useRef(null);

  useEffect(() => {
    if (phase === "idle") setSecs(workSecs);
  }, [workSecs, phase]);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Work / break countdown
  useEffect(() => {
    if (phase !== "work" && phase !== "break") return;
    lastTick.current = Date.now();
    workRef.current = setInterval(() => {
      const now = Date.now();
      const diff = Math.round((now - lastTick.current) / 1000);
      lastTick.current = now;

      setSecs(s => {
        if (phase === "work") setActualSecs(a => a + diff); 
        if (s <= diff) {
          clearInterval(workRef.current);
          if (phase === "work") {
            setPhase("liveness");
            setCdSecs(ghostSecs);
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification("[ STUDYOS ] LIVENESS CHECK", {
                body: "Open StudyOS immediately to verify focus.",
                icon: "/favicon.ico"
              });
            }
          } else {
            setPhase("idle");
            setSecs(workSecs);
          }
          return 0;
        }
        return s - diff;
      });
    }, 1000);
    return () => clearInterval(workRef.current);
  }, [phase, workSecs, ghostSecs]);

  // Liveness countdown
  useEffect(() => {
    if (phase !== "liveness") return;
    lastTick.current = Date.now();
    cdRef.current = setInterval(() => {
      const now = Date.now();
      const diff = Math.round((now - lastTick.current) / 1000);
      lastTick.current = now;

      setCdSecs(c => {
        if (c <= diff) {
          clearInterval(cdRef.current);
          triggerGhost();
          return 0;
        }
        return c - diff;
      });
    }, 1000);
    return () => clearInterval(cdRef.current);
  }, [phase]);

  function start() {
    if (phase === "idle") {
      setSecs(workSecs);
    }
    setPhase("work");
  }

  function pause() {
    clearInterval(workRef.current);
    if (phase === "work" || phase === "break") {
      setPhase("paused");
    }
  }

  function confirmAlive() {
    clearInterval(cdRef.current);
    const np = pomos + 1;
    setPomos(np);
    onPomoComplete?.(np, actualSecs); // pass actual seconds too
    setSecs(breakSecs);
    setPhase("break");
  }

  function triggerGhost() {
    setPhase("ghosted");
    onGhost?.(actualSecs);
  }

  function reset() {
    clearInterval(workRef.current);
    clearInterval(cdRef.current);
    setPhase("idle");
    setSecs(workSecs);
    setCdSecs(ghostSecs);
    setPomos(0);
    setActualSecs(0);
  }

  const pct = phase === "work"
    ? Math.round(((workSecs  - secs) / workSecs)  * 100)
    : phase === "break"
    ? Math.round(((breakSecs - secs) / breakSecs) * 100)
    : 0;

  return {
    phase, secs, cdSecs, pomos, pct, actualSecs,
    start, pause, confirmAlive, triggerGhost, reset,
  };
}
