/**
 * pages/Timetable/WeekMiniGrid.jsx
 * Compact 7-column mini overview — one column per day.
 * Shows slot chips + free time label. Purely visual, not interactive.
 */

import { DS } from "../../constants/theme";
import { DAYS, SLOT_LABELS } from "../../constants/timetable";

const TODAY = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
const toM = t => { const[h,m]=t.split(":").map(Number); return h*60+m; };

function fmtMins(m) {
  return m >= 60 ? `${Math.floor(m/60)}h${m%60 ? " "+m%60+"m" : ""}` : `${m}m`;
}

function getTypeColors(label) {
  const map = {
    College:  { bg:"rgba(79,110,247,0.14)", text:"#8496ff" },
    Coaching: { bg:"rgba(240,96,96,0.14)", text:"#ff8c42" },
    Other:    { bg:"rgba(155,109,255,0.14)", text:"#e040fb" },
  };
  return map[label] || { bg: "rgba(255,255,255,0.05)", text: "#8090a8" };
}

export default function WeekMiniGrid({ slots, getFreeSlots }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:8, marginTop:24 }}>
      {DAYS.map(day => {
        const daySlots = [...slots.filter(s => s.day === day)]
          .sort((a,b) => toM(a.start) - toM(b.start));
        const free     = getFreeSlots(day);
        const freeMins = free.reduce((a,s) => a + s.mins, 0);
        const isToday  = day === TODAY;

        return (
          <div
            className="gl hov"
            key={day}
            style={{
              border: `1px solid ${isToday ? "#4f6ef7" : "var(--b1)"}`,
              overflow:"hidden",
            }}
          >
            {/* Column header */}
            <div style={{
              padding:"7px 8px",
              textAlign:"center",
              background: isToday ? `rgba(79,110,247,0.12)` : "rgba(255,255,255,0.02)",
              borderBottom:`1px solid ${isToday ? "rgba(79,110,247,0.4)" : "var(--b1)"}`,
            }}>
              <div style={{
                fontSize:11, fontWeight:700, fontFamily: "monospace",
                color: isToday ? "#4f6ef7" : "#8090a8",
              }}>
                {day}
              </div>
              {freeMins > 0
                ? <div style={{ fontSize:10, color: "#00c6a0", marginTop:1, fontFamily: "monospace" }}>{fmtMins(freeMins)}</div>
                : <div style={{ fontSize:10, color: "#5a6070", marginTop:1, fontFamily: "monospace" }}>—</div>
              }
            </div>

            {/* Slot chips */}
            <div style={{ padding:6, display:"flex", flexDirection:"column", gap:4, minHeight:72 }}>
              {daySlots.map(s => {
                const { bg, text } = getTypeColors(s.label);
                return (
                  <div key={s.id} style={{
                    background: bg, borderRadius:4,
                    padding:"3px 6px",
                  }}>
                    <div style={{ fontSize:10, fontWeight:600, color:text, fontFamily:"monospace" }}>{s.label}</div>
                    <div style={{ fontSize:9, color:text, opacity:.7, fontFamily: "monospace" }}>
                      {s.start}–{s.end}
                    </div>
                  </div>
                );
              })}
              {freeMins > 0 && (
                <div style={{
                  borderRadius:4, padding:"3px 6px",
                  background:`rgba(0,198,160,0.1)`,
                }}>
                  <div style={{ fontSize:10, color: "#00c6a0", fontFamily:"monospace" }}>{fmtMins(freeMins)} free</div>
                </div>
              )}
              {daySlots.length === 0 && freeMins === 0 && (
                <div style={{ fontSize:10, color: "#5a6070", padding:"4px 2px", fontFamily: "monospace" }}>[ Empty ]</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
