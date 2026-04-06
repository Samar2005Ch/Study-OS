import { useState, useEffect } from "react";
import { api }           from "../../api/client";
import { usePath }       from "../../system/PathContext";
import { useRank }       from "../../system/RankContext";
import { fireScouter }   from "../../components/Scouter";
import { calcAnalytics } from "../../hooks/useAnalytics";
import { generateInsights, calcExamReadiness, calcWeeklySummary } from "../../utils/insightsEngine";
import {
  WeeklyXPBars,
  SubjectDistribution,
  GhostVsComplete,
  TimeOfDayChart,
  CompletionTrend,
  SessionLengthDist,
} from "./HeatmapChart";
import ExamReadiness from "./ExamReadiness";

// ─── Heatmap cell ─────────────────────────────────────────────────
function HeatmapCell({ day }) {
  const mins = day?.mins || 0;
  const isToday   = day?.isToday;
  const isStreak  = day?.isStreak;
  const c = getComputedStyle(document.documentElement).getPropertyValue("--a").trim() || "#4f6ef7";
  const bg = mins === 0 ? "rgba(255,255,255,.04)" : mins < 30 ? `${c}30` : mins < 60 ? `${c}50` : mins < 120 ? `${c}75` : c;
  return (
    <div
      style={{
        width: 12, height: 12, borderRadius: 3, background: bg,
        border: isToday ? `1px solid ${c}` : "1px solid transparent",
        boxShadow: isStreak && mins > 0 ? `0 0 4px ${c}50` : "none",
        cursor: "pointer", transition: "transform .15s",
      }}
      title={day ? `${day.date}: ${mins}min, +${day.xp}XP` : ""}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.5)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
    />
  );
}

// ─── Section header ───────────────────────────────────────────────
function SectionHdr({ label, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "#5a6070", letterSpacing: ".14em" }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 11, color: "#444", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

const getLocalDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function AnalyticsPage() {
  const { path }              = usePath();
  const { rank, totalXP, nextRank } = useRank();
  const c                     = path.primary;
  const [history,  setHistory]  = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams,    setExams]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    Promise.all([api.getHistory(), api.getSubjects?.() || Promise.resolve([]), api.getExams()])
      .then(([h, s, e]) => { setHistory(h); setSubjects(s || []); setExams(e || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Analytics computation ────────────────────────────────────
  const analytics     = history.length ? calcAnalytics(history, subjects) : null;
  const readiness     = calcExamReadiness(subjects, exams, history);
  const { thisWeek, lastWeek, streak } = calcWeeklySummary(history);
  const insights      = history.length >= 3
    ? generateInsights({ history, subjects, exams, streak })
    : [];

  // ── Heatmap data ──────────────────────────────────────────────
  const dayMap = {};
  history.forEach(h => {
    const d = h.schedule_date || h.scheduleDate || h.date || "";
    if (!d) return;
    if (!dayMap[d]) dayMap[d] = { date: d, mins: 0, xp: 0, sessions: 0, completed: 0 };
    dayMap[d].mins     += h.actual_mins || h.actualMins || h.planned_mins || h.plannedMins || 0;
    dayMap[d].xp       += h.xp_earned || h.xpEarned || 0;
    dayMap[d].sessions += 1;
    if (h.completed === 1 || h.completed === true) dayMap[d].completed++;
  });

  const today = new Date();
  const streakSet = new Set();
  let sd = new Date(today);
  for (let i = 0; i < streak; i++) { streakSet.add(sd.toISOString().split("T")[0]); sd.setDate(sd.getDate() - 1); }

  const weeks = [];
  const start = new Date(today); start.setDate(start.getDate() - 364); start.setDate(start.getDate() - start.getDay());
  const cur = new Date(start);
  for (let w = 0; w < 53; w++) {
    const wk = [];
    for (let d = 0; d < 7; d++) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${dd}`;
      wk.push({ date: key, ...(dayMap[key] || {}), isToday: key === getLocalDateStr(), isStreak: streakSet.has(key), isFuture: cur > today });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(wk);
  }

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthLabels = [];
  weeks.forEach((w, wi) => {
    const fd = new Date(w[0].date + "T00:00:00");
    if (fd.getDate() <= 7) monthLabels.push({ wi, m: MONTHS[fd.getMonth()] });
  });

  const totalMins = history.reduce((a, h) => a + (h.actual_mins || 0), 0);
  const totalDone = history.filter(h => h.completed === 1).length;
  const completionRate = history.length ? Math.round((totalDone / history.length) * 100) : 0;

  const TABS = [
    { id: "overview",  label: "Overview"  },
    { id: "subjects",  label: "Subjects"  },
    { id: "timing",    label: "Timing"    },
    { id: "readiness", label: "Readiness" },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="page-hdr">
        <div>
          <div className="page-tag">{path.name.toUpperCase()} · {(path.navAnalytics || "ANALYTICS").toUpperCase()}</div>
          <h1 className="page-title">{path.navAnalytics || "Analytics"}</h1>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }} className="stagger">
        {[
          { label: path.xpLabel.toUpperCase(),      value: totalXP.toLocaleString(),     color: c,              onClick: () => fireScouter(totalXP, path.xpLabel) },
          { label: "STUDY HOURS",                    value: `${Math.floor(totalMins/60)}h`, color: "var(--green)", onClick: () => fireScouter(Math.floor(totalMins/60), "HOURS") },
          { label: path.streakLabel.toUpperCase(),   value: streak,                       color: "var(--gold)",  onClick: () => fireScouter(streak, "STREAK") },
          { label: "COMPLETION RATE",                value: `${completionRate}%`,          color: completionRate >= 70 ? "var(--green)" : completionRate >= 50 ? "var(--gold)" : "var(--red)", onClick: () => fireScouter(completionRate, "RATE") },
        ].map((s, i) => (
          <div key={i} className="card anim-up" onClick={s.onClick} style={{ cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = s.color + "40"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = ""; }}
          >
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--t3)", letterSpacing: ".1em", marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-1px", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* This week vs last */}
      {analytics && (
        <div className="card anim-up" style={{ marginBottom: 20 }}>
          <div className="card-hdr">
            <div className="card-title">Weekly XP</div>
            <div style={{ display: "flex", gap: 14, fontFamily: "JetBrains Mono, monospace", fontSize: 9 }}>
              <span style={{ color: "#5a6070" }}>THIS WEEK</span>
              <span style={{ color: "#00c6a0", fontWeight: 700 }}>{thisWeek.xp.toLocaleString()} XP</span>
              <span style={{ color: thisWeek.xp > lastWeek.xp ? "#00c6a0" : "#ef4444" }}>
                {thisWeek.xp > lastWeek.xp ? "↑" : "↓"} vs last
              </span>
            </div>
          </div>
          <WeeklyXPBars weekly={analytics.weekly} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "8px 16px", background: "transparent",
            border: "none",
            borderBottom: activeTab === tab.id ? `2px solid ${c}` : "2px solid transparent",
            color: activeTab === tab.id ? c : "#555",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10, fontWeight: 700, cursor: "pointer",
            letterSpacing: ".08em", transition: "all .2s",
          }}>
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ───────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Heatmap */}
          <div className="card anim-up" style={{ gridColumn: "1 / -1" }}>
            <div className="card-hdr">
              <div className="card-title">Study Activity</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--t3)" }}>LESS</span>
                {[0,.3,.5,.8,1].map((o, i) => (
                  <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: i === 0 ? "rgba(255,255,255,.04)" : c, opacity: i === 0 ? 1 : o * 0.6 + 0.15, border: "1px solid rgba(255,255,255,.04)" }} />
                ))}
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--t3)" }}>MORE</span>
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: streak > 0 ? "var(--gold)" : "var(--t4)", marginBottom: 16 }}>
              {streak} <span style={{ fontSize: 13, fontWeight: 500, color: "var(--t3)" }}>day streak</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 53 * 15 + 32 }}>
                <div style={{ position: "relative", height: 14, marginLeft: 28, marginBottom: 4 }}>
                  {monthLabels.map((ml, i) => (
                    <div key={i} style={{ position: "absolute", left: ml.wi * 15, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--t4)" }}>{ml.m}</div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, marginRight: 4 }}>
                    {["","M","","W","","F",""].map((d, i) => (
                      <div key={i} style={{ height: 12, fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "var(--t4)", display: "flex", alignItems: "center" }}>{d}</div>
                    ))}
                  </div>
                  {weeks.map((wk, wi) => (
                    <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3, marginRight: 3 }}>
                      {wk.map((day, di) => (
                        day.isFuture ? <div key={di} style={{ width: 12, height: 12 }} /> : <HeatmapCell key={di} day={day} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Ghost vs Complete */}
          <div className="card anim-up">
            <SectionHdr label="GHOST VS COMPLETE · LAST 7 DAYS" />
            <GhostVsComplete weekly={analytics?.weekly || []} />
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontFamily: "JetBrains Mono, monospace", fontSize: 9 }}>
              <span style={{ color: "#00c6a0" }}>■ Completed</span>
              <span style={{ color: "#ef4444" }}>■ Ghost</span>
            </div>
          </div>

          {/* 4-week trend */}
          <div className="card anim-up">
            <SectionHdr label="COMPLETION RATE · 4 WEEKS" />
            <CompletionTrend history={history} />
          </div>

          {/* Session length distribution */}
          <div className="card anim-up">
            <SectionHdr label="SESSION LENGTH DISTRIBUTION" sub="How long are your actual sessions?" />
            <SessionLengthDist history={history} />
          </div>

          {/* Rank progression */}
          <div className="card anim-up">
            <div className="card-hdr">
              <div className="card-title">Rank Progression</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: c }}>{rank.rank} → {nextRank?.rank || "MAX"}</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {["E","D","C","B","A","S"].map(r => {
                const rankDef = { E:{min:0},D:{min:500},C:{min:1500},B:{min:3000},A:{min:6000},S:{min:10000} }[r];
                const done = totalXP >= rankDef.min;
                const active = rank.rank === r;
                const rankColor = active ? c : done ? "var(--green)" : "var(--t4)";
                return (
                  <div key={r} style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, margin: "0 auto 8px", background: active ? `${c}18` : done ? "rgba(45,226,160,.08)" : "rgba(255,255,255,.03)", border: `1px solid ${active ? c : done ? "rgba(45,226,160,.3)" : "var(--b1)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: rankColor }}>
                      {r}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "var(--t4)" }}>{rankDef.min > 0 ? rankDef.min.toLocaleString() : "START"}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBJECTS TAB ───────────────────────────────────────── */}
      {activeTab === "subjects" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="card anim-up">
            <SectionHdr label="TIME SPLIT BY SUBJECT" sub="Where does your study time go?" />
            <SubjectDistribution bySubject={analytics?.bySubject || []} />
          </div>
          <div className="card anim-up">
            <SectionHdr label="SUBJECT PERFORMANCE" sub="Completion rate per subject" />
            {(analytics?.bySubject || []).map((s, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "monospace", marginBottom: 4 }}>
                  <span style={{ color: "#e8ecf4", fontWeight: 700 }}>{s.name}</span>
                  <span style={{ color: s.completionRate >= 70 ? "#00c6a0" : s.completionRate >= 50 ? "#f59e0b" : "#ef4444", fontWeight: 700 }}>
                    {s.completionRate}%
                  </span>
                </div>
                <div style={{ height: 5, background: "#1c2030", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${s.completionRate}%`,
                    background: s.completionRate >= 70 ? "#00c6a0" : s.completionRate >= 50 ? "#f59e0b" : "#ef4444",
                    borderRadius: 99,
                    transition: "width 1s ease",
                  }} />
                </div>
                <div style={{ fontSize: 9, color: "#444", fontFamily: "monospace", marginTop: 3 }}>
                  {s.done}/{s.total} done · {Math.floor(s.totalMins/60)}h {s.totalMins%60}m · best: {s.bestTime || "anytime"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TIMING TAB ─────────────────────────────────────────── */}
      {activeTab === "timing" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          <div className="card anim-up">
            <SectionHdr label="TIME OF DAY PERFORMANCE" sub="When do you actually study?" />
            <TimeOfDayChart byTime={analytics?.byTime || []} />
          </div>
          <div className="card anim-up">
            <SectionHdr label="WEEKLY DAY BREAKDOWN" sub="Which days are most productive?" />
            <WeeklyXPBars weekly={analytics?.weekly || []} />
          </div>
        </div>
      )}

      {/* ── READINESS TAB ──────────────────────────────────────── */}
      {activeTab === "readiness" && (
        <div>
          <div className="card anim-up" style={{ marginBottom: 16 }}>
            <div className="card-hdr">
              <div className="card-title">Exam Readiness</div>
              <div style={{ fontSize: 9, color: "#5a6070", fontFamily: "monospace" }}>
                At current pace · updates daily
              </div>
            </div>
            <ExamReadiness subjects={readiness} />
          </div>
        </div>
      )}
    </div>
  );
}


