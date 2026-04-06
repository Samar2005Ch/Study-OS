/**
 * StudyCalendar.jsx
 *
 * Two views:
 *   1. Heatmap   — full year GitHub-style, streak visible as chain
 *   2. Monthly   — single month, session details per day
 *
 * Shows:
 *   - Which days studied (color intensity = minutes studied)
 *   - Streak as connected colored chain
 *   - Hover: date, sessions, minutes, XP
 *   - Click any day: see that day's sessions
 */

import { useState, useMemo } from "react";

// ── Color scale ───────────────────────────────────────────────────
function getDayColor(mins, pathColor="#4f6ef7") {
  if (!mins || mins === 0) return "rgba(255,255,255,0.04)";
  if (mins < 30)  return `${pathColor}25`;
  if (mins < 60)  return `${pathColor}45`;
  if (mins < 120) return `${pathColor}70`;
  if (mins < 180) return `${pathColor}90`;
  return pathColor;
}

function getDayBorder(mins, isStreak, pathColor="#4f6ef7") {
  if (isStreak && mins > 0) return `1px solid ${pathColor}55`;
  if (mins > 0) return `1px solid rgba(255,255,255,0.06)`;
  return "1px solid transparent";
}

// ── Build calendar data from history ────────────────────────────
function buildCalendarData(history) {
  // history: [{ date:"2025-03-15", completed:1, duration_mins:90, xp_earned:67 }, ...]
  const map = {};
  for (const h of (history||[])) {
    const d = h.schedule_date || h.date;
    if (!d) continue;
    if (!map[d]) map[d] = { mins:0, sessions:0, xp:0, completed:0 };
    map[d].mins     += h.actual_mins || h.duration_mins || 0;
    map[d].sessions += 1;
    map[d].xp       += h.xp_earned || 0;
    if (h.completed === 1) map[d].completed += 1;
  }
  return map;
}

// ── Calculate streak chain ────────────────────────────────────────
function calcStreakDates(dayMap) {
  const streakDates = new Set();
  const today = new Date();
  let d = new Date(today);
  let streak = 0;

  // Walk backwards from today
  while (true) {
    const key = d.toISOString().split("T")[0];
    if (dayMap[key] && dayMap[key].mins > 0) {
      streakDates.add(key);
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return { streakDates, currentStreak: streak };
}

// ── Format date ───────────────────────────────────────────────────
function fmtDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric", weekday:"short" });
}

// ══════════════════════════════════════════════════════════════════
// HEATMAP — full year view
// ══════════════════════════════════════════════════════════════════
function Heatmap({ history, pathColor="#4f6ef7", onDayClick }) {
  const [tooltip, setTooltip] = useState(null);

  const dayMap = useMemo(() => buildCalendarData(history), [history]);
  const { streakDates, currentStreak } = useMemo(() => calcStreakDates(dayMap), [dayMap]);

  // Build 52 weeks × 7 days grid
  const weeks = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364); // ~1 year back
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const weeks = [];
    let d = new Date(startDate);
    for (let w = 0; w < 53; w++) {
      const week = [];
      for (let day = 0; day < 7; day++) {
        const key = d.toISOString().split("T")[0];
        const isFuture = d > today;
        week.push({
          date:     key,
          data:     dayMap[key] || null,
          isStreak: streakDates.has(key),
          isFuture,
          isToday:  key === today.toISOString().split("T")[0],
        });
        d.setDate(d.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [dayMap, streakDates]);

  const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // Month labels
  const monthLabels = useMemo(() => {
    const labels = [];
    weeks.forEach((week, wi) => {
      const firstDay = week[0];
      const d = new Date(firstDay.date + "T00:00:00");
      if (d.getDate() <= 7) {
        labels.push({ weekIdx: wi, month: MONTHS[d.getMonth()] });
      }
    });
    return labels;
  }, [weeks]);

  const CELL = 12;
  const GAP  = 3;

  return (
    <div>
      {/* Streak summary */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        marginBottom:16,
      }}>
        <div>
          <div style={{
            fontSize:11, color:"#555",
            fontFamily:"JetBrains Mono,monospace",
            letterSpacing:".08em", marginBottom:4,
          }}>STUDY ACTIVITY — LAST 12 MONTHS</div>
          <div style={{
            fontSize:22, fontWeight:900,
            color: currentStreak > 0 ? "#f5c842" : "#333",
          }}>
            {currentStreak}
            <span style={{ fontSize:12, fontWeight:500, color:"#555", marginLeft:6 }}>
              day streak
            </span>
          </div>
        </div>
        {/* Legend */}
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:10, color:"#333", fontFamily:"JetBrains Mono,monospace" }}>LESS</span>
          {[0, 0.25, 0.5, 0.75, 1].map((opacity, i) => (
            <div key={i} style={{
              width:CELL, height:CELL, borderRadius:3,
              background: i === 0 ? "rgba(255,255,255,0.04)" : pathColor,
              opacity: i === 0 ? 1 : opacity * 0.4 + 0.2,
              border: "1px solid rgba(255,255,255,0.05)",
            }}/>
          ))}
          <span style={{ fontSize:10, color:"#333", fontFamily:"JetBrains Mono,monospace" }}>MORE</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div style={{ overflowX:"auto", paddingBottom:8 }}>
        <div style={{ position:"relative", minWidth: 53*(CELL+GAP) + 32 }}>

          {/* Month labels */}
          <div style={{
            display:"flex", marginLeft:28,
            marginBottom:4, position:"relative",
            height:14,
          }}>
            {monthLabels.map((ml, i) => (
              <div key={i} style={{
                position:"absolute",
                left: ml.weekIdx * (CELL+GAP),
                fontSize:9, color:"#333",
                fontFamily:"JetBrains Mono,monospace",
                letterSpacing:".05em",
              }}>{ml.month}</div>
            ))}
          </div>

          <div style={{ display:"flex", gap:0 }}>
            {/* Day labels */}
            <div style={{
              display:"flex", flexDirection:"column",
              gap:GAP, marginRight:6, marginTop:0,
            }}>
              {DAYS.map((d,i) => (
                <div key={i} style={{
                  height:CELL,
                  fontSize:8, color:"#2a2a2a",
                  fontFamily:"JetBrains Mono,monospace",
                  display:"flex", alignItems:"center",
                }}>{d}</div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} style={{
                display:"flex", flexDirection:"column",
                gap:GAP, marginRight:GAP,
              }}>
                {week.map((cell, di) => {
                  const mins = cell.data?.mins || 0;
                  const bg   = cell.isFuture
                    ? "transparent"
                    : getDayColor(mins, pathColor);
                  const border = cell.isFuture
                    ? "1px solid transparent"
                    : getDayBorder(mins, cell.isStreak, pathColor);

                  return (
                    <div
                      key={di}
                      onClick={() => !cell.isFuture && onDayClick?.(cell)}
                      onMouseEnter={e => {
                        if (!cell.isFuture) {
                          const r = e.currentTarget.getBoundingClientRect();
                          setTooltip({ cell, x:r.left, y:r.top });
                          e.currentTarget.style.transform = "scale(1.4)";
                          e.currentTarget.style.zIndex = "10";
                        }
                      }}
                      onMouseLeave={e => {
                        setTooltip(null);
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.zIndex = "1";
                      }}
                      style={{
                        width:CELL, height:CELL,
                        borderRadius:3,
                        background:bg,
                        border: cell.isToday
                          ? `2px solid ${pathColor}`
                          : border,
                        cursor: cell.isFuture ? "default" : "pointer",
                        transition:"transform .15s",
                        position:"relative",
                        boxShadow: cell.isStreak && mins>0
                          ? `0 0 4px ${pathColor}40`
                          : "none",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position:"fixed",
          left: Math.min(tooltip.x + 16, window.innerWidth - 200),
          top:  tooltip.y - 80,
          background: "rgba(10,10,14,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius:10, padding:"10px 14px",
          fontSize:11, zIndex:9999,
          backdropFilter:"blur(20px)",
          pointerEvents:"none",
          minWidth:160,
          boxShadow:"0 8px 32px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontWeight:700, marginBottom:5, color:"#efefef" }}>
            {fmtDate(tooltip.cell.date)}
          </div>
          {tooltip.cell.data ? (<>
            <div style={{ color:"#555", fontFamily:"JetBrains Mono,monospace", fontSize:10 }}>
              {tooltip.cell.data.sessions} sessions
              &nbsp;·&nbsp; {tooltip.cell.data.mins}min
              &nbsp;·&nbsp; +{tooltip.cell.data.xp} XP
            </div>
            {tooltip.cell.isStreak && (
              <div style={{ color:"#f5c842", fontSize:10, marginTop:4,
                fontFamily:"JetBrains Mono,monospace" }}>
                🔥 streak day
              </div>
            )}
          </>) : (
            <div style={{ color:"#333", fontFamily:"JetBrains Mono,monospace", fontSize:10 }}>
              No sessions
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MONTHLY CALENDAR
// ══════════════════════════════════════════════════════════════════
function MonthlyCalendar({ history, pathColor="#4f6ef7", onDayClick }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const dayMap   = useMemo(() => buildCalendarData(history), [history]);
  const { streakDates } = useMemo(() => calcStreakDates(dayMap), [dayMap]);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const MONTHS_FULL = ["January","February","March","April","May","June",
    "July","August","September","October","November","December"];
  const DAYS_SHORT  = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

  // Build month grid
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const last  = new Date(year, month+1, 0);
    const cells = [];
    // Empty cells before first
    for (let i=0; i<first.getDay(); i++) cells.push(null);
    // Days of month
    for (let d=1; d<=last.getDate(); d++) {
      const key = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      cells.push({ date:key, day:d, data:dayMap[key]||null, isStreak:streakDates.has(key) });
    }
    return cells;
  }, [year, month, dayMap, streakDates]);

  const today = new Date().toISOString().split("T")[0];

  // Sessions for selected day
  const selectedSessions = useMemo(() => {
    if (!selectedDay) return [];
    return (history||[]).filter(h => (h.schedule_date||h.date) === selectedDay.date);
  }, [selectedDay, history]);

  return (
    <div>
      {/* Month nav */}
      <div style={{
        display:"flex", alignItems:"center",
        justifyContent:"space-between", marginBottom:20,
      }}>
        <button
          onClick={() => setViewDate(new Date(year, month-1, 1))}
          style={{
            width:32, height:32, borderRadius:8,
            background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.07)",
            color:"#555", cursor:"pointer", fontSize:16,
            transition:"all .18s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.color="#efefef"}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color="#555"}}
        >‹</button>

        <div style={{ fontWeight:700, fontSize:16, letterSpacing:"-.2px" }}>
          {MONTHS_FULL[month]} {year}
        </div>

        <button
          onClick={() => setViewDate(new Date(year, month+1, 1))}
          style={{
            width:32, height:32, borderRadius:8,
            background:"rgba(255,255,255,0.04)",
            border:"1px solid rgba(255,255,255,0.07)",
            color:"#555", cursor:"pointer", fontSize:16,
            transition:"all .18s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.08)";e.currentTarget.style.color="#efefef"}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.color="#555"}}
        >›</button>
      </div>

      {/* Day headers */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(7,1fr)",
        gap:4, marginBottom:6,
      }}>
        {DAYS_SHORT.map(d => (
          <div key={d} style={{
            textAlign:"center",
            fontFamily:"JetBrains Mono,monospace",
            fontSize:9, color:"#2a2a2a", fontWeight:700,
            letterSpacing:".08em", padding:"4px 0",
          }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(7,1fr)",
        gap:4,
      }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={i}/>;
          const mins    = cell.data?.mins || 0;
          const isToday = cell.date === today;
          const isSel   = selectedDay?.date === cell.date;

          return (
            <div
              key={i}
              onClick={() => {
                setSelectedDay(isSel ? null : cell);
                onDayClick?.(cell);
              }}
              style={{
                borderRadius:9,
                padding:"8px 4px 6px",
                background: isSel
                  ? `${pathColor}18`
                  : mins > 0
                    ? getDayColor(mins, pathColor)
                    : "rgba(255,255,255,0.025)",
                border: isToday
                  ? `2px solid ${pathColor}`
                  : isSel
                    ? `1px solid ${pathColor}55`
                    : cell.isStreak && mins>0
                      ? `1px solid ${pathColor}35`
                      : "1px solid rgba(255,255,255,0.04)",
                cursor:"pointer",
                transition:"all .18s",
                textAlign:"center",
                position:"relative",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform="translateY(-2px)";
                e.currentTarget.style.boxShadow="0 6px 16px rgba(0,0,0,.3)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform="translateY(0)";
                e.currentTarget.style.boxShadow="none";
              }}
            >
              {/* Streak dot */}
              {cell.isStreak && mins>0 && (
                <div style={{
                  position:"absolute", top:4, right:4,
                  width:4, height:4, borderRadius:"50%",
                  background:"#f5c842",
                  boxShadow:"0 0 4px #f5c842",
                }}/>
              )}

              {/* Day number */}
              <div style={{
                fontSize:13, fontWeight:700,
                color: isToday ? pathColor : mins>0 ? "#efefef" : "#333",
              }}>{cell.day}</div>

              {/* XP if studied */}
              {cell.data && (
                <div style={{
                  fontFamily:"JetBrains Mono,monospace",
                  fontSize:8, color:"#f5c842",
                  marginTop:3, fontWeight:700,
                }}>+{cell.data.xp}</div>
              )}

              {/* Session dots */}
              {cell.data && cell.data.sessions > 0 && (
                <div style={{
                  display:"flex", justifyContent:"center",
                  gap:2, marginTop:4,
                }}>
                  {Array.from({length:Math.min(cell.data.sessions,4)}).map((_,si)=>(
                    <div key={si} style={{
                      width:3, height:3, borderRadius:"50%",
                      background: pathColor,
                      opacity:.7,
                    }}/>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div style={{
          marginTop:16,
          background:"rgba(255,255,255,0.025)",
          border:"1px solid rgba(255,255,255,0.06)",
          borderRadius:14, padding:16,
          animation:"fadeIn .2s ease",
        }}>
          <div style={{
            fontFamily:"JetBrains Mono,monospace",
            fontSize:10, color:"#555",
            letterSpacing:".1em", marginBottom:8,
          }}>{fmtDate(selectedDay.date).toUpperCase()}</div>

          {selectedSessions.length > 0 ? (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {selectedSessions.map((s,i) => (
                <div key={i} style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"8px 10px",
                  background:"rgba(255,255,255,0.03)",
                  borderRadius:8,
                  borderLeft:`2px solid ${s.status==="completed"?"#2de2a0":s.status==="skipped"?"#555":"#f06060"}`,
                }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600 }}>
                      {s.subject_name}
                    </div>
                    <div style={{
                      fontFamily:"JetBrains Mono,monospace",
                      fontSize:10, color:"#555", marginTop:2,
                    }}>
                      {s.topic} · {s.actual_mins||s.duration_mins}min
                    </div>
                  </div>
                  <div style={{
                    fontFamily:"JetBrains Mono,monospace",
                    fontSize:10,
                    color: s.status==="completed"?"#2de2a0":s.status==="skipped"?"#555":"#f06060",
                    fontWeight:700,
                  }}>
                    {s.status==="completed"
                      ? `+${s.xp_earned||0} XP`
                      : s.status?.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              fontFamily:"JetBrains Mono,monospace",
              fontSize:11, color:"#333",
            }}>No sessions on this day.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN EXPORT — combined calendar component
// ══════════════════════════════════════════════════════════════════
export default function StudyCalendar({
  history = [],
  pathColor = "#4f6ef7",
}) {
  const [view, setView] = useState("heatmap");
  const [selectedDay, setSelectedDay] = useState(null);

  return (
    <div>
      {/* View toggle */}
      <div style={{
        display:"flex", gap:6, marginBottom:20,
      }}>
        {[
          { id:"heatmap", label:"Year View" },
          { id:"month",   label:"Month View" },
        ].map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            style={{
              height:30, padding:"0 14px",
              background: view===v.id
                ? `${pathColor}15`
                : "rgba(255,255,255,0.03)",
              border: `1px solid ${view===v.id ? pathColor+"35" : "rgba(255,255,255,0.07)"}`,
              borderRadius:8,
              color: view===v.id ? pathColor : "#555",
              fontSize:12, fontWeight:600, cursor:"pointer",
              fontFamily:"Inter,sans-serif",
              transition:"all .18s",
            }}
          >{v.label}</button>
        ))}
      </div>

      {view === "heatmap" ? (
        <Heatmap
          history={history}
          pathColor={pathColor}
          onDayClick={setSelectedDay}
        />
      ) : (
        <MonthlyCalendar
          history={history}
          pathColor={pathColor}
          onDayClick={setSelectedDay}
        />
      )}
    </div>
  );
}
