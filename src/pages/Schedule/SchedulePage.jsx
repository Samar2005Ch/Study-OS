import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../api/client";
import { usePath } from "../../system/PathContext";
import { useRank } from "../../system/RankContext";
import { showToast } from "../../components/Toast";
import { fireScouter } from "../../components/Scouter";
import PomodoroTimer from "./PomodoroTimer"; 
import Portal from "../../components/Portal";

export default function SchedulePage() {
  const { path } = usePath();
  const { addXP, rank, totalXP } = useRank(); // Use rank for streak
  const [showManual, setShowManual] = useState(false);
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

  async function handleManualInsert(data) {
    setGenerating(true);
    try {
      const now = new Date();
      const atTime = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
      await api.insertTask({ ...data, atTime });
      const t = await api.getTodayTasks();
      setTasks(t);
      setShowManual(false);
      showToast("Raid Inserted", "Schedule updated.", path.sig);
    } catch (e) { showToast("Error", e.message); }
    setGenerating(false);
  }

  async function startTask(id) {
    await api.updateTaskStatus(id, { status:"active" });
    setTasks(p=>p.map(t=>t.id===id?{...t,status:"active"}:t));
    setActiveTask(tasks.find(t=>t.id===id));
  }

  /**
   * @param {number} focusedMins — honest focus time
   * @param {number} progress — 0-100 completion %
   * @param {number} xp — calculated in timer via xpEngine
   * @param {number} integrity — 0-100 integrity score
   * @param {Object} signals — raw anti-cheat signals for history
   */
  async function completeTask(focusedMins, progress, xp, integrity, signals = {}) {
    if (!activeTask) return;
    const id = activeTask.id;
    
    // 1. Update task status in DB
    await api.updateTaskStatus(id, { 
      status: "completed", 
      actualMins: focusedMins,
      completionPct: progress,
      integrityScore: integrity,
      xpEarned: xp
    });

    // 2. Record detailed history for intelligence engine
    await api.recordSession({
      sourceType:     "exam", 
      sourceId:       activeTask.source_id || 0,
      subjectId:      activeTask.subject_id || 0,
      topic:          activeTask.topic || "",
      plannedMins:    activeTask.duration_mins || 0,
      actualMins:     focusedMins,
      completed:      progress >= 90 ? 1 : 0,
      completionPct:  progress,
      integrityScore: integrity,
      xpEarned:       xp,
      date:           new Date().toISOString().split("T")[0],
      timeOfDay:      new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening",
      // Anti-cheat signals
      tabHideCount:    signals.tabHideCount || 0,
      inactivityCount: signals.inactivityCount || 0,
      pauseCount:      signals.pauseCount || 0,
    });

    // 3. Update Rank and UI
    addXP(xp);
    setTasks(p => p.map(t => t.id === id ? { ...t, status: "completed", actual_mins: focusedMins, xp_earned: xp } : t));
    setActiveTask(null);

    // 4. Feedback
    const msg = integrity < 50 ? "Session Flagged (Low Integrity)" : `Session complete: ${progress}%`;
    showToast(msg, activeTask.subject_name, `+${xp} XP`);
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
        <PomodoroTimer 
          task={activeTask} 
          streak={rank.streak || 0}
          onDone={completeTask} 
          onSkip={skipTask} 
          onPostpone={() => skipTask(activeTask.id)}
          onGhostLogged={() => {
             showToast("Ghost Session Logged", "Intelligence updated.", "⚠️");
             setActiveTask(null);
          }}
        />
      )}

      <div className="page-hdr">
        <div>
          <div className="page-tag">{path.name.toUpperCase()} · {(path.navSchedule||"SCHEDULE").toUpperCase()}</div>
          <h1 className="page-title">{path.navSchedule||"Schedule"}</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-g" onClick={() => setShowManual(true)}>+ Manual Raid</button>
          <button className="btn btn-p" onClick={generate} disabled={generating}>
            {generating ? <span className="spinner" style={{ width: 14, height: 14 }} /> : null}
            Generate
          </button>
        </div>
      </div>

      {showManual && (
        <ManualRaidModal 
          onClose={() => setShowManual(false)} 
          onSave={handleManualInsert}
          color={c}
        />
      )}

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

function ManualRaidModal({ onClose, onSave, color }) {
  const [subject, setSubject] = useState("");
  const [topic,   setTopic]   = useState("");
  const [mins,    setMins]    = useState(60);

  return (
    <Portal>
      <div className="modal-overlay" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", zIndex: 10000 }}>
        <div className="card anim-up" style={{ width: 400, padding: 32, borderTop: `4px solid ${color}` }}>
          <div style={{ fontSize: 9, color, fontFamily: "monospace", letterSpacing: ".15em", marginBottom: 8 }}>
            SYSTEM MONARCH: MANUAL OVERRIDE
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>Insert Manual Raid</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="input-group">
              <label>SUBJECT NAME</label>
              <input style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--t1)", padding: 12, borderRadius: 8 }} value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Physics" />
            </div>
            <div className="input-group">
              <label>TOPIC / OBJECTIVE</label>
              <input style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--t1)", padding: 12, borderRadius: 8 }} value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Mechanics" />
            </div>
            <div className="input-group">
              <label>DURATION (MINUTES)</label>
              <input style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--t1)", padding: 12, borderRadius: 8 }} type="number" value={mins} onChange={e=>setMins(parseInt(e.target.value))} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
            <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>ABORT</button>
            <button className="btn btn-p" style={{ flex: 2 }} onClick={() => onSave({ subject_name:subject, topic, duration_mins:mins })}>
              INITIALIZE RAID ▸
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
