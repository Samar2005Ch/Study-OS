/**
 * pages/Analytics/ExamReadiness.jsx
 *
 * Shows per-subject exam readiness bars:
 *   Physics  [████████░░] 78%  ✅ Will be ready
 *   Maths    [███░░░░░░░] 23%  ❌ Need immediate action
 */

function ReadinessBar({ subject, compact = false }) {
  const { readiness, projectedReadiness, name, color, daysLeft, status } = subject;

  const statusConfig = {
    ready:    { color: "#00c6a0", icon: "✅", label: "On track" },
    at_risk:  { color: "#f59e0b", icon: "⚠️", label: "At risk" },
    critical: { color: "#ef4444", icon: "❌", label: "Needs action" },
  };
  const sc = statusConfig[status] || statusConfig.at_risk;

  if (compact) {
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "monospace", marginBottom: 4 }}>
          <span style={{ color: "#e8ecf4", fontWeight: 700 }}>{name}</span>
          <span style={{ color: sc.color }}>{sc.icon} {readiness}%</span>
        </div>
        <div style={{ height: 4, background: "#1c2030", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${readiness}%`,
            background: sc.color,
            borderRadius: 99,
            transition: "width 1s ease",
            boxShadow: `0 0 8px ${sc.color}60`,
          }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding:    "14px 16px",
      background: `${sc.color}06`,
      border:     `1px solid ${sc.color}20`,
      borderLeft: `3px solid ${sc.color}`,
      borderRadius: "0 10px 10px 0",
      marginBottom: 10,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, background: color || sc.color, borderRadius: "50%" }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: "#e8ecf4", fontFamily: "monospace" }}>
            {name}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "#5a6070", fontFamily: "monospace" }}>
            {daysLeft !== null ? `${daysLeft}d left` : "No exam set"}
          </span>
          <span style={{ fontSize: 10, color: sc.color, fontWeight: 700, fontFamily: "monospace" }}>
            {sc.icon} {sc.label}
          </span>
        </div>
      </div>

      {/* Readiness bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontFamily: "monospace", color: "#5a6070", marginBottom: 4 }}>
          <span>Current</span>
          <span style={{ color: sc.color, fontWeight: 700 }}>{readiness}%</span>
        </div>
        <div style={{ height: 6, background: "#1c2030", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${readiness}%`,
            background: sc.color,
            borderRadius: 99,
            transition: "width 1.2s ease",
            boxShadow: `0 0 10px ${sc.color}60`,
          }} />
        </div>
      </div>

      {/* Projected */}
      {projectedReadiness > readiness && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontFamily: "monospace", color: "#5a6070", marginBottom: 4 }}>
            <span>Projected (at current pace)</span>
            <span style={{ color: projectedReadiness >= 70 ? "#00c6a0" : "#f59e0b", fontWeight: 700 }}>
              {projectedReadiness}% {projectedReadiness >= 70 ? "✅" : "⚠️"}
            </span>
          </div>
          <div style={{ height: 3, background: "#1c2030", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${projectedReadiness}%`,
              background: projectedReadiness >= 70 ? "#00c6a044" : "#f59e0b44",
              borderRadius: 99,
              transition: "width 1.5s ease",
            }} />
          </div>
        </div>
      )}

      {/* Action hint for critical */}
      {status === "critical" && daysLeft !== null && daysLeft <= 14 && (
        <div style={{
          marginTop:  8,
          fontSize:   10,
          color:      "#ef4444",
          fontFamily: "monospace",
        }}>
          {daysLeft <= 3
            ? `⚡ ${daysLeft} days left — emergency sessions activated`
            : `Add ${Math.ceil((70 - readiness) / 5)} more sessions to reach safe zone`}
        </div>
      )}
    </div>
  );
}

export default function ExamReadiness({ subjects = [], compact = false }) {
  if (!subjects.length) return null;

  const sorted = [...subjects].sort((a, b) => {
    // Sort: critical first, then by days left
    const order = { critical: 0, at_risk: 1, ready: 2 };
    const oa = order[a.status] ?? 1, ob = order[b.status] ?? 1;
    if (oa !== ob) return oa - ob;
    return (a.daysLeft || 999) - (b.daysLeft || 999);
  });

  return (
    <div>
      {!compact && (
        <div style={{ fontSize: 10, color: "#5a6070", fontFamily: "monospace", letterSpacing: ".12em", marginBottom: 12 }}>
          EXAM READINESS
        </div>
      )}
      {sorted.map(s => (
        <ReadinessBar key={s.id || s.name} subject={s} compact={compact} />
      ))}
    </div>
  );
}
