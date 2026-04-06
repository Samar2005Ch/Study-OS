import { DS } from "../../constants/theme";
export default function StatCard({ label, value, color }) {
  return (
    <div style={{ background: DS.surface, border: "1px solid " + DS.border, borderRadius: DS.r12, padding: "18px 20px" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: color, fontFamily: DS.fontMono, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: DS.textMuted }}>{label}</div>
    </div>
  );
}