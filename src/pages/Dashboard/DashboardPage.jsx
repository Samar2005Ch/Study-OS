import { useState, useEffect, useRef } from "react";
import { api } from "../../api/client";
import { usePath } from "../../system/PathContext";
import { useRank } from "../../system/RankContext";
import { useAuth } from "../../system/AuthContext";
import { fireScouter } from "../../components/Scouter";
import { showToast } from "../../components/Toast";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!";
function scramble(el, final, dur=700) {
  if (!el) return;
  let f=0; const total=dur/16;
  const iv = setInterval(() => {
    f++; const prog=f/total;
    el.textContent = final.split("").map((c,i) => {
      if (c===" ") return " ";
      if (i/final.length < prog) return c;
      return CHARS[Math.floor(Math.random()*CHARS.length)];
    }).join("");
    if (f>=total) { clearInterval(iv); el.textContent=final; }
  }, 16);
}

function Countdown({ targetDate }) {
  const [time, setTime] = useState({});
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(targetDate) - new Date());
      setTime({
        d: Math.floor(diff/86400000),
        h: Math.floor((diff%86400000)/3600000),
        m: Math.floor((diff%3600000)/60000),
        s: Math.floor((diff%60000)/1000),
      });
    };
    tick(); const iv=setInterval(tick,1000);
    return ()=>clearInterval(iv);
  }, [targetDate]);

  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      {[["d","Days"],["h","Hrs"],["m","Min"]].map(([k,l]) => (
        <div key={k} style={{textAlign:"center"}}>
          <div style={{fontSize:36,fontWeight:900,letterSpacing:"-1px",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>
            {String(time[k]||0).padStart(2,"0")}
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--t4)",letterSpacing:".12em",marginTop:3}}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon, value, label, color, onClick }) {
  return (
    <div className="card anim-up" onClick={onClick} style={{cursor:"pointer",transition:"all .2s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.borderColor=color+"44";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor="";}}
    >
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{width:32,height:32,borderRadius:8,background:color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{icon}</div>
      </div>
      <div style={{fontSize:28,fontWeight:900,letterSpacing:"-1px",color,marginBottom:3}}>{value}</div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t3)",letterSpacing:".08em"}}>{label}</div>
    </div>
  );
}

function ReadinessRing({ pct, color }) {
  const r=38, c=Math.PI*2*r;
  const [disp, setDisp] = useState(0);
  useEffect(()=>{setTimeout(()=>setDisp(pct),400);},[pct]);

  return (
    <div style={{position:"relative",width:90,height:90}}>
      <svg width={90} height={90} style={{transform:"rotate(-90deg)"}}>
        <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={5}/>
        <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c-(disp/100)*c}
          style={{transition:"stroke-dashoffset 2s cubic-bezier(.4,0,.2,1)",filter:`drop-shadow(0 0 5px ${color}60)`}}
        />
      </svg>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
        <div style={{fontSize:18,fontWeight:800,color}}>{pct}%</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:"var(--t4)",marginTop:1,letterSpacing:".08em"}}>READY</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { path } = usePath();
  const { rank, totalXP, nextRank } = useRank();
  const { user } = useAuth();
  const titleRef = useRef();
  const [exams, setExams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [generating, setGenerating] = useState(false);
  const c = path.primary;

  useEffect(() => {
    scramble(titleRef.current, "Dashboard", 800);
    Promise.all([api.getExams(), api.getTodayTasks(), api.getHistory()])
      .then(([e,t,h]) => { setExams(e); setTasks(t); setHistory(h); })
      .catch(() => {});
  }, []);

  const primaryExam  = exams[0];
  const daysLeft     = primaryExam ? Math.max(0,Math.ceil((new Date(primaryExam.date)-new Date())/86400000)) : 0;
  const totalSessions = history.length;
  const completed    = history.filter(h=>h.completed===1).length;
  const streak       = (() => {
    const dates = [...new Set(history.map(h=>h.schedule_date||h.date))].sort().reverse();
    let s=0; const today=new Date().toISOString().split("T")[0]; let d=new Date();
    for (const date of dates) {
      const key=d.toISOString().split("T")[0];
      if (date===key) { s++; d.setDate(d.getDate()-1); } else break;
    }
    return s;
  })();
  const todayDone = tasks.filter(t=>t.status==="completed").length;
  const todayTotal = tasks.length;
  const readinessPct = primaryExam && primaryExam.subjects?.length
    ? Math.round(primaryExam.subjects.reduce((a,s) => {
        const topics = s.topics||[];
        const avg = topics.length ? topics.reduce((x,t)=>x+(t.progress||0),0)/topics.length : 0;
        return a + avg;
      }, 0) / primaryExam.subjects.length)
    : 0;

  async function generate() {
    setGenerating(true);
    fireScouter(totalXP||1234, path.xpLabel.toUpperCase());
    try {
      const res = await api.generateSchedule();
      setTasks(res.tasks||[]);
      showToast(res.message||"Schedule generated", `${res.tasks?.length||0} sessions`, path.sig);
    } catch(e) { showToast("Error", e.message); }
    setGenerating(false);
  }

  const activeTask = tasks.find(t=>t.status==="active");
  const pendingTasks = tasks.filter(t=>t.status==="pending");

  return (
    <div className="page">
      {/* Header */}
      <div className="page-hdr">
        <div>
          <div className="page-tag">{path.name.toUpperCase()} · COMMAND CENTER</div>
          <h1 className="page-title" ref={titleRef}>Dashboard</h1>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-g">Settings</button>
          <button className="btn btn-p" onClick={generate} disabled={generating}
            style={{gap:8,opacity:generating?.7:1}}>
            {generating ? <span className="spinner" style={{width:14,height:14}}/> : null}
            Generate Schedule
          </button>
        </div>
      </div>

      {/* Exam hero card */}
      {primaryExam ? (
        <div className="card anim-up" style={{
          marginBottom:20,cursor:"pointer",
          position:"relative",overflow:"hidden",
          background:`linear-gradient(135deg, var(--s1), var(--s2))`,
        }}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor=c+"30";}}
          onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor="";}}
        >
          {/* Shimmer */}
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${c}60,transparent)`,animation:"shimmer 4s ease-in-out infinite"}}/>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:24}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div className="glow-dot" style={{background:c}}/>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:c,letterSpacing:".18em"}}>ACTIVE DUNGEON</span>
              </div>
              <h2 style={{fontSize:22,fontWeight:900,letterSpacing:"-.4px",marginBottom:6}}>{primaryExam.name}</h2>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--t3)"}}>
                {new Date(primaryExam.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                {primaryExam.subjects?.length ? ` · ${primaryExam.subjects.length} subjects` : ""}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:28,flexShrink:0}}>
              <Countdown targetDate={primaryExam.date}/>
              <ReadinessRing pct={readinessPct} color={c}/>
            </div>
          </div>
        </div>
      ) : (
        <div className="card anim-up" style={{marginBottom:20,textAlign:"center",padding:36}}>
          <div style={{fontSize:24,marginBottom:10,opacity:.3}}>◫</div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>No exam configured</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>Go to Dungeons to add your first exam.</div>
        </div>
      )}

      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}} className="stagger">
        <StatCard icon="⚡" value={totalXP.toLocaleString()} label={path.xpLabel.toUpperCase()} color={c}
          onClick={()=>fireScouter(totalXP||1234,path.xpLabel.toUpperCase())}/>
        <StatCard icon="✓" value={completed} label={path.sessionLabel.toUpperCase()} color="var(--green)"
          onClick={()=>fireScouter(completed,"SESSIONS")}/>
        <StatCard icon="🔥" value={streak} label={path.streakLabel.toUpperCase()} color="var(--gold)"
          onClick={()=>fireScouter(streak,"STREAK DAYS")}/>
        <StatCard icon="◈" value={`${todayDone}/${todayTotal}`} label="TODAY'S PROGRESS" color="var(--purple)"
          onClick={()=>fireScouter(todayTotal,"TODAY")}/>
      </div>

      {/* Two col */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:16}}>

        {/* Today's sessions */}
        <div className="card anim-up" style={{animationDelay:".05s"}}>
          <div className="card-hdr">
            <div className="card-title">Today's {path.navSchedule||"Sessions"}</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:c,padding:"3px 8px",border:`1px solid ${c}25`,borderRadius:6,background:`${c}08`}}>
              {todayDone}/{todayTotal} DONE
            </div>
          </div>

          {tasks.length===0 ? (
            <div className="empty">
              <div className="empty-icon">▸</div>
              <div className="empty-title">No sessions yet</div>
              <div className="empty-sub">Click Generate Schedule to create today's plan.</div>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {tasks.slice(0,6).map((t,i) => {
                const statusColor = t.status==="completed"?"var(--green)":t.status==="active"?c:t.status==="skipped"?"var(--t4)":"var(--t3)";
                return (
                  <div key={t.id} style={{
                    display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                    borderRadius:10,background:"var(--s2)",
                    borderLeft:`2px solid ${t.color||c}`,
                    opacity:t.status==="completed"?.4:1,
                    transition:"all .18s",
                  }}>
                    <div style={{width:28,height:28,borderRadius:7,background:`${t.color||c}18`,color:t.color||c,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:700,flexShrink:0}}>
                      {(t.subject_name||"?")[0]}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:t.status==="completed"?"line-through":"none"}}>{t.subject_name}</div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t3)",marginTop:1}}>{t.topic} · {t.duration_mins}min</div>
                    </div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:statusColor,fontWeight:600,flexShrink:0}}>
                      {t.status==="completed"?"DONE":t.status==="active"?"ACTIVE":t.status==="skipped"?"SKIP":t.start_time}
                    </div>
                  </div>
                );
              })}
              {tasks.length>6 && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t3)",textAlign:"center",padding:"8px 0"}}>+{tasks.length-6} more sessions</div>}
            </div>
          )}
        </div>

        {/* Right col */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>

          {/* Rank card */}
          <div className="card anim-up" style={{animationDelay:".08s",cursor:"pointer"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=c+"40";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="";}}
          >
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
              <div style={{width:46,height:46,borderRadius:12,background:`${c}12`,border:`1px solid ${c}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:c,transition:"all .3s cubic-bezier(.34,1.56,.64,1)"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.15) rotate(8deg)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";}}
              >{rank.rank}</div>
              <div>
                <div style={{fontSize:13,fontWeight:700}}>Rank {rank.rank} — {path.name}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:c,marginTop:2}}>{path.char.toUpperCase()} PATH</div>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t3)"}}>{path.xpLabel.toUpperCase()}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t2)",fontWeight:600}}>{totalXP.toLocaleString()} / {nextRank?.min.toLocaleString()||"MAX"}</div>
            </div>
            <div className="prog-track">
              <div className="prog-fill" style={{width:nextRank?`${Math.min(100,((totalXP-rank.min)/(nextRank.min-rank.min))*100)}%`:"100%",background:c}}/>
            </div>
            {nextRank && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t4)",textAlign:"center",marginTop:8}}>{(nextRank.min-totalXP).toLocaleString()} to <span style={{color:c}}>RANK {nextRank.rank}</span></div>}
          </div>

          {/* Subject readiness */}
          {primaryExam?.subjects?.length>0 && (
            <div className="card anim-up" style={{animationDelay:".1s"}}>
              <div className="card-hdr">
                <div className="card-title">Dungeon Progress</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {primaryExam.subjects.slice(0,5).map(s => {
                  const topics = s.topics||[];
                  const pct = topics.length ? Math.round(topics.reduce((a,t)=>a+(t.progress||0),0)/topics.length) : 0;
                  const color = pct<30?"var(--red)":pct<60?"var(--orange)":pct<80?"var(--a)":"var(--green)";
                  return (
                    <div key={s.id}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                        <div style={{fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:5,height:5,borderRadius:1,background:color,flexShrink:0}}/>
                          {s.name}
                        </div>
                        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,color}}>{pct}%</div>
                      </div>
                      <div className="prog-track">
                        <div className="prog-fill" style={{width:pct+"%",background:color}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
