/**
 * components/CalendarPicker.jsx
 * A clean inline calendar — no libraries needed, pure React.
 *
 * PROPS:
 *   value    — selected date string "YYYY-MM-DD" or ""
 *   onChange — called with "YYYY-MM-DD" when a date is picked
 *   minDate  — optional "YYYY-MM-DD", days before this are disabled
 */

import { useState } from "react";
import { DS } from "../constants/theme";

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const DAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function pad(n) { return String(n).padStart(2,"0"); }
function toStr(y,m,d) { return `${y}-${pad(m+1)}-${pad(d)}`; }

export default function CalendarPicker({ value, onChange, minDate }) {
  const today = new Date();
  const initDate = value ? new Date(value + "T00:00:00") : today;

  const [viewYear,  setViewYear]  = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());
  const [open,      setOpen]      = useState(false);

  const minD = minDate ? new Date(minDate + "T00:00:00") : today;
  minD.setHours(0,0,0,0);

  // Days in this view month
  const firstDay  = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Build grid — leading empty cells + day cells
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  function prev() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y-1); }
    else setViewMonth(m => m-1);
  }
  function next() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y+1); }
    else setViewMonth(m => m+1);
  }
  function pick(day) {
    const str = toStr(viewYear, viewMonth, day);
    onChange(str);
    setOpen(false);
  }

  const selectedStr = value || "";

  // Format for display button
  function displayVal() {
    if (!value) return "Pick a date";
    const d = new Date(value + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
  }

  return (
    <div style={{ position:"relative", display:"inline-block" }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "8px 12px",
          background: DS.surfaceAlt,
          border: `0.5px solid ${open ? DS.primary : DS.border}`,
          borderRadius: DS.r8,
          color: value ? DS.textPrimary : DS.textMuted,
          fontSize: 13, fontFamily: DS.fontBody,
          cursor: "pointer", display: "flex",
          alignItems: "center", gap: 8,
          transition: "border-color .15s",
        }}
      >
        <span style={{ fontSize: 14 }}>📅</span>
        {displayVal()}
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0,
          zIndex: 100, width: 260,
          background: DS.surface,
          border: `0.5px solid ${DS.border}`,
          borderRadius: DS.r12,
          padding: 14,
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
        }}>
          {/* Month navigation */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: 12 }}>
            <button onClick={prev} style={{ background:"none", border:"none", color:DS.textSecondary, cursor:"pointer", fontSize:16, padding:"2px 6px" }}>‹</button>
            <span style={{ fontSize:13, fontWeight:600, color:DS.textPrimary }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={next} style={{ background:"none", border:"none", color:DS.textSecondary, cursor:"pointer", fontSize:16, padding:"2px 6px" }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
            {DAYS_SHORT.map(d => (
              <div key={d} style={{ textAlign:"center", fontSize:10, fontWeight:600, color:DS.textMuted, padding:"3px 0" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const str      = toStr(viewYear, viewMonth, day);
              const disabled = new Date(str + "T00:00:00") < minD;
              const selected = str === selectedStr;
              const isToday  = str === toStr(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                <button
                  key={i}
                  onClick={() => !disabled && pick(day)}
                  disabled={disabled}
                  style={{
                    padding: "5px 0",
                    borderRadius: DS.r4,
                    border: isToday && !selected ? `0.5px solid ${DS.primary}` : "none",
                    background: selected ? DS.primary : "transparent",
                    color: disabled ? DS.textMuted
                         : selected ? "#fff"
                         : isToday  ? DS.primary
                         : DS.textPrimary,
                    fontSize: 12,
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.35 : 1,
                    fontFamily: DS.fontBody,
                    transition: "background .1s",
                  }}
                  onMouseEnter={e => { if(!disabled && !selected) e.target.style.background = DS.surfaceAlt; }}
                  onMouseLeave={e => { if(!selected) e.target.style.background = "transparent"; }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Clear button */}
          {value && (
            <button
              onClick={() => { onChange(""); setOpen(false); }}
              style={{ marginTop:10, width:"100%", padding:"6px 0", background:"none", border:`0.5px solid ${DS.border}`, borderRadius:DS.r8, color:DS.textMuted, fontSize:11, cursor:"pointer", fontFamily:DS.fontBody }}
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
}
