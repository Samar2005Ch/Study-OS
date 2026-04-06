const express = require("express");
const router  = express.Router();
const db      = require("../database");
const { requireAuth } = require("../auth");
router.use(requireAuth);

router.get("/", (req, res) => {
  res.json(db.prepare("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50").all(req.userId));
});

router.post("/", (req, res) => {
  const { title, body, type } = req.body;
  if (!title) return res.status(400).json({ error:"Title required." });
  const r = db.prepare("INSERT INTO notifications (user_id,title,body,type) VALUES (?,?,?,?)").run(req.userId, title, body||"", type||"info");
  res.json({ id:r.lastInsertRowid, success:true });
});

router.put("/:id/read", (req, res) => {
  db.prepare("UPDATE notifications SET read=1 WHERE id=? AND user_id=?").run(req.params.id, req.userId);
  res.json({ success:true });
});

router.delete("/:id", (req, res) => {
  db.prepare("DELETE FROM notifications WHERE id=? AND user_id=?").run(req.params.id, req.userId);
  res.json({ success:true });
});

module.exports = router;
