/**
 * pages/Schedule/SessionTypeSelector.jsx
 *
 * Visual 5-type session picker with descriptions, durations, and XP multipliers.
 * Shows theme-aware labels based on user's chosen path.
 */

import { useRank } from "../../system/RankContext";
import { SESSION_TYPE_LIST } from "../../utils/xpEngine";

function fmt(mins) {
  return `${mins}m`;
}

export default function SessionTypeSelector({ selected, onChange, disabled = false }) {
  const { pathId } = useRank?.() || {};

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: 8,
      marginBottom: 20,
    }}>
      {SESSION_TYPE_LIST.map(type => {
        const active      = selected === type.id;
        const themeLabel  = type.themeLabels?.[pathId] || type.themeLabels?.default || type.label;
        const isEmergency = type.id === "emergency";

        return (
          <button
            key={type.id}
            onClick={() => !disabled && onChange(type.id)}
            disabled={disabled}
            title={`${type.desc} · ${fmt(type.workMins)} work / ${fmt(type.breakMins)} break · ${type.xpMultiplier}× XP`}
            style={{
              padding: "10px 6px",
              background: active
                ? `${type.color}18`
                : isEmergency && !active
                ? "rgba(220,38,38,0.04)"
                : "rgba(255,255,255,0.02)",
              border: active
                ? `1px solid ${type.color}60`
                : isEmergency
                ? "1px solid rgba(220,38,38,0.2)"
                : "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled && !active ? 0.4 : 1,
              transition: "all 0.2s",
              textAlign: "center",
              fontFamily: "Inter, sans-serif",
              position: "relative",
              animation: isEmergency && active ? "emergencyPulse 1.5s ease-in-out infinite" : "none",
            }}
            onMouseEnter={e => {
              if (!disabled && !active) {
                e.currentTarget.style.background = `${type.color}10`;
                e.currentTarget.style.borderColor = `${type.color}35`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={e => {
              if (!disabled && !active) {
                e.currentTarget.style.background = isEmergency ? "rgba(220,38,38,0.04)" : "rgba(255,255,255,0.02)";
                e.currentTarget.style.borderColor = isEmergency ? "rgba(220,38,38,0.2)" : "rgba(255,255,255,0.06)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {/* Active indicator */}
            {active && (
              <div style={{
                position: "absolute", top: 5, right: 5,
                width: 5, height: 5,
                background: type.color, borderRadius: "50%",
                boxShadow: `0 0 6px ${type.color}`,
              }} />
            )}

            {/* Icon */}
            <div style={{ fontSize: 18, marginBottom: 5 }}>{type.icon}</div>

            {/* Label */}
            <div style={{
              fontSize: 9,
              fontWeight: 700,
              color: active ? type.color : "#efefef",
              marginBottom: 3,
              letterSpacing: ".04em",
              lineHeight: 1.3,
            }}>
              {type.label.toUpperCase()}
            </div>

            {/* Theme label */}
            <div style={{
              fontSize: 8,
              color: active ? `${type.color}cc` : "#333",
              marginBottom: 4,
              fontStyle: "italic",
            }}>
              {themeLabel}
            </div>

            {/* Duration pill */}
            <div style={{
              display: "inline-block",
              padding: "2px 6px",
              background: active ? `${type.color}20` : "rgba(255,255,255,0.04)",
              borderRadius: 99,
              fontSize: 8,
              color: active ? type.color : "#555",
              fontWeight: 700,
              marginBottom: 3,
            }}>
              {fmt(type.workMins)}
            </div>

            {/* XP multiplier */}
            <div style={{
              fontSize: 9,
              color: active ? type.color : "#444",
              fontWeight: 800,
              fontFamily: "JetBrains Mono, monospace",
            }}>
              {type.xpMultiplier}×
            </div>
          </button>
        );
      })}

      <style>{`
        @keyframes emergencyPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(220,38,38,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(220,38,38,0); }
        }
      `}</style>
    </div>
  );
}
