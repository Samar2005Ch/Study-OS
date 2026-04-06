/**
 * hooks/useIntegrityScore.js
 *
 * Computes a 0-100 integrity score for each session based on 4 signals:
 *
 *   Tab always visible?         +25
 *   No inactivity detected?     +25
 *   Completed in real time?     +25
 *   No suspicious patterns?     +25
 *
 * Score  → XP multiplier
 *  100   → 100% XP
 *   75   → 75%  XP  ⚠️
 *   50   → 50%  XP  ⚠️
 *  <50   → 0%   XP  ❌ + flagged
 *
 * Also computes the label and color for UI display.
 */

export const INTEGRITY_TIERS = [
  { min: 90, label: "Perfect Focus 🔥",    color: "#00c6a0", xpMult: 1.00 },
  { min: 75, label: "Good Focus ✅",       color: "#4ade80", xpMult: 0.90 },
  { min: 50, label: "Partial Focus ⚠️",   color: "#f59e0b", xpMult: 0.60 },
  { min: 25, label: "Low Integrity ❌",    color: "#f87171", xpMult: 0.25 },
  { min:  0, label: "No XP — Flagged 🚩",  color: "#ef4444", xpMult: 0.00 },
];

/**
 * Compute integrity from raw session signals.
 *
 * @param {Object} signals
 *   tabHideCount     — times tab was hidden
 *   inactivityCount  — times inactivity detected
 *   pauseCount       — manual pauses by user
 *   tabFocusSecs     — actual tab-focused seconds
 *   plannedSecs      — planned session duration
 *   wallSecs         — actual wall-clock seconds elapsed
 *   sessionType      — deep/practice/revision/emergency/light
 */
export function computeIntegrityScore({
  tabHideCount    = 0,
  inactivityCount = 0,
  pauseCount      = 0,
  tabFocusSecs    = 0,
  plannedSecs     = 1500,
  wallSecs        = 0,
  sessionType     = "practice",
} = {}) {
  let score = 100;
  const reasons = [];

  // ── Signal 1: Tab visibility (–25 if any tab hides) ─────────────
  if (tabHideCount === 0) {
    // Full 25 — tab was always visible
  } else if (tabHideCount <= 1) {
    score -= 12;
    reasons.push(`Tab hidden once`);
  } else {
    score -= 25;
    reasons.push(`Tab hidden ${tabHideCount}× — possible distraction`);
  }

  // ── Signal 2: Inactivity ─────────────────────────────────────────
  if (inactivityCount === 0) {
    // Full 25
  } else if (inactivityCount === 1) {
    score -= 12;
    reasons.push(`Inactivity detected once`);
  } else {
    score -= 25;
    reasons.push(`Inactivity detected ${inactivityCount}× — long idle periods`);
  }

  // ── Signal 3: Completion in real time ────────────────────────────
  // If tabFocusSecs is suspiciously far from wallSecs → penalise
  if (wallSecs > 60 && tabFocusSecs > 0) {
    const ratio = tabFocusSecs / wallSecs;
    if (ratio >= 0.85) {
      // Good — focused most of the wall time
    } else if (ratio >= 0.6) {
      score -= 12;
      reasons.push(`Focus ratio: ${Math.round(ratio * 100)}%`);
    } else {
      score -= 25;
      reasons.push(`Low focus ratio: ${Math.round(ratio * 100)}% of session was active`);
    }
  }

  // ── Signal 4: Suspicious patterns ───────────────────────────────
  // Excessive pauses or very short session marked as done
  let suspicion = 0;
  if (pauseCount >= 5)      { suspicion += 15; reasons.push(`${pauseCount} pauses detected`); }
  else if (pauseCount >= 3) { suspicion += 7; }

  if (tabFocusSecs < 5 * 60 && tabFocusSecs > 0) {
    suspicion += 10;
    reasons.push("Under 5 min focused");
  }

  score -= Math.min(25, suspicion); // cap at -25

  score = Math.max(0, Math.min(100, score));

  // ── Session type minimum threshold ──────────────────────────────
  const minimums = {
    deep:      80,
    practice:  70,
    revision:  60,
    emergency: 85,
    light:     50,
  };
  const minRequired = minimums[sessionType] || 60;
  const passesThreshold = score >= minRequired;

  // ── XP multiplier ──────────────────────────────────────────────
  const tier = INTEGRITY_TIERS.find(t => score >= t.min) || INTEGRITY_TIERS.at(-1);

  return {
    score,
    tier,
    label: tier.label,
    color: tier.color,
    xpMultiplier: passesThreshold ? tier.xpMult : 0,
    passesThreshold,
    minRequired,
    reasons,
    // Component breakdown for UI
    breakdown: {
      tabVisibility:    tabHideCount === 0    ? 25 : tabHideCount <= 1 ? 13 : 0,
      noInactivity:     inactivityCount === 0 ? 25 : inactivityCount === 1 ? 13 : 0,
      realTime:         score,   // approximation for display
      noSuspicion:      pauseCount < 3 && tabFocusSecs >= 5*60 ? 25 : 12,
    },
  };
}

/**
 * Hook version for use inside React components.
 * Pass session signals and get live integrity data.
 */
import { useMemo } from "react";

export function useIntegrityScore(signals) {
  return useMemo(() => computeIntegrityScore(signals), [
    signals?.tabHideCount,
    signals?.inactivityCount,
    signals?.pauseCount,
    signals?.tabFocusSecs,
    signals?.plannedSecs,
    signals?.sessionType,
  ]);
}
