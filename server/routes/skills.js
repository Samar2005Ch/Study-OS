const express = require("express");
const router  = express.Router();
const db      = require("../database");
const { requireAuth } = require("../auth");
router.use(requireAuth);

router.get("/", (req, res) => {
  const skills = db.prepare("SELECT * FROM skills WHERE user_id=? ORDER BY id").all(req.userId);
  res.json(skills.map(s => ({ ...s, topics:db.prepare("SELECT * FROM skill_topics WHERE skill_id=?").all(s.id) })));
});

router.post("/", (req, res) => {
  const { name, color } = req.body;
  if (!name?.trim()) return res.status(400).json({ error:"Name required." });
  const r = db.prepare("INSERT INTO skills (user_id,name,color) VALUES (?,?,?)").run(req.userId, name.trim(), color||"#2de2a0");
  res.json({ id:r.lastInsertRowid, name:name.trim(), color:color||"#2de2a0", topics:[] });
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM skills WHERE id=? AND user_id=?").run(req.params.id, req.userId);
  res.json({ success:true });
});

router.post("/:id/topics", (req, res) => {
  const { name, difficulty } = req.body;
  if (!name?.trim()) return res.status(400).json({ error:"Name required." });
  const r = db.prepare("INSERT INTO skill_topics (skill_id,name,difficulty) VALUES (?,?,?)").run(req.params.id, name.trim(), difficulty||"medium");
  res.json({ id:r.lastInsertRowid, skill_id:Number(req.params.id), name:name.trim(), difficulty:difficulty||"medium", status:"not_touched", progress:0 });
});

router.put("/topics/:id", (req, res) => {
  const { status, progress } = req.body;
  db.prepare("UPDATE skill_topics SET status=COALESCE(?,status), progress=COALESCE(?,progress) WHERE id=?").run(status, progress, req.params.id);
  res.json({ success:true });
});

module.exports = router;
