/**
 * system/ranks.js
 * Universal 8-Tier Rank system.
 */

export const RANKS = [
  { rank: "1", min: 0,     max: 500,   label: "Tier 1" },
  { rank: "2", min: 500,   max: 1500,  label: "Tier 2" },
  { rank: "3", min: 1500,  max: 3000,  label: "Tier 3" },
  { rank: "4", min: 3000,  max: 5000,  label: "Tier 4" },
  { rank: "5", min: 5000,  max: 7500,  label: "Tier 5" },
  { rank: "6", min: 7500,  max: 10000, label: "Tier 6" },
  { rank: "7", min: 10000, max: 15000, label: "Tier 7" },
  { rank: "8", min: 15000, max: 999999,label: "Tier 8" },
];

export function getRankData(xp) {
  return [...RANKS].reverse().find(r => xp >= r.min) || RANKS[0];
}

export function getNextRank(xp) {
  return RANKS.find(r => xp < r.max) || RANKS[RANKS.length - 1];
}

export function getRankProgress(xp) {
  const cur  = getRankData(xp);
  const next = getNextRank(xp);
  if (cur.rank === "8") return 100;
  return Math.round(((xp - cur.min) / (next.max - cur.min)) * 100);
}
