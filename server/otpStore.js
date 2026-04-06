const store = new Map();
const OTP_EXPIRY_MS = 10 * 60 * 1000;

function generateOTP() { return String(Math.floor(100000 + Math.random()*900000)); }
function saveOTP(email, otp, name, passwordHash) {
  store.set(email.toLowerCase(), { otp, name, passwordHash, expiresAt:Date.now()+OTP_EXPIRY_MS });
}
function getOTP(email) {
  const e = store.get(email?.toLowerCase());
  if (!e) return null;
  if (Date.now() > e.expiresAt) { store.delete(email.toLowerCase()); return null; }
  return e;
}
function deleteOTP(email) { store.delete(email?.toLowerCase()); }

module.exports = { generateOTP, saveOTP, getOTP, deleteOTP };
