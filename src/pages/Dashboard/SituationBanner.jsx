/**
 * pages/Dashboard/SituationBanner.jsx
 *
 * Renders contextual smart banners at the top of the dashboard.
 * Each banner has: title, message, optional CTA, severity color.
 *
 * Severity: emergency | danger | warning | info | success
 */

import { useState } from "react";

const SEVERITY_CONFIG = {
  emergency: {
    bg:     "rgba(220, 38, 38, 0.12)",
    border: "#dc2626",
    title:  "#ff6b6b",
    icon:   "🚨",
    pulse:  true,
  },
  danger: {
    bg:     "rgba(239, 68, 68, 0.08)",
    border: "#ef4444",
    title:  "#f87171",
    icon:   "⚠️",
    pulse:  false,
  },
  warning: {
    bg:     "rgba(245, 158, 11, 0.08)",
    border: "#f59e0b",
    title:  "#fbbf24",
    icon:   "⚡",
    pulse:  false,
  },
  info: {
    bg:     "rgba(56, 189, 248, 0.06)",
    border: "#38bdf8",
    title:  "#7dd3fc",
    icon:   "💡",
    pulse:  false,
  },
  success: {
    bg:     "rgba(0, 198, 160, 0.08)",
    border: "#00c6a0",
    title:  "#00c6a0",
    icon:   "🔥",
    pulse:  false,
  },
};

function Banner({ banner, onDismiss, onAction }) {
  const cfg = SEVERITY_CONFIG[banner.severity] || SEVERITY_CONFIG.info;

  return (
    <div style={{
      display:      "flex",
      alignItems:   "flex-start",
      gap:          12,
      padding:      "14px 16px",
      background:   cfg.bg,
      borderLeft:   `3px solid ${cfg.border}`,
      borderRadius: "0 10px 10px 0",
      marginBottom: 10,
      position:     "relative",
      animation:    cfg.pulse ? "bannerPulse 2s ease-in-out infinite" : "none",
    }}>
      {/* Icon */}
      <div style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight:   700,
          fontSize:     13,
          color:        cfg.title,
          fontFamily:   "monospace",
          marginBottom: 4,
          letterSpacing: ".02em",
        }}>
          {banner.title}
        </div>
        <div style={{
          fontSize:   11,
          color:      "#888",
          fontFamily: "Inter, sans-serif",
          lineHeight: 1.5,
        }}>
          {banner.message}
        </div>

        {/* CTA */}
        {banner.action && banner.actionLabel && (
          <button
            onClick={() => onAction?.(banner)}
            style={{
              marginTop:   10,
              padding:     "6px 14px",
              background:  `${cfg.border}20`,
              border:      `1px solid ${cfg.border}50`,
              borderRadius: 6,
              color:        cfg.title,
              fontWeight:  700,
              fontSize:    10,
              cursor:      "pointer",
              fontFamily:  "monospace",
              letterSpacing: ".08em",
              transition:  "all .2s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${cfg.border}35`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `${cfg.border}20`;
            }}
          >
            {banner.actionLabel} →
          </button>
        )}
      </div>

      {/* Dismiss */}
      {banner.dismissible && (
        <button
          onClick={() => onDismiss?.(banner.id)}
          style={{
            position:   "absolute",
            top:        8,
            right:      10,
            background: "transparent",
            border:     "none",
            color:      "#555",
            cursor:     "pointer",
            fontSize:   14,
            padding:    4,
            lineHeight: 1,
          }}
          title="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function SituationBanner({ banners = [], onAction }) {
  const [dismissed, setDismissed] = useState([]);
  const visible = banners.filter(b => !dismissed.includes(b.id));

  if (!visible.length) return null;

  return (
    <>
      <style>{`
        @keyframes bannerEntry {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bannerPulse {
          0%, 100% { border-left-color: #dc2626; box-shadow: 0 0 5px rgba(220,38,38,0.1); }
          50%       { border-left-color: #ff6b6b; box-shadow: 0 0 15px rgba(220,38,38,0.3); }
        }
      `}</style>
      <div style={{ marginBottom: 20 }}>
        {visible.map(banner => (
          <div key={banner.id} style={{ animation: "bannerEntry 0.4s cubic-bezier(0.23, 1, 0.32, 1) both" }}>
            <Banner
              banner={banner}
              onDismiss={id => setDismissed(d => [...d, id])}
              onAction={onAction}
            />
          </div>
        ))}
      </div>
    </>
  );
}

