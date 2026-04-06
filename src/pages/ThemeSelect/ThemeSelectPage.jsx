import { useState } from "react";
import { PATHS, savePath, getGroupedPaths } from "../../system/paths";
import { useRank } from "../../system/RankContext";

function ThemeCard({ path, isActive, onSelect }) {
  const isSelected = isActive;
  const pColor = path.rankColors["3"].primary;
  const sColor = path.rankColors["8"].primary;

  return (
    <div
      onClick={() => onSelect(path.id)}
      className={`gl hov ${isSelected ? 'neon' : ''}`}
      style={{
        padding: "24px 20px",
        cursor: "pointer",
        display: "flex", flexDirection: "column",
        gap: 12,
        transition: "all .3s cubic-bezier(0.4,0,0.2,1)",
        background: isSelected ? `${pColor}12` : "var(--glass-bg)",
        border: isSelected ? `2px solid ${pColor}` : "1px solid var(--glass-border)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `linear-gradient(135deg, ${pColor}, ${sColor})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, color: "#fff", fontWeight: 800,
          boxShadow: `0 8px 16px ${pColor}40`
        }}>
          {(path.character || "P").charAt(0)}
        </div>
        {isSelected && (
          <div className="badge badge-active">ACTIVE</div>
        )}
      </div>

      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
          {path.name}
        </div>
        <div className="label-tag" style={{ color: pColor, marginTop: 4 }}>
          {path.character.toUpperCase()}
        </div>
      </div>

      <div style={{ fontSize: 13, color: "var(--t2)", fontStyle: "italic", lineHeight: 1.4 }}>
        "{path.tagline}"
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {Object.values(path.rankColors).map((rc, i) => (
            <div key={i} style={{ flex: 1, height: 4, background: rc.primary, borderRadius: 2 }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="mono" style={{ fontSize: 9, color: "var(--t3)" }}>XP: {path.xpName.toUpperCase()}</span>
          <span className="mono" style={{ fontSize: 9, color: "var(--t3)" }}>LVL: 8 TIERS</span>
        </div>
      </div>

      <button 
        className="btn-primary" 
        style={{ 
          marginTop: 12, width: "100%", height: 36, fontSize: 12,
          background: isSelected ? "var(--green)" : pColor,
          opacity: isSelected ? 0.7 : 1
        }}
      >
        {isSelected ? "SYNCHRONIZED" : "INITIALIZE"}
      </button>
    </div>
  );
}

export default function ThemeSelectPage() {
  const { pathId } = useRank();
  const [selectedId, setSelectedId] = useState(pathId);
  const grouped = getGroupedPaths();

  const handleSelect = (id) => {
    setSelectedId(id);
    savePath(id);
    // Force reload to apply all global transformations
    window.location.reload();
  };

  return (
    <div className="page-enter" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ maxWidth: 800 }}>
        <div className="label-tag" style={{ color: "var(--a)", marginBottom: 8 }}>System Customization</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, letterSpacing: "-1px" }}>
          Path Synchronization
        </h1>
        <p style={{ color: "var(--t2)", lineHeight: 1.6 }}>
          Choose your thematic resonance. Each path provides a unique progression experience, 
          character-specific labeling, and dynamic visual evolution across 8 rank tiers.
        </p>
      </div>

      {Object.entries(grouped).map(([category, paths]) => (
        <div key={category} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ 
            display: "flex", alignItems: "center", gap: 12, 
            borderBottom: "1px solid var(--b1)", paddingBottom: 12 
          }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--t3)", letterSpacing: ".2em" }}>
              // {category.toUpperCase()}
            </div>
          </div>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
            gap: 20 
          }}>
            {paths.map(path => (
              <ThemeCard 
                key={path.id} 
                path={path} 
                isActive={path.id === pathId} 
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
