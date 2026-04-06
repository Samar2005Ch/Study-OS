const express = require("express");
const router = express.Router();
const db = require("../database");
const { requireAuth } = require("../auth");
router.use(requireAuth);

const GEMINI_KEY = "YOUR_GEMINI_API_KEY_HERE"; // replace this
const GEMINI_MODEL = "gemini-1.5-flash-8b";

router.get("/history", (req, res) => {
  const msgs = db.prepare("SELECT * FROM chat_messages WHERE user_id=? ORDER BY created_at ASC LIMIT 100").all(req.userId);
  res.json(msgs);
});

router.post("/", async (req, res) => {
  const { message, context } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "Message required." });

  // Save user message
  db.prepare("INSERT INTO chat_messages (user_id,role,content) VALUES (?,?,?)").run(req.userId, "user", message.trim());

  // Get recent history for context
  const recent = db.prepare("SELECT role,content FROM chat_messages WHERE user_id=? ORDER BY created_at DESC LIMIT 20").all(req.userId).reverse();

  const contents = recent.map(m => ({ role: m.role, parts: [{ text: m.content }] }));

  let systemTxt = "You are the StudyOS AI assistant. You help students prepare for competitive exams like NIMCET, MAH MCA CET, CUET PG. Be direct, focused, and helpful. No fluff.";
  if (context) {
    systemTxt += `\n\nCurrent student persona:\n- Path/Class: ${context.path}\n- Rank: ${context.rank} (${context.xp} XP)\n- Current Form: ${context.form}\n- Signature Move: ${context.move}\n\nINSTRUCTIONS: When generating your response, subtly adapt your tone to match their 'Path/Class'. Occasionally reference their 'Current Form' or 'Signature Move' when you motivate them or give them an insight. Don't be overly cheesy, just add flavor as a mentor to a warrior. Keep the advice highly practical.`;
  }

  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemTxt }] },
        contents,
      }),
    });
    const data = await r.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "System error. Try again.";
    db.prepare("INSERT INTO chat_messages (user_id,role,content) VALUES (?,?,?)").run(req.userId, "model", reply);
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: "AI unavailable." });
  }
});

module.exports = router;
