import { useState } from "react";
import { api } from "../../api/client";
import { usePath } from "../../system/PathContext";

const TIMES = ["morning","afternoon","evening","night"];
const TARGETS = [{val:"2",label:"2 hours",desc:"Light"},{val:"4",label:"4 hours",desc:"Regular"},{val:"6",label:"6 hours",desc:"Serious"},{val:"8",label:"8 hours",desc:"Full"}];

export default function OnboardingScreen({ onDone }) {
  const { path } = usePath();
  const c = path.primary;
  const [bestTime, setBestTime] = useState("morning");
  const [target, setTarget] = useState("4");
  const [saving, setSaving] = useState(false);

  async function handleDone() {
    setSaving(true);
    try {
      await Promise.all([api.saveSetting("best_time",bestTime), api.saveSetting("daily_target_hours",target), api.saveSetting("onboarded","1")]);
      onDone();
    } catch(e) { console.error(e); } finally { setSaving(false); }
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace",padding:24,backgroundImage:`linear-gradient(${c}06 1px,transparent 1px),linear-gradient(90deg,${c}06 1px,transparent 1px)`,backgroundSize:"40px 40px"}}>
      <div style={{width:"100%",maxWidth:440}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:10,color:"var(--t4)",letterSpacing:".14em",marginBottom:8}}>[ HUNTER PROFILE SETUP ]</div>
          <div style={{fontSize:24,fontWeight:900,marginBottom:6}}>Two quick questions.</div>
          <div style={{fontSize:11,color:"var(--t3)"}}>The system needs to know when you work best.</div>
        </div>
        {/* Q1 */}
        <div style={{background:"var(--s1)",borderLeft:`2px solid ${c}`,padding:"18px 20px",marginBottom:12,borderRadius:"0 12px 12px 0"}}>
          <div style={{fontSize:9,color:c,letterSpacing:".12em",marginBottom:10}}>[ QUESTION 1 ]</div>
          <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>When do you study best?</div>
          <div style={{fontSize:10,color:"var(--t3)",marginBottom:14}}>Hard subjects will be scheduled here.</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {TIMES.map(t=><button key={t} onClick={()=>setBestTime(t)} style={{padding:"10px 6px",border:`1px solid ${bestTime===t?c:c+"25"}`,background:bestTime===t?`${c}18`:"transparent",color:bestTime===t?c:"var(--t4)",fontWeight:700,fontSize:10,cursor:"pointer",fontFamily:"monospace",borderRadius:8,transition:"all .15s"}}>{t.toUpperCase()}</button>)}
          </div>
        </div>
        {/* Q2 */}
        <div style={{background:"var(--s1)",borderLeft:`2px solid ${c}`,padding:"18px 20px",marginBottom:24,borderRadius:"0 12px 12px 0"}}>
          <div style={{fontSize:9,color:c,letterSpacing:".12em",marginBottom:10}}>[ QUESTION 2 ]</div>
          <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Daily study target?</div>
          <div style={{fontSize:10,color:"var(--t3)",marginBottom:14}}>Be realistic. The scheduler won't exceed this.</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {TARGETS.map(t=><button key={t.val} onClick={()=>setTarget(t.val)} style={{padding:"10px 6px",border:`1px solid ${target===t.val?c:c+"25"}`,background:target===t.val?`${c}18`:"transparent",color:target===t.val?c:"var(--t4)",fontWeight:700,fontSize:10,cursor:"pointer",fontFamily:"monospace",borderRadius:8,transition:"all .15s"}}>
              <div>{t.label}</div><div style={{fontSize:8,color:target===t.val?c+"aa":"var(--t4)",marginTop:2}}>{t.desc}</div>
            </button>)}
          </div>
        </div>
        <button onClick={handleDone} disabled={saving} style={{width:"100%",padding:14,border:`1px solid ${c}`,background:`${c}18`,color:c,fontWeight:700,fontSize:12,cursor:saving?"not-allowed":"pointer",fontFamily:"monospace",letterSpacing:".08em",borderRadius:12,transition:"all .2s"}}>
          {saving?"[ SAVING... ]":"[ BEGIN TRAINING ]"}
        </button>
      </div>
    </div>
  );
}
