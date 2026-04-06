const nodemailer = require("nodemailer");

// ── CONFIG — change these ─────────────────────────────────────────
const GMAIL_USER = "samar2005chauhan@gmail.com";   // ← your Gmail
const GMAIL_PASS = "qrfspuybzfgdtkof"; // ← 16 char app password (no spaces)

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  tls: { rejectUnauthorized: false }, // Windows SSL fix
});

async function sendOTP(toEmail, otp, name) {
  if (GMAIL_USER === "your_gmail@gmail.com") {
    console.log(`\n\x1b[36m==================================================`);
    console.log(` ✉️  DEV MODE: Simulated Email Delivery `);
    console.log(`==================================================`);
    console.log(` To:      ${toEmail}`);
    console.log(` Subject: [ STUDYOS ] Your verification code`);
    console.log(` OTP:     \x1b[32m${otp}\x1b[36m`);
    console.log(`==================================================\x1b[0m\n`);
    return;
  }

  await transporter.sendMail({
    from: `"StudyOS" <${GMAIL_USER}>`,
    to: toEmail,
    subject: "[ STUDYOS ] Your verification code",
    html: `<div style="background:#07090f;padding:40px;font-family:monospace;color:#e8ecf4;max-width:480px;margin:0 auto">
      <div style="font-size:10px;color:#3a4060;letter-spacing:.14em;margin-bottom:8px">[ SYSTEM MESSAGE ]</div>
      <div style="font-size:22px;font-weight:900;color:#e8ecf4;margin-bottom:4px">STUDY<span style="color:#4f6ef7">OS</span></div>
      <div style="font-size:12px;color:#5a6070;margin-bottom:32px">Smart Study Scheduler</div>
      <div style="font-size:13px;color:#e8ecf4;margin-bottom:8px">Hello ${name},</div>
      <div style="font-size:12px;color:#5a6070;margin-bottom:24px">Your verification code:</div>
      <div style="background:#0a0c14;border-left:3px solid #4f6ef7;padding:20px;text-align:center;margin-bottom:24px">
        <div style="font-size:42px;font-weight:900;color:#4f6ef7;letter-spacing:.3em">${otp}</div>
        <div style="font-size:10px;color:#3a4060;margin-top:8px">Valid for 10 minutes</div>
      </div>
      <div style="font-size:11px;color:#3a4060">Do not share this code with anyone.</div>
    </div>`,
  });
}

module.exports = { sendOTP };
