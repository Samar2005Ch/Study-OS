/**
 * pages/Dashboard/HunterProfile.jsx
 * The hunter status card — Solo Leveling system screen style.
 * Shows name, rank, XP bar with sparkle particles, stats.
 */

import { useRank } from "../../system/RankContext";
import { useStudyHistory } from "../../hooks/useStudyHistory";
import { useSubjects } from "../../hooks/useSubjects";

function calcStreak(history) {
  const dates = [...new Set(history.filter(h=>h.completed).map(h=>h.date))].sort().reverse();
  let streak = 0;
  for (let i = 0; i < dates.length; i++) {
    const d = new Date(); d.setDate(d.getDate()-i);
    if (dates[i] === d.toISOString().split("T")[0]) streak++;
    else break;
  }
  return streak;
}

export default function HunterProfile() {
  const { rank, nextRank, progress, totalXP } = useRank();
  const { history }  = useStudyHistory();
  const { subjects } = useSubjects();

  const totalMins  = history.filter(h=>h.completed).reduce((a,h)=>a+(h.actualMins||h.plannedMins||0),0);
  const streak     = calcStreak(history);
  const completion = history.length
    ? Math.round(history.filter(h=>h.completed).length/history.length*100)
    : 0;

  const toNext = rank.rank !== "S" ? nextRank.max - totalXP : 0;

  return (
    <div style={{
      background:"#0a0c14",
      border:`1px solid ${rank.primary}35`,
      borderRadius:16,
      padding:"20px 22px",
      marginBottom:20,
      boxShadow:`0 0 30px ${rank.glow}`,
      transition:"box-shadow 1s ease",
      position:"relative",
      overflow:"hidden",
    }}>
      {/* Background rank letter watermark */}
      <div style={{
        position:"absolute", right:-10, top:-20,
        fontSize:160, fontWeight:900,
        color:`${rank.primary}06`,
        fontFamily:"monospace",
        pointerEvents:"none",
        userSelect:"none",
        lineHeight:1,
      }}>
        {rank.rank}
      </div>

      {/* System label */}
      <div style={{ fontSize:10, color:rank.primary, fontFamily:"monospace", letterSpacing:"0.12em", marginBottom:14 }}>
        [ HUNTER STATUS ]
      </div>

      {/* Top row — badge + name + stats */}
      <div style={{ display:"flex", gap:16, alignItems:"flex-start", marginBottom:18 }}>
        {/* Rank badge */}
        <div style={{
          width:56, height:56,
          background:`${rank.primary}15`,
          border:`2px solid ${rank.primary}60`,
          borderRadius:12,
          display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0,
          animation:"rankPulse 3s ease infinite",
          boxShadow:`0 0 20px ${rank.glow}`,
        }}>
          <span style={{ fontSize:28, fontWeight:900, color:rank.primary, fontFamily:"monospace" }}>
            {rank.rank}
          </span>
        </div>

        <div style={{ flex:1 }}>
          <div style={{ fontSize:18, fontWeight:700, color:"#e8ecf4", fontFamily:"monospace", letterSpacing:"0.05em", marginBottom:2 }}>
            HUNTER
          </div>
          <div style={{ fontSize:11, color:rank.primary, fontFamily:"monospace", marginBottom:10 }}>
            {rank.label} · {rank.desc}
          </div>

          {/* Stats grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            {[
              { v:`${Math.floor(totalMins/60)}h`, l:"studied"    },
              { v:streak?`${streak}🔥`:"0",       l:"streak"     },
              { v:`${completion}%`,               l:"completion" },
              { v:subjects.length,                l:"subjects"   },
            ].map(s => (
              <div key={s.l} style={{ background:"#0d0f14", borderRadius:8, padding:"8px 6px", textAlign:"center", border:`0.5px solid ${rank.primary}15` }}>
                <div style={{ fontSize:16, fontWeight:700, color:rank.primary, fontFamily:"monospace" }}>{s.v}</div>
                <div style={{ fontSize:9,  color:"#3a4060", marginTop:2, fontFamily:"monospace" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* XP bar with sparkle */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:10, fontFamily:"monospace" }}>
          <span style={{ color:rank.primary }}>
            {totalXP.toLocaleString()} XP
          </span>
          <span style={{ color:"#3a4060" }}>
            {rank.rank !== "S" ? `${toNext.toLocaleString()} to Rank ${nextRank.rank}` : "MAX RANK"}
          </span>
        </div>
        <div style={{ height:8, background:"#1c2030", borderRadius:4, overflow:"hidden", position:"relative" }}>
          <div style={{
            height:"100%",
            width:`${progress}%`,
            background:rank.gradient,
            borderRadius:4,
            transition:"width 1.2s ease",
            position:"relative",
          }}>
            {/* Sparkle particles on bar */}
            {[...Array(3)].map((_,i) => (
              <div key={i} style={{
                position:"absolute",
                right: i*8, top:"50%",
                transform:"translateY(-50%)",
                width: 4-i, height: 4-i,
                borderRadius:"50%",
                background:"#fff",
                opacity: 1-i*0.3,
                boxShadow:`0 0 4px ${rank.primary}`,
                animation:`sparkle ${1+i*0.3}s ease infinite ${i*0.2}s`,
              }}/>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontSize:9, color:"#3a4060", fontFamily:"monospace" }}>
          <span>Rank {rank.rank}</span>
          {rank.rank !== "S" && <span>Rank {nextRank.rank}</span>}
        </div>
      </div>

      <style>{`
        @keyframes rankPulse {
          0%,100% { box-shadow: 0 0 16px var(--rank-glow); }
          50%      { box-shadow: 0 0 32px var(--rank-glow); }
        }
        @keyframes sparkle {
          0%,100% { opacity:0.9; transform:translateY(-50%) scale(1); }
          50%      { opacity:0.3; transform:translateY(-50%) scale(0.5); }
        }
      `}</style>
    </div>
  );
}
