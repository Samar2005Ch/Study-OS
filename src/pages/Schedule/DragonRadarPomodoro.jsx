import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRank } from "../../system/RankContext";
import { useStudySession } from "../../hooks/useStudySession";
import { useScheduler, calcXP, hourLabel } from "../../hooks/useScheduler";
import { useStudyHistory } from "../../hooks/useStudyHistory";
import { useSubjects } from "../../hooks/useSubjects";
import LivenessModal from "./LivenessModal";
import GhostModal from "./GhostModal";

const MIN_MINS_FOR_DONE = 15;

const STUDY_MODES = [
  { id: "laptop",   icon: "💻", label: "Deep Work",   work: 25, break: 5 },
  { id: "lecture",  icon: "👨‍🏫", label: "Lecture",     work: 45, break: 10 },
  { id: "book",     icon: "📚", label: "Reading",     work: 30, break: 5 },
  { id: "practice", icon: "✍️", label: "Practice",    work: 45, break: 5 },
  { id: "revision", icon: "🔄", label: "Revision",    work: 15, break: 5 },
];

function fmtSecs(s) {
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}

export default function DragonRadarPomodoro() {
  const { activeTask: task, updateTask } = useScheduler();
  const { rank, theme, pathId } = useRank();
  const { addEntry } = useStudyHistory();
  const { subjects } = useSubjects();

  const isSystem = pathId === "jinwoo";

  const [ghostCount, setGhostCount] = useState(task?.ghostCount || 0);
  const [showGhost, setShowGhost] = useState(false);
  const [totalFocused, setTotalFocused] = useState(0);
  const [doneWarning, setDoneWarning] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pipContainer, setPipContainer] = useState(null);
  const [mode, setMode] = useState(STUDY_MODES[0]);
  const [isBreaking, setIsBreaking] = useState(false);

  const [pos, setPos] = useState({ right: 30, bottom: 20 });
  const dragState = useRef({ isDragging: false, startX: 0, startY: 0, initX: 0, initY: 0 });

  function startDrag(e) {
    if (e.target.closest("button")) return;
    dragState.current = { isDragging: true, startX: e.clientX, startY: e.clientY, initX: pos.right, initY: pos.bottom };
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
  }
  function onDrag(e) {
    if (!dragState.current.isDragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    setPos({ right: dragState.current.initX - dx, bottom: dragState.current.initY - dy });
  }
  function stopDrag() {
    dragState.current.isDragging = false;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
  }

  const session = useStudySession({
    workSecs: mode.work * 60,
    breakSecs: mode.break * 60,
    ghostSecs: 5 * 60,
    onPomoComplete: (n, actualSecs) => setTotalFocused(prev => prev + actualSecs),
    onGhost: (actualSecs) => {
      setTotalFocused(prev => prev + actualSecs);
      const newGC = ghostCount + 1;
      setGhostCount(newGC);
      setShowGhost(true);
      handleGhostLogged(newGC);
    },
  });

  if (!task) return null;

  const currentBlockSecs = session.phase === "work" ? (mode.work * 60) - session.secs : 0;
  const focusedMins = Math.floor((totalFocused + currentBlockSecs) / 60);
  const canMarkDone = focusedMins >= MIN_MINS_FOR_DONE;
  const durationMins = task.duration_mins || 90;
  
  const isLowTime = session.secs < (mode.work * 60 * 0.1);
  const phaseColor = session.phase === "break" ? "#9b6dff" : (isSystem ? "#00D4FF" : rank.primary);
  const maxPomos = Math.ceil(durationMins / 30);

  async function completeTask(mins, topicProgress) {
    setIsBreaking(true);
    const xpEarned = calcXP(topicProgress, durationMins);
    setTimeout(async () => {
      await addEntry({
        subjectId: task.subject_id, topic: task.topic,
        plannedMins: durationMins, actualMins: mins,
        completed: true, xpEarned, timeOfDay: hourLabel(new Date().getHours())
      });
      await updateTask(task.id, { status: "done", actualMins: mins, xp: xpEarned, topicProgress });
      session.pause();
    }, 1000);
  }

  async function handleGhostLogged(count) {
    const locked = count >= 3;
    if (locked) {
      await addEntry({
        subjectId: task.subject_id, topic: task.topic,
        plannedMins: durationMins, actualMins: count * 25,
        completed: false, ghosted: true, timeOfDay: hourLabel(new Date().getHours())
      });
    }
    await updateTask(task.id, { ghostCount: count, locked: locked ? 1 : 0, status: locked ? "ghosted" : "active" });
  }

  const togglePiP = async () => {
    if (pipContainer) {
      window.documentPictureInPicture?.window?.close();
      setPipContainer(null);
      return;
    }
    if (!("documentPictureInPicture" in window)) {
      setIsMinimized(!isMinimized);
      return;
    }
    try {
      const pipWin = await window.documentPictureInPicture.requestWindow({ width: 340, height: 100 });
      [...document.styleSheets].forEach(s => {
        try {
          const style = document.createElement('style');
          style.textContent = [...s.cssRules].map(r => r.cssText).join('');
          pipWin.document.head.appendChild(style);
        } catch(e) {}
      });
      pipWin.document.body.style.margin = "0";
      pipWin.document.body.style.background = "#050010";
      pipWin.addEventListener("pagehide", () => setPipContainer(null));
      setPipContainer(pipWin.document.body);
    } catch(e) { setIsMinimized(!isMinimized); }
  };

  const MiniHUD = (
    <div 
      onMouseDown={startDrag}
      className={`gl neon ${isSystem ? 'system-window' : ''} ${isBreaking ? 'break-anim' : ''}`}
      style={{
        width: "100%", height: "100%", minHeight: 90,
        borderLeft: isSystem ? 'none' : `4px solid ${phaseColor}`, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
        cursor: "grab", boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
      }}
    >
      <div className="mono glow-text" style={{ fontSize: 24, fontWeight: 900, color: phaseColor }}>
        {fmtSecs(session.secs)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
         <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
           {task.subject_name}
         </div>
         <div className="label-tag" style={{ marginTop: 2, color: isSystem ? "#00D4FF" : "var(--t3)" }}>{isSystem ? "ACTIVE QUEST" : task.topic}</div>
      </div>
      <button className="btn-ghost" onClick={() => { setIsMinimized(false); window.documentPictureInPicture?.window?.close(); }} style={{ height: 32 }}>
        ◱
      </button>
    </div>
  );

  if (pipContainer) return createPortal(MiniHUD, pipContainer);
  if (isMinimized) return <div style={{ position: "fixed", bottom: pos.bottom, right: pos.right, zIndex: 10000, width: 340 }}>{MiniHUD}</div>;

  return (
    <div 
      onMouseDown={startDrag}
      className={`gl neon ${isSystem ? 'system-window' : ''} ${isBreaking ? 'break-anim' : ''}`}
      style={{
        position: "fixed", bottom: pos.bottom, right: pos.right, zIndex: 10000,
        width: 360, padding: 24, cursor: "grab",
        display: "flex", flexDirection: "column", gap: 20
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="label-tag" style={{ color: isSystem ? "#00D4FF" : "var(--t3)" }}>
          {isSystem ? "SYSTEM GATE STATUS" : `Tactical Interface // ${session.phase.toUpperCase()}`}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" onClick={togglePiP} style={{ width: 32, padding: 0 }}>◰</button>
          <button className="btn-ghost" onClick={() => setIsMinimized(true)} style={{ width: 32, padding: 0 }}>—</button>
        </div>
      </div>

      {/* Radar Visualizer */}
      <div style={{
        width: 200, height: 200, margin: "0 auto", borderRadius: "50%",
        background: "rgba(0,0,0,0.4)", border: `2px solid ${phaseColor}30`,
        position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: isSystem ? `inset 0 0 60px rgba(123, 47, 190, 0.1)` : `inset 0 0 40px ${phaseColor}15`
      }}>
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.05)" }} />
        
        {/* Sweep */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", width: "50%", height: 2,
          background: isSystem ? "linear-gradient(90deg, transparent, #00D4FF)" : `linear-gradient(90deg, transparent, ${phaseColor})`,
          transformOrigin: "left center", animation: "radarSweep 4s linear infinite"
        }} />

        {/* Progress Ring */}
        <svg width={180} height={180} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
          <circle cx={90} cy={90} r={82} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={isSystem ? 4 : 6} />
          <circle cx={90} cy={90} r={82} fill="none" stroke={phaseColor} strokeWidth={isSystem ? 4 : 6}
            strokeDasharray={515} strokeDashoffset={515 * (1 - session.secs / (mode.work * 60))}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear", filter: `drop-shadow(0 0 5px ${phaseColor})` }}
          />
        </svg>

        <div style={{ textAlign: "center", zIndex: 5 }}>
          <div className="mono glow-text" style={{ fontSize: 36, fontWeight: 900, color: phaseColor }}>
            {fmtSecs(session.secs)}
          </div>
          <div className="label-tag" style={{ color: isSystem ? "#00D4FF" : "var(--t3)", marginTop: 4 }}>
             {isSystem ? "GATE TIMER" : "Time Remaining"}
          </div>
        </div>
        
        {/* Cracks Overlay */}
        <div className="gate-cracks" style={{ opacity: (isSystem && isLowTime) ? 1 : 0 }} />

        {/* Collectibles (Stars/Shadows) */}
        <div style={{ position: "absolute", inset: 0 }}>
          {[...Array(maxPomos)].map((_, i) => {
            const angle = (i * 137.5) * (Math.PI / 180);
            const dist = 55 + (i * 5);
            const x = 100 + dist * Math.cos(angle) - 10;
            const y = 100 + dist * Math.sin(angle) - 10;
            const active = i < session.pomos;
            return (
              <div key={i} style={{ 
                position: "absolute", left: x, top: y, fontSize: 16,
                opacity: active ? 1 : 0.1, filter: active ? `drop-shadow(0 0 5px #7B2FBE)` : "grayscale(1)",
                color: isSystem ? "#7B2FBE" : "inherit"
              }}>
                {isSystem ? "✦" : (theme?.streakIcon || "⭐")}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#C8B8FF" }}>
           {isSystem ? `QUEST: ${task.subject_name.toUpperCase()}` : task.subject_name}
        </h3>
        <p className="mono" style={{ fontSize: 10, color: "var(--t3)", marginTop: 4 }}>// {task.topic}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <button 
          className="btn-primary" 
          onClick={() => session.phase === "work" ? session.pause() : session.start()}
          style={{ 
            background: session.phase === "work" ? "rgba(255,100,100,0.1)" : (isSystem ? "linear-gradient(135deg, #7B2FBE, #00D4FF)" : rank.primary), 
            border: session.phase === "work" ? "1px solid rgba(255,100,100,0.3)" : "none",
            boxShadow: (isSystem && session.phase !== "work") ? "0 0 15px rgba(123, 47, 190, 0.4)" : "none"
          }}
        >
          {session.phase === "work" ? "PAUSE" : (isSystem ? "ENGAGE" : "START")}
        </button>
        <button 
          className="btn-ghost" 
          onClick={() => setShowProgress(true)} 
          disabled={!canMarkDone}
          style={{ 
            borderColor: canMarkDone ? "var(--green)" : "var(--b2)", 
            color: canMarkDone ? "var(--green)" : "var(--t3)",
            background: (isSystem && canMarkDone) ? "rgba(0, 212, 255, 0.05)" : "transparent"
          }}
        >
          {isSystem ? "QUEST CLEAR" : "COMPLETE"}
        </button>
      </div>

      {session.phase === "liveness" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10001, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }}>
           <LivenessModal cdSecs={session.cdSecs} onAlive={session.confirmAlive} onStop={session.triggerGhost} />
        </div>
      )}

      {showProgress && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10001, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }}>
           <div className="gl neon" style={{ padding: 40, maxWidth: 400, textAlign: "center" }}>
              <div className="label-tag" style={{ color: "var(--a)", marginBottom: 16 }}>Mission debriefing</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>How much did you master?</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 24 }}>
                {[25, 50, 75, 100].map(p => (
                  <button key={p} className="btn-ghost" onClick={() => completeTask(focusedMins, p)} style={{ height: 50 }}>{p}% Mastery</button>
                ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
