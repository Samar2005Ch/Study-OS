import { useRank } from "../../system/RankContext";
import { getRank } from "../Dashboard/HunterXPBar"; 

export default function RankPreviewPage({ onNavigate }) {
  const { rank, totalXP, theme, pathId } = useRank();
  const c = rank.primary;

  // Generate all 8 ranks for this path to preview
  const allRanks = ["1", "2", "3", "4", "5", "6", "7", "8"].map(lvl => {
     const rc = theme.rankColors[lvl];
     return {
       level: lvl,
       name: rc.name,
       form: rc.formName,
       primary: rc.primary,
       active: rank.level === lvl,
       locked: parseInt(lvl) > parseInt(rank.level)
     };
  });

  return (
    <div className="page-enter" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div className="label-tag" style={{ color: c, marginBottom: 8 }}>Evolution Protocol</div>
          <h1 style={{ fontSize: 32, fontWeight: 950 }}>Rank Progression Matrix</h1>
        </div>
        <button className="btn-primary" onClick={() => onNavigate('themes')}>
          CHANGE CHARACTER PATH
        </button>
      </div>

      <div className="gl" style={{ padding: 40, display: "flex", alignItems: "center", gap: 40 }}>
        <div style={{ 
          width: 120, height: 120, borderRadius: "50%", background: rank.gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 60, fontWeight: 950, color: "#fff", border: `1px solid ${c}40`,
          boxShadow: `0 0 40px ${c}60`, animation: "hexGlow 4s infinite"
        }}>
          {rank.level}
        </div>
        <div>
          <div className="label-tag" style={{ color: c }}>CURRENT SYSTEM RESONANCE</div>
          <h2 style={{ fontSize: 36, fontWeight: 900, marginTop: 8 }}>{(rank?.name || "RANK").toUpperCase()} // {(rank?.formName || "BASE").toUpperCase()}</h2>
          <p className="mono" style={{ fontSize: 13, color: "var(--t3)", marginTop: 12 }}>
            Synchronization established at {totalXP} XP. Evolution to next tier initiated.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="mono" style={{ fontSize: 11, color: "var(--t3)", marginBottom: 8 }}>[ 8-TIER EVOLUTION BLUEPRINT ]</div>
        {allRanks.map((r, i) => (
          <div 
            key={r.level} 
            className={`gl ${r.active ? 'neon' : ''}`}
            style={{ 
              padding: "16px 24px", display: "flex", alignItems: "center", gap: 24,
              borderLeft: `4px solid ${r.primary}`,
              opacity: r.locked ? 0.3 : 1,
              background: r.active ? `${r.primary}12` : "var(--glass-bg)",
              transition: "all .3s"
            }}
          >
            <div style={{ 
              width: 32, height: 32, borderRadius: 8, background: `${r.primary}15`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 900, color: r.primary, border: `1px solid ${r.primary}30`
            }}>
              {r.level}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{(r.name || "RANK").toUpperCase()}</div>
              <div className="mono" style={{ fontSize: 10, color: r.primary, marginTop: 2 }}>{(r.form || "BASE FORM").toUpperCase()}</div>
            </div>

            {r.active && (
              <div className="badge badge-active" style={{ fontSize: 10 }}>ACTIVE</div>
            )}
            {r.locked && (
              <div className="mono" style={{ fontSize: 10, color: "var(--t3)" }}>[ LOCKED ]</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
