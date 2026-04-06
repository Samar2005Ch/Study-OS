const express = require("express");
const router  = express.Router();
const db      = require("../database");
const { requireAuth } = require("../auth");
router.use(requireAuth);

const toMins = t => { const[h,m]=t.split(":").map(Number); return h*60+m; };

router.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM timetable_slots WHERE user_id=? ORDER BY day, start").all(req.userId));
});

router.post("/", (req, res) => {
  const { day, label, start, end } = req.body;
  if (!day||!label||!start||!end) return res.status(400).json({ error:"All fields required." });
  if (toMins(start) >= toMins(end)) return res.status(400).json({ error:"End must be after start." });
  const existing = db.prepare("SELECT * FROM timetable_slots WHERE user_id=? AND day=?").all(req.userId, day);
  const overlap  = existing.some(s => toMins(start)<toMins(s.end) && toMins(end)>toMins(s.start));
  if (overlap) return res.status(400).json({ error:"Overlaps with existing slot." });
  const r = db.prepare("INSERT INTO timetable_slots (user_id,day,label,start,end) VALUES (?,?,?,?,?)").run(req.userId,day,label,start,end);
  res.json({ id:r.lastInsertRowid, user_id:req.userId, day, label, start, end });
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM timetable_slots WHERE id=? AND user_id=?").run(req.params.id, req.userId);
  res.json({ success:true });
});

module.exports = router;
