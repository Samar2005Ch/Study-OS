const express = require("express");
const router  = express.Router();
const db      = require("../database");
const { requireAuth } = require("../auth");
router.use(requireAuth);

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT key,value FROM user_settings WHERE user_id=?").all(req.userId);
  const s = {};
  rows.forEach(r => s[r.key] = r.value);
  res.json(s);
});

router.post("/", (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error:"Key required." });
  db.prepare("INSERT INTO user_settings (user_id,key,value) VALUES (?,?,?) ON CONFLICT(user_id,key) DO UPDATE SET value=?")
    .run(req.userId, key, value, value);
  res.json({ success:true, key, value });
});

module.exports = router;
