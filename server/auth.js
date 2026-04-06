const jwt    = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = "studyos_secret_key_change_in_production";
const JWT_EXPIRY = "7d";

async function hashPassword(p)        { return bcrypt.hash(p, 10); }
async function comparePassword(p, h)  { return bcrypt.compare(p, h); }
function createToken(userId, email)   { return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn:JWT_EXPIRY }); }
function verifyToken(token)           { try { return jwt.verify(token, JWT_SECRET); } catch { return null; } }

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error:"Login required." });
  const decoded = verifyToken(header.split(" ")[1]);
  if (!decoded) return res.status(401).json({ error:"Invalid or expired token." });
  req.userId = decoded.userId;
  req.email  = decoded.email;
  next();
}

module.exports = { hashPassword, comparePassword, createToken, verifyToken, requireAuth };
