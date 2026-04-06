import { useState, useEffect } from "react";
import { api } from "../../api/client";
import { usePath } from "../../system/PathContext";
import { useRank } from "../../system/RankContext";
import { fireScouter } from "../../components/Scouter";

function HeatmapCell({ day }) {
  const mins = day?.mins||0;
  const isToday = day?.isToday;
  const isStreak = day?.isStreak;
  const c = getComputedStyle(document.documentElement).getPropertyValue("--a").trim()||"#4f6ef7";
  const bg = mins===0?"rgba(255,255,255,.04)":mins<30?`${c}30`:mins<60?`${c}50`:mins<120?`${c}75`:c;
  return (
    <div style={{
      width:12,height:12,borderRadius:3,background:bg,
      border:isToday?`1px solid ${c}`:"1px solid transparent",
      boxShadow:isStreak&&mins>0?`0 0 4px ${c}50`:"none",
      cursor:"pointer",transition:"transform .15s",
    }}
      title={day?`${day.date}: ${mins}min, +${day.xp}XP`:""}
      onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.5)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";}}
    />
  );
}

export default function AnalyticsPage() {
  const { path } = usePath();
  const { rank, totalXP, nextRank } = useRank();
  const c = path.primary;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getHistory().then(setHistory).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  // Build day map
  const dayMap = {};
  history.forEach(h => {
    const d = h.schedule_date||h.date||"";
    if (!d) return;
    if (!dayMap[d]) dayMap[d]={ date:d, mins:0, xp:0, sessions:0, completed:0 };
    dayMap[d].mins     += h.actual_mins||h.planned_mins||0;
    dayMap[d].xp       += h.xp_earned||0;
    dayMap[d].sessions += 1;
    if (h.completed) dayMap[d].completed++;
  });

  // Streak
  const today = new Date();
  let streak=0;
  for (let i=0;;i++) {
    const d=new Date(today); d.setDate(d.getDate()-i);
    const key=d.toISOString().split("T")[0];
    if (dayMap[key]?.mins>0) streak++;
    else break;
  }
  const streakSet = new Set();
  let d=new Date(today);
  for (let i=0;i<streak;i++) { streakSet.add(d.toISOString().split("T")[0]); d.setDate(d.getDate()-1); }

  // Build 53-week heatmap
  const weeks=[];
  const start=new Date(today); start.setDate(start.getDate()-364); start.setDate(start.getDate()-start.getDay());
  const cur=new Date(start);
  for (let w=0;w<53;w++) {
    const wk=[];
    for (let day=0;day<7;day++) {
      const key=cur.toISOString().split("T")[0];
      wk.push({ date:key, ...(dayMap[key]||{}), isToday:key===today.toISOString().split("T")[0], isStreak:streakSet.has(key), isFuture:cur>today });
      cur.setDate(cur.getDate()+1);
    }
    weeks.push(wk);
  }

  const totalMins = history.reduce((a,h)=>a+(h.actual_mins||0),0);
  const totalDone  = history.filter(h=>h.completed===1).length;
  const totalGhost = history.filter(h=>h.ghosted===1).length;
  const completionRate = history.length ? Math.round((totalDone/history.length)*100) : 0;

  const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthLabels=[];
  weeks.forEach((w,wi)=>{
    const fd=new Date(w[0].date+"T00:00:00");
    if (fd.getDate()<=7) monthLabels.push({wi,m:MONTHS[fd.getMonth()]});
  });

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <div className="page-tag">{path.name.toUpperCase()} · {(path.navAnalytics||"ANALYTICS").toUpperCase()}</div>
          <h1 className="page-title">{path.navAnalytics||"Analytics"}</h1>
        </div>
      </div>

      {/* Big stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}} className="stagger">
        {[
          { label:path.xpLabel.toUpperCase(), value:totalXP.toLocaleString(), color:c, onClick:()=>fireScouter(totalXP,path.xpLabel) },
          { label:"STUDY HOURS", value:Math.floor(totalMins/60)+"h", color:"var(--green)", onClick:()=>fireScouter(Math.floor(totalMins/60),"HOURS") },
          { label:path.streakLabel.toUpperCase(), value:streak, color:"var(--gold)", onClick:()=>fireScouter(streak,"STREAK") },
          { label:"COMPLETION RATE", value:completionRate+"%", color:"var(--purple)", onClick:()=>fireScouter(completionRate,"RATE") },
        ].map((s,i)=>(
          <div key={i} className="card anim-up" onClick={s.onClick} style={{cursor:"pointer"}}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.borderColor=s.color+"40";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.borderColor="";}}
          >
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t3)",letterSpacing:".1em",marginBottom:10}}>{s.label}</div>
            <div style={{fontSize:30,fontWeight:900,letterSpacing:"-1px",color:s.color,animation:"countUp .5s ease"}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="card anim-up" style={{marginBottom:20,animationDelay:".06s"}}>
        <div className="card-hdr">
          <div className="card-title">Study Activity</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t3)"}}>LESS</span>
            {[0,.3,.5,.8,1].map((o,i)=>(
              <div key={i} style={{width:11,height:11,borderRadius:2,background:i===0?"rgba(255,255,255,.04)":c,opacity:i===0?1:o*0.6+0.15,border:"1px solid rgba(255,255,255,.04)"}}/>
            ))}
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t3)"}}>MORE</span>
          </div>
        </div>

        <div style={{fontSize:26,fontWeight:900,color:streak>0?"var(--gold)":"var(--t4)",marginBottom:16}}>
          {streak} <span style={{fontSize:13,fontWeight:500,color:"var(--t3)"}}>day streak</span>
        </div>

        <div style={{overflowX:"auto"}}>
          <div style={{minWidth:53*15+32}}>
            {/* Month labels */}
            <div style={{position:"relative",height:14,marginLeft:28,marginBottom:4}}>
              {monthLabels.map((ml,i)=>(
                <div key={i} style={{position:"absolute",left:ml.wi*15,fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t4)"}}>{ml.m}</div>
              ))}
            </div>
            {/* Grid */}
            <div style={{display:"flex",gap:0}}>
              {/* Day labels */}
              <div style={{display:"flex",flexDirection:"column",gap:3,marginRight:4}}>
                {["","M","","W","","F",""].map((d,i)=>(
                  <div key={i} style={{height:12,fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--t4)",display:"flex",alignItems:"center"}}>{d}</div>
                ))}
              </div>
              {weeks.map((wk,wi)=>(
                <div key={wi} style={{display:"flex",flexDirection:"column",gap:3,marginRight:3}}>
                  {wk.map((day,di)=>(
                    day.isFuture ? <div key={di} style={{width:12,height:12}}/> : <HeatmapCell key={di} day={day}/>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Rank progress */}
      <div className="card anim-up" style={{animationDelay:".1s"}}>
        <div className="card-hdr">
          <div className="card-title">Rank Progression</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:c}}>{rank.rank} → {nextRank?.rank||"MAX"}</div>
        </div>
        <div style={{display:"flex",gap:16}}>
          {["E","D","C","B","A","S"].map((r,i) => {
            const rankDef = {E:{min:0},D:{min:500},C:{min:1500},B:{min:3000},A:{min:6000},S:{min:10000}}[r];
            const done = totalXP >= rankDef.min;
            const active = rank.rank===r;
            const rankColor = active?c:done?"var(--green)":"var(--t4)";
            return (
              <div key={r} style={{textAlign:"center",flex:1}}>
                <div style={{
                  width:40,height:40,borderRadius:10,margin:"0 auto 8px",
                  background:active?`${c}18`:done?"rgba(45,226,160,.08)":"rgba(255,255,255,.03)",
                  border:`1px solid ${active?c:done?"rgba(45,226,160,.3)":"var(--b1)"}`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:18,fontWeight:900,color:rankColor,
                }}>{r}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--t4)"}}>{rankDef.min>0?rankDef.min.toLocaleString():"START"}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
