/**
 * pages/Timetable/WeeklyGrid.jsx
 * Visual 7-day grid showing busy slots and free time.
 * Each day is a column. Slots are positioned by time.
 *
 * PROPS:
 *   slots        — array of all slot objects
 *   getFreeSlots — function(day) → array of free slot objects
 *   onRemove     — function(id) called when trash icon clicked
 */

import { DS } from "../../constants/theme";
import { DAYS, SLOT_LABELS, WAKE_HOUR, SLEEP_HOUR } from "../../constants/timetable";

// Total minutes the grid covers (7am to 10pm = 15 hours = 900 mins)
const TOTAL_MINS = (SLEEP_HOUR - WAKE_HOUR) * 60;

// Convert "09:30" to a % position on the grid column
function timeToPercent(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const mins = h * 60 + m - WAKE_HOUR * 60;
  return (mins / TOTAL_MINS) * 100;
}

// Duration "09:00" to "12:00" as % of column height
function durationPercent(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return (mins / TOTAL_MINS) * 100;
}

// Find color for a slot label
function getLabelColor(label) {
  return SLOT_LABELS.find((l) => l.value === label)?.color || DS.primary;
}

// Format total free minutes as "Xh Ym"
function formatMins(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? m + "m" : ""}`.trim() : `${m}m`;
}

// Hour labels on the left axis
const HOUR_LABELS = Array.from(
  { length: SLEEP_HOUR - WAKE_HOUR + 1 },
  (_, i) => {
    const h = WAKE_HOUR + i;
    return { label: h <= 12 ? `${h}am` : `${h - 12}pm`, pct: (i / (SLEEP_HOUR - WAKE_HOUR)) * 100 };
  }
);

export default function WeeklyGrid({ slots, getFreeSlots, onRemove }) {
  const today = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];

  return (
    <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: DS.r16, overflow: "hidden" }}>

      {/* Header row — day names */}
      <div style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)", borderBottom: `1px solid ${DS.border}` }}>
        <div /> {/* empty corner */}
        {DAYS.map((day) => {
          const freeSlots = getFreeSlots(day);
          const freeMins  = freeSlots.reduce((a, s) => a + s.mins, 0);
          const isToday   = day === today;
          return (
            <div key={day} style={{
              padding: "12px 8px",
              textAlign: "center",
              borderLeft: `1px solid ${DS.border}`,
              background: isToday ? `${DS.primary}10` : "transparent",
            }}>
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: isToday ? DS.primary : DS.textSecondary,
                marginBottom: 3,
              }}>
                {day}
                {isToday && <span style={{ marginLeft: 4, fontSize: 9, color: DS.primary }}>●</span>}
              </div>
              {freeMins > 0 && (
                <div style={{ fontSize: 10, color: DS.success }}>
                  {formatMins(freeMins)} free
                </div>
              )}
              {freeMins === 0 && (
                <div style={{ fontSize: 10, color: DS.textMuted }}>full day</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grid body */}
      <div style={{ display: "grid", gridTemplateColumns: "44px repeat(7, 1fr)", height: 420 }}>

        {/* Time axis (left column) */}
        <div style={{ position: "relative", borderRight: `1px solid ${DS.border}` }}>
          {HOUR_LABELS.filter((_, i) => i % 2 === 0).map((hl) => (
            <div key={hl.label} style={{
              position: "absolute",
              top: `${hl.pct}%`,
              right: 6,
              fontSize: 9,
              color: DS.textMuted,
              transform: "translateY(-50%)",
              whiteSpace: "nowrap",
            }}>
              {hl.label}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((day) => {
          const daySlots  = slots.filter((s) => s.day === day);
          const freeSlots = getFreeSlots(day);
          const isToday   = day === today;

          return (
            <div key={day} style={{
              position: "relative",
              borderLeft: `1px solid ${DS.border}`,
              background: isToday ? `${DS.primary}05` : "transparent",
            }}>
              {/* Horizontal hour lines */}
              {HOUR_LABELS.map((hl) => (
                <div key={hl.label} style={{
                  position: "absolute",
                  top: `${hl.pct}%`,
                  left: 0, right: 0,
                  height: 1,
                  background: DS.border,
                  opacity: 0.4,
                }} />
              ))}

              {/* Free time blocks — green tint */}
              {freeSlots.map((fs, i) => (
                <div key={i} style={{
                  position: "absolute",
                  top:    `${timeToPercent(fs.start)}%`,
                  height: `${durationPercent(fs.start, fs.end)}%`,
                  left: 2, right: 2,
                  background: `${DS.success}10`,
                  borderLeft: `2px solid ${DS.success}40`,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  {fs.mins >= 60 && (
                    <span style={{ fontSize: 9, color: DS.success, opacity: 0.7 }}>
                      {formatMins(fs.mins)}
                    </span>
                  )}
                </div>
              ))}

              {/* Busy slot blocks */}
              {daySlots.map((slot) => {
                const color = getLabelColor(slot.label);
                return (
                  <div key={slot.id} style={{
                    position: "absolute",
                    top:    `${timeToPercent(slot.start)}%`,
                    height: `${durationPercent(slot.start, slot.end)}%`,
                    left: 2, right: 2,
                    background: `${color}22`,
                    border: `1px solid ${color}55`,
                    borderRadius: 4,
                    padding: "3px 5px",
                    overflow: "hidden",
                    cursor: "default",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color, lineHeight: 1.3 }}>
                      {slot.label}
                    </div>
                    <div style={{ fontSize: 9, color: DS.textMuted }}>
                      {slot.start}–{slot.end}
                    </div>
                    {/* Delete button — only visible on hover via inline trick */}
                    <button
                      onClick={() => onRemove(slot.id)}
                      title="Remove slot"
                      style={{
                        position: "absolute", top: 3, right: 3,
                        background: `${DS.danger}22`,
                        border: "none",
                        borderRadius: 3,
                        color: DS.danger,
                        fontSize: 9,
                        cursor: "pointer",
                        padding: "1px 4px",
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        borderTop: `1px solid ${DS.border}`,
        padding: "10px 16px",
        display: "flex",
        gap: 20,
        alignItems: "center",
      }}>
        {SLOT_LABELS.map((l) => (
          <div key={l.value} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color, opacity: 0.8 }} />
            <span style={{ fontSize: 11, color: DS.textSecondary }}>{l.value}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: DS.success, opacity: 0.5 }} />
          <span style={{ fontSize: 11, color: DS.textSecondary }}>Free time</span>
        </div>
      </div>
    </div>
  );
}
