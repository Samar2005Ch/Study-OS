/**
 * pages/Dashboard/ExamCountdown.jsx
 * Shows upcoming exams with urgency-colored countdown.
 */
import { DS } from "../../constants/theme";

function daysUntil(d) {
  return Math.max(0, Math.ceil((new Date(d) - new Date()) / 86400000));
}
function urgColor(days) {
  return days < 7 ? DS.danger : days < 14 ? DS.warning : DS.success;
}

export default function ExamCountdown({ exams }) {
  if (!exams.length) return null;
  const sorted = [...exams].sort((a,b) => new Date(a.date)-new Date(b.date)).slice(0,3);
  return (
    <div style={{ display:"flex", gap:10, marginBottom:20 }}>
      {sorted.map(e => {
        const days = daysUntil(e.date);
        const c    = urgColor(days);
        return (
          <div key={e.id} style={{ flex:1, background:DS.surface, border:`0.5px solid ${c}25`, borderRadius:DS.r12, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:600, color:DS.textPrimary, fontSize:13 }}>{e.name}</div>
              <div style={{ fontSize:10, color:DS.textMuted, marginTop:2 }}>
                {new Date(e.date+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
              </div>
            </div>
            <div style={{ textAlign:"center", background:`${c}14`, border:`0.5px solid ${c}30`, borderRadius:DS.r8, padding:"8px 12px", minWidth:52 }}>
              <div style={{ fontSize:20, fontWeight:800, color:c, fontFamily:DS.fontMono }}>{days}</div>
              <div style={{ fontSize:9, color:DS.textMuted }}>days</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
