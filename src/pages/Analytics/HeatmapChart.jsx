/**
 * pages/Analytics/HeatmapChart.jsx
 *
 * Full 30-day study heatmap with:
 *  - Daily XP bar chart (this week vs last week)
 *  - Subject time pie chart
 *  - Completion rate trend (4 weeks)
 *  - Ghost vs complete ratio
 *  - Session length distribution
 *  - Time of day chart
 */

// ─── Daily XP Bar (this week vs last) ─────────────────────────────
export function WeeklyXPBars({ weekly = [] }) {
  const maxXP = Math.max(...weekly.map(d => d.xp), 1);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, marginBottom: 6 }}>
        {weekly.map((day, i) => {
          const pct = (day.xp / maxXP) * 100;
          const isToday = day.date === today;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div
                title={`${day.label}: ${day.xp} XP, ${day.done} sessions`}
                style={{
                  width: "100%",
                  height: `${Math.max(pct, 4)}%`,
                  background: isToday
                    ? "linear-gradient(180deg, #00c6a0, #00c6a060)"
                    : day.ghost > 0
                    ? "linear-gradient(180deg, #ef444460, #ef444420)"
                    : "linear-gradient(180deg, rgba(79,110,247,0.8), rgba(79,110,247,0.3))",
                  borderRadius: "3px 3px 0 0",
                  border: isToday ? "1px solid #00c6a0" : "none",
                  transition: "height 1s ease",
                  cursor: "pointer",
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {weekly.map((day, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 9, color: day.date === today ? "#00c6a0" : "#555",
            fontWeight: day.date === today ? 700 : 400,
          }}>
            {day.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Subject pie chart (simple bar-style) ─────────────────────────
export function SubjectDistribution({ bySubject = [] }) {
  const total = bySubject.reduce((a, s) => a + s.totalMins, 0) || 1;

  return (
    <div>
      {bySubject.slice(0, 6).map((s, i) => {
        const pct = Math.round((s.totalMins / total) * 100);
        return (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "monospace", marginBottom: 4 }}>
              <span style={{ color: "#e8ecf4", fontWeight: 600 }}>{s.name}</span>
              <span style={{ color: s.color || "#4f6ef7" }}>{pct}% · {Math.floor(s.totalMins / 60)}h {s.totalMins % 60}m</span>
            </div>
            <div style={{ height: 4, background: "#1c2030", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${pct}%`,
                background: s.color || "#4f6ef7",
                borderRadius: 99,
                transition: "width 1.2s ease",
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Ghost vs Complete ratio by week ──────────────────────────────
export function GhostVsComplete({ weekly = [] }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
      {weekly.map((day, i) => {
        const total = (day.done || 0) + (day.ghost || 0);
        if (total === 0) return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ height: 60, display: "flex", alignItems: "flex-end", width: "100%" }}>
              <div style={{ width: "100%", height: 2, background: "#1c2030", borderRadius: 1 }} />
            </div>
            <div style={{ fontSize: 8, color: "#333", fontFamily: "monospace", marginTop: 3 }}>{day.label}</div>
          </div>
        );
        const doneH  = (day.done  / total) * 60;
        const ghostH = (day.ghost / total) * 60;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ height: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "100%", gap: 2 }}>
              {ghostH > 0 && (
                <div title={`${day.ghost} ghost`} style={{ width: "100%", height: ghostH, background: "rgba(239,68,68,0.5)", borderRadius: 2 }} />
              )}
              {doneH > 0 && (
                <div title={`${day.done} done`} style={{ width: "100%", height: doneH, background: "rgba(0,198,160,0.7)", borderRadius: 2 }} />
              )}
            </div>
            <div style={{ fontSize: 8, color: "#555", fontFamily: "monospace", marginTop: 3 }}>{day.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Time of day chart ────────────────────────────────────────────
export function TimeOfDayChart({ byTime = [] }) {
  const maxDone = Math.max(...byTime.map(t => t.done), 1);
  const icons   = { morning: "🌅", afternoon: "☀️", evening: "🌆", night: "🌙" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      {byTime.map((slot, i) => {
        const pct   = (slot.done / maxDone) * 100;
        const isBest = slot.done === maxDone && slot.done > 0;
        const color  = isBest ? "#00c6a0" : "#4f6ef7";
        return (
          <div key={i} style={{
            padding:    "12px 8px",
            background: isBest ? "rgba(0,198,160,0.06)" : "rgba(255,255,255,0.02)",
            border:     `1px solid ${isBest ? "#00c6a025" : "rgba(255,255,255,0.05)"}`,
            borderRadius: 8,
            textAlign:  "center",
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{icons[slot.label] || "⏰"}</div>
            <div style={{ height: 40, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <div style={{
                width:      "60%",
                height:     `${Math.max(pct, 4)}%`,
                background: `${color}80`,
                borderRadius: "3px 3px 0 0",
                border:     `1px solid ${color}40`,
                transition: "height 1s ease",
              }} />
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8, color: isBest ? "#00c6a0" : "#555", marginTop: 4, textTransform: "capitalize" }}>
              {slot.label}
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, fontWeight: 700, color, marginTop: 2 }}>
              {slot.done}
            </div>
            {isBest && <div style={{ fontSize: 8, color: "#00c6a0", marginTop: 2 }}>BEST</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── 4-week completion trend ──────────────────────────────────────
export function CompletionTrend({ history = [] }) {
  const weeks = [];
  for (let w = 3; w >= 0; w--) {
    const start = new Date(); start.setDate(start.getDate() - (w + 1) * 7);
    const end   = new Date(); end.setDate(end.getDate() - w * 7);
    const wh    = history.filter(h => {
      const d = new Date(h.date || h.schedule_date);
      return d >= start && d < end;
    });
    const done  = wh.filter(h => h.completed === 1 || h.completed === true).length;
    const rate  = wh.length ? Math.round((done / wh.length) * 100) : 0;
    weeks.push({ label: `W${4 - w}`, rate, done, total: wh.length });
  }

  const maxRate = Math.max(...weeks.map(w => w.rate), 1);
  const trend   = weeks[3]?.rate > weeks[0]?.rate ? "improving" : weeks[3]?.rate < weeks[0]?.rate ? "declining" : "stable";
  const trendColor = trend === "improving" ? "#00c6a0" : trend === "declining" ? "#ef4444" : "#f59e0b";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <span style={{ fontSize: 9, color: trendColor, fontFamily: "monospace", fontWeight: 700 }}>
          {trend === "improving" ? "↑ IMPROVING" : trend === "declining" ? "↓ DECLINING" : "→ STABLE"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 80 }}>
        {weeks.map((w, i) => {
          const h = (w.rate / maxRate) * 70;
          const color = w.rate >= 70 ? "#00c6a0" : w.rate >= 50 ? "#f59e0b" : "#ef4444";
          return (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 10, color, fontWeight: 700, fontFamily: "monospace", marginBottom: 4 }}>
                {w.rate}%
              </div>
              <div style={{
                height: `${Math.max(h, 4)}px`,
                background: `${color}60`,
                border:     `1px solid ${color}40`,
                borderRadius: "3px 3px 0 0",
                transition: "height 1s ease",
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {weeks.map((w, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#444", fontFamily: "monospace" }}>
            {w.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Session length distribution ──────────────────────────────────
export function SessionLengthDist({ history = [] }) {
  const buckets = [
    { label: "0–10m",  min: 0,   max: 10  },
    { label: "10–20m", min: 10,  max: 20  },
    { label: "20–30m", min: 20,  max: 30  },
    { label: "30–45m", min: 30,  max: 45  },
    { label: "45m+",   min: 45,  max: 999 },
  ];
  const completed = history.filter(h => h.completed === 1 || h.completed === true);
  const counts = buckets.map(b => ({
    ...b,
    count: completed.filter(h => {
      const m = h.actual_mins || h.actualMins || h.planned_mins || 0;
      return m >= b.min && m < b.max;
    }).length,
  }));
  const maxCount = Math.max(...counts.map(b => b.count), 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 70 }}>
      {counts.map((b, i) => {
        const pct = (b.count / maxCount) * 100;
        return (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#555", fontFamily: "monospace", marginBottom: 3 }}>{b.count}</div>
            <div style={{
              height: `${Math.max(pct, 4)}%`,
              background: "rgba(79,110,247,0.5)",
              border: "1px solid rgba(79,110,247,0.3)",
              borderRadius: "3px 3px 0 0",
              transition: "height 1s ease",
            }} />
            <div style={{ fontSize: 8, color: "#444", fontFamily: "monospace", marginTop: 4 }}>{b.label}</div>
          </div>
        );
      })}
    </div>
  );
}
