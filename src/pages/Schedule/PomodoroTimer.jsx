/**
 * pages/Schedule/PomodoroTimer.jsx  v3 — ANTI-CHEAT EDITION
 *
 * Wires together:
 *  - useStudySession (anti-cheat engine)
 *  - useIntegrityScore (live scoring)
 *  - calcXP (XP engine with all multipliers)
 *  - SessionTypeSelector (5 session types)
 *  - IntegrityBadge (live score ring)
 *
 * Overlays:
 *  - Tab-hidden warning (timer already paused by hook)
 *  - Inactivity "Still studying?" confirmation
 *  - Liveness check (end of pomo)
 *  - Ghost consequence
 *  - Break lock (5 min enforced break)
 *  - Session complete + XP breakdown
 */

import { useState, useCallback } from "react";
import { createPortal }          from "react-dom";
import { useRank }               from "../../system/RankContext";
import { useStudySession,
         getTodaySessionCount,
         DAILY_SESSION_CAP }     from "../../hooks/useStudySession";
import { useIntegrityScore }     from "../../hooks/useIntegrityScore";
import { calcXP, SESSION_TYPES,
         getSessionQualityLabel } from "../../utils/xpEngine";
import { getInSessionSituation } from "../../utils/situationEngine";
import LivenessModal             from "./LivenessModal";
import GhostModal                from "./GhostModal";
import SessionTypeSelector       from "./SessionTypeSelector";
import IntegrityBadge            from "./IntegrityBadge";

function fmtSecs(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function fmtMins(s) { return `${Math.floor(s / 60)}m`; }

const MIN_MINS_FOR_DONE = 5; // at least 5 honest minutes

export default function PomodoroTimer({ task, onDone, onSkip, onPostpone, onGhostLogged, streak = 0 }) {
  const { rank, theme, pathId }            = useRank();
  const [sessionTypeId, setSessionTypeId]  = useState(() => task.sessionType || "practice");
  const sessionTypeCfg                     = SESSION_TYPES[sessionTypeId] || SESSION_TYPES.practice;
  const [ghostCount,   setGhostCount]      = useState(task.ghostCount || 0);
  const [showGhost,    setShowGhost]       = useState(false);
  const [showComplete, setShowComplete]    = useState(false);
  const [finalXPResult, setFinalXPResult]  = useState(null);
  const [doneWarning,  setDoneWarning]     = useState(false);
  const [isMinimized,  setIsMinimized]     = useState(false);
  const [pipContainer, setPipContainer]    = useState(null);
  const [tabHiddenAlert, setTabHiddenAlert] = useState(false);
  const [lastTaskId,     setLastTaskId]      = useState(task.id);
  
  // ── RESET STATE ON TASK CHANGE ──────────────────────────────
  if (task.id !== lastTaskId) {
    setSessionTypeId(task.sessionType || "practice");
    setGhostCount(task.ghostCount || 0);
    setShowGhost(false);
    setShowComplete(false);
    setFinalXPResult(null);
    setDoneWarning(false);
    setTabHiddenAlert(false);
    setLastTaskId(task.id);
    session.reset();
  }

  const session = useStudySession({
    workSecs:  sessionTypeCfg.workMins  * 60,
    breakSecs: sessionTypeCfg.breakMins * 60,
    ghostSecs: 5 * 60,
    onPomoComplete: (n, tabFocusSecs, signals) => {
      // Internal counters in hook are session-wide, no need to accumulate manually
    },
    onGhost: (tabFocusSecs, signals) => {
      const newGC = ghostCount + 1;
      setGhostCount(newGC);
      setShowGhost(true);
      onGhostLogged?.(newGC);
    },
    onTabHidden:  () => setTabHiddenAlert(true),
    onTabRestored: () => {}, // alert stays until user dismisses
    onInactivityDetected: () => {},
    onInactivityConfirmed: () => {},
    onSessionBlocked: (reason) => {
      if (reason === "cap")   setDoneWarning("cap");
      if (reason === "break") setDoneWarning("break");
    },
  });

  // ── Live integrity (updates every second) ─────────────────────
  const currentBlockSecs  = session.phase === "work"
    ? (sessionTypeCfg.workMins * 60) - session.secs
    : 0;
  const totalFocusSecs    = session.tabFocusSecs;
  const focusedMins       = Math.floor(totalFocusSecs / 60);
  const canMarkDone       = focusedMins >= MIN_MINS_FOR_DONE;

  const integrityData = useIntegrityScore({
    tabHideCount:    session.tabHideCount,
    inactivityCount: session.inactivityCount,
    pauseCount:      session.pauseCount,
    tabFocusSecs:    totalFocusSecs,
    plannedSecs:     sessionTypeCfg.workMins * 60,
    sessionType:     sessionTypeId,
  });

  // ── In-session situation warnings ─────────────────────────────
  const studyMins        = Math.floor(totalFocusSecs / 60);
  const inSessionWarns   = getInSessionSituation(
    session.pauseCount,
    studyMins,
    session.inactivityCount,
  );

  // ── Daily session cap ─────────────────────────────────────────
  const todayCount = getTodaySessionCount();

  const c           = rank?.primary || "#4f6ef7";
  const phaseColor  = session.phase === "break" ? "#00c6a0" : (sessionTypeCfg.color || c);
  const durationMins= task.durationMins || task.duration_mins || sessionTypeCfg.workMins;
  const maxPomos    = Math.ceil(durationMins / sessionTypeCfg.workMins);
  const r           = 62, circ = 2 * Math.PI * r;
  const difficulty  = task.difficulty || 3;

  // ── Handlers ──────────────────────────────────────────────────
  function handleStart() {
    setTabHiddenAlert(false);
    session.start();
  }

  function handleDone() {
    if (!canMarkDone) {
      setDoneWarning("time");
      setTimeout(() => setDoneWarning(false), 2800);
      return;
    }
    session.pause(false);
    // Compute final XP
    const xpResult = calcXP({
      tabFocusSecs: totalFocusSecs,
      sessionType:  sessionTypeId,
      difficulty,
      streak,
      integritySignals: {
        tabHideCount:    session.tabHideCount,
        inactivityCount: session.inactivityCount,
        pauseCount:      session.pauseCount,
        tabFocusSecs:    totalFocusSecs,
        plannedSecs:     sessionTypeCfg.workMins * 60,
      },
    });
    setFinalXPResult(xpResult);
    setShowComplete(true);
  }

  function submitProgress(progVal) {
    setShowComplete(false);
    onDone(
      focusedMins, 
      progVal, 
      finalXPResult?.xp || 0, 
      integrityData.score,
      {
        tabHideCount:    session.tabHideCount,
        inactivityCount: session.inactivityCount,
        pauseCount:      session.pauseCount,
      }
    );
    // Force reset for next task
    session.reset();
  }

  // ── Tab-hidden overlay ─────────────────────────────────────────
  if (tabHiddenAlert && session.phase === "paused_tab") {
    return (
      <div className="card anim-up" style={{
        padding: 32, borderLeft: `4px solid #f59e0b`,
        background: "rgba(245,158,11,0.05)", marginBottom: 12,
        textAlign: "center", position: "relative", zIndex: 10
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⏸️</div>
        <div style={{ fontWeight: 900, fontSize: 18, color: "#f59e0b", fontFamily: "monospace", marginBottom: 8, letterSpacing: ".05em" }}>
          SESSION PAUSED
        </div>
        <div style={{ fontSize: 12, color: "var(--t2)", fontFamily: "monospace", marginBottom: 24, lineHeight: 1.6, maxWidth: 300, margin: "0 auto 24px" }}>
          The timer was paused to maintain study integrity. 
          Focus time is only recorded while this tab is active.
          <br /><br />
          <span style={{ color: "#f59e0b", opacity: 0.8 }}>Current Quality: {integrityData.score}%</span>
        </div>
        <button
          onClick={() => { setTabHiddenAlert(false); session.resumeAfterTab(); }}
          className="btn btn-p"
          style={{
            background: "#f59e0b", borderColor: "#f59e0b",
            padding: "12px 32px", color: "#000",
            fontWeight: 800, fontSize: 13, cursor: "pointer",
            fontFamily: "monospace", borderRadius: 8, width: "100%"
          }}
        >
          RESUME MISSION ▸
        </button>
      </div>
    );
  }

  // ── Inactivity overlay ─────────────────────────────────────────
  if (session.inactivityAlert) {
    return (
      <div className="gl" style={{
        padding: 24, borderLeft: "2px solid #9b6dff",
        background: "#9b6dff08", marginBottom: 12,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🤔</div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#9b6dff", fontFamily: "monospace", marginBottom: 8 }}>
          Still Studying?
        </div>
        <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace", marginBottom: 20 }}>
          No activity detected for 10 minutes.
          <br />Tap confirm to keep XP — or the timer will pause in 2 min.
        </div>
        <button
          onClick={session.confirmInactivity}
          style={{
            padding: "10px 28px", border: "1px solid #9b6dff",
            background: "#9b6dff18", color: "#9b6dff",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
            fontFamily: "monospace", borderRadius: 6,
          }}
        >
          YES, I'M HERE ✓
        </button>
      </div>
    );
  }

  // ── Liveness check ────────────────────────────────────────────
  if (session.phase === "liveness") return (
    <LivenessModal
      task={{ ...task, ghostCount }}
      cdSecs={session.cdSecs}
      onAlive={session.confirmAlive}
      onStop={() => session.triggerGhost()}
    />
  );

  // ── Ghost overlay ─────────────────────────────────────────────
  if (showGhost) return (
    <GhostModal
      task={{ ...task, ghostCount }}
      onResume={() => { setShowGhost(false); session.reset(); }}
      onSkip={() => { setShowGhost(false); onSkip(); }}
    />
  );

  // ── Session complete + XP breakdown ───────────────────────────
  if (showComplete && finalXPResult) {
    return (
      <div className="gl" style={{
        padding: 24,
        borderLeft: `2px solid ${integrityData.color}`,
        background: `${integrityData.color}08`,
        marginBottom: 12,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: "#5a6070", fontFamily: "monospace", letterSpacing: ".12em", marginBottom: 4 }}>
              SESSION COMPLETE
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#e8ecf4", fontFamily: "monospace" }}>
              {task.subjectName || task.subject_name}
            </div>
          </div>
          <IntegrityBadge
            score={integrityData.score}
            label={integrityData.label}
            color={integrityData.color}
            compact
          />
        </div>

        {/* XP breakdown */}
        <div style={{
          padding: "12px 14px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 8, marginBottom: 16,
          fontFamily: "JetBrains Mono, monospace",
        }}>
          <div style={{ fontSize: 9, color: "#5a6070", marginBottom: 6, letterSpacing: ".1em" }}>XP BREAKDOWN</div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{finalXPResult.breakdown}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: integrityData.color }}>
            +{finalXPResult.xp} XP
          </div>
          {finalXPResult.status === "flagged" && (
            <div style={{ fontSize: 10, color: "#ef4444", marginTop: 4 }}>
              🚩 Session flagged — integrity below threshold. No XP awarded.
            </div>
          )}
        </div>

        {/* Integrity detail */}
        <IntegrityBadge
          score={integrityData.score}
          label={integrityData.label}
          color={integrityData.color}
          breakdown={integrityData.breakdown}
          reasons={integrityData.reasons}
          showBreakdown
        />

        {/* Topic progress */}
        <div style={{ fontSize: 12, color: "#c8d0e0", fontFamily: "monospace", marginBottom: 12 }}>
          How much of <strong>{task.topic}</strong> did you cover?
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {[
            { v: 25, l: "JUST STARTED" },
            { v: 50, l: "HALFWAY" },
            { v: 75, l: "ALMOST DONE" },
            { v: 100, l: "MASTERED IT" },
          ].map(p => (
            <button
              key={p.v}
              onClick={() => submitProgress(p.v)}
              style={{
                padding: 12,
                border: `1px solid ${integrityData.color}60`,
                background: `${integrityData.color}15`,
                color: integrityData.color,
                fontWeight: 700, fontSize: 11,
                cursor: "pointer", fontFamily: "monospace", borderRadius: 6,
              }}
            >
              {p.v}% — {p.l}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Break lock overlay ────────────────────────────────────────
  if (session.breakLocked) {
    return (
      <div className="gl" style={{
        padding: 24, borderLeft: "2px solid #00c6a0",
        background: "#00c6a008", marginBottom: 12, textAlign: "center",
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>☕</div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#00c6a0", fontFamily: "monospace", marginBottom: 6 }}>
          Take Your Break
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: "#00c6a0", fontFamily: "monospace", marginBottom: 8 }}>
          {fmtSecs(session.breakLockSecs)}
        </div>
        <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>
          5-minute break enforced between sessions.
          <br />Your brain needs recovery time.
        </div>
      </div>
    );
  }

  // ── Daily cap overlay ─────────────────────────────────────────
  if (doneWarning === "cap") {
    return (
      <div className="gl" style={{
        padding: 24, borderLeft: "2px solid #7c3aed",
        background: "#7c3aed08", marginBottom: 12, textAlign: "center",
      }}>
        <div style={{ fontSize: 22, marginBottom: 8 }}>🧠</div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#7c3aed", fontFamily: "monospace", marginBottom: 8 }}>
          Daily Limit Reached
        </div>
        <div style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>
          You've completed {todayCount}/{DAILY_SESSION_CAP} sessions today.
          <br />Rest now. Tomorrow is another day.
        </div>
      </div>
    );
  }

  // ── Mini HUD ──────────────────────────────────────────────────
  const MiniHUD = (
    <div style={{
      width: "100%", height: "100%", minHeight: 90,
      background: "rgba(13,14,26,1)", borderLeft: `3px solid ${phaseColor}`,
      padding: "16px 24px", display: "flex", alignItems: "center", gap: 16,
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "monospace", color: phaseColor }}>
        {fmtSecs(session.secs)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "#e8ecf4", fontWeight: 700, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {task.subjectName || task.subject_name}
        </div>
        <div style={{ fontSize: 10, color: "#5a6070", fontFamily: "monospace", marginTop: 3 }}>
          Quality: {integrityData.score}% · {fmtMins(totalFocusSecs)} focused
        </div>
      </div>
      <button
        onClick={() => { setIsMinimized(false); if (pipContainer) window.documentPictureInPicture?.window?.close(); }}
        style={{ background: "transparent", border: "1px solid #5a6070", color: "#e8ecf4", cursor: "pointer", padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}
      >
        EXPAND 🗗
      </button>
    </div>
  );

  if (pipContainer) return createPortal(MiniHUD, pipContainer);
  if (isMinimized) return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, borderRadius: 8, overflow: "hidden", boxShadow: `0 8px 32px rgba(0,0,0,0.5)`, width: 340, height: 90, border: `1px solid ${c}40` }}>
      {MiniHUD}
    </div>
  );

  // ── MAIN TIMER VIEW ───────────────────────────────────────────
  const isEmergency = sessionTypeId === "emergency";
  return (
    <div className="gl" style={{
      borderLeft:   `2px solid ${phaseColor}`,
      borderTop:    `1px solid ${phaseColor}20`,
      borderRight:  `1px solid ${phaseColor}08`,
      borderBottom: `1px solid ${phaseColor}08`,
      padding: 22, marginBottom: 12,
      position: "relative",
      boxShadow: isEmergency ? `0 0 30px rgba(220,38,38,0.15)` : "none",
      animation: isEmergency && session.phase === "work" ? "emergencyGlow 2s ease-in-out infinite" : "none",
    }}>
      {/* Corner accents */}
      <div style={{ position: "absolute", top: 0,    left: 0,  width: 10, height: 10, borderTop: `2px solid ${c}`, borderLeft: `2px solid ${c}`, opacity: .8 }} />
      <div style={{ position: "absolute", bottom: 0, right: 0, width: 8,  height: 8,  borderBottom: `1px solid ${c}30`, borderRight: `1px solid ${c}30` }} />

      {/* Emergency banner */}
      {isEmergency && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          background: "rgba(220,38,38,0.12)", padding: "4px 12px",
          fontSize: 9, fontFamily: "JetBrains Mono, monospace",
          color: "#dc2626", letterSpacing: ".15em", textAlign: "center",
        }}>
          ⚡ EMERGENCY MODE — 2.0× XP ACTIVE ⚡
        </div>
      )}

      {/* Top controls */}
      <button
        onClick={async () => {
          if (pipContainer) { window.documentPictureInPicture?.window?.close(); setPipContainer(null); return; }
          setIsMinimized(!isMinimized);
        }}
        style={{ position: "absolute", top: isEmergency ? 28 : 10, right: 34, background: "transparent", border: "none", color: "#5a6070", cursor: "pointer", padding: 5, fontSize: 14, fontWeight: 700 }}
        title="Minimize"
      >_</button>
      <button
        onClick={() => onPostpone?.()}
        style={{ position: "absolute", top: isEmergency ? 28 : 10, right: 10, background: "transparent", border: "none", color: "#5a6070", cursor: "pointer", padding: 5, fontSize: 14 }}
        title="Postpone"
      >✖</button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginTop: isEmergency ? 20 : 0 }}>
        <div style={{ width: 7, height: 7, background: task.color || c, transform: "rotate(45deg)", boxShadow: `0 0 8px ${task.color || c}` }} />
        <span style={{ color: "#5a6070", fontSize: 10, fontFamily: "monospace" }}>
          {task.start || task.start_time} — {task.end || task.end_time}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {Array.from({ length: maxPomos }).map((_, i) => (
            <div key={i} style={{ width: 7, height: 7, background: i < session.pomos ? phaseColor : "#1c2030", transform: "rotate(45deg)", boxShadow: i < session.pomos ? `0 0 5px ${phaseColor}` : "none", transition: "all .4s" }} />
          ))}
        </div>
      </div>

      {/* Subject + topic */}
      <div style={{ fontWeight: 700, fontSize: 16, color: "#e8ecf4", fontFamily: "monospace", marginBottom: 3 }}>
        {task.subjectName || task.subject_name}
      </div>
      <div style={{ fontSize: 11, color: "#5a6070", fontFamily: "monospace", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
        // {task.topic}
        {(task.topicDiff || task.topic_diff) === "hard" && (
          <span style={{ fontSize: 9, color: "#ff3c3c", border: "1px solid #ff3c3c40", padding: "1px 5px" }}>HARD</span>
        )}
      </div>
      {(task.aiReason || task.ai_reason) && (
        <div style={{ fontSize: 9, color: c, marginBottom: 14, fontFamily: "monospace" }}>
          {">> "}{task.aiReason || task.ai_reason}
        </div>
      )}

      {/* Session type selector */}
      <SessionTypeSelector
        selected={sessionTypeId}
        onChange={setSessionTypeId}
        disabled={session.phase !== "idle"}
      />

      {/* Daily cap indicator */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 9, color: "#333", fontFamily: "monospace", marginBottom: 14,
      }}>
        <span>Sessions today: {todayCount}/{DAILY_SESSION_CAP}</span>
        <span style={{ color: integrityData.color }}>
          Live quality: {integrityData.score}%
        </span>
      </div>

      {/* Ring timer */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <div style={{ position: "relative" }}>
          {/* Integrity outer ring */}
          <svg width={160} height={160} style={{ position: "absolute", top: -8, left: -8, transform: "rotate(-90deg)" }}>
            <circle cx={80} cy={80} r={76} fill="none" stroke="#111" strokeWidth={2} />
            <circle
              cx={80} cy={80} r={76}
              fill="none" stroke={integrityData.color} strokeWidth={2}
              strokeDasharray={2 * Math.PI * 76}
              strokeDashoffset={2 * Math.PI * 76 * (1 - integrityData.score / 100)}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s" }}
            />
          </svg>

          <svg width={144} height={144} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={72} cy={72} r={r} fill="none" stroke="#1c2030" strokeWidth={7} />
            <circle cx={72} cy={72} r={r} fill="none" stroke={phaseColor} strokeWidth={7}
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - session.pct / 100)}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }}
            />
          </svg>

          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "monospace", color: phaseColor, letterSpacing: "-.03em" }}>
              {fmtSecs(session.secs)}
            </div>
            <div style={{ fontSize: 9, color: "#5a6070", fontFamily: "monospace" }}>
              {session.phase === "break" ? "BREAK" : session.phase === "idle" ? "READY" : session.phase === "paused" ? "PAUSED" : "FOCUS"}
            </div>
            <div style={{ fontSize: 9, color: integrityData.color, marginTop: 2, fontFamily: "monospace" }}>
              {integrityData.score}%
            </div>
          </div>
        </div>
      </div>

      {/* Focus progress bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontFamily: "monospace", marginBottom: 5 }}>
          <span style={{ color: canMarkDone ? "#00c6a0" : "#5a6070" }}>
            FOCUSED: {focusedMins}m / {durationMins}m
            {!canMarkDone && ` (need ${MIN_MINS_FOR_DONE}m min)`}
          </span>
          <span style={{ color: integrityData.color, fontWeight: 700 }}>
            {sessionTypeCfg.xpMultiplier}× XP
          </span>
        </div>
        <div style={{ height: 3, background: "#1c2030", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.min((focusedMins / durationMins) * 100, 100)}%`,
            background: canMarkDone ? "#00c6a0" : phaseColor,
            transition: "width 1s linear",
          }} />
        </div>
      </div>

      {/* In-session warnings */}
      {inSessionWarns.map((w, i) => (
        <div key={i} style={{
          marginBottom: 10, padding: "7px 12px",
          borderLeft: "2px solid #f59e0b", background: "#f59e0b08",
          fontSize: 10, color: "#f59e0b", fontFamily: "monospace",
        }}>
          ⚠ {w.message}
        </div>
      ))}

      {/* Done warning */}
      {doneWarning === "time" && (
        <div style={{ marginBottom: 10, padding: "7px 12px", borderLeft: "2px solid #ff8c42", background: "#ff8c4208", fontSize: 10, color: "#ff8c42", fontFamily: "monospace" }}>
          [ STUDY AT LEAST {MIN_MINS_FOR_DONE} MINUTES BEFORE MARKING DONE ]
        </div>
      )}

      {/* Ghost warning */}
      {ghostCount > 0 && (
        <div style={{ marginBottom: 12, padding: "7px 12px", borderLeft: "2px solid #ff3c3c", background: "#ff3c3c08", fontSize: 10, color: "#ff3c3c", fontFamily: "monospace" }}>
          [ {ghostCount} GHOST(S) — {ghostCount >= 2 ? "ONE MORE = LOCKED" : "STAY FOCUSED"} ]
        </div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() =>
            (session.phase === "idle" || session.phase === "paused" || session.phase === "paused_tab") ? handleStart() : session.pause(false)
          }
          style={{
            flex: 2, padding: 11, border: `1px solid ${phaseColor}`,
            background: `${phaseColor}18`, color: phaseColor,
            fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "monospace", borderRadius: 0,
          }}
        >
          {session.phase === "work" ? "PAUSE" : session.phase === "break" ? "RESTING..." : (session.phase === "paused" || session.phase === "paused_tab") ? "RESUME" : "START"}
        </button>

        <button
          onClick={handleDone}
          style={{
            flex: 1, padding: 11,
            border: `1px solid ${canMarkDone ? "#00c6a0" : "#1c2030"}`,
            background: canMarkDone ? "#00c6a008" : "transparent",
            color: canMarkDone ? "#00c6a0" : "#3a4060",
            fontWeight: 700, fontSize: 11, cursor: canMarkDone ? "pointer" : "not-allowed",
            fontFamily: "monospace", borderRadius: 0, transition: "all .2s",
          }}
          title={canMarkDone ? "Mark as done" : `Study at least ${MIN_MINS_FOR_DONE} min first`}
        >
          DONE
        </button>

        <button
          onClick={() => onPostpone?.()}
          style={{ flex: 1, padding: 11, border: "1px solid #ff8c4250", background: "#ff8c4208", color: "#ff8c42", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "monospace", borderRadius: 0 }}
          title="Postpone — do this later today, no penalty"
        >
          LATER
        </button>

        <button
          onClick={() => onSkip()}
          style={{ flex: 1, padding: 11, border: "1px solid #ff3c3c30", background: "#ff3c3c08", color: "#ff3c3c", fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "monospace", borderRadius: 0 }}
          title="Skip — counts as skipped in history"
        >
          SKIP
        </button>
      </div>

      <div style={{ marginTop: 14, fontSize: 9, color: "#3a4060", textAlign: "center", fontFamily: "monospace" }}>
        ANTI-CHEAT ACTIVE · TAB-SWITCH PENALISED · INACTIVITY DETECTED · {sessionTypeCfg.workMins}MIN POMO
      </div>

      <style>{`
        @keyframes emergencyGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(220,38,38,0.1); }
          50%       { box-shadow: 0 0 40px rgba(220,38,38,0.3); }
        }
      `}</style>
    </div>
  );
}
