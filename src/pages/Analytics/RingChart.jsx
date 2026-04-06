/**
 * pages/Analytics/RingChart.jsx
 * Simple SVG ring/donut chart. No library needed.
 */
import { DS } from "../../constants/theme";

export default function RingChart({ pct, size=96, stroke=8, color=DS.primary, label, sublabel }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={DS.surfaceAlt} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - Math.min(pct,100) / 100)}
          strokeLinecap="round"
          style={{ transition:"stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        {label   && <div style={{ fontSize: size>80?18:13, fontWeight:700, color, fontFamily:DS.fontMono }}>{label}</div>}
        {sublabel && <div style={{ fontSize:9, color:DS.textMuted, marginTop:1 }}>{sublabel}</div>}
      </div>
    </div>
  );
}
