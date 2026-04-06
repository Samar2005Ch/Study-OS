/**
 * pages/Dashboard/InsightCards.jsx
 *
 * Displays up to 3 nightly insights.
 * Each card: WHAT + WHY + WHAT WE DID. Always actionable.
 */

import { useState } from "react";

const SEVERITY_STYLES = {
  success: { accent: "#00c6a0", bg: "rgba(0,198,160,0.06)",    icon: "✅" },
  info:    { accent: "#38bdf8", bg: "rgba(56,189,248,0.06)",   icon: "💡" },
  warning: { accent: "#f59e0b", bg: "rgba(245,158,11,0.06)",   icon: "⚡" },
  danger:  { accent: "#ef4444", bg: "rgba(239,68,68,0.06)",    icon: "🔴" },
  emergency:{ accent:"#dc2626", bg: "rgba(220,38,38,0.08)",    icon: "🚨" },
};

function InsightCard({ insight, index }) {
  const [expanded, setExpanded]     = useState(false);
  const style = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.info;

  return (
    <div
      style={{
        background:   style.bg,
        border:       `1px solid ${style.accent}25`,
        borderLeft:   `3px solid ${style.accent}`,
        borderRadius: "0 10px 10px 0",
        padding:      "14px 16px",
        cursor:       "pointer",
        transition:   "all 0.2s",
        position:     "relative",
        overflow:     "hidden",
      }}
      onClick={() => setExpanded(e => !e)}
      onMouseEnter={e => { e.currentTarget.style.background = `${style.accent}10`; }}
      onMouseLeave={e => { e.currentTarget.style.background = style.bg; }}
    >
      {/* Number tag */}
      <div style={{
        position:    "absolute",
        top:         10,
        right:       12,
        fontFamily:  "JetBrains Mono, monospace",
        fontSize:    9,
        color:       "#333",
      }}>
        INSIGHT {index + 1}/3
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: expanded ? 12 : 0 }}>
        <div style={{ fontSize: 18, flexShrink: 0 }}>{style.icon}</div>
        <div style={{ flex: 1 }}>
          {/* WHAT */}
          <div style={{
            fontWeight:   700,
            fontSize:     12,
            color:        "#e8ecf4",
            fontFamily:   "monospace",
            marginBottom: expanded ? 8 : 0,
            lineHeight:   1.4,
          }}>
            {insight.what}
          </div>

          {/* Expanded: WHY + ACTION */}
          {expanded && (
            <div style={{ animation: "fadeInDown 0.2s ease" }}>
              {insight.why && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 9, color: style.accent, fontFamily: "monospace", letterSpacing: ".1em", marginBottom: 3 }}>
                    WHY IT MATTERS
                  </div>
                  <div style={{ fontSize: 11, color: "#888", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>
                    {insight.why}
                  </div>
                </div>
              )}

              {insight.action_taken && (
                <div style={{
                  padding:    "8px 12px",
                  background: `${style.accent}12`,
                  borderRadius: 6,
                  borderLeft: `2px solid ${style.accent}`,
                }}>
                  <div style={{ fontSize: 9, color: style.accent, fontFamily: "monospace", letterSpacing: ".1em", marginBottom: 3 }}>
                    WHAT WE DID
                  </div>
                  <div style={{ fontSize: 11, color: "#c8d0e0", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>
                    {insight.action_taken}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expand hint */}
      {!expanded && (
        <div style={{
          fontSize:   9,
          color:      "#333",
          fontFamily: "monospace",
          marginLeft: 28,
          marginTop:  4,
        }}>
          tap to see WHY + WHAT WE DID →
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function InsightCards({ insights = [], loading = false }) {
  if (loading) {
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, color: "#5a6070", fontFamily: "monospace", letterSpacing: ".12em", marginBottom: 12 }}>
          GENERATING INSIGHTS...
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            height: 54, background: "rgba(255,255,255,0.02)", borderRadius: 10,
            marginBottom: 8, animation: "shimmer 1.5s ease infinite",
          }} />
        ))}
        <style>{`
          @keyframes shimmer {
            0%, 100% { opacity: 0.3; }
            50%       { opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  }

  if (!insights.length) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display:       "flex",
        justifyContent:"space-between",
        alignItems:    "center",
        marginBottom:  12,
      }}>
        <div style={{ fontSize: 10, color: "#5a6070", fontFamily: "monospace", letterSpacing: ".12em" }}>
          {insights.length} NEW INSIGHT{insights.length > 1 ? "S" : ""} · UPDATED TODAY
        </div>
        <div style={{ fontSize: 9, color: "#333", fontFamily: "monospace" }}>
          tap each to expand
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {insights.slice(0, 3).map((insight, i) => (
          <InsightCard key={insight.id || i} insight={insight} index={i} />
        ))}
      </div>
    </div>
  );
}
