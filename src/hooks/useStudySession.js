/**
 * hooks/useStudySession.js  v3 — ANTI-CHEAT EDITION
 *
 * ANTI-CHEAT MECHANISMS:
 *  1. Page Visibility API  → timer pauses when tab hidden
 *  2. Inactivity detection → pauses after 10 min no input
 *  3. Crash recovery       → saves state to localStorage with timestamp
 *  4. Daily session cap    → max 8 sessions per day
 *  5. Min break enforcement→ 5 min break enforced between sessions
 *  6. Integrity scoring    → every second counts toward score
 *
 * XP is based on tab_focus_time — the only honest metric.
 */

import { useState, useEffect, useRef, useCallback } from "react";

export const GHOST_SECS          = 5 * 60;
export const INACTIVITY_SECS     = 10 * 60; // 10 min no input → pause
export const INACTIVITY_GRACE    = 2 * 60;  // 2 min to respond before auto-pause
export const DAILY_SESSION_CAP   = 8;
export const MIN_BREAK_SECS      = 5 * 60;  // 5 min enforced break
export const MIN_SESSION_FOR_XP  = 5 * 60;  // 5 min = earn XP

const STORE_KEY = "studyos_session_state";

// ─── LocalStorage crash recovery ──────────────────────────────────
function saveSessionState(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {}
}
function loadSessionState() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch { return null; }
}
function clearSessionState() {
  try { localStorage.removeItem(STORE_KEY); } catch {}
}

// ─── Daily session counter ─────────────────────────────────────────
export function getTodaySessionCount() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const data  = JSON.parse(localStorage.getItem("studyos_daily_sessions") || "{}");
    return data[today] || 0;
  } catch { return 0; }
}
export function incrementDailySessionCount() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const data  = JSON.parse(localStorage.getItem("studyos_daily_sessions") || "{}");
    data[today] = (data[today] || 0) + 1;
    localStorage.setItem("studyos_daily_sessions", JSON.stringify(data));
    return data[today];
  } catch { return 0; }
}

// ─── Last session end time (for break enforcement) ─────────────────
export function getLastSessionEnd() {
  try { return parseInt(localStorage.getItem("studyos_last_session_end") || "0", 10); } catch { return 0; }
}
export function setLastSessionEnd() {
  try { localStorage.setItem("studyos_last_session_end", Date.now().toString()); } catch {}
}
export function getBreakSecsRemaining() {
  const last = getLastSessionEnd();
  if (!last) return 0;
  const elapsed = (Date.now() - last) / 1000;
  return Math.max(0, Math.ceil(MIN_BREAK_SECS - elapsed));
}

// ══════════════════════════════════════════════════════════════════
export function useStudySession({
  onPomoComplete,
  onGhost,
  onTabHidden,          // called when tab goes hidden (timer paused)
  onTabRestored,        // called when tab comes back
  onInactivityDetected, // called when idle > 10 min (show "still studying?")
  onInactivityConfirmed,
  onSessionBlocked,     // called if daily cap reached
  workSecs   = 25 * 60,
  breakSecs  = 5  * 60,
  ghostSecs  = GHOST_SECS,
}) {
  const [phase,           setPhase]           = useState("idle");
  const [secs,            setSecs]            = useState(workSecs);
  const [cdSecs,          setCdSecs]          = useState(ghostSecs);
  const [pomos,           setPomos]           = useState(0);
  const [tabFocusSecs,    setTabFocusSecs]    = useState(0); // HONEST time: tab was active
  const [pausedByTab,     setPausedByTab]     = useState(false);
  const [inactivityAlert, setInactivityAlert] = useState(false);
  const [breakLocked,     setBreakLocked]     = useState(false);
  const [breakLockSecs,   setBreakLockSecs]   = useState(0);

  // integrity signals
  const [tabHideCount,    setTabHideCount]    = useState(0);
  const [inactivityCount, setInactivityCount] = useState(0);
  const [pauseCount,      setPauseCount]      = useState(0);
  const [sessionStartTs,  setSessionStartTs]  = useState(null);

  const workRef         = useRef(null);
  const cdRef           = useRef(null);
  const breakLockRef    = useRef(null);
  const inactivityRef   = useRef(null);
  const inactivityGrace = useRef(null);
  const invisibilityTimer = useRef(null);
  const lastTick        = useRef(null);
  const lastInput       = useRef(Date.now());
  const phaseRef        = useRef(phase);
  phaseRef.current      = phase;

  // Request notification permission
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Track any user input ────────────────────────────────────────
  useEffect(() => {
    const up = () => {
      lastInput.current = Date.now();
      // If inactivity alert is showing and user returns
      if (inactivityAlert) {
        clearTimeout(inactivityGrace.current);
        setInactivityAlert(false);
        onInactivityConfirmed?.();
        resetInactivityTimer();
      }
    };
    ["keydown","mousemove","mousedown","touchstart","scroll"].forEach(ev =>
      window.addEventListener(ev, up, { passive: true })
    );
    return () => {
      ["keydown","mousemove","mousedown","touchstart","scroll"].forEach(ev =>
        window.removeEventListener(ev, up)
      );
    };
  }, [inactivityAlert]);

  // ── Page Visibility API ─────────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        // Grace period (1.5s) to allow for accidental switches or fast lookups
        invisibilityTimer.current = setTimeout(() => {
          if (phaseRef.current === "work") {
            pauseTimer(true); // true = paused by tab
            setTabHideCount(c => c + 1);
            onTabHidden?.();
          }
        }, 1500);
      } else {
        clearTimeout(invisibilityTimer.current);
        if (phaseRef.current === "paused_tab") {
          // Tab is back — show warning but DO NOT auto-resume
          setPausedByTab(true);
          onTabRestored?.();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // ── Inactivity timer ───────────────────────────────────────────
  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityRef.current);
    clearTimeout(inactivityGrace.current);
    if (phaseRef.current !== "work") return;
    inactivityRef.current = setTimeout(() => {
      if (phaseRef.current !== "work") return;
      setInactivityAlert(true);
      setInactivityCount(c => c + 1);
      onInactivityDetected?.();
      // Grace: 2 min to respond, then auto-pause
      inactivityGrace.current = setTimeout(() => {
        if (phaseRef.current === "work") {
          pauseTimer(false);
        }
        setInactivityAlert(false);
      }, INACTIVITY_GRACE * 1000);
    }, INACTIVITY_SECS * 1000);
  }, []);

  useEffect(() => {
    if (phase === "work") resetInactivityTimer();
    else {
      clearTimeout(inactivityRef.current);
      clearTimeout(inactivityGrace.current);
    }
  }, [phase]);

  // ── Crash recovery on mount ─────────────────────────────────────
  useEffect(() => {
    const saved = loadSessionState();
    if (!saved) return;
    const { startTs, plannedSecs, tabFocusSecs: savedFocus } = saved;
    const wallTime = (Date.now() - startTs) / 1000;
    // If wall time << planned → suspicious (device clock change)
    // Only count saved tabFocusSecs — don't trust wall clock
    if (savedFocus > 0) {
      setTabFocusSecs(savedFocus);
    }
    clearSessionState();
  }, []);

  // ── Main work / break tick ─────────────────────────────────────
  // refs for live counters to avoid interval re-triggering
  const secsRef         = useRef(secs);
  const tabFocusRef     = useRef(tabFocusSecs);
  const cdSecsRef       = useRef(cdSecs);

  // Sync refs to state for UI (occasionally)
  useEffect(() => { secsRef.current = secs; }, [secs]);
  useEffect(() => { tabFocusRef.current = tabFocusSecs; }, [tabFocusSecs]);
  useEffect(() => { cdSecsRef.current = cdSecs; }, [cdSecs]);

  useEffect(() => {
    if (phase !== "work" && phase !== "break") return;
    
    lastTick.current = Date.now();

    workRef.current = setInterval(() => {
      const now  = Date.now();
      // Use wall clock diff for robustness (handles brief JS execution pauses)
      const diff = Math.max(1, Math.round((now - lastTick.current) / 1000));
      lastTick.current = now;

      if (phase === "work") {
        tabFocusRef.current += diff;
        setTabFocusSecs(f => f + diff);
        
        // Save state for crash recovery
        saveSessionState({
          startTs:     sessionStartTs || now,
          plannedSecs: workSecs,
          tabFocusSecs: tabFocusRef.current,
        });
      }

      secsRef.current -= diff;
      setSecs(s => {
        const next = s - diff;
        if (next <= 0) {
          clearInterval(workRef.current);
          if (phase === "work") {
            setPhase("liveness");
            setCdSecs(ghostSecs);
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              new Notification("[ STUDYOS ] LIVENESS CHECK", {
                body: "Open StudyOS immediately to verify focus.",
                icon: "/favicon.ico",
              });
            }
          } else {
            setPhase("idle");
            setSecs(workSecs);
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(workRef.current);
  }, [phase, workSecs, ghostSecs, sessionStartTs]); // FIXED: Removed tabFocusSecs from deps


  // ── Liveness countdown ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== "liveness") return;
    lastTick.current = Date.now();
    cdRef.current = setInterval(() => {
      const now  = Date.now();
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

  // ── Break lock countdown ────────────────────────────────────────
  useEffect(() => {
    if (!breakLocked) return;
    const remaining = getBreakSecsRemaining();
    setBreakLockSecs(remaining);
    if (remaining <= 0) { setBreakLocked(false); return; }
    breakLockRef.current = setInterval(() => {
      setBreakLockSecs(s => {
        if (s <= 1) {
          clearInterval(breakLockRef.current);
          setBreakLocked(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(breakLockRef.current);
  }, [breakLocked]);

  // ── Controls ──────────────────────────────────────────────────
  function start() {
    // Check daily cap
    const todayCount = getTodaySessionCount();
    if (todayCount >= DAILY_SESSION_CAP) {
      onSessionBlocked?.("cap");
      return false;
    }
    // Check break lock
    const breakRemaining = getBreakSecsRemaining();
    if (breakRemaining > 0) {
      setBreakLocked(true);
      setBreakLockSecs(breakRemaining);
      onSessionBlocked?.("break");
      return false;
    }
    if (phase === "idle") setSecs(workSecs);
    const ts = Date.now();
    setSessionStartTs(ts);
    setPhase("work");
    resetInactivityTimer();
    return true;
  }

  function pauseTimer(byTab = false) {
    clearInterval(workRef.current);
    clearTimeout(inactivityRef.current);
    clearTimeout(inactivityGrace.current);
    if (phase === "work" || phase === "break") {
      const newPhase = byTab ? "paused_tab" : "paused";
      setPhase(newPhase);
      setPauseCount(c => c + 1);
    }
  }

  function resume() {
    if (phase === "paused" || phase === "paused_tab") {
      setPausedByTab(false);
      setPhase("work");
      resetInactivityTimer();
    }
  }

  function confirmAlive() {
    clearInterval(cdRef.current);
    const np = pomos + 1;
    setPomos(np);
    incrementDailySessionCount();
    setLastSessionEnd();
    onPomoComplete?.(np, tabFocusSecs, {
      tabHideCount, inactivityCount, pauseCount,
    });
    setSecs(breakSecs);
    setPhase("break");
    clearSessionState();
    resetInactivityTimer();
  }

  function triggerGhost() {
    setPhase("ghosted");
    clearSessionState();
    setLastSessionEnd();
    onGhost?.(tabFocusSecs, {
      tabHideCount, inactivityCount, pauseCount,
    });
  }

  function confirmInactivity() {
    clearTimeout(inactivityGrace.current);
    setInactivityAlert(false);
    lastInput.current = Date.now();
    onInactivityConfirmed?.();
    resetInactivityTimer();
  }

  function resumeAfterTab() {
    clearTimeout(invisibilityTimer.current);
    setPausedByTab(false);
    setPhase("work");
    resetInactivityTimer();
  }

  function reset() {
    clearInterval(workRef.current);
    clearInterval(cdRef.current);
    clearInterval(breakLockRef.current);
    clearTimeout(inactivityRef.current);
    clearTimeout(inactivityGrace.current);
    setPhase("idle");
    setSecs(workSecs);
    setCdSecs(ghostSecs);
    setPomos(0);
    setTabFocusSecs(0);
    setPausedByTab(false);
    setInactivityAlert(false);
    setTabHideCount(0);
    setInactivityCount(0);
    setPauseCount(0);
    setSessionStartTs(null);
    clearSessionState();
  }

  const pct = phase === "work"
    ? Math.round(((workSecs  - secs) / workSecs)  * 100)
    : phase === "break"
    ? Math.round(((breakSecs - secs) / breakSecs) * 100)
    : 0;

  const isRunning = phase === "work";
  const isPaused  = phase === "paused" || phase === "paused_tab";

  return {
    phase, secs, cdSecs, pomos, pct,
    tabFocusSecs,    // THE honest metric
    pausedByTab,     // true = tab-hide pause, show specific warning
    inactivityAlert, // true = show "still studying?" overlay
    breakLocked,     // true = break not done yet
    breakLockSecs,   // seconds until break is done
    tabHideCount, inactivityCount, pauseCount,
    isRunning, isPaused,
    start, pause: pauseTimer, resume, reset,
    confirmAlive, triggerGhost,
    confirmInactivity, resumeAfterTab,
  };
}
