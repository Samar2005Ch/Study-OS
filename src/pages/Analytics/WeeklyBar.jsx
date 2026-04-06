/**
 * pages/Analytics/WeeklyBar.jsx
 * 7-day bar chart showing sessions per day. Pure SVG, no library.
 */
import { DS } from "../../constants/theme";

export default function WeeklyBar({ weekly }) {
  const maxMins = Math.max(...weekly.map(d => d.mins), 1);
  const H = 80; // bar max height px

  return (
    <div style={{ background:DS.surface, border:`0.5px solid ${DS.border}`, borderRadius:DS.r12, padding:"16px 20px" }}>
      <div style={{ fontSize:11, fontWeight:600, color:DS.textSecondary, marginBottom:14, letterSpacing:"0.06em", textTransform:"uppercase" }}>
        7-Day Activity
      </div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:H+32 }}>
        {weekly.map((day, i) => {
          const barH   = day.mins ? Math.max(4, Math.round((day.mins / maxMins) * H)) : 2;
          const color  = day.isToday ? DS.primary : day.done > 0 ? DS.primary+"88" : DS.border;
          return (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              {/* XP label on top */}
              {day.xp > 0 && (
                <div style={{ fontSize:9, color:"#a78bfa", fontFamily:DS.fontMono, whiteSpace:"nowrap" }}>
                  +{day.xp}
                </div>
              )}
              {/* Bar */}
              <div style={{
                width:"100%", height:barH,
                background:color,
                borderRadius:"3px 3px 0 0",
                transition:"height 0.8s ease",
                position:"relative",
              }}>
                {/* Ghost indicator */}
                {day.ghost > 0 && (
                  <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", fontSize:10 }}>
                    👻
                  </div>
                )}
              </div>
              {/* Mins label */}
              <div style={{ fontSize:9, color:DS.textMuted, fontFamily:DS.fontMono }}>
                {day.mins > 0 ? `${day.mins}m` : "—"}
              </div>
              {/* Day label */}
              <div style={{ fontSize:10, fontWeight: day.isToday?600:400, color:day.isToday?DS.primary:DS.textMuted }}>
                {day.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
