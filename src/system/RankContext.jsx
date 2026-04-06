import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client";

// E→D→C→B→A→S
export const RANKS = [
  { rank:"E", min:0,     max:500,   label:"E",  color:"#888" },
  { rank:"D", min:500,   max:1500,  label:"D",  color:"#4f6ef7" },
  { rank:"C", min:1500,  max:3000,  label:"C",  color:"#30d158" },
  { rank:"B", min:3000,  max:6000,  label:"B",  color:"#f5c842" },
  { rank:"A", min:6000,  max:10000, label:"A",  color:"#fb923c" },
  { rank:"S", min:10000, max:Infinity, label:"S", color:"#f06060" },
];

export function getRank(xp) {
  return RANKS.find(r => xp >= r.min && xp < r.max) || RANKS[0];
}

const RankCtx = createContext(null);

export function RankProvider({ children }) {
  const [totalXP,    setTotalXP]    = useState(0);
  const [showRankUp, setShowRankUp] = useState(false);
  const [newRank,    setNewRank]    = useState(null);

  useEffect(() => {
    api.getHistory().then(h => {
      const xp = h.reduce((a,b) => a + (b.xp_earned||0), 0);
      setTotalXP(xp);
    }).catch(() => {});
  }, []);

  function addXP(amount) {
    const prev = getRank(totalXP);
    setTotalXP(x => {
      const next = x + amount;
      const nextRank = getRank(next);
      if (nextRank.rank !== prev.rank) {
        setNewRank(nextRank);
        setShowRankUp(true);
      }
      return next;
    });
  }

  const rank = getRank(totalXP);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];
  const progress = nextRank
    ? ((totalXP - rank.min) / (nextRank.min - rank.min)) * 100
    : 100;

  return (
    <RankCtx.Provider value={{ totalXP, rank, nextRank, progress, addXP, showRankUp, setShowRankUp, newRank }}>
      {children}
    </RankCtx.Provider>
  );
}

export function useRank() {
  const ctx = useContext(RankCtx);
  if (!ctx) throw new Error("useRank must be inside RankProvider");
  return ctx;
}
