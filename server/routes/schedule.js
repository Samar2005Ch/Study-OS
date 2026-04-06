const express = require("express");
const router  = express.Router();
const db      = require("../database");
const { requireAuth } = require("../auth");
const { buildSchedule, calcPreparationScore, getDayType, detectStudentType } = require("../scheduler");
const { getMessage, getSkipMessage, getGhostMessage } = require("../dialogue");

router.use(requireAuth);
const TODAY = () => new Date().toISOString().split("T")[0];

router.post("/generate", (req, res) => {
  const uid = req.userId;

  const exams = db.prepare("SELECT * FROM exams WHERE user_id=?").all(uid).map(e => ({
    ...e,
    subExams: db.prepare("SELECT * FROM sub_exams WHERE exam_id=?").all(e.id),
    subjects: db.prepare("SELECT * FROM exam_subjects WHERE exam_id=?").all(e.id).map(s => ({
      ...s,
      topics: db.prepare("SELECT * FROM exam_topics WHERE exam_subject_id=?").all(s.id),
    })),
  }));

  // Flatten exam subjects for scheduler
  const examSubjects = exams.flatMap(e =>
    (e.subjects||[]).map(s => ({ ...s, exam:e }))
  );

  const skills = db.prepare("SELECT * FROM skills WHERE user_id=?").all(uid).map(s => ({
    ...s,
    topics: db.prepare("SELECT * FROM skill_topics WHERE skill_id=?").all(s.id),
  }));

  const history        = db.prepare("SELECT * FROM study_history WHERE user_id=?").all(uid);
  const timetableSlots = db.prepare("SELECT * FROM timetable_slots WHERE user_id=?").all(uid);
  const getS = k => db.prepare("SELECT value FROM user_settings WHERE user_id=? AND key=?").get(uid,k)?.value;

  const wakeTime   = getS("wake_time")          || "07:00";
  const sleepTime  = getS("sleep_time")         || "22:00";
  const bestTime   = getS("best_time")          || null;
  const worstTime  = getS("worst_time")         || null;
  const dailyHours = parseInt(getS("daily_target_hours") || "6");

  if (!examSubjects.length && !skills.length) {
    return res.json({ tasks:[], message:"Add exams and subjects first." });
  }

  const tasks = buildSchedule({ examSubjects, skills, history, timetableSlots, wakeTime, sleepTime, bestTime, worstTime, dailyTargetHours:dailyHours });

  if (!tasks.length) return res.json({ tasks:[], message:"No free time found today." });

  db.prepare("DELETE FROM scheduled_tasks WHERE user_id=? AND schedule_date=? AND status IN ('pending', 'postponed', 'active')").run(uid, TODAY());

  const insert = db.prepare(`
    INSERT INTO scheduled_tasks
    (user_id,source_type,source_id,subject_name,topic,topic_diff,topic_status,
     color,start_time,end_time,duration_mins,break_mins,score,ai_reason,xp,
     day_type,student_type,topic_progress,expected_progress,status,schedule_date)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const insertAll = db.transaction(tasks => {
    for (const t of tasks) {
      insert.run(uid,t.source_type||"exam",t.source_id||0,t.subject_name||"",t.topic||"",
        t.topic_diff||"medium",t.topic_status||"not_touched",t.color||"#4f6ef7",
        t.start_time,t.end_time,t.duration_mins,t.break_mins||15,t.score||0,
        t.ai_reason||"",t.xp||0,t.day_type||"coverage",t.student_type||"unknown",
        t.topic_progress||0,t.expected_progress||25,"pending",TODAY());
    }
  });
  insertAll(tasks);

  const saved       = db.prepare("SELECT * FROM scheduled_tasks WHERE user_id=? AND schedule_date=? ORDER BY start_time").all(uid, TODAY());
  const userPath    = getS("path") || "shadow";
  const prepScore   = calcPreparationScore(examSubjects);
  const minDays     = exams.length ? Math.min(...exams.map(e => Math.max(0, Math.ceil((new Date(e.date)-new Date())/86400000)))) : 999;
  const dayType     = getDayType(minDays);
  const studentType = detectStudentType(history);
  const sysMsg      = getMessage(userPath, "scheduleGenerated", { n:saved.length });

  res.json({ tasks:saved, message:sysMsg||`${saved.length} sessions scheduled.`, prepScore, dayType, studentType });
});

router.get("/today", (req, res) => {
  const tasks = db.prepare("SELECT * FROM scheduled_tasks WHERE user_id=? AND schedule_date=? ORDER BY start_time").all(req.userId, TODAY());
  res.json(tasks);
});

router.put("/:id/status", (req, res) => {
  const { status, actualMins, ghostCount, locked, topicProgress } = req.body;

  if (status === "active") {
    const task = db.prepare("SELECT * FROM scheduled_tasks WHERE id=? AND user_id=?").get(req.params.id, req.userId);
    if (task && task.start_time) {
      const now = new Date();
      const stParts = task.start_time.split(":");
      const taskStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(stParts[0]), parseInt(stParts[1]));
      
      const diffMins = Math.round((now.getTime() - taskStart.getTime()) / 60000);
      
      // If drift is significant (5+ mins either early or late)
      if (Math.abs(diffMins) >= 5) {
        // Find tasks scheduled at or after this task's original start time
        const futureTasks = db.prepare("SELECT id, start_time, end_time FROM scheduled_tasks WHERE user_id=? AND schedule_date=? AND status IN ('pending','postponed')").all(req.userId, TODAY());
        const updateTime = db.prepare("UPDATE scheduled_tasks SET start_time=?, end_time=? WHERE id=?");
        
        function addMins(timeStr, mins) {
          if (!timeStr) return timeStr;
          const [h, m] = timeStr.split(":").map(Number);
          const date = new Date(2000, 1, 1, h, m + mins);
          return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        }

        db.transaction(() => {
          if (task.topic_diff === "hard" || task.locked || task.source_type === "exam") {
            // Highly important task: shift everything
            updateTime.run(addMins(task.start_time, diffMins), addMins(task.end_time, diffMins), task.id);
            for (const t of futureTasks) {
              updateTime.run(addMins(t.start_time, diffMins), addMins(t.end_time, diffMins), t.id);
            }
          } else {
            // Generic task: attempt to compress duration instead of cascading delay
            if (diffMins > 0) {
              // We are late, compress the current task to finish on original end_time if possible
              const curDur = task.duration_mins;
              if (curDur - diffMins >= 15) {
                // Compress duration
                db.prepare("UPDATE scheduled_tasks SET start_time=?, duration_mins=? WHERE id=?").run(addMins(task.start_time, diffMins), curDur - diffMins, task.id);
              } else {
                // Too much delay, have to shift
                updateTime.run(addMins(task.start_time, diffMins), addMins(task.end_time, diffMins), task.id);
                for (const t of futureTasks) {
                  updateTime.run(addMins(t.start_time, diffMins), addMins(t.end_time, diffMins), t.id);
                }
              }
            } else {
              // We are early, compress this task forward without touching queue, creating free gap!
              updateTime.run(addMins(task.start_time, diffMins), addMins(task.end_time, diffMins), task.id);
            }
          }
        })();
      }
    }
  }

  db.prepare("UPDATE scheduled_tasks SET status=?,actual_mins=?,ghost_count=?,locked=? WHERE id=? AND user_id=?")
    .run(status, actualMins||0, ghostCount||0, locked?1:0, req.params.id, req.userId);

  let systemMessage = null;

  if (status === "done" && topicProgress !== undefined) {
    const task = db.prepare("SELECT * FROM scheduled_tasks WHERE id=? AND user_id=?").get(req.params.id, req.userId);
    
    let finalProgress = topicProgress;
    if (task && task.source_type === "exam") {
      // ANTI-CHEAT check
      const isHard = task.topic_diff === "hard" || task.topic_diff === "medium" || task.topic_diff >= 3;
      if (topicProgress === 100 && actualMins <= 20 && isHard) {
        finalProgress = 85;
        systemMessage = "[ ANTI-CHEAT ALERT ] Mastery claimed impossibly fast. Progress capped at 85%. Verification review scheduled for tomorrow.";
      }

      const ts = finalProgress >= 100 ? "confident" : "in_progress";
      db.prepare("UPDATE exam_topics SET progress=?, status=? WHERE name=? AND exam_subject_id=?")
        .run(finalProgress, ts, task.topic, task.source_id);
    }
  }

  const userPath = db.prepare("SELECT value FROM user_settings WHERE user_id=? AND key='path'").get(req.userId)?.value || "shadow";

  if (!systemMessage) {
    if (status === "ghosted") {
      systemMessage = getGhostMessage(userPath, ghostCount||1);
    } else if (status === "skipped") {
      const todaySkips = db.prepare("SELECT COUNT(*) as c FROM study_history WHERE user_id=? AND skipped=1 AND schedule_date=?").get(req.userId, TODAY())?.c || 1;
      systemMessage = getSkipMessage(userPath, todaySkips);
    } else if (status === "completed" || status === "done") {
      systemMessage = getMessage(userPath, "sessionDone");
    }
  }

  res.json({ success:true, systemMessage });
});

router.post("/insert", (req, res) => {
  const { subject_name, topic, duration_mins, atTime } = req.body;
  const uid = req.userId;

  if (!subject_name || !duration_mins || !atTime) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  function addMins(timeStr, mins) {
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date(2000, 1, 1, h, m + mins);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  db.transaction(() => {
    // 1. Find all tasks for today starting at or after atTime
    const futureTasks = db.prepare("SELECT * FROM scheduled_tasks WHERE user_id=? AND schedule_date=? AND start_time >= ?")
      .all(uid, TODAY(), atTime);

    // 2. Shift them forward by duration_mins
    const updateTime = db.prepare("UPDATE scheduled_tasks SET start_time=?, end_time=? WHERE id=?");
    for (const t of futureTasks) {
      updateTime.run(addMins(t.start_time, duration_mins), addMins(t.end_time, duration_mins), t.id);
    }

    // 3. Insert the new task
    const endTime = addMins(atTime, duration_mins);
    db.prepare(`
      INSERT INTO scheduled_tasks (user_id, source_type, subject_name, topic, duration_mins, start_time, end_time, status, schedule_date, color, xp)
      VALUES (?, 'manual', ?, ?, ?, ?, ?, 'pending', ?, '#7000ff', 50)
    `).run(uid, subject_name, topic || "Manual Study", duration_mins, atTime, endTime, TODAY());
  })();

  const updatedTasks = db.prepare("SELECT * FROM scheduled_tasks WHERE user_id=? AND schedule_date=? ORDER BY start_time").all(uid, TODAY());
  res.json({ tasks: updatedTasks, message: "Task inserted. Schedule synchronized." });
});

module.exports = router;
