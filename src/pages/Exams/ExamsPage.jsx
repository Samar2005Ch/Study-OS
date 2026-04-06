import { useState, useEffect, useRef } from "react";
import { api } from "../../api/client";
import { usePath } from "../../system/PathContext";
import { showToast } from "../../components/Toast";

const LEVEL_MAP = { not_started:{l:"Not Started",c:"#f06060"}, learning:{l:"Learning",c:"#fb923c"}, strong:{l:"Strong",c:"var(--a)"}, confident:{l:"Confident",c:"var(--green)"} };
const DIFF_MAP  = { easy:"var(--green)", medium:"var(--gold)", hard:"var(--red)" };

function TopicRow({ topic, subjectId, onUpdate, onDelete }) {
  const statuses = ["not_touched","in_progress","confident"];
  const statusColors = { not_touched:"var(--red)", in_progress:"var(--gold)", confident:"var(--green)" };
  const statusLabels = { not_touched:"●", in_progress:"●", confident:"●" };
  const si = statuses.indexOf(topic.status||"not_touched");

  return (
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,background:"var(--s2)",marginBottom:3,borderLeft:`2px solid ${statusColors[topic.status||"not_touched"]}50`}}>
      <button title={`Status: ${topic.status} — click to cycle`} onClick={()=>onUpdate(topic.id,{status:statuses[(si+1)%3]})}
        style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:statusColors[topic.status||"not_touched"],padding:0,flexShrink:0}}>
        {statusLabels[topic.status||"not_touched"]}
      </button>
      <span style={{flex:1,fontSize:12,fontWeight:600}}>{topic.name}</span>
      {topic.progress>0 && <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t3)"}}>{topic.progress}%</span>}
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:DIFF_MAP[topic.difficulty||"medium"]}}>{topic.difficulty||"medium"}</span>
      <button onClick={()=>onDelete(topic.id)} style={{background:"none",border:"none",color:"var(--t4)",cursor:"pointer",fontSize:14,padding:"0 2px"}}>×</button>
    </div>
  );
}

function SubjectCard({ subject, examId, onUpdateSubject, onAddTopic, onUpdateTopic, onDeleteTopic, onDelete, pathColor }) {
  const [open, setOpen] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [newTopicD, setNewTopicD] = useState("medium");
  const level = LEVEL_MAP[subject.student_level||"not_started"];
  const topics = subject.topics||[];
  const untouched = topics.filter(t=>(t.status||"not_touched")==="not_touched").length;
  const inProg    = topics.filter(t=>t.status==="in_progress").length;
  const confident = topics.filter(t=>t.status==="confident").length;

  async function addT() {
    if (!newTopic.trim()) return;
    await onAddTopic(subject.id, { name:newTopic.trim(), difficulty:newTopicD });
    setNewTopic("");
  }

  return (
    <div style={{background:"var(--s1)",border:`1px solid var(--b1)`,borderLeft:`2px solid ${subject.color||pathColor}`,borderRadius:12,marginBottom:8,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div style={{width:7,height:7,background:subject.color||pathColor,borderRadius:1,transform:"rotate(45deg)",flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700}}>{subject.name}</div>
          {topics.length>0 && (
            <div style={{display:"flex",gap:8,marginTop:3}}>
              {untouched>0 && <span style={{fontSize:9,color:"var(--red)",fontFamily:"'JetBrains Mono',monospace"}}>● {untouched}</span>}
              {inProg>0    && <span style={{fontSize:9,color:"var(--gold)",fontFamily:"'JetBrains Mono',monospace"}}>● {inProg}</span>}
              {confident>0 && <span style={{fontSize:9,color:"var(--green)",fontFamily:"'JetBrains Mono',monospace"}}>● {confident}</span>}
            </div>
          )}
        </div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:level.c,padding:"2px 7px",border:`1px solid ${level.c}40`,borderRadius:5,background:`${level.c}10`}}>{level.l.toUpperCase()}</div>
        <span style={{color:"var(--t4)",fontSize:11}}>{open?"▲":"▼"}</span>
      </div>

      {open && (
        <div style={{padding:"12px 16px 16px",borderTop:"1px solid var(--b1)"}}>
          {/* Level selector */}
          <div style={{marginBottom:14}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t3)",letterSpacing:".1em",marginBottom:8}}>YOUR LEVEL</div>
            <div style={{display:"flex",gap:6}}>
              {Object.entries(LEVEL_MAP).map(([val,{l,c}])=>(
                <button key={val} onClick={()=>onUpdateSubject(subject.id,{student_level:val})} style={{
                  flex:1,padding:"6px 4px",border:`1px solid ${subject.student_level===val?c:c+"30"}`,
                  background:subject.student_level===val?`${c}18`:"transparent",color:subject.student_level===val?c:"var(--t4)",
                  fontSize:9,cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",borderRadius:6,transition:"all .15s",
                }}>{l.replace(" ","\n")}</button>
              ))}
            </div>
          </div>

          {/* Topics */}
          <div style={{marginBottom:10}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t3)",letterSpacing:".1em",marginBottom:8}}>TOPICS ({topics.length})</div>
            {topics.map(t=>(
              <TopicRow key={t.id} topic={t} subjectId={subject.id}
                onUpdate={(id,d)=>onUpdateTopic(id,d)} onDelete={id=>onDeleteTopic(subject.id,id)}/>
            ))}
            {!topics.length && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t4)",padding:"6px 0"}}>No topics yet.</div>}
          </div>

          {/* Add topic */}
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            <input value={newTopic} onChange={e=>setNewTopic(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addT()}
              placeholder="Add topic..." className="inp" style={{flex:1,height:34,fontSize:12}}/>
            <select value={newTopicD} onChange={e=>setNewTopicD(e.target.value)}
              style={{background:"var(--s1)",border:"1px solid var(--b1)",color:"var(--t1)",fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"4px 6px",borderRadius:8,cursor:"pointer"}}>
              <option value="easy">easy</option><option value="medium">medium</option><option value="hard">hard</option>
            </select>
            <button onClick={addT} className="btn btn-p" style={{height:34,padding:"0 14px",fontSize:13}}>+</button>
          </div>

          <button onClick={()=>onDelete(subject.id)} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--red)",background:"none",border:"1px solid rgba(240,96,96,.2)",padding:"4px 10px",borderRadius:6,cursor:"pointer",letterSpacing:".06em"}}>
            REMOVE SUBJECT
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExamsPage() {
  const { path } = usePath();
  const c = path.primary;
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddExam, setShowAddExam] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(null); // examId
  const [newExam, setNewExam] = useState({ name:"", date:"" });
  const [newSubject, setNewSubject] = useState({ name:"", color:"#4f6ef7", student_level:"not_started", question_count:"25" });

  useEffect(() => {
    api.getExams().then(setExams).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  async function addExam() {
    if (!newExam.name.trim()||!newExam.date) return;
    try {
      const e = await api.addExam(newExam);
      setExams(p=>[...p,{...e,subjects:[]}]);
      setNewExam({name:"",date:""}); setShowAddExam(false);
      showToast("Dungeon added", newExam.name, path.sig);
    } catch(e) { showToast("Error", e.message); }
  }

  async function deleteExam(id) {
    await api.deleteExam(id);
    setExams(p=>p.filter(e=>e.id!==id));
    showToast("Dungeon removed","",path.sig);
  }

  async function addSubject(examId) {
    if (!newSubject.name.trim()) return;
    try {
      const s = await api.addExamSubject(examId, { ...newSubject, question_count:parseInt(newSubject.question_count)||25 });
      setExams(p=>p.map(e=>e.id===examId?{...e,subjects:[...(e.subjects||[]),{...s,topics:[]}]}:e));
      setNewSubject({name:"",color:"#4f6ef7",student_level:"not_started",question_count:"25"});
      setShowAddSubject(null);
    } catch(e) { showToast("Error",e.message); }
  }

  async function updateSubject(subjectId, data) {
    await api.updateSubject(subjectId, data);
    setExams(p=>p.map(e=>({...e,subjects:(e.subjects||[]).map(s=>s.id===subjectId?{...s,...data}:s)})));
  }

  async function deleteSubject(examId, subjectId) {
    await api.deleteSubject(subjectId);
    setExams(p=>p.map(e=>e.id===examId?{...e,subjects:(e.subjects||[]).filter(s=>s.id!==subjectId)}:e));
  }

  async function addTopic(subjectId, data) {
    const t = await api.addTopic(subjectId, data);
    setExams(p=>p.map(e=>({...e,subjects:(e.subjects||[]).map(s=>s.id===subjectId?{...s,topics:[...(s.topics||[]),t]}:s)})));
  }

  async function updateTopic(topicId, data) {
    await api.updateTopic(topicId, data);
    setExams(p=>p.map(e=>({...e,subjects:(e.subjects||[]).map(s=>({...s,topics:(s.topics||[]).map(t=>t.id===topicId?{...t,...data}:t)}))})));
  }

  async function deleteTopic(subjectId, topicId) {
    await api.deleteTopic(topicId);
    setExams(p=>p.map(e=>({...e,subjects:(e.subjects||[]).map(s=>s.id===subjectId?{...s,topics:(s.topics||[]).filter(t=>t.id!==topicId)}:s)})));
  }

  const COLORS = ["#4f6ef7","#30d158","#f5c842","#f06060","#bf5af2","#fb923c","#2de2a0","#ff6b9d"];

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <div className="page-tag">{path.name.toUpperCase()} · DUNGEON GATES</div>
          <h1 className="page-title">Exams</h1>
        </div>
        <button className="btn btn-p" onClick={()=>setShowAddExam(true)}>+ Add Exam</button>
      </div>

      {/* Add Exam Modal */}
      {showAddExam && (
        <div style={{position:"fixed",inset:0,zIndex:999,background:"rgba(0,0,0,.7)",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(10px)"}} onClick={()=>setShowAddExam(false)}>
          <div className="card" style={{width:400,borderColor:`${c}30`}} onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:c,letterSpacing:".18em",marginBottom:14}}>[ ADD DUNGEON ]</div>
            <input value={newExam.name} onChange={e=>setNewExam(p=>({...p,name:e.target.value}))} placeholder="Exam name (e.g. MAH MCA CET 2025)"
              className="inp" style={{marginBottom:10}}/>
            <input type="date" value={newExam.date} onChange={e=>setNewExam(p=>({...p,date:e.target.value}))}
              className="inp" style={{marginBottom:18,colorScheme:"dark"}}/>
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-g" onClick={()=>setShowAddExam(false)} style={{flex:1}}>Cancel</button>
              <button className="btn btn-p" onClick={addExam} style={{flex:1}}>Create Dungeon</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:60}}><div className="spinner"/></div>
      ) : exams.length===0 ? (
        <div className="empty">
          <div className="empty-icon">◫</div>
          <div className="empty-title">No dungeons yet</div>
          <div className="empty-sub">Add your first exam to begin scheduling. The system needs a target to fight for.</div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:20}}>
          {exams.map(exam => {
            const daysLeft = Math.max(0,Math.ceil((new Date(exam.date)-new Date())/86400000));
            const urgColor = daysLeft<7?"var(--red)":daysLeft<14?"var(--orange)":"var(--t2)";
            return (
              <div key={exam.id} className="card anim-up">
                {/* Exam header */}
                <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:16}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <div className="glow-dot" style={{background:c}}/>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:c,letterSpacing:".15em"}}>DUNGEON</span>
                    </div>
                    <h2 style={{fontSize:18,fontWeight:900,letterSpacing:"-.3px",marginBottom:4}}>{exam.name}</h2>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--t3)"}}>
                      {new Date(exam.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:28,fontWeight:900,color:urgColor,letterSpacing:"-1px"}}>{daysLeft}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--t4)",letterSpacing:".1em"}}>DAYS LEFT</div>
                  </div>
                  <button onClick={()=>deleteExam(exam.id)} style={{background:"none",border:"none",color:"var(--t4)",cursor:"pointer",fontSize:16,padding:"0 4px",marginTop:4}}>×</button>
                </div>

                {/* Subjects */}
                <div style={{marginBottom:12}}>
                  {(exam.subjects||[]).map(s=>(
                    <SubjectCard key={s.id} subject={s} examId={exam.id} pathColor={c}
                      onUpdateSubject={(id,d)=>updateSubject(id,d)}
                      onAddTopic={(id,d)=>addTopic(id,d)}
                      onUpdateTopic={(id,d)=>updateTopic(id,d)}
                      onDeleteTopic={(sid,tid)=>deleteTopic(sid,tid)}
                      onDelete={()=>deleteSubject(exam.id,s.id)}
                    />
                  ))}
                </div>

                {/* Add subject */}
                {showAddSubject===exam.id ? (
                  <div style={{background:"var(--s2)",borderRadius:12,padding:14,border:"1px solid var(--b1)"}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:c,letterSpacing:".15em",marginBottom:12}}>[ ADD SUBJECT ]</div>
                    <input value={newSubject.name} onChange={e=>setNewSubject(p=>({...p,name:e.target.value}))}
                      placeholder="Subject name" className="inp" style={{marginBottom:8}}/>
                    <div style={{display:"flex",gap:8,marginBottom:12}}>
                      <input type="number" value={newSubject.question_count} onChange={e=>setNewSubject(p=>({...p,question_count:e.target.value}))}
                        placeholder="Questions" className="inp" style={{width:100,flex:"none"}}/>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {COLORS.map(col=>(
                          <div key={col} onClick={()=>setNewSubject(p=>({...p,color:col}))} style={{
                            width:22,height:22,borderRadius:5,background:col,cursor:"pointer",
                            border:`2px solid ${newSubject.color===col?"#fff":"transparent"}`,
                            transition:"border-color .15s",
                          }}/>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button className="btn btn-g" onClick={()=>setShowAddSubject(null)} style={{flex:1,height:34}}>Cancel</button>
                      <button className="btn btn-p" onClick={()=>addSubject(exam.id)} style={{flex:1,height:34}}>Add Subject</button>
                    </div>
                  </div>
                ) : (
                  <button className="btn btn-g" onClick={()=>setShowAddSubject(exam.id)} style={{width:"100%",justifyContent:"center",height:36,fontSize:12}}>
                    + Add Subject
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
