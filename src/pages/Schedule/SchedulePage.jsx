import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../api/client";
import { usePath } from "../../system/PathContext";
import { useRank } from "../../system/RankContext";
import { showToast } from "../../components/Toast";
import { fireScouter } from "../../components/Scouter";

function fmtSecs(s) {
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}

const STUDY_MODES = [
  { id:"laptop",   icon:"💻", label:"On Laptop",    checkMins:15 },
  { id:"lecture",  icon:"📺", label:"Video Lecture",checkMins:30 },
  { id:"book",     icon:"📖", label:"From Book",    checkMins:30 },
  { id:"phone",    icon:"📱", label:"Phone Lecture",checkMins:30 },
  { id:"practice", icon:"✏️", label:"Practising",   checkMins:15 },
  { id:"revision", icon:"⚡", label:"Revision",     checkMins:15 },
];

function PomodoroTimer({ task, onDone, onSkip, onGhost, pathColor }) {
  const totalSecs = (task.duration_mins||25)*60;
  const [secs,     setSecs]     = useState(totalSecs);
  const [running,  setRunning]  = useState(false);
  const [mode,     setMode]     = useState("laptop");
  const [canDone,  setCanDone]  = useState(false);
  const [ghostCnt, setGhostCnt] = useState(0);
  const startedAt = useRef(null);
  const c = pathColor;

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => setSecs(s => {
      if (s<=1) { clearInterval(iv); handleDone(); return 0; }
      return s-1;
    }), 1000);
    // Enable Done after 5 min
    setTimeout(() => setCanDone(true), 5*60*1000);
    return () => clearInterval(iv);
  }, [running]);

  // Update tab title
  useEffect(() => {
    if (running) {
      const modeInfo = STUDY_MODES.find(m=>m.id===mode);
      document.title = `${modeInfo?.icon||"⏱"} ${fmtSecs(secs)} · ${task.subject_name}`;
    } else {
      document.title = "StudyOS";
    }
    return () => { document.title = "StudyOS"; };
  }, [running, secs, mode, task]);

  function handleStart() { setRunning(true); startedAt.current = Date.now(); }

  function handleDone() {
    setRunning(false);
    const actualMins = startedAt.current ? Math.floor((Date.now()-startedAt.current)/60000) : task.duration_mins;
    onDone(task.id, actualMins, ghostCnt);
  }

  const pct = ((totalSecs-secs)/totalSecs)*100;
  const r=64, circ=Math.PI*2*r;

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(6,6,8,.95)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:24}}>

      {/* Subject info */}
      <div style={{textAlign:"center"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:c,letterSpacing:".2em",marginBottom:8}}>[ SESSION ACTIVE ]</div>
        <h2 style={{fontSize:22,fontWeight:900,marginBottom:4}}>{task.subject_name}</h2>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--t3)"}}>{task.topic}</div>
      </div>

      {/* Ring timer */}
      <div style={{position:"relative",width:160,height:160}}>
        <svg width={160} height={160} style={{transform:"rotate(-90deg)"}}>
          <circle cx={80} cy={80} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={6}/>
          <circle cx={80} cy={80} r={r} fill="none" stroke={c} strokeWidth={6}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
            style={{transition:"stroke-dashoffset .9s linear",filter:`drop-shadow(0 0 8px ${c}80)`}}/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
          <div style={{fontSize:36,fontWeight:900,letterSpacing:"-2px",fontVariantNumeric:"tabular-nums"}}>{fmtSecs(secs)}</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--t3)",marginTop:4,letterSpacing:".1em"}}>{task.duration_mins}MIN SESSION</div>
        </div>
      </div>

      {/* Study mode */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center",maxWidth:400}}>
        {STUDY_MODES.map(m=>(
          <button key={m.id} onClick={()=>setMode(m.id)} style={{
            padding:"5px 10px",borderRadius:8,cursor:"pointer",
            border:`1px solid ${mode===m.id?c+"50":"var(--b1)"}`,
            background:mode===m.id?`${c}15`:"transparent",
            color:mode===m.id?c:"var(--t3)",fontSize:11,
            display:"flex",alignItems:"center",gap:5,
            fontFamily:"'JetBrains Mono',monospace",transition:"all .15s",
          }}>
            <span style={{fontSize:13}}>{m.icon}</span>{m.label}
          </button>
        ))}
      </div>

      {/* Buttons */}
      <div style={{display:"flex",gap:10}}>
        {!running ? (
          <button className="btn btn-p" onClick={handleStart} style={{padding:"0 32px",fontSize:15}}>
            ▸ ARISE
          </button>
        ) : (
          <>
            <button onClick={()=>onSkip(task.id)} style={{padding:"0 18px",height:40,background:"transparent",border:"1px solid var(--b1)",borderRadius:10,color:"var(--t3)",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>LATER</button>
            <button disabled={!canDone} onClick={handleDone} style={{
              padding:"0 24px",height:40,background:canDone?`${c}18`:"var(--s2)",border:`1px solid ${canDone?c:"var(--b1)"}`,
              borderRadius:10,color:canDone?c:"var(--t4)",cursor:canDone?"pointer":"not-allowed",fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,
            }}>DONE</button>
            <button onClick={()=>onSkip(task.id)} style={{padding:"0 18px",height:40,background:"transparent",border:"1px solid rgba(240,96,96,.2)",borderRadius:10,color:"var(--red)",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>SKIP</button>
          </>
        )}
      </div>

      {/* Close */}
      <button onClick={()=>onSkip(null)} style={{background:"none",border:"none",color:"var(--t4)",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:11,letterSpacing:".08em",marginTop:-12}}>
        CLOSE
      </button>
    </div>
  );
}

export default function SchedulePage() {
  const { path } = usePath();
  const { addXP } = useRank();
  const c = path.primary;
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.getTodayTasks().then(setTasks).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  async function generate() {
    setGenerating(true);
    fireScouter(9000+Math.random()*5000|0, "PRIORITY SCAN");
    try {
      const res = await api.generateSchedule();
      setTasks(res.tasks||[]);
      showToast(res.message||"Generated", path.sig);
    } catch(e) { showToast("Error", e.message); }
    setGenerating(false);
  }

  async function startTask(id) {
    await api.updateTaskStatus(id, { status:"active" });
    setTasks(p=>p.map(t=>t.id===id?{...t,status:"active"}:t));
    setActiveTask(tasks.find(t=>t.id===id));
  }

  async function completeTask(id, actualMins, ghostCount) {
    const task = tasks.find(t=>t.id===id);
    const xp = task ? Math.round((task.difficulty_num||2)*actualMins*0.5) : 0;
    await api.updateTaskStatus(id, { status:"completed", actualMins, ghostCount });
    await api.addHistory({
      sourceType:"exam", sourceId:task?.source_id||0,
      topic:task?.topic||"", plannedMins:task?.duration_mins||0,
      actualMins, completed:1, skipped:0, ghosted:0,
      xpEarned:xp, scheduleDate:new Date().toISOString().split("T")[0],
    });
    addXP(xp);
    setTasks(p=>p.map(t=>t.id===id?{...t,status:"completed",actual_mins:actualMins}:t));
    setActiveTask(null);
    showToast("Session complete", task?.subject_name||"", `+${xp} XP`);
  }

  async function skipTask(id) {
    if (!id) { setActiveTask(null); return; }
    await api.updateTaskStatus(id, { status:"skipped", actualMins:0 });
    setTasks(p=>p.map(t=>t.id===id?{...t,status:"skipped"}:t));
    setActiveTask(null);
    showToast("Skipped", "The exam doesn't care why.", path.sig);
  }

  const hasActive = tasks.some(t=>t.status==="active");
  const done = tasks.filter(t=>t.status==="completed").length;
  const total = tasks.length;

  return (
    <div className="page">
      {activeTask && (
        <PomodoroTimer task={activeTask} pathColor={c}
          onDone={completeTask} onSkip={skipTask} onGhost={()=>{}}/>
      )}

      <div className="page-hdr">
        <div>
          <div className="page-tag">{path.name.toUpperCase()} · {(path.navSchedule||"SCHEDULE").toUpperCase()}</div>
          <h1 className="page-title">{path.navSchedule||"Schedule"}</h1>
        </div>
        <button className="btn btn-p" onClick={generate} disabled={generating}>
          {generating?<span className="spinner" style={{width:14,height:14}}/>:null}
          Generate
        </button>
      </div>

      {/* Progress bar */}
      {total>0 && (
        <div style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--t3)"}}>TODAY'S PROGRESS</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:c,fontWeight:700}}>{done}/{total}</div>
          </div>
          <div className="prog-track" style={{height:4}}>
            <div className="prog-fill" style={{width:`${(done/total)*100}%`,background:c}}/>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:60}}><div className="spinner"/></div>
      ) : tasks.length===0 ? (
        <div className="empty">
          <div className="empty-icon">▸</div>
          <div className="empty-title">No sessions scheduled</div>
          <div className="empty-sub">Click Generate to create today's schedule. The system needs you to begin.</div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {tasks.map(task => {
            const isActive   = task.status==="active";
            const isDone     = task.status==="completed";
            const isSkipped  = task.status==="skipped";
            const isLocked   = task.locked===1;
            const statusColor = isDone?"var(--green)":isActive?c:isSkipped?"var(--t4)":"var(--t3)";
            const nowMins = new Date().getHours()*60+new Date().getMinutes();
            const [sh,sm] = (task.start_time||"00:00").split(":").map(Number);
            const slotMins = sh*60+sm;
            const canStart = nowMins>=slotMins && !hasActive && !isDone && !isSkipped && !isLocked;

            return (
              <div key={task.id} style={{
                display:"flex",alignItems:"center",gap:12,padding:"14px 16px",
                background:isActive?`${c}08`:"var(--s1)",
                border:`1px solid ${isActive?c+"30":isDone?"rgba(45,226,160,.1)":"var(--b1)"}`,
                borderLeft:`3px solid ${isDone?"var(--green)":isActive?c:task.color||c}`,
                borderRadius:12,opacity:isDone?.4:1,
                transition:"all .2s",
              }}>
                {/* Subject icon */}
                <div style={{width:36,height:36,borderRadius:10,background:`${task.color||c}18`,color:task.color||c,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,flexShrink:0}}>
                  {(task.subject_name||"?")[0]}
                </div>

                {/* Info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,textDecoration:isDone?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.subject_name}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t3)",marginTop:2}}>
                    {task.topic} · {task.duration_mins}min
                    {task.ai_reason ? ` · ${task.ai_reason}` : ""}
                  </div>
                </div>

                {/* XP */}
                {isDone ? (
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--gold)",fontWeight:700,flexShrink:0}}>
                    +{task.xp||0} XP
                  </div>
                ) : (
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--t3)",flexShrink:0}}>{task.xp} xp</div>
                )}

                {/* Time */}
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--t3)",flexShrink:0,minWidth:40,textAlign:"right"}}>{task.start_time}</div>

                {/* Action */}
                <div style={{flexShrink:0}}>
                  {isDone ? (
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--green)",border:"1px solid rgba(45,226,160,.2)",padding:"3px 8px",borderRadius:6,background:"rgba(45,226,160,.05)"}}>DONE</div>
                  ) : isSkipped ? (
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t4)"}}>SKIPPED</div>
                  ) : isLocked ? (
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--orange)"}}>LOCKED</div>
                  ) : hasActive && !isActive ? (
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t4)"}}>BUSY</div>
                  ) : !canStart ? (
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t4)"}}>
                      in {slotMins-nowMins}m
                    </div>
                  ) : (
                    <button className="btn btn-p" onClick={()=>startTask(task.id)} style={{height:30,padding:"0 14px",fontSize:11}}>
                      ARISE ▸
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
