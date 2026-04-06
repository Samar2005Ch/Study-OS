/**
 * pages/Subjects/SubjectCard.jsx
 * Now shows student level + topic status dots.
 */
import { useState }   from "react";
import { DS }         from "../../constants/theme";
import { useRank }    from "../../system/RankContext";

const LEVELS = [
  { val:"not_started", label:"Not Started", color:"#ff3c3c" },
  { val:"learning",    label:"Learning",    color:"#ff8c42" },
  { val:"strong",      label:"Strong",      color:"#1040ff" },
  { val:"confident",   label:"Confident",   color:"#00c6a0" },
];

const TOPIC_STATUS = [
  { val:"not_touched",  label:"Not Touched",  color:"#ff3c3c", short:"●" },
  { val:"in_progress",  label:"In Progress",  color:"#ff8c42", short:"●" },
  { val:"confident",    label:"Confident",    color:"#00c6a0", short:"●" },
];

const DIFF_COLORS = { easy:"#00c6a0", medium:"#ff8c42", hard:"#ff3c3c" };

export default function SubjectCard({
  subject, onRemove, onAddTopic, onRemoveTopic,
  onUpdateTopicDiff, onUpdateLevel, onUpdateTopicStatus,
}) {
  const { rank }     = useRank();
  const c            = rank.primary;
  const [expanded,   setExpanded]   = useState(false);
  const [newTopic,   setNewTopic]   = useState("");
  const [newTopicD,  setNewTopicD]  = useState("medium");

  const level     = LEVELS.find(l => l.val === (subject.student_level||"not_started")) || LEVELS[0];
  const topics    = subject.topics || [];
  const notTouched  = topics.filter(t=>(t.status||"not_touched")==="not_touched").length;
  const inProgress  = topics.filter(t=>t.status==="in_progress").length;
  const confident   = topics.filter(t=>t.status==="confident").length;

  async function handleAddTopic() {
    if (!newTopic.trim()) return;
    await onAddTopic(subject.id, newTopic, newTopicD);
    setNewTopic(""); setNewTopicD("medium");
  }

  return (
    <div style={{
      background:"#0a0c14",
      borderLeft:`2px solid ${subject.color||c}`,
      borderTop:`1px solid ${subject.color||c}18`,
      marginBottom:10,
      position:"relative",
    }}>
      {/* Corner accent */}
      <div style={{ position:"absolute",top:0,left:0,width:8,height:8,borderTop:`2px solid ${subject.color||c}`,borderLeft:`2px solid ${subject.color||c}` }}/>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", cursor:"pointer" }}
        onClick={()=>setExpanded(!expanded)}>

        {/* Color dot */}
        <div style={{ width:8,height:8,background:subject.color||c,transform:"rotate(45deg)",flexShrink:0,boxShadow:`0 0 6px ${subject.color||c}` }}/>

        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, color:"#e8ecf4", fontSize:13, fontFamily:"monospace" }}>
            {subject.name}
          </div>
          {/* Topic status summary */}
          {topics.length>0 && (
            <div style={{ display:"flex", gap:6, marginTop:4, alignItems:"center" }}>
              {notTouched>0  && <span style={{ fontSize:9,color:"#ff3c3c",fontFamily:"monospace" }}>● {notTouched} untouched</span>}
              {inProgress>0  && <span style={{ fontSize:9,color:"#ff8c42",fontFamily:"monospace" }}>● {inProgress} in progress</span>}
              {confident>0   && <span style={{ fontSize:9,color:"#00c6a0",fontFamily:"monospace" }}>● {confident} confident</span>}
            </div>
          )}
        </div>

        {/* Level badge */}
        <div style={{ fontSize:9, padding:"3px 8px", border:`1px solid ${level.color}40`, color:level.color, fontFamily:"monospace", background:`${level.color}10` }}>
          {level.label.toUpperCase()}
        </div>

        <span style={{ color:"#3a4060", fontSize:12 }}>{expanded?"▲":"▼"}</span>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding:"0 16px 16px", borderTop:`1px solid ${c}10` }}>

          {/* Student level selector */}
          <div style={{ marginBottom:14, paddingTop:12 }}>
            <div style={{ fontSize:9,color:"#3a4060",fontFamily:"monospace",letterSpacing:".1em",marginBottom:8 }}>
              YOUR LEVEL IN THIS SUBJECT
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {LEVELS.map(l => (
                <button key={l.val}
                  onClick={()=>onUpdateLevel(subject.id, l.val)}
                  style={{
                    flex:1, padding:"6px 4px",
                    border:`1px solid ${subject.student_level===l.val?l.color:l.color+"30"}`,
                    background:subject.student_level===l.val?`${l.color}18`:"transparent",
                    color:subject.student_level===l.val?l.color:"#3a4060",
                    fontSize:9, cursor:"pointer",
                    fontFamily:"monospace", borderRadius:0,
                    transition:"all .15s",
                  }}
                >
                  {l.label.replace(" ","\n")}
                </button>
              ))}
            </div>
          </div>

          {/* Topics */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:9,color:"#3a4060",fontFamily:"monospace",letterSpacing:".1em",marginBottom:8 }}>
              TOPICS ({topics.length})
            </div>

            {topics.map(t => {
              const ts = TOPIC_STATUS.find(s=>s.val===(t.status||"not_touched"))||TOPIC_STATUS[0];
              return (
                <div key={t.id} style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 10px",marginBottom:4,background:`${ts.color}06`,borderLeft:`2px solid ${ts.color}40` }}>
                  {/* Status cycle button */}
                  <button
                    title={`Status: ${ts.label} — click to change`}
                    onClick={()=>{
                      const idx=TOPIC_STATUS.findIndex(s=>s.val===(t.status||"not_touched"));
                      const next=TOPIC_STATUS[(idx+1)%TOPIC_STATUS.length];
                      onUpdateTopicStatus(subject.id, t.id, next.val);
                    }}
                    style={{ background:"none",border:"none",cursor:"pointer",padding:0,fontSize:12,color:ts.color }}
                  >
                    {ts.short}
                  </button>

                  <span style={{ flex:1,fontSize:12,color:"#c8d0e0",fontFamily:"monospace" }}>{t.name}</span>

                  {/* Difficulty badge */}
                  <select
                    value={t.difficulty||"medium"}
                    onChange={e=>onUpdateTopicDiff(subject.id,t.id,e.target.value)}
                    style={{ background:"#0d0f14",border:`1px solid ${DIFF_COLORS[t.difficulty||"medium"]}40`,color:DIFF_COLORS[t.difficulty||"medium"],fontSize:9,fontFamily:"monospace",padding:"2px 4px",borderRadius:0,cursor:"pointer" }}
                  >
                    <option value="easy">easy</option>
                    <option value="medium">medium</option>
                    <option value="hard">hard</option>
                  </select>

                  <button onClick={()=>onRemoveTopic(subject.id,t.id)} style={{ background:"none",border:"none",color:"#3a4060",cursor:"pointer",fontSize:14,padding:"0 4px" }}>×</button>
                </div>
              );
            })}

            {!topics.length && (
              <div style={{ fontSize:10,color:"#3a4060",fontFamily:"monospace",padding:"8px 10px" }}>
                No topics yet. Add one below.
              </div>
            )}
          </div>

          {/* Add topic */}
          <div style={{ display:"flex", gap:6 }}>
            <input
              value={newTopic}
              onChange={e=>setNewTopic(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleAddTopic()}
              placeholder="Add topic..."
              style={{ flex:1,padding:"7px 10px",background:"#0d0f14",border:`1px solid ${c}25`,color:"#e8ecf4",fontFamily:"monospace",fontSize:11,outline:"none",borderRadius:0 }}
            />
            <select value={newTopicD} onChange={e=>setNewTopicD(e.target.value)} style={{ background:"#0d0f14",border:`1px solid ${c}25`,color:"#e8ecf4",fontFamily:"monospace",fontSize:10,padding:"4px 6px",borderRadius:0 }}>
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
            <button onClick={handleAddTopic} style={{ padding:"7px 14px",border:`1px solid ${c}`,background:`${c}18`,color:c,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"monospace",borderRadius:0 }}>+</button>
          </div>

          {/* Remove subject */}
          <button onClick={()=>onRemove(subject.id)} style={{ marginTop:12,padding:"5px 12px",border:"1px solid #ff3c3c30",background:"transparent",color:"#ff3c3c",fontSize:9,cursor:"pointer",fontFamily:"monospace",borderRadius:0,letterSpacing:".06em" }}>
            REMOVE SUBJECT
          </button>
        </div>
      )}
    </div>
  );
}
