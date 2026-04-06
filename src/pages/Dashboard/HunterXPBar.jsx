/**
 * pages/Dashboard/HunterXPBar.jsx
 * Solo Leveling-style XP bar + rank display.
 * E → D → C → B → A → S
 *
 * XP comes from completed study sessions (difficulty × minutes × 0.5)
 * Stored cumulatively in localStorage across all days.
 */
import { DS } from "../../constants/theme";

const RANKS = [
  { rank:"E", min:0,     max:500,   color:"#888780",  label:"Just started"  },
  { rank:"D", min:500,   max:1500,  color:"#3dd68c",  label:"Getting serious"},
  { rank:"C", min:1500,  max:3000,  color:"#5b8dee",  label:"Consistent"    },
  { rank:"B", min:3000,  max:6000,  color:"#a78bfa",  label:"Dedicated"     },
  { rank:"A", min:6000,  max:10000, color:"#f5a623",  label:"Elite"         },
  { rank:"S", min:10000, max:99999, color:"#f0544f",  label:"NIMCET Ready"  },
];

export function getRank(xp) {
  return RANKS.slice().reverse().find(r => xp >= r.min) || RANKS[0];
}

export function getNextRank(xp) {
  return RANKS.find(r => xp < r.max) || RANKS[RANKS.length-1];
}

export default function HunterXPBar({ totalXP, todayXP }) {
  const rank     = getRank(totalXP);
  const next     = getNextRank(totalXP);
  const pct      = next.rank === rank.rank
    ? 100
    : Math.round(((totalXP - rank.min) / (next.max - rank.min)) * 100);
  const toNext   = Math.max(0, next.max - totalXP);

  return (
    <div style={{
      background: DS.surface,
      border:`0.5px solid ${rank.color}30`,
      borderRadius:DS.r12,
      padding:"16px 20px",
      marginBottom:20,
    }}>
      {/* System label */}
      <div style={{ fontSize:10, color:DS.primary, fontFamily:DS.fontMono, letterSpacing:"0.1em", marginBottom:10 }}>
        [ HUNTER STATUS ]
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:16 }}>
        {/* Rank badge */}
        <div style={{
          width:48, height:48,
          borderRadius:DS.r12,
          background:`${rank.color}18`,
          border:`1px solid ${rank.color}50`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22, fontWeight:800,
          color:rank.color,
          fontFamily:DS.fontMono,
          flexShrink:0,
        }}>
          {rank.rank}
        </div>

        <div style={{ flex:1 }}>
          {/* Rank name + label */}
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:13, fontWeight:600, color:DS.textPrimary }}>
              Rank {rank.rank} · {rank.label}
            </span>
            <span style={{ fontSize:11, color:DS.textMuted, fontFamily:DS.fontMono }}>
              {totalXP.toLocaleString()} XP
            </span>
          </div>

          {/* XP bar */}
          <div style={{ height:6, background:DS.surfaceAlt, borderRadius:3, overflow:"hidden", marginBottom:5 }}>
            <div style={{
              height:"100%",
              width:`${Math.min(pct,100)}%`,
              background:`linear-gradient(90deg, ${rank.color}, ${rank.color}aa)`,
              borderRadius:3,
              transition:"width 1s ease",
            }}/>
          </div>

          {/* Progress text */}
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:DS.textMuted }}>
            <span style={{ color:DS.warning }}>+{todayXP} XP today</span>
            {rank.rank !== "S" && <span>{toNext.toLocaleString()} XP to Rank {next.rank}</span>}
            {rank.rank === "S" && <span style={{ color:rank.color }}>MAX RANK 🔥</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
