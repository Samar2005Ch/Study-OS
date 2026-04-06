import { useState, useEffect } from "react";
import { api } from "../../api/client";
import { usePath } from "../../system/PathContext";
import { showToast } from "../../components/Toast";

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function TimetablePage() {
  const { path } = usePath();
  const c = path.primary;
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({ day:"Mon", label:"", start:"09:00", end:"11:00" });

  useEffect(()=>{ api.getTimetable().then(setSlots).catch(()=>{}).finally(()=>setLoading(false)); },[]);

  async function addSlot() {
    if (!newSlot.label.trim()) return;
    try {
      const s = await api.addSlot(newSlot);
      setSlots(p=>[...p,s]);
      setNewSlot(p=>({...p,label:""}));
      showToast("Slot added",newSlot.label,path.sig);
    } catch(e) { showToast("Error",e.message); }
  }

  async function deleteSlot(id) {
    await api.deleteSlot(id);
    setSlots(p=>p.filter(s=>s.id!==id));
  }

  return (
    <div className="page">
      <div className="page-hdr">
        <div><div className="page-tag">{path.name.toUpperCase()} · TIMETABLE</div><h1 className="page-title">Timetable</h1></div>
      </div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t3)",marginBottom:20}}>
        MARK BUSY SLOTS — scheduler will work around them
      </div>

      {/* Add slot */}
      <div className="card" style={{marginBottom:24,borderColor:c+"20"}}>
        <div className="tag" style={{color:c,marginBottom:14}}>[ ADD BUSY SLOT ]</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
          <select value={newSlot.day} onChange={e=>setNewSlot(p=>({...p,day:e.target.value}))}
            style={{height:40,padding:"0 12px",background:"var(--s2)",border:"1px solid var(--b1)",color:"var(--t1)",borderRadius:10,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>
            {DAYS.map(d=><option key={d}>{d}</option>)}
          </select>
          <input value={newSlot.label} onChange={e=>setNewSlot(p=>({...p,label:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addSlot()}
            placeholder="Label (e.g. College, Gym)" className="inp" style={{flex:1,minWidth:160}}/>
          <input type="time" value={newSlot.start} onChange={e=>setNewSlot(p=>({...p,start:e.target.value}))}
            className="inp" style={{width:110,colorScheme:"dark"}}/>
          <span style={{color:"var(--t3)",fontSize:12}}>to</span>
          <input type="time" value={newSlot.end} onChange={e=>setNewSlot(p=>({...p,end:e.target.value}))}
            className="inp" style={{width:110,colorScheme:"dark"}}/>
          <button className="btn btn-p" onClick={addSlot}>Add</button>
        </div>
      </div>

      {/* Weekly grid */}
      {loading?<div style={{display:"flex",justifyContent:"center",padding:60}}><div className="spinner"/></div>
      :<div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:12}}>
        {DAYS.map(day=>{
          const daySlots=slots.filter(s=>s.day===day);
          return (
            <div key={day}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:c,letterSpacing:".15em",marginBottom:8,textAlign:"center"}}>{day.toUpperCase()}</div>
              {daySlots.length===0?<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t4)",textAlign:"center",padding:"16px 0",border:"1px dashed var(--b1)",borderRadius:8}}>free</div>
              :daySlots.map(s=>(
                <div key={s.id} style={{background:`${c}10`,border:`1px solid ${c}25`,borderRadius:8,padding:"8px 10px",marginBottom:6,position:"relative"}}>
                  <div style={{fontSize:11,fontWeight:700,marginBottom:2}}>{s.label}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t3)"}}>{s.start} – {s.end}</div>
                  <button onClick={()=>deleteSlot(s.id)} style={{position:"absolute",top:4,right:6,background:"none",border:"none",color:"var(--t4)",cursor:"pointer",fontSize:13}}>×</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>}
    </div>
  );
}
