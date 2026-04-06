/**
 * pages/Subjects/ExamSection.jsx
 *
 * WHAT CHANGED:
 *   - Date input replaced with CalendarPicker component
 *   - Sub-exams: each exam can have child exams (e.g. BCA → C++, OS, etc)
 *   - Sub-exam rows show indented under parent with their own dates
 */

import { useState } from "react";
import { DS } from "../../constants/theme";
import { daysUntil } from "../../hooks/useSubjects";
import CalendarPicker from "../../components/CalendarPicker";

function urgColor(days) {
  return days < 7 ? DS.danger : days < 14 ? DS.warning : DS.success;
}

const th = {
  padding:"9px 14px", fontSize:11, fontWeight:600,
  color:DS.textMuted, letterSpacing:"0.06em",
  textTransform:"uppercase", textAlign:"left",
  background:DS.surfaceAlt, borderBottom:`0.5px solid ${DS.border}`,
};
const td = { padding:"10px 14px", fontSize:13, color:DS.textPrimary, verticalAlign:"middle" };

// Row for a single exam (parent or sub)
function ExamRow({ exam, subjects, onRemove, onToggleSubject, isSubExam,
                   onAddSubExam, onRemoveSubExam, depth = 0 }) {
  const [showSub, setShowSub]     = useState(false);
  const [subName, setSubName]     = useState("");
  const [subDate, setSubDate]     = useState("");
  const [subErr,  setSubErr]      = useState("");

  const days = daysUntil(exam.date);
  const uc   = urgColor(days);

  function submitSub() {
    const err = onAddSubExam(exam.id, { name: subName, date: subDate });
    if (err) { setSubErr(err); return; }
    setSubName(""); setSubDate(""); setSubErr("");
  }

  return (
    <>
      <tr style={{ borderBottom:`0.5px solid ${DS.border}`, background: isSubExam ? DS.surfaceAlt+"80" : "transparent" }}>
        {/* Exam name — indented for sub-exams */}
        <td style={{ ...td, paddingLeft: 14 + depth * 20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {isSubExam && <span style={{ color:DS.textMuted, fontSize:12 }}>└</span>}
            <span style={{ fontWeight: isSubExam ? 400 : 600, fontSize: isSubExam ? 12 : 13 }}>
              {exam.name}
            </span>
            {/* Add sub-exam toggle — only on parent exams */}
            {!isSubExam && (
              <button
                onClick={() => setShowSub(v => !v)}
                title="Add sub-exam (e.g. C++, OS)"
                style={{
                  fontSize:10, padding:"2px 7px", borderRadius:20,
                  border:`0.5px solid ${DS.border}`, background:"none",
                  color:DS.textMuted, cursor:"pointer",
                  fontFamily:DS.fontBody,
                }}
              >
                {showSub ? "− sub" : "+ sub-exam"}
              </button>
            )}
          </div>

          {/* Sub-exam add form — inline below parent name */}
          {showSub && (
            <div style={{ marginTop:8, display:"flex", gap:6, alignItems:"flex-start", flexWrap:"wrap" }}>
              <input
                value={subName}
                onChange={e => { setSubName(e.target.value); setSubErr(""); }}
                placeholder="e.g. C++ Programming"
                onKeyDown={e => e.key === "Enter" && submitSub()}
                style={{
                  padding:"5px 9px", background:DS.bg,
                  border:`0.5px solid ${DS.border}`,
                  borderRadius:DS.r8, color:DS.textPrimary,
                  fontSize:12, fontFamily:DS.fontBody, outline:"none", width:180,
                }}
              />
              <CalendarPicker
                value={subDate}
                onChange={setSubDate}
                minDate={new Date().toISOString().split("T")[0]}
              />
              <button onClick={submitSub}
                style={{ padding:"5px 12px", borderRadius:DS.r8, border:"none", background:DS.primary, color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:DS.fontBody }}
              >Add</button>
              {subErr && <span style={{ fontSize:11, color:DS.danger, alignSelf:"center" }}>{subErr}</span>}
            </div>
          )}
        </td>

        {/* Date */}
        <td style={{ ...td, fontFamily:DS.fontMono, fontSize:12, color:DS.textSecondary }}>
          {new Date(exam.date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}
        </td>

        {/* Days left */}
        <td style={td}>
          <span style={{
            display:"inline-block", fontSize:12, fontWeight:700,
            color:uc, background:uc+"18",
            border:`0.5px solid ${uc}40`,
            borderRadius:20, padding:"2px 10px",
          }}>
            {days === 0 ? "Today!" : `${days}d`}
          </span>
        </td>

        {/* Subject links — only on parent */}
        <td style={td}>
          {!isSubExam ? (
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {subjects.map(s => {
                const linked = exam.subjectIds?.includes(s.id);
                return (
                  <button key={s.id}
                    onClick={() => onToggleSubject(exam.id, s.id)}
                    style={{
                      fontSize:10, padding:"2px 8px", borderRadius:20,
                      cursor:"pointer", border:`0.5px solid ${s.color}60`,
                      background: linked ? s.color+"22" : "transparent",
                      color: linked ? s.color : DS.textMuted,
                      fontFamily:DS.fontBody, transition:"all .15s",
                    }}
                  >{s.name}</button>
                );
              })}
              {subjects.length === 0 && <span style={{ fontSize:11, color:DS.textMuted }}>Add subjects first</span>}
            </div>
          ) : (
            <span style={{ fontSize:11, color:DS.textMuted }}>—</span>
          )}
        </td>

        {/* Delete */}
        <td style={{ ...td, textAlign:"right" }}>
          <button
            onClick={onRemove}
            style={{ background:"none", border:"none", color:DS.textMuted, cursor:"pointer", fontSize:14, padding:"2px 6px", borderRadius:DS.r4 }}
            onMouseEnter={e => e.target.style.color = DS.danger}
            onMouseLeave={e => e.target.style.color = DS.textMuted}
          >✕</button>
        </td>
      </tr>

      {/* Sub-exam rows — indented */}
      {!isSubExam && (exam.subExams||[]).map(sub => (
        <ExamRow key={sub.id} exam={sub} subjects={[]}
          isSubExam={true} depth={1}
          onRemove={() => onRemoveSubExam(exam.id, sub.id)}
          onToggleSubject={() => {}}
        />
      ))}
    </>
  );
}

export default function ExamSection({ exams, subjects, onAdd, onRemove, onToggleSubject, onAddSubExam, onRemoveSubExam }) {
  const [name,  setName]  = useState("");
  const [date,  setDate]  = useState("");
  const [error, setError] = useState("");

  async function submit() {
    try {
      const err = await onAdd({ name, date, subjectIds: [] });
      if (err) { setError(err); return; }
      setName(""); setDate(""); setError("");
    } catch(e) {
      setError("Connection error. Is the server running?");
    }
  }

  const inp = {
    padding:"8px 12px", background:DS.surfaceAlt,
    border:`0.5px solid ${DS.border}`, borderRadius:DS.r8,
    color:DS.textPrimary, fontSize:13,
    fontFamily:DS.fontBody, outline:"none",
  };

  return (
    <div>
      <div style={{ fontSize:12, fontWeight:600, color:DS.textSecondary, marginBottom:12 }}>
        Exam Deadlines
        <span style={{ marginLeft:8, fontSize:11, fontWeight:400, color:DS.textMuted }}>
          Add sub-exams (like C++, OS) inside each exam row
        </span>
      </div>

      {/* Add exam form */}
      <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"flex-end", flexWrap:"wrap" }}>
        <div style={{ flex:2, minWidth:160 }}>
          <label style={{ fontSize:11, color:DS.textMuted, display:"block", marginBottom:5 }}>Exam name</label>
          <input value={name} onChange={e => { setName(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="e.g. NIMCET 2025 / BCA Semester 6"
            style={{ ...inp, width:"100%" }}
          />
        </div>
        <div>
          <label style={{ fontSize:11, color:DS.textMuted, display:"block", marginBottom:5 }}>Date</label>
          <CalendarPicker
            value={date}
            onChange={setDate}
            minDate={new Date().toISOString().split("T")[0]}
          />
        </div>
        <button onClick={submit}
          style={{ padding:"8px 20px", borderRadius:DS.r8, border:"none", background:DS.primary, color:"#fff", fontWeight:600, fontSize:13, cursor:"pointer", fontFamily:DS.fontBody, height:36, alignSelf:"flex-end" }}
        >Add exam</button>
      </div>

      {error && (
        <div style={{ marginBottom:12, fontSize:12, color:DS.danger, borderLeft:`2px solid ${DS.danger}`, paddingLeft:10 }}>
          {error}
        </div>
      )}

      {/* Exam table */}
      {exams.length === 0 ? (
        <div style={{ border:`0.5px solid ${DS.border}`, borderRadius:DS.r12, padding:"32px 0", textAlign:"center", fontSize:13, color:DS.textMuted }}>
          No exams added yet.
        </div>
      ) : (
        <div style={{ border:`0.5px solid ${DS.border}`, borderRadius:DS.r12, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                <th style={th}>Exam</th>
                <th style={th}>Date</th>
                <th style={th}>Days left</th>
                <th style={th}>Subjects</th>
                <th style={{ ...th, textAlign:"right" }}></th>
              </tr>
            </thead>
            <tbody>
              {[...exams].sort((a,b) => new Date(a.date)-new Date(b.date)).map(exam => (
                <ExamRow
                  key={exam.id} exam={exam} subjects={subjects}
                  onRemove={() => onRemove(exam.id)}
                  onToggleSubject={onToggleSubject}
                  onAddSubExam={onAddSubExam}
                  onRemoveSubExam={onRemoveSubExam}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
