import { useState, useEffect } from "react";
import { api } from "../../api/client";
import { usePath } from "../../system/PathContext";
import { showToast } from "../../components/Toast";

const COLORS = ["#2de2a0","#4f6ef7","#f5c842","#f06060","#bf5af2","#fb923c"];
const STATUSES = ["not_touched","in_progress","confident"];
const SCOLORS = { not_touched:"var(--red)", in_progress:"var(--gold)", confident:"var(--green)" };

export default function SkillsPage() {
  const { path } = usePath();
  const c = path.primary;
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newSkill, setNewSkill] = useState({ name:"", color:"#2de2a0" });
  const [expanded, setExpanded] = useState({});
  const [newTopics, setNewTopics] = useState({});

  useEffect(() => { api.getSkills().then(setSkills).catch(()=>{}).finally(()=>setLoading(false)); }, []);

  async function addSkill() {
    if (!newSkill.name.trim()) return;
    try {
      const s = await api.addSkill(newSkill);
      setSkills(p=>[...p,{...s,topics:[]}]);
      setNewSkill({name:"",color:"#2de2a0"}); setShowAdd(false);
    } catch(e) { showToast("Error",e.message); }
  }

  async function addTopic(skillId) {
    const name=(newTopics[skillId]||"").trim(); if (!name) return;
    const t = await api.addSkillTopic(skillId, { name });
    setSkills(p=>p.map(s=>s.id===skillId?{...s,topics:[...(s.topics||[]),t]}:s));
    setNewTopics(p=>({...p,[skillId]:""}));
  }

  async function updateTopic(topicId, data) {
    await api.updateSkillTopic(topicId, data);
    setSkills(p=>p.map(s=>({...s,topics:(s.topics||[]).map(t=>t.id===topicId?{...t,...data}:t)})));
  }

  return (
    <div className="page">
      <div className="page-hdr">
        <div><div className="page-tag">{path.name.toUpperCase()} · SKILLS</div><h1 className="page-title">Skills</h1></div>
        <button className="btn btn-p" onClick={()=>setShowAdd(true)}>+ Add Skill</button>
      </div>
      {showAdd && (
        <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)"}} onClick={()=>setShowAdd(false)}>
          <div className="card" style={{width:360,borderColor:c+"30"}} onClick={e=>e.stopPropagation()}>
            <div className="tag" style={{color:c,marginBottom:14}}>[ ADD SKILL ]</div>
            <input value={newSkill.name} onChange={e=>setNewSkill(p=>({...p,name:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addSkill()} placeholder="Skill name" className="inp" style={{marginBottom:12}}/>
            <div style={{display:"flex",gap:6,marginBottom:16}}>{COLORS.map(col=><div key={col} onClick={()=>setNewSkill(p=>({...p,color:col}))} style={{width:24,height:24,borderRadius:6,background:col,cursor:"pointer",border:"2px solid "+(newSkill.color===col?"#fff":"transparent")}}/>)}</div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-g" onClick={()=>setShowAdd(false)} style={{flex:1}}>Cancel</button>
              <button className="btn btn-p" onClick={addSkill} style={{flex:1}}>Add</button>
            </div>
          </div>
        </div>
      )}
      {loading?<div style={{display:"flex",justifyContent:"center",padding:60}}><div className="spinner"/></div>
      :skills.length===0?<div className="empty"><div className="empty-icon">▤</div><div className="empty-title">No skills yet</div><div className="empty-sub">Add skills like boxing, guitar, coding alongside your exams.</div></div>
      :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {skills.map(skill=>{
          const topics=skill.topics||[],open=expanded[skill.id];
          const pct=topics.length?Math.round(topics.filter(t=>t.status==="confident").length/topics.length*100):0;
          return (
            <div key={skill.id} className="card anim-up">
              <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:12}} onClick={()=>setExpanded(p=>({...p,[skill.id]:!p[skill.id]}))}>
                <div style={{width:9,height:9,borderRadius:2,background:skill.color,transform:"rotate(45deg)",flexShrink:0}}/>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700}}>{skill.name}</div><div className="tag" style={{marginTop:2}}>{topics.length} topics · {pct}% mastered</div></div>
                <span style={{color:"var(--t4)",fontSize:11}}>{open?"▲":"▼"}</span>
              </div>
              <div className="prog-track" style={{marginBottom:open?12:0}}><div className="prog-fill" style={{width:pct+"%",background:skill.color}}/></div>
              {open&&<>
                {topics.map(t=>{const si=STATUSES.indexOf(t.status||"not_touched");return(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,background:"var(--s2)",marginBottom:4,borderLeft:"2px solid "+SCOLORS[t.status||"not_touched"]+"50"}}>
                    <button onClick={()=>updateTopic(t.id,{status:STATUSES[(si+1)%3]})} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:SCOLORS[t.status||"not_touched"],padding:0}}>●</button>
                    <span style={{flex:1,fontSize:12,fontWeight:600}}>{t.name}</span>
                  </div>
                );})}
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  <input value={newTopics[skill.id]||""} onChange={e=>setNewTopics(p=>({...p,[skill.id]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addTopic(skill.id)} placeholder="Add topic..." className="inp" style={{flex:1,height:32,fontSize:12}}/>
                  <button onClick={()=>addTopic(skill.id)} className="btn btn-p" style={{height:32,padding:"0 12px"}}>+</button>
                </div>
              </>}
            </div>
          );
        })}
      </div>}
    </div>
  );
}
