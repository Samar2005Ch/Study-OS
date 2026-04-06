/**
 * utils/xpEngine.js
 *
 * THE AUTHORITATIVE XP CALCULATION ENGINE
 * Everything feeds here. Every multiplier stacks.
 *
 * FORMULA:
 *   baseXP           = tabFocusSecs/60 × 4   (4 XP per real focused minute)
 *   typeMultiplier   = session type (deep 1.5×, practice 1.25×, etc.)
 *   integrityMult    = integrityScore / 100  (0 if score < threshold)
 *   difficultyBonus  = (difficulty / 5) × 0.3
 *   streakBonus      = min(streak, 10) × 0.05
 *   finalXP = baseXP × typeMultiplier × integrityMult × (1 + difficultyBonus + streakBonus)
 *
 * If session < 5 min → 0 XP, status = "attempted"
 */

import { computeIntegrityScore } from "../hooks/useIntegrityScore";

// ─── Session type definitions ──────────────────────────────────────
export const SESSION_TYPES = {
  deep: {
    id:           "deep",
    label:        "Deep Learning",
    icon:         "🧠",
    desc:         "Learning new concepts",
    workMins:     47,   // 45–50 min midpoint
    breakMins:    15,
    xpMultiplier: 1.5,
    minIntegrity: 80,
    color:        "#7c3aed",
    // Theme labels per path
    themeLabels: {
      shadow:  "Boss Raid Mode",
      saiyan:  "Hyperbolic Chamber",
      demon:   "Cursed Training",
      default: "Deep Session",
    },
  },
  practice: {
    id:           "practice",
    label:        "Practice",
    icon:         "✏️",
    desc:         "Solving problems",
    workMins:     27,
    breakMins:    5,
    xpMultiplier: 1.25,
    minIntegrity: 70,
    color:        "#2563eb",
    themeLabels: {
      shadow:  "Dungeon Raid",
      saiyan:  "Sparring Match",
      demon:   "Exorcism Round",
      default: "Practice Round",
    },
  },
  revision: {
    id:           "revision",
    label:        "Revision",
    icon:         "🔄",
    desc:         "Reviewing done topics",
    workMins:     17,
    breakMins:    5,
    xpMultiplier: 1.0,
    minIntegrity: 60,
    color:        "#0891b2",
    themeLabels: {
      shadow:  "Quick Quest",
      saiyan:  "Warm Up",
      demon:   "Ritual Recall",
      default: "Quick Review",
    },
  },
  emergency: {
    id:           "emergency",
    label:        "Emergency",
    icon:         "🚨",
    desc:         "Exam tomorrow cramming",
    workMins:     52,
    breakMins:    10,
    xpMultiplier: 2.0,
    minIntegrity: 85,
    color:        "#dc2626",
    urgentBorder: true,
    themeLabels: {
      shadow:  "Emergency Raid",
      saiyan:  "Ultra Instinct Mode",
      demon:   "Domain Expansion",
      default: "Emergency Mode",
    },
  },
  light: {
    id:           "light",
    label:        "Light",
    icon:         "☀️",
    desc:         "When tired or short on time",
    workMins:     12,
    breakMins:    3,
    xpMultiplier: 0.75,
    minIntegrity: 50,
    color:        "#d97706",
    themeLabels: {
      shadow:  "Maintenance Training",
      saiyan:  "Light Sparring",
      demon:   "Cursed Warmup",
      default: "Light Session",
    },
  },
};

export const SESSION_TYPE_LIST = Object.values(SESSION_TYPES);

// ─── Main XP calculator ────────────────────────────────────────────
/**
 * @param {Object} params
 *   tabFocusSecs  — actual tab-focused seconds (THE honest metric)
 *   sessionType   — "deep" | "practice" | "revision" | "emergency" | "light"
 *   difficulty    — 1–5 subject difficulty
 *   streak        — current streak in days
 *   integritySignals — { tabHideCount, inactivityCount, pauseCount, tabFocusSecs, plannedSecs }
 * @returns {Object} xp result with full breakdown
 */
export function calcXP({
  tabFocusSecs    = 0,
  sessionType     = "practice",
  difficulty      = 3,
  streak          = 0,
  integritySignals = {},
}) {
  const diffNum = isNaN(Number(difficulty)) ? 3 : Number(difficulty);
  const type = SESSION_TYPES[sessionType] || SESSION_TYPES.practice;

  // Under 5 min → 0 XP — not enough to count
  if (tabFocusSecs < 5 * 60) {
    return {
      xp:              0,
      status:          "attempted",
      baseXP:          0,
      typeMultiplier:  type.xpMultiplier,
      integrityScore:  0,
      integrityMult:   0,
      difficultyBonus: 0,
      streakBonus:     0,
      breakdown:       "Under 5 min — no XP awarded",
    };
  }

  // Compute integrity
  const integrity = computeIntegrityScore({
    ...integritySignals,
    tabFocusSecs,
    sessionType,
  });

  const integrityMult = integrity.xpMultiplier; // 0 if below threshold

  // Base XP: 4 XP per focused minute
  const focusedMins    = tabFocusSecs / 60;
  const baseXP         = focusedMins * 4;

  // Bonus multipliers
  const difficultyBonus = ((difficulty - 1) / 4) * 0.30; // 0% for difficulty 1, 30% for 5
  const streakBonus     = Math.min(streak, 10) * 0.05;    // 0.05 per streak day, max 0.5

  // Final XP
  const finalXP = Math.round(
    baseXP
    * type.xpMultiplier
    * integrityMult
    * (1 + difficultyBonus + streakBonus)
  );

  // Human-readable breakdown
  const parts = [
    `${Math.round(focusedMins)}m × 4`,
    `× ${type.xpMultiplier} (${type.label})`,
    `× ${Math.round(integrityMult * 100)}% integrity`,
  ];
  if (difficultyBonus > 0)
    parts.push(`+ ${Math.round(difficultyBonus * 100)}% difficulty`);
  if (streakBonus > 0)
    parts.push(`+ ${Math.round(streakBonus * 100)}% streak`);

  return {
    xp:              finalXP,
    status:          integrityMult === 0 ? "flagged" : "earned",
    baseXP:          Math.round(baseXP),
    typeMultiplier:  type.xpMultiplier,
    integrityScore:  integrity.score,
    integrityLabel:  integrity.label,
    integrityColor:  integrity.color,
    integrityMult,
    difficultyBonus: Math.round(difficultyBonus * 100),
    streakBonus:     Math.round(streakBonus * 100),
    breakdown:       parts.join(" "),
    reasons:         integrity.reasons,
  };
}

// ─── Session quality tier label ────────────────────────────────────
export function getSessionQualityLabel(integrityScore) {
  if (integrityScore >= 90) return { label: "Perfect Focus 🔥",   color: "#00c6a0" };
  if (integrityScore >= 75) return { label: "Good Focus ✅",      color: "#4ade80" };
  if (integrityScore >= 50) return { label: "Partial Focus ⚠️",  color: "#f59e0b" };
  if (integrityScore >= 25) return { label: "Low Integrity ❌",   color: "#f87171" };
  return                           { label: "Flagged 🚩",          color: "#ef4444" };
}

// ─── Format XP for display ─────────────────────────────────────────
export function fmtXP(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}
