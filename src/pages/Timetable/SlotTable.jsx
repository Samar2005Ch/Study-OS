/**
 * pages/Timetable/SlotTable.jsx
 * Clean table — now shows 12hr AM/PM format in Time column.
 */

import { DS } from "../../constants/theme";
import { DAYS, SLOT_LABELS } from "../../constants/timetable";
import { fmt12 } from "../../hooks/useTimetable";

const TODAY = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
const toM = t => { const[h,m]=t.split(":").map(Number); return h*60+m; };

function durLabel(start, end) {
  const d = toM(end) - toM(start);
  const h = Math.floor(d/60), m = d%60;
  return h > 0 ? `${h}h${m ? " "+m+"m" : ""}` : `${m}m`;
}

function getColor(label) {
  return SLOT_LABELS.find(l => l.value === label)?.color || DS.primary;
}

const th = {
  padding:"9px 14px", fontSize:11, fontWeight:600,
  color:"#6468a0", letterSpacing:"0.06em",
  textTransform:"uppercase", textAlign:"left",
  background:"rgba(255,255,255,0.02)", borderBottom:`1px solid var(--b1)`,
  fontFamily: "monospace"
};
const td = { padding:"11px 14px", fontSize:13, color:"#e8ecf4", verticalAlign:"middle" };

export default function SlotTable({ slots, onRemove }) {
  if (slots.length === 0) return (
    <div className="gl" style={{ padding:"40px 0", textAlign:"center", fontSize:13, color:"#6468a0", fontFamily: "monospace" }}>
      [ NO SLOTS YET ]<br/>
      <span style={{ fontSize:10, display:"block", marginTop:6 }}>add your college and coaching hours above.</span>
    </div>
  );

  const sorted = [...slots].sort((a,b) =>
    DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || toM(a.start) - toM(b.start)
  );

  return (
    <div className="gl" style={{ overflow:"hidden" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr>
            <th style={th}>Day</th>
            <th style={th}>Type</th>
            <th style={th}>Time</th>
            <th style={th}>Duration</th>
            <th style={{ ...th, textAlign:"right" }}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((slot, i) => {
            const color  = getColor(slot.label);
            const isToday = slot.day === TODAY;
            const isLast  = i === sorted.length - 1;
            return (
              <tr className="hov" key={slot.id} style={{ borderBottom: isLast ? "none" : `1px solid var(--b1)` }}>
                <td style={td}>
                  <span style={{
                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                    padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600,
                    background: isToday ? `rgba(79,110,247,0.18)` : "rgba(255,255,255,0.04)",
                    color: isToday ? "#4f6ef7" : "#8090a8", fontFamily: "monospace"
                  }}>
                    {slot.day}
                  </span>
                </td>
                <td style={td}>
                  <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:color, marginRight:8, verticalAlign:"middle" }}/>
                  {slot.label}
                </td>
                <td style={{ ...td, fontFamily:"monospace", fontSize:12, color:"#8090a8" }}>
                  {fmt12(slot.start)} – {fmt12(slot.end)}
                </td>
                <td style={td}>
                  <span style={{ fontSize:10, color:"#8090a8", background:"rgba(255,255,255,0.04)", border:`1px solid var(--b1)`, borderRadius:20, padding:"3px 8px", fontFamily:"monospace" }}>
                    {durLabel(slot.start, slot.end)}
                  </span>
                </td>
                <td style={{ ...td, textAlign:"right" }}>
                  <button
                    onClick={() => onRemove(slot.id)}
                    style={{ background:"none", border:"none", color:DS.textMuted, cursor:"pointer", fontSize:14, padding:"2px 6px", borderRadius:DS.r4 }}
                    onMouseEnter={e => e.target.style.color = DS.danger}
                    onMouseLeave={e => e.target.style.color = DS.textMuted}
                  >✕</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
