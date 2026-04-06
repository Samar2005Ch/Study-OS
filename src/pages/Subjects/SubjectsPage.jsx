/**
 * pages/Subjects/SubjectsPage.jsx — wires everything together.
 */
import Page from "../../components/Page";
import AddSubjectForm from "./AddSubjectForm";
import SubjectCard    from "./SubjectCard";
import ExamSection    from "./ExamSection";
import { useSubjects } from "../../hooks/useSubjects";
import { DS } from "../../constants/theme";

export default function SubjectsPage() {
  const {
    subjects, addSubject, removeSubject,
    addTopic, removeTopic, updateTopicDifficulty, updateDifficulty,
    exams, addExam, removeExam, toggleExamSubject,
    addSubExam, removeSubExam,
  } = useSubjects();

  const totalTopics = subjects.reduce((a,s) => a + s.topics.length, 0);

  return (
    <Page title="Subjects & Exams"
      subtitle="Add subjects, rate topics, and set exam deadlines."
      badge="Step 3 ✓">

      {/* Stats */}
      <div style={{ display:"flex", gap:10, marginBottom:28 }}>
        {[
          { value:subjects.length, label:"subjects"     },
          { value:totalTopics,     label:"total topics" },
          { value:exams.length,    label:"exams added"  },
        ].map(s => (
          <div key={s.label} style={{ background:DS.surfaceAlt, border:`0.5px solid ${DS.border}`, borderRadius:DS.r8, padding:"9px 16px", display:"flex", alignItems:"baseline", gap:7 }}>
            <span style={{ fontSize:18, fontWeight:700, color:DS.textPrimary, fontFamily:DS.fontMono }}>{s.value}</span>
            <span style={{ fontSize:11, color:DS.textMuted }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Add subject */}
      <div style={{ fontSize:12, fontWeight:600, color:DS.textSecondary, marginBottom:10 }}>Add Subject</div>
      <AddSubjectForm onAdd={addSubject} />

      {/* Subject cards */}
      {subjects.length > 0 ? (
        <>
          <div style={{ fontSize:12, fontWeight:600, color:DS.textSecondary, marginBottom:12 }}>
            Your Subjects
            <span style={{ marginLeft:8, fontSize:11, fontWeight:400, color:DS.textMuted }}>
              Click topic count → expand → rate each topic Easy / Medium / Hard
            </span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:12, marginBottom:32 }}>
            {subjects.map(s => (
              <SubjectCard key={s.id} subject={s}
                onRemove={removeSubject}
                onAddTopic={addTopic}
                onRemoveTopic={removeTopic}
                onDifficultyChange={updateDifficulty}
                onTopicDifficultyChange={updateTopicDifficulty}
              />
            ))}
          </div>
        </>
      ) : (
        <div style={{ border:`0.5px dashed ${DS.border}`, borderRadius:DS.r12, padding:"32px 0", textAlign:"center", fontSize:13, color:DS.textMuted, marginBottom:32 }}>
          No subjects yet — add Mathematics, CS, Reasoning etc above.
        </div>
      )}

      {/* Exams */}
      <ExamSection
        exams={exams} subjects={subjects}
        onAdd={addExam} onRemove={removeExam}
        onToggleSubject={toggleExamSubject}
        onAddSubExam={addSubExam}
        onRemoveSubExam={removeSubExam}
      />
    </Page>
  );
}
