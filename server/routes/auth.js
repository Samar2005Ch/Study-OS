const express = require("express");
const router  = express.Router();
const db      = require("../database");
const { hashPassword, comparePassword, createToken, requireAuth } = require("../auth");
const { sendOTP }                         = require("../mailer");
const { generateOTP, saveOTP, getOTP, deleteOTP } = require("../otpStore");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Step 1 — send OTP
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim())     return res.status(400).json({ error:"Name is required." });
  if (!emailRegex.test(email?.trim())) return res.status(400).json({ error:"Enter a valid email." });
  if (!password || password.length<6) return res.status(400).json({ error:"Password must be 6+ characters." });

  const existing = db.prepare("SELECT id FROM users WHERE email=?").get(email.toLowerCase());
  if (existing) return res.status(400).json({ error:"Account already exists with this email." });

  try {
    const passwordHash = await hashPassword(password);
    const otp          = generateOTP();
    saveOTP(email.toLowerCase(), otp, name.trim(), passwordHash);
    await sendOTP(email.toLowerCase(), otp, name.trim());
    res.json({ success:true, message:`OTP sent to ${email}`, email:email.toLowerCase() });
  } catch(e) {
    console.error("OTP send failed:", e.message);
    res.status(500).json({ error:"Failed to send email. Check server/mailer.js Gmail config." });
  }
});

// Step 2 — verify OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error:"Email and OTP required." });
  const pending = getOTP(email.toLowerCase());
  if (!pending)                       return res.status(400).json({ error:"OTP expired. Sign up again." });
  if (pending.otp !== String(otp).trim()) return res.status(400).json({ error:"Incorrect OTP." });

  try {
    const result = db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?,?,?)")
      .run(pending.name, email.toLowerCase(), pending.passwordHash);
    deleteOTP(email.toLowerCase());
    const token = createToken(result.lastInsertRowid, email.toLowerCase());
    res.json({ token, user:{ id:result.lastInsertRowid, name:pending.name, email:email.toLowerCase() } });
  } catch { res.status(400).json({ error:"Account already exists." }); }
});

// Resend OTP
router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;
  const pending = getOTP(email?.toLowerCase());
  if (!pending) return res.status(400).json({ error:"No pending signup. Start over." });
  const newOtp = generateOTP();
  saveOTP(email.toLowerCase(), newOtp, pending.name, pending.passwordHash);
  try {
    await sendOTP(email.toLowerCase(), newOtp, pending.name);
    res.json({ success:true });
  } catch { res.status(500).json({ error:"Failed to send email." }); }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error:"Email and password required." });
  if (!emailRegex.test(email.trim())) return res.status(400).json({ error:"Enter a valid email." });

  const user = db.prepare("SELECT * FROM users WHERE email=?").get(email.toLowerCase());
  if (!user) return res.status(400).json({ error:"No account with this email." });

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) return res.status(400).json({ error:"Incorrect password." });

  const token = createToken(user.id, user.email);
  res.json({ token, user:{ id:user.id, name:user.name, email:user.email, path:user.path } });
});

// Me
router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT id,name,email,path FROM users WHERE id=?").get(req.userId);
  if (!user) return res.status(404).json({ error:"User not found." });
  res.json(user);
});

module.exports = router;
