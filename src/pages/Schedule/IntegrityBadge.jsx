/**
 * pages/Schedule/IntegrityBadge.jsx
 *
 * Shows live session integrity score with color-coded ring and label.
 * Appears during and after a session.
 */

import { INTEGRITY_TIERS } from "../../hooks/useIntegrityScore";

export default function IntegrityBadge({
  score,
  label,
  color,
  breakdown,
  reasons = [],
  compact = false,
  showBreakdown = false,
}) {
  const tier = INTEGRITY_TIERS.find(t => score >= t.min) || INTEGRITY_TIERS.at(-1);
  const displayColor = color || tier.color;

  if (compact) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "4px 10px",
        background: `${displayColor}12`,
        border: `1px solid ${displayColor}30`,
        borderRadius: 99,
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10, fontWeight: 700,
        color: displayColor,
      }}>
        <IntegrityRing score={score} color={displayColor} size={16} strokeWidth={2.5} />
        <span>Session Quality: {label || tier.label}</span>
      </div>
    );
  }

  return (
    <div style={{
      padding: "12px 14px",
      background: `${displayColor}08`,
      border: `1px solid ${displayColor}25`,
      borderRadius: 10,
      marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: showBreakdown ? 10 : 0 }}>
        <IntegrityRing score={score} color={displayColor} size={36} strokeWidth={3.5} />
        <div>
          <div style={{
            fontSize: 10, fontFamily: "JetBrains Mono, monospace",
            color: "#5a6070", letterSpacing: ".1em", marginBottom: 2,
          }}>
            SESSION QUALITY
          </div>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: displayColor, fontFamily: "Inter, sans-serif",
          }}>
            {score}% · {label || tier.label}
          </div>
        </div>
      </div>

      {/* Breakdown bars */}
      {showBreakdown && breakdown && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px" }}>
          {[
            { label: "Tab Focus",   val: breakdown.tabVisibility },
            { label: "No Idle",     val: breakdown.noInactivity },
            { label: "Real Time",   val: Math.round(score * 0.5) },
            { label: "No Abuse",    val: breakdown.noSuspicion },
          ].map(item => (
            <div key={item.label}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 9, color: "#444",
                fontFamily: "JetBrains Mono, monospace", marginBottom: 3,
              }}>
                <span>{item.label}</span>
                <span style={{ color: item.val >= 20 ? "#00c6a0" : "#f87171" }}>
                  +{item.val}/25
                </span>
              </div>
              <div style={{ height: 2, background: "#1c2030", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(item.val / 25) * 100}%`,
                  background: item.val >= 20 ? "#00c6a0" : item.val >= 12 ? "#f59e0b" : "#ef4444",
                  borderRadius: 99,
                  transition: "width 0.8s ease",
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Penalty reasons */}
      {showBreakdown && reasons.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {reasons.map((r, i) => (
            <div key={i} style={{
              fontSize: 9, color: "#f59e0b",
              fontFamily: "JetBrains Mono, monospace",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span>⚠</span> {r}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SVG ring ─────────────────────────────────────────────────────
function IntegrityRing({ score, color, size = 36, strokeWidth = 3.5 }) {
  const r    = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const cx   = size / 2;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#1c2030" strokeWidth={strokeWidth} />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease, stroke 0.3s" }}
      />
    </svg>
  );
}
