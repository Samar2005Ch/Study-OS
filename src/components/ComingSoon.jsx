/**
 * components/ComingSoon.jsx
 * Placeholder shown on pages not built yet.
 * Removed step by step as each page gets real content.
 */

import { DS } from "../constants/theme";

export default function ComingSoon({ step, description, items = [] }) {
  return (
    <div style={{
      background: DS.surface,
      border: `1px dashed ${DS.border}`,
      borderRadius: DS.r16,
      padding: "48px 32px",
      textAlign: "center",
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 52, height: 52,
        background: `${DS.primary}12`,
        border: `1px solid ${DS.primary}25`,
        borderRadius: DS.r12,
        fontSize: 22, marginBottom: 16,
      }}>
        🚧
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, color: DS.textPrimary, marginBottom: 6 }}>
        Coming in Step {step}
      </div>

      <div style={{ fontSize: 13, color: DS.textSecondary, marginBottom: items.length ? 24 : 0 }}>
        {description}
      </div>

      {items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360, margin: "0 auto" }}>
          {items.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: DS.surfaceAlt,
              border: `1px solid ${DS.border}`,
              borderRadius: DS.r8,
              padding: "10px 14px",
              textAlign: "left",
            }}>
              <span style={{ color: DS.primary, fontSize: 13 }}>◎</span>
              <span style={{ fontSize: 12, color: DS.textSecondary }}>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
