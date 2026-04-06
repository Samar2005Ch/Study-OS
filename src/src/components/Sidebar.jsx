/**
 * components/Sidebar.jsx
 * Left navigation panel. Reads NAV_ITEMS and highlights the active page.
 *
 * PROPS:
 *   activePage  — string ID of current page e.g. "dashboard"
 *   onNavigate  — function called with page ID when a link is clicked
 */

import { DS } from "../constants/theme";
import { NAV_ITEMS } from "../constants/navItems";
import Icon from "./Icon";

// Build progress — update `done: true` as each step is completed
const BUILD_STEPS = [
  { step: 1, label: "Shell & Layout",   done: true  },
  { step: 2, label: "Timetable Input",  done: true  },
  { step: 3, label: "Subjects & Exams", done: false },
  { step: 4, label: "AI Scheduler",     done: false },
  { step: 5, label: "Analytics",        done: false },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside style={{
      width: 220,
      minHeight: "100vh",
      background: DS.surface,
      borderRight: `1px solid ${DS.border}`,
      display: "flex",
      flexDirection: "column",
      padding: "0 0 24px",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 18px", borderBottom: `1px solid ${DS.border}`, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            background: `linear-gradient(135deg, ${DS.primary}, #7ba7f5)`,
            borderRadius: DS.r8,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17,
          }}>
            🧠
          </div>
          <div>
            <div style={{ fontFamily: DS.fontBody, fontWeight: 700, fontSize: 15, color: DS.textPrimary, letterSpacing: "-0.02em" }}>
              StudyOS
            </div>
            <div style={{ fontSize: 9, color: DS.textMuted, marginTop: 1 }}>Smart Scheduler</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "0 10px" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: "100%",
                display: "flex", alignItems: "center", gap: 11,
                padding: "10px 12px",
                borderRadius: DS.r8,
                border: "none",
                background: isActive ? `${DS.primary}18` : "transparent",
                cursor: "pointer",
                marginBottom: 2,
                textAlign: "left",
              }}
            >
              <Icon
                path={item.icon}
                size={17}
                color={isActive ? DS.primary : DS.textMuted}
                strokeWidth={isActive ? 2 : 1.6}
              />
              <span style={{
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? DS.primary : DS.textSecondary,
              }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: DS.primary }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Build progress tracker */}
      <div style={{ margin: "0 10px", padding: 14, background: DS.surfaceAlt, border: `1px solid ${DS.border}`, borderRadius: DS.r12 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: DS.textSecondary, marginBottom: 10 }}>
          Build Progress
        </div>
        {BUILD_STEPS.map((s) => (
          <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              background: s.done ? `${DS.success}20` : DS.border,
              border: `1px solid ${s.done ? DS.success : DS.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700,
              color: s.done ? DS.success : DS.textMuted,
              flexShrink: 0,
            }}>
              {s.done ? "✓" : s.step}
            </div>
            <span style={{ fontSize: 11, color: s.done ? DS.textSecondary : DS.textMuted, fontWeight: s.done ? 500 : 400 }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
