/**
 * pages/Analytics/InsightCard.jsx
 * One AI insight message. Type = success | warning | danger | info
 */
import { DS } from "../../constants/theme";

const COLORS = {
  success: { bg:`${DS.success}0c`, border:`${DS.success}30`, text:DS.success, icon:"✦" },
  warning: { bg:`${DS.warning}0c`, border:`${DS.warning}30`, text:DS.warning, icon:"⚠" },
  danger:  { bg:`${DS.danger}0c`,  border:`${DS.danger}30`,  text:DS.danger,  icon:"👻" },
  info:    { bg:`#a78bfa0c`,       border:`#a78bfa30`,       text:"#a78bfa",  icon:"◎" },
};

export default function InsightCard({ type="info", msg }) {
  const c = COLORS[type] || COLORS.info;
  return (
    <div style={{
      display:"flex", gap:10, alignItems:"flex-start",
      padding:"10px 14px",
      background:c.bg,
      border:`0.5px solid ${c.border}`,
      borderLeft:`2px solid ${c.text}`,
      borderRadius:0,
      marginBottom:8,
    }}>
      <span style={{ color:c.text, fontSize:12, flexShrink:0, marginTop:1 }}>{c.icon}</span>
      <span style={{ fontSize:12, color:DS.textSecondary, lineHeight:1.6 }}>{msg}</span>
    </div>
  );
}
