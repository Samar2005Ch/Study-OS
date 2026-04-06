const express = require("express");
const router  = express.Router();
const db      = require("../database");
const { requireAuth } = require("../auth");

router.use(requireAuth);

// Get all exams with subjects and topics
router.get("/", (req, res) => {
  const exams = db.prepare("SELECT * FROM exams WHERE user_id=? ORDER BY date").all(req.userId);
  const result = exams.map(e => ({
    ...e,
    subExams: db.prepare("SELECT * FROM sub_exams WHERE exam_id=?").all(e.id),
    subjects: db.prepare("SELECT * FROM exam_subjects WHERE exam_id=?").all(e.id).map(s => ({
      ...s,
      topics: db.prepare("SELECT * FROM exam_topics WHERE exam_subject_id=?").all(s.id),
    })),
  }));
  res.json(result);
});

// Add exam
router.post("/", (req, res) => {
  const { name, date } = req.body;
  if (!name?.trim()) return res.status(400).json({ error:"Name required." });
  if (!date)         return res.status(400).json({ error:"Date required." });
  const r = db.prepare("INSERT INTO exams (user_id,name,date) VALUES (?,?,?)").run(req.userId, name.trim(), date);
  res.json({ id:r.lastInsertRowid, user_id:req.userId, name:name.trim(), date, subExams:[], subjects:[] });
});

// Delete exam
router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM exams WHERE id=? AND user_id=?").run(req.params.id, req.userId);
  res.json({ success:true });
});

// Add sub-exam
router.post("/:id/subexams", (req, res) => {
  const { name, date } = req.body;
  if (!name?.trim() || !date) return res.status(400).json({ error:"Name and date required." });
  const exam = db.prepare("SELECT id FROM exams WHERE id=? AND user_id=?").get(req.params.id, req.userId);
  if (!exam) return res.status(403).json({ error:"Not your exam." });
  const r = db.prepare("INSERT INTO sub_exams (exam_id,name,date) VALUES (?,?,?)").run(req.params.id, name.trim(), date);
  res.json({ id:r.lastInsertRowid, exam_id:Number(req.params.id), name:name.trim(), date });
});

// Add subject to exam
router.post("/:id/subjects", (req, res) => {
  const { name, student_level, exam_weight, question_count, color, difficulty } = req.body;
  if (!name?.trim()) return res.status(400).json({ error:"Name required." });
  const exam = db.prepare("SELECT id FROM exams WHERE id=? AND user_id=?").get(req.params.id, req.userId);
  if (!exam) return res.status(403).json({ error:"Not your exam." });
  const r = db.prepare(
    "INSERT INTO exam_subjects (exam_id,name,student_level,exam_weight,question_count,color,difficulty) VALUES (?,?,?,?,?,?,?)"
  ).run(req.params.id, name.trim(), student_level||"not_started", exam_weight||"medium", question_count||25, color||"#4f6ef7", difficulty||3);
  res.json({ id:r.lastInsertRowid, exam_id:Number(req.params.id), name:name.trim(), student_level:student_level||"not_started", topics:[] });
});

// Update subject level
router.put("/subjects/:id", (req, res) => {
  const { student_level, exam_weight, question_count } = req.body;
  db.prepare("UPDATE exam_subjects SET student_level=COALESCE(?,student_level), exam_weight=COALESCE(?,exam_weight), question_count=COALESCE(?,question_count) WHERE id=?")
    .run(student_level, exam_weight, question_count, req.params.id);
  res.json({ success:true });
});

// Delete subject
router.delete("/subjects/:id", (req, res) => {
  db.prepare("DELETE FROM exam_subjects WHERE id=?").run(req.params.id);
  res.json({ success:true });
});

// Add topic to subject
router.post("/subjects/:id/topics", (req, res) => {
  const { name, difficulty } = req.body;
  if (!name?.trim()) return res.status(400).json({ error:"Name required." });
  const r = db.prepare("INSERT INTO exam_topics (exam_subject_id,name,difficulty) VALUES (?,?,?)")
    .run(req.params.id, name.trim(), difficulty||"medium");
  res.json({ id:r.lastInsertRowid, exam_subject_id:Number(req.params.id), name:name.trim(), difficulty:difficulty||"medium", status:"not_touched", progress:0 });
});

// Update topic progress
router.put("/topics/:id", (req, res) => {
  const { status, progress } = req.body;
  db.prepare("UPDATE exam_topics SET status=COALESCE(?,status), progress=COALESCE(?,progress) WHERE id=?")
    .run(status, progress, req.params.id);
  res.json({ success:true });
});

// Delete topic
router.delete("/topics/:id", (req, res) => {
  db.prepare("DELETE FROM exam_topics WHERE id=?").run(req.params.id);
  res.json({ success:true });
});

module.exports = router;
