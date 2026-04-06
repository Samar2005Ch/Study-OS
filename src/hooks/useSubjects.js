import { useState, useEffect } from "react";

export function daysUntil(d) {
  return Math.max(0, Math.ceil((new Date(d) - new Date()) / 86400000));
}
import { api } from "../api/client";

export function useSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [exams,    setExams]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s,e] = await Promise.all([api.getSubjects(), api.getExams()]);
        setSubjects(s); setExams(e);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function addSubject(s) {
    try {
      const ns = await api.addSubject(s);
      setSubjects(p=>[...p,ns]); return null;
    } catch(e) { return e.message; }
  }

  async function removeSubject(id) {
    await api.deleteSubject(id);
    setSubjects(p=>p.filter(s=>s.id!==id));
  }

  async function addTopic(subjectId, name, difficulty="medium") {
    if (!name?.trim()) return;
    const nt = await api.addTopic(subjectId, { name:name.trim(), difficulty, status:"not_touched" });
    setSubjects(p=>p.map(s=>s.id===subjectId?{...s,topics:[...(s.topics||[]),nt]}:s));
  }

  async function removeTopic(subjectId, topicId) {
    await api.deleteTopic(subjectId, topicId);
    setSubjects(p=>p.map(s=>s.id===subjectId?{...s,topics:(s.topics||[]).filter(t=>t.id!==topicId)}:s));
  }

  async function updateTopicDifficulty(subjectId, topicId, difficulty) {
    await api.updateTopicDiff(subjectId, topicId, difficulty);
    setSubjects(p=>p.map(s=>s.id===subjectId?{...s,topics:(s.topics||[]).map(t=>t.id===topicId?{...t,difficulty}:t)}:s));
  }

  async function updateTopicStatus(subjectId, topicId, status) {
    await api.request?.("PUT", `/subjects/${subjectId}/topics/${topicId}/status`, { status });
    // use direct fetch as backup
    try {
      await fetch(`http://localhost:3001/api/subjects/${subjectId}/topics/${topicId}/status`, {
        method:"PUT",
        headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${localStorage.getItem("studyos_token")}` },
        body:JSON.stringify({ status }),
      });
    } catch(e){}
    setSubjects(p=>p.map(s=>s.id===subjectId?{...s,topics:(s.topics||[]).map(t=>t.id===topicId?{...t,status}:t)}:s));
  }

  async function updateLevel(subjectId, level) {
    await fetch(`http://localhost:3001/api/subjects/${subjectId}/level`, {
      method:"PUT",
      headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${localStorage.getItem("studyos_token")}` },
      body:JSON.stringify({ level }),
    });
    setSubjects(p=>p.map(s=>s.id===subjectId?{...s,student_level:level}:s));
  }

  async function updateDifficulty(subjectId, difficulty) {
    await api.updateDifficulty(subjectId, difficulty);
    setSubjects(p=>p.map(s=>s.id===subjectId?{...s,difficulty}:s));
  }

  async function addExam(e) {
    try { const ne=await api.addExam(e); setExams(p=>[...p,ne]); return null; }
    catch(err) { return err.message; }
  }

  async function removeExam(id) {
    await api.deleteExam(id);
    setExams(p=>p.filter(e=>e.id!==id));
  }

  async function toggleExamSubject(examId, subjectId, weight) {
    const result = await api.toggleExamSubject(examId, subjectId, weight);
    setExams(p=>p.map(e=>{
      if (e.id!==examId) return e;
      const ids=e.subjectIds||[];
      return {...e, subjectIds:result.linked?[...ids,subjectId]:ids.filter(id=>id!==subjectId)};
    }));
  }

  async function addSubExam(parentId, subExam) {
    try { const ns=await api.addSubExam(parentId,subExam); setExams(p=>p.map(e=>e.id===parentId?{...e,subExams:[...(e.subExams||[]),ns]}:e)); return null; }
    catch(e) { return e.message; }
  }

  async function removeSubExam(parentId, subExamId) {
    await api.deleteExam(subExamId);
    setExams(p=>p.map(e=>e.id===parentId?{...e,subExams:(e.subExams||[]).filter(s=>s.id!==subExamId)}:e));
  }

  return {
    subjects, exams, loading,
    addSubject, removeSubject, addTopic, removeTopic,
    updateTopicDifficulty, updateTopicStatus, updateLevel, updateDifficulty,
    addExam, removeExam, toggleExamSubject, addSubExam, removeSubExam,
  };
}
