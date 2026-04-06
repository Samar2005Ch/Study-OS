/**
 * pages/Schedule/PomodoroTimer.jsx
 *
 * FIXES:
 *  1. Done button disabled until at least 5 minutes studied
 *  2. Shows "X min studied" so student knows their progress
 *  3. Postpone button — moves task back to pending without penalty
 *  4. Ghost rate fix — passes correct field names to history
 */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRank }           from "../../system/RankContext";
import { useStudySession }   from "../../hooks/useStudySession";
import { calcXP }            from "../../hooks/useScheduler";
import LivenessModal         from "./LivenessModal";
import GhostModal            from "./GhostModal";

const MIN_MINS_FOR_DONE = 15; // must study at least 15 min to mark done

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

export default function PomodoroTimer({ task, onDone, onSkip, onPostpone, onGhostLogged }) {
  const { rank, theme }                      = useRank();
  const [ghostCount,   setGhostCount]        = useState(task.ghostCount || 0);
  const [showGhost,    setShowGhost]         = useState(false);
  const [totalFocused, setTotalFocused]      = useState(0); // total seconds focused
  const [doneWarning,  setDoneWarning]       = useState(false);
  const [showProgress, setShowProgress]      = useState(false);
  const [isMinimized,  setIsMinimized]       = useState(false);
  const [pipContainer, setPipContainer]      = useState(null);
  const [mode,         setMode]              = useState(STUDY_MODES[0]);

  const session = useStudySession({
    workSecs: mode.work * 60,
    breakSecs: mode.break * 60,
    ghostSecs: 5 * 60, // 5 min to answer liveness check
    onPomoComplete: (n, actualSecs) => {
      setTotalFocused(prev => prev + actualSecs);
    },
    onGhost: (actualSecs) => {
      setTotalFocused(prev => prev + actualSecs);
      const newGC = ghostCount + 1;
      setGhostCount(newGC);
      setShowGhost(true);
      onGhostLogged?.(newGC);
    },
  });

  // How many seconds have been focused total (including current running block)
  const currentBlockSecs = session.phase === "work" ? (mode.work * 60) - session.secs : 0;
  const totalFocusedSecs = totalFocused + currentBlockSecs;
  const focusedMins      = Math.floor(totalFocusedSecs / 60);
  const canMarkDone      = focusedMins >= MIN_MINS_FOR_DONE;

  // Live XP removed to prevent auto-earning gamification
  const durationMins = task.durationMins || task.duration_mins || 90;
  const difficulty   = task.difficulty || 3;

  const phaseColor = session.phase === "break" ? "#00c6a0" : rank.primary;
  const maxPomos   = Math.ceil(durationMins / 30);
  const r = 62, circ = 2 * Math.PI * r;
  const c = rank.primary;

  function handleDone() {
    if (!canMarkDone) {
      setDoneWarning(true);
      setTimeout(() => setDoneWarning(false), 2500);
      return;
    }
    // Pause timer and prompt for progress
    session.pause();
    setShowProgress(true);
  }

  function submitProgress(progVal) {
    setShowProgress(false);
    onDone(focusedMins, progVal);
  }

  // Liveness check overlay
  if (session.phase === "liveness") return (
    <LivenessModal
      task={{ ...task, ghostCount }}
      cdSecs={session.cdSecs}
      onAlive={session.confirmAlive}
      onStop={() => session.triggerGhost()}
    />
  );

  // Ghost consequence overlay
  if (showGhost) return (
    <GhostModal
      task={{ ...task, ghostCount }}
      onResume={() => { setShowGhost(false); session.reset(); }}
      onSkip={()   => { setShowGhost(false); onSkip(); }}
    />
  );

  // Subjective Progress overlay
  if (showProgress) return (
    <div className="gl" style={{ padding:22, borderLeft:`2px solid #00c6a0`, background:"#00c6a008", marginBottom:12 }}>
      <div style={{ fontWeight:700, fontSize:15, color:"#e8ecf4", fontFamily:"monospace", marginBottom:8 }}>
        [ SESSION COMPLETE ]
      </div>
      <div style={{ fontSize:11, color:"#c8d0e0", fontFamily:"monospace", marginBottom:16 }}>
        Great work running the <strong>{task.subjectName || task.subject_name} ({task.topic})</strong> session.
        <br/><br/>
        To feed the AI Priority Engine, how much of this topic is completed / understood?
      </div>
      
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:8 }}>
        {[
          { v: 25, l:"JUST STARTED" },
          { v: 50, l:"HALFWAY" },
          { v: 75, l:"ALMOST DONE" },
          { v: 100, l:"MASTERED IT" }
        ].map(p => (
          <button key={p.v} onClick={() => submitProgress(p.v)} style={{
            padding:12, border:"1px solid #00c6a060", background:"#00c6a015", color:"#00c6a0",
            fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"monospace", borderRadius:0
          }}>
            {p.v}% — {p.l}
          </button>
        ))}
      </div>
    </div>
  );

  async function togglePiP() {
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
      const pipWin = await window.documentPictureInPicture.requestWindow({ width: 340, height: 90 });
      [...document.styleSheets].forEach(styleSheet => {
        try {
          const cssRules = [...styleSheet.cssRules].map(rule => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          pipWin.document.head.appendChild(style);
        } catch (e) {
          const link = document.createElement('link');
          link.rel = 'stylesheet'; link.type = styleSheet.type; link.media = styleSheet.media; link.href = styleSheet.href;
          pipWin.document.head.appendChild(link);
        }
      });
      pipWin.document.body.style.margin = "0";
      pipWin.document.body.style.background = "#07090f";
      pipWin.addEventListener("pagehide", () => setPipContainer(null));
      setPipContainer(pipWin.document.body);
    } catch(e) {
      setIsMinimized(!isMinimized);
    }
  }

  const MiniHUD = (
    <div style={{
      width: "100%", height: "100%", minHeight: 90,
      background: `rgba(13,14,26,1)`, borderLeft: `3px solid ${phaseColor}`,
      padding: "16px 24px", display: "flex", alignItems: "center", gap: 16,
      fontFamily: "Inter, sans-serif"
    }}>
      <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "monospace", color: phaseColor }}>
        {fmtSecs(session.secs)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
         <div style={{ fontSize: 13, color: "#e8ecf4", fontWeight: 700, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
           {task.subjectName || task.subject_name}
         </div>
         <div style={{ fontSize: 11, color: "#5a6070", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 4 }}>
           {task.topic}
         </div>
      </div>
      <button onClick={() => {
        setIsMinimized(false);
        if (pipContainer) window.documentPictureInPicture?.window?.close();
      }} style={{ background: "transparent", border: "1px solid #5a6070", color: "#e8ecf4", cursor: "pointer", padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
        EXPAND 🗗
      </button>
    </div>
  );

  if (pipContainer) return createPortal(MiniHUD, pipContainer);

  if (isMinimized) return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, borderRadius: 8, overflow:"hidden", boxShadow: `0 8px 32px rgba(0,0,0,0.5)`, width: 340, height: 90, border: `1px solid ${c}40` }}>
       {MiniHUD}
    </div>
  );

  return (
    <div className="gl" style={{
      borderLeft:`2px solid ${phaseColor}`,
      borderTop:`1px solid ${phaseColor}20`,
      borderRight:`1px solid ${phaseColor}08`,
      borderBottom:`1px solid ${phaseColor}08`,
      padding:22, marginBottom:12,
      position:"relative",
    }}>
      {/* Corner accents */}
      <div style={{ position:"absolute",top:0,left:0,width:10,height:10,borderTop:`2px solid ${c}`,borderLeft:`2px solid ${c}`,opacity:.8 }}/>
      <div style={{ position:"absolute",bottom:0,right:0,width:8,height:8,borderBottom:`1px solid ${c}30`,borderRight:`1px solid ${c}30` }}/>

      {/* Minimize Button (Top Right) */}
      <button 
        onClick={togglePiP} 
        style={{ position:"absolute", top:10, right:34, background:"transparent", border:"none", color:"#5a6070", cursor:"pointer", padding:5, fontSize:14, fontWeight:700 }}
        title="Pop-out timer to OS window"
      >
        _
      </button>

      {/* Postpone Button (Top Right) */}
      <button 
        onClick={() => onPostpone?.()} 
        style={{ position:"absolute", top:10, right:10, background:"transparent", border:"none", color:"#5a6070", cursor:"pointer", padding:5, fontSize:14 }}
        title="Postpone timer back to task list"
      >
        ✖
      </button>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
        <div style={{ width:7, height:7, background:task.color||c, transform:"rotate(45deg)", boxShadow:`0 0 8px ${task.color||c}` }}/>
        <span style={{ color:"#5a6070", fontSize:10, fontFamily:"monospace" }}>
          {task.start || task.start_time} — {task.end || task.end_time}
        </span>
        {/* Pomo dots */}
        <div style={{ marginLeft:"auto", display:"flex", gap:4 }}>
          {Array.from({length:maxPomos}).map((_,i) => (
            <div key={i} style={{ width:7,height:7,background:i<session.pomos?phaseColor:"#1c2030",transform:"rotate(45deg)",boxShadow:i<session.pomos?`0 0 5px ${phaseColor}`:"none",transition:"all .4s" }}/>
          ))}
        </div>
      </div>

      {/* Subject + topic */}
      <div style={{ fontWeight:700, fontSize:16, color:"#e8ecf4", fontFamily:"monospace", marginBottom:3 }}>
        {task.subjectName || task.subject_name}
      </div>
      <div style={{ fontSize:11, color:"#5a6070", fontFamily:"monospace", marginBottom:6, display:"flex", alignItems:"center", gap:8 }}>
        // {task.topic}
        {(task.topicDiff||task.topic_diff) === "hard" && (
          <span style={{ fontSize:9,color:"#ff3c3c",border:"1px solid #ff3c3c40",padding:"1px 5px" }}>HARD</span>
        )}
        {(task.isRevision||task.is_revision) && (
          <span style={{ fontSize:9,color:"#9b6dff",border:"1px solid #9b6dff40",padding:"1px 5px" }}>REVISION</span>
        )}
      </div>

      {/* AI reason */}
      {(task.aiReason||task.ai_reason) && (
        <div style={{ fontSize:9,color:c,marginBottom:16,fontFamily:"monospace" }}>
          {'>>'} {task.aiReason||task.ai_reason}
        </div>
      )}

      {/* Study Mode Selector */}
      <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
        {STUDY_MODES.map(m => (
          <button
            key={m.id}
            onClick={() => session.phase === "idle" && setMode(m)}
            disabled={session.phase !== "idle"}
            style={{
              padding:"6px 12px", border:`1px solid ${mode.id === m.id ? c : "#1c2030"}`,
              background: mode.id === m.id ? `${c}15` : "transparent",
              color: mode.id === m.id ? c : "#5a6070",
              fontWeight: 700, fontSize: 10, cursor: session.phase !== "idle" ? "not-allowed" : "pointer",
              fontFamily: "monospace", borderRadius: 4, transition: "all .2s", opacity: session.phase !== "idle" && mode.id !== m.id ? 0.4 : 1
            }}
          >
            {m.icon} {m.label} ({m.work}m)
          </button>
        ))}
      </div>

      {/* Ring timer */}
      <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
        <div style={{ position:"relative" }}>
          <svg width={144} height={144} style={{ transform:"rotate(-90deg)" }}>
            <circle cx={72} cy={72} r={r} fill="none" stroke="#1c2030" strokeWidth={7}/>
            <circle cx={72} cy={72} r={r} fill="none" stroke={phaseColor} strokeWidth={7}
              strokeDasharray={circ}
              strokeDashoffset={circ*(1-session.pct/100)}
              strokeLinecap="round"
              style={{ transition:"stroke-dashoffset 1s linear, stroke .3s" }}
            />
          </svg>
          <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
            <div style={{ fontSize:30,fontWeight:800,fontFamily:"monospace",color:phaseColor,letterSpacing:"-.03em" }}>
              {fmtSecs(session.secs)}
            </div>
            <div style={{ fontSize:9,color:"#5a6070",fontFamily:"monospace" }}>
              {session.phase==="break"?"BREAK":session.phase==="idle"?"READY":session.phase==="paused"?"PAUSED":"FOCUS"}
            </div>
          </div>
        </div>
      </div>

      {/* Focus progress + live XP */}
      <div style={{ marginBottom:14 }}>
        <div style={{ display:"flex",justifyContent:"space-between",fontSize:9,fontFamily:"monospace",marginBottom:5 }}>
          <span style={{ color: canMarkDone ? "#00c6a0" : "#5a6070" }}>
            {theme ? theme.xpName.toUpperCase() : "FOCUSED"}: {focusedMins}m / {durationMins}m
            {!canMarkDone && ` (need ${MIN_MINS_FOR_DONE}m min)`}
          </span>
        </div>
        {/* Progress bar */}
        <div style={{ height:3,background:"#1c2030",overflow:"hidden" }}>
          <div style={{
            height:"100%",
            width:`${Math.min((focusedMins/durationMins)*100,100)}%`,
            background: canMarkDone ? "#00c6a0" : c,
            transition:"width 1s linear",
          }}/>
        </div>
      </div>

      {/* Done warning */}
      {doneWarning && (
        <div style={{ marginBottom:10,padding:"7px 12px",borderLeft:"2px solid #ff8c42",background:"#ff8c4208",fontSize:10,color:"#ff8c42",fontFamily:"monospace" }}>
          [ STUDY AT LEAST {MIN_MINS_FOR_DONE} MINUTES BEFORE MARKING DONE ]
        </div>
      )}

      {/* Ghost warning */}
      {ghostCount > 0 && (
        <div style={{ marginBottom:12,padding:"7px 12px",borderLeft:"2px solid #ff3c3c",background:"#ff3c3c08",fontSize:10,color:"#ff3c3c",fontFamily:"monospace" }}>
          [ {ghostCount} GHOST(S) — {ghostCount>=2?"ONE MORE = LOCKED":"STAY FOCUSED"} ]
        </div>
      )}

      {/* Controls */}
      <div style={{ display:"flex", gap:6 }}>
        {/* Start / Pause */}
        <button
          onClick={() => (session.phase==="idle"||session.phase==="paused") ? session.start() : session.pause()}
          style={{ flex:2,padding:11,border:`1px solid ${phaseColor}`,background:`${phaseColor}18`,color:phaseColor,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"monospace",borderRadius:0 }}
        >
          {session.phase==="work"?"PAUSE":session.phase==="break"?"RESTING...":session.phase==="paused"?"RESUME":"START"}
        </button>

        {/* Done — disabled until 5 min studied */}
        <button
          onClick={handleDone}
          style={{
            flex:1,padding:11,
            border:`1px solid ${canMarkDone?"#00c6a0":"#1c2030"}`,
            background: canMarkDone ? "#00c6a008" : "transparent",
            color: canMarkDone ? "#00c6a0" : "#3a4060",
            fontWeight:700,fontSize:11,
            cursor: canMarkDone ? "pointer" : "not-allowed",
            fontFamily:"monospace",borderRadius:0,
            transition:"all .2s",
          }}
          title={canMarkDone ? "Mark as done" : `Study at least ${MIN_MINS_FOR_DONE} min first`}
        >
          DONE
        </button>

        {/* Postpone — no penalty, just moves back to pending */}
        <button
          onClick={() => onPostpone?.()}
          style={{ flex:1,padding:11,border:"1px solid #ff8c4250",background:"#ff8c4208",color:"#ff8c42",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"monospace",borderRadius:0 }}
          title="Postpone — do this later today, no penalty"
        >
          LATER
        </button>

        {/* Skip */}
        <button
          onClick={() => onSkip()}
          style={{ flex:1,padding:11,border:"1px solid #ff3c3c30",background:"#ff3c3c08",color:"#ff3c3c",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"monospace",borderRadius:0 }}
          title="Skip — counts as skipped in history"
        >
          SKIP
        </button>
      </div>

      <div style={{ marginTop:14,fontSize:9,color:"#3a4060",textAlign:"center",fontFamily:"monospace" }}>
        LIVENESS CHECK AFTER EVERY {mode.work}MIN · 5MIN TO RESPOND
      </div>
    </div>
  );
}
