const express = require("express");
const router  = express.Router();
const db      = require("../database");
const { requireAuth } = require("../auth");

router.use(requireAuth);

router.get("/", (req, res) => {
  const subjects = db.prepare("SELECT * FROM subjects WHERE user_id=? ORDER BY id").all(req.userId);
  const withTopics = subjects.map(s => ({
    ...s,
    topics: db.prepare("SELECT * FROM topics WHERE subject_id=? ORDER BY id").all(s.id),
  }));
  res.json(withTopics);
});

router.post("/", (req, res) => {
  const { name, color, difficulty, studentLevel } = req.body;
  if (!name?.trim()) return res.status(400).json({ error:"Name required." });
  try {
    const result = db.prepare(
      "INSERT INTO subjects (user_id,name,color,difficulty,student_level) VALUES (?,?,?,?,?)"
    ).run(req.userId, name.trim(), color||"#5b8dee", difficulty||3, studentLevel||"not_started");
    res.json({ id:result.lastInsertRowid, user_id:req.userId, name:name.trim(), color:color||"#5b8dee", difficulty:difficulty||3, student_level:studentLevel||"not_started", topics:[] });
  } catch(e) { res.status(400).json({ error:"Subject already exists." }); }
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM subjects WHERE id=? AND user_id=?").run(req.params.id, req.userId);
  res.json({ success:true });
});

// Update student level
router.put("/:id/level", (req, res) => {
  db.prepare("UPDATE subjects SET student_level=? WHERE id=? AND user_id=?")
    .run(req.body.level, req.params.id, req.userId);
  res.json({ success:true });
});

router.put("/:id/difficulty", (req, res) => {
  db.prepare("UPDATE subjects SET difficulty=? WHERE id=? AND user_id=?")
    .run(req.body.difficulty, req.params.id, req.userId);
  res.json({ success:true });
});

// Topics
router.post("/:id/topics", (req, res) => {
  const { name, difficulty, status } = req.body;
  if (!name?.trim()) return res.status(400).json({ error:"Topic name required." });
  const subject = db.prepare("SELECT id FROM subjects WHERE id=? AND user_id=?").get(req.params.id, req.userId);
  if (!subject) return res.status(403).json({ error:"Not your subject." });
  const result = db.prepare(
    "INSERT INTO topics (subject_id,name,difficulty,status) VALUES (?,?,?,?)"
  ).run(req.params.id, name.trim(), difficulty||"medium", status||"not_touched");
  res.json({ id:result.lastInsertRowid, subject_id:Number(req.params.id), name:name.trim(), difficulty:difficulty||"medium", status:status||"not_touched" });
});

router.delete("/:id/topics/:topicId", (req, res) => {
  db.prepare("DELETE FROM topics WHERE id=? AND subject_id=?").run(req.params.topicId, req.params.id);
  res.json({ success:true });
});

router.put("/:id/topics/:topicId/difficulty", (req, res) => {
  db.prepare("UPDATE topics SET difficulty=? WHERE id=? AND subject_id=?")
    .run(req.body.difficulty, req.params.topicId, req.params.id);
  res.json({ success:true });
});

// Update topic status
router.put("/:id/topics/:topicId/status", (req, res) => {
  db.prepare("UPDATE topics SET status=? WHERE id=? AND subject_id=?")
    .run(req.body.status, req.params.topicId, req.params.id);
  res.json({ success:true });
});

module.exports = router;
