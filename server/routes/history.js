const express = require("express");
const router  = express.Router();
const db      = require("../database");
const { requireAuth } = require("../auth");
router.use(requireAuth);

router.get("/", (req, res) => {
  const history = db.prepare("SELECT * FROM study_history WHERE user_id=? ORDER BY created_at DESC").all(req.userId);
  res.json(history);
});

router.post("/", (req, res) => {
  const { sourceType, sourceId, topic, plannedMins, actualMins, completed, skipped, ghosted, timeOfDay, xpEarned, scheduleDate } = req.body;
  const r = db.prepare(`
    INSERT INTO study_history (user_id,source_type,source_id,topic,planned_mins,actual_mins,completed,skipped,ghosted,time_of_day,xp_earned,schedule_date)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(req.userId, sourceType||"exam", sourceId||0, topic||"", plannedMins||0, actualMins||0, completed?1:0, skipped?1:0, ghosted?1:0, timeOfDay||"morning", xpEarned||0, scheduleDate||new Date().toISOString().split("T")[0]);
  res.json({ id:r.lastInsertRowid, success:true });
});

module.exports = router;
