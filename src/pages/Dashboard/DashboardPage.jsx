import { useState, useEffect, useRef } from "react";
import { api }                        from "../../api/client";
import { usePath }                    from "../../system/PathContext";
import { useRank }                    from "../../system/RankContext";
import { useAuth }                    from "../../system/AuthContext";
import { fireScouter }                from "../../components/Scouter";
import { showToast }                  from "../../components/Toast";
import { evaluateSituations }         from "../../utils/situationEngine";
import { generateInsights, calcExamReadiness } from "../../utils/insightsEngine";
import SituationBanner                from "./SituationBanner";
import InsightCards                   from "./InsightCards";
import ExamReadiness                  from "../Analytics/ExamReadiness";
import Portal                         from "../../components/Portal";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!";
function scramble(el, final, dur = 700) {
  if (!el) return;
  let f = 0; const total = dur / 16;
  const iv = setInterval(() => {
    f++; const prog = f / total;
    el.textContent = final.split("").map((c, i) => {
      if (c === " ") return " ";
      if (i / final.length < prog) return c;
      return CHARS[Math.floor(Math.random() * CHARS.length)];
    }).join("");
    if (f >= total) { clearInterval(iv); el.textContent = final; }
  }, 16);
}

function Countdown({ targetDate }) {
  const [time, setTime] = useState({});
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(targetDate) - new Date());
      setTime({ d: Math.floor(diff/86400000), h: Math.floor((diff%86400000)/3600000), m: Math.floor((diff%3600000)/60000) });
    };
    tick(); const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [targetDate]);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {[["d","Days"],["h","Hrs"],["m","Min"]].map(([k,l]) => (
        <div key={k} style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-1px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {String(time[k] || 0).padStart(2, "0")}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "var(--t4)", letterSpacing: ".12em", marginTop: 3 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon, value, label, color, onClick, sub }) {
  return (
    <div className="card anim-up" onClick={onClick} style={{ cursor: "pointer", transition: "all .2s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = color + "44"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = ""; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{icon}</div>
        {sub && <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 8, color: "#444" }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-1px", color, marginBottom: 3 }}>{value}</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--t3)", letterSpacing: ".08em" }}>{label}</div>
    </div>
  );
}

function ReadinessRing({ pct, color }) {
  const r = 38, c = Math.PI * 2 * r;
  const [disp, setDisp] = useState(0);
  useEffect(() => { setTimeout(() => setDisp(pct), 400); }, [pct]);
  return (
    <div style={{ position: "relative", width: 90, height: 90 }}>
      <svg width={90} height={90} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,.04)" strokeWidth={5} />
        <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (disp/100)*c}
          style={{ transition: "stroke-dashoffset 2s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 5px ${color}60)` }}
        />
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color }}>{pct}%</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 7, color: "var(--t4)", marginTop: 1, letterSpacing: ".08em" }}>READY</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { path }              = usePath();
  const { rank, totalXP, nextRank } = useRank();
  const { user }              = useAuth();
  const titleRef              = useRef();
  const [exams,      setExams]      = useState([]);
  const [tasks,      setTasks]      = useState([]);
  const [history,    setHistory]    = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [timetable,  setTimetable]  = useState([]);
  const [generating, setGenerating] = useState(false);
  const [situations, setSituations] = useState({ banners: [], scheduleAdjustments: {}, emergencyMode: false });
  const [insights,   setInsights]   = useState([]);
  const [readiness,  setReadiness]  = useState([]);
  const [insightLoading, setInsightLoading] = useState(true);
  const c = path.primary;

  useEffect(() => {
    scramble(titleRef.current, "Dashboard", 800);
    Promise.all([
      api.getExams(),
      api.getTodayTasks(),
      api.getHistory(),
      api.getSubjects?.() || Promise.resolve([]),
      api.getTimetable?.() || Promise.resolve([]),
    ]).then(([e, t, h, s, tt]) => {
      setExams(e || []);
      setTasks(t || []);
      setHistory(h || []);
      setSubjects(s || []);
      setTimetable(tt || []);

      // ── Run intelligence engines ───────────────────────────
      const sit = evaluateSituations({ history: h, subjects: s, exams: e, timetable: tt });
      setSituations(sit);

      const streak = computeStreak(h);
      const ins = (h?.length >= 3 || s?.length > 0)
        ? generateInsights({ history: h, subjects: s, exams: e, streak })
        : [];
      setInsights(ins);

      const rd = calcExamReadiness(s || [], e || [], h || []);
      setReadiness(rd);
      
      // ── Intelligence Metadata ───────────────────────────
      const sType = h?.length >= 3 ? detectStudentType(h) : "Unknown";
      const bTime = h?.length >= 3 ? getBestTimeFromHistory(h) : "Collecting Data...";
      const gRate = h?.length ? (h.filter(x => x.ghosted === 1).length / h.length * 100).toFixed(0) : 0;
      setMeta({ studentType: sType, bestTime: bTime, ghostRate: gRate });
      
      setInsightLoading(false);
    }).catch(() => { setInsightLoading(false); });
  }, []);

  const [meta, setMeta] = useState({ studentType: "Detecting...", bestTime: "Analysis in progress...", ghostRate: 0 });

  function detectStudentType(history) {
    const recent = history.slice(-14);
    const comp   = recent.filter(h=>h.completed===1).length / recent.length;
    const ghost  = recent.filter(h=>h.ghosted===1).length  / recent.length;
    if (comp >= 0.75 && ghost < 0.1) return "Elite Topper";
    if (comp >= 0.5)  return "Consistent Learner";
    if (ghost > 0.4)  return "Ghost Target";
    return "Evolving";
  }
  function getBestTimeFromHistory(history) {
    const counts = {};
    history.filter(h=>h.completed===1).forEach(h=>{ counts[h.time_of_day]=(counts[h.time_of_day]||0)+1; });
    const best = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0];
    return best ? best.toUpperCase() : "Analysis pending";
  }

  function computeStreak(h) {
    const getLocalStr = (dt) => {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const dates = [...new Set((h || []).filter(x => x.completed === 1).map(x => x.schedule_date || x.date || ""))].sort().reverse();
    let s = 0; let d = new Date();
    for (const date of dates) {
      const key = getLocalStr(d);
      if (date === key) { s++; d.setDate(d.getDate() - 1); } else break;
    }
    return s;
  }

  const primaryExam   = exams[0];
  const daysLeft      = primaryExam ? Math.max(0, Math.ceil((new Date(primaryExam.date) - new Date()) / 86400000)) : 0;
  const totalSessions = history.length;
  const completed     = history.filter(h => h.completed === 1).length;
  const streak        = computeStreak(history);
  const todayDone     = tasks.filter(t => t.status === "completed").length;
  const todayGhosted  = tasks.filter(t => t.status === "ghosted").length;
  const todayTotal    = tasks.length;
  const readinessPct  = primaryExam?.subjects?.length
    ? Math.round(primaryExam.subjects.reduce((a, s) => {
        const topics = s.topics || [];
        const avg = topics.length ? topics.reduce((x, t) => x + (t.progress || 0), 0) / topics.length : 0;
        return a + avg;
      }, 0) / primaryExam.subjects.length)
    : 0;

  async function generate() {
    if (tasks.length > 0) {
      const ok = window.confirm("You already have a schedule for today. Regenerating will shift or replace your remaining pending tasks. Confirm?");
      if (!ok) return;
    }
    setGenerating(true);
    fireScouter(totalXP || 1234, path.xpLabel.toUpperCase());
    try {
      const res = await api.generateSchedule();
      setTasks(res.tasks || []);
      showToast(res.message || "Schedule generated", `${res.tasks?.length || 0} sessions`, path.sig);
    } catch (e) { showToast("Error", e.message); }
    setGenerating(false);
  }
  
  const [showManual, setShowManual] = useState(false);
  async function handleManualInsert(data) {
    setGenerating(true);
    try {
      const now = new Date();
      const atTime = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
      await api.insertTask({ ...data, atTime });
      const t = await api.getTodayTasks();
      setTasks(t);
      showToast("Raid Inserted", "Schedule Synchronized", path.sig);
      setShowManual(false);
    } catch (e) { showToast("Error", e.message); }
    setGenerating(false);
  }

  function handleBannerAction(banner) {
    if (banner.action === "add_subject") {
      showToast("Navigate to Subjects", "Add your first subject to begin");
    }
    if (banner.action === "emergency_reschedule" || banner.action === "emergency_focus") {
      generate();
    }
    if (banner.action === "bonus_sessions") {
      showToast("Bonus Session", "Great work today! Adding a bonus session...");
    }
  }

  const pendingTasks  = tasks.filter(t => t.status === "pending");
  const criticalSubjects = readiness.filter(r => r.status === "critical" || r.status === "at_risk");

  return (
    <div className="page">
      {/* Header */}
      <div className="page-hdr">
        <div>
          <div className="page-tag">{path.name.toUpperCase()} · COMMAND CENTER</div>
          <h1 className="page-title" ref={titleRef}>Dashboard</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-g" onClick={() => setShowManual(true)}>+ Manual Raid</button>
          <button className="btn btn-p" onClick={generate} disabled={generating} style={{ gap: 8, opacity: generating ? .7 : 1 }}>
            {generating ? <span className="spinner" style={{ width: 14, height: 14 }} /> : null}
            Generate Schedule
          </button>
        </div>
      </div>

      {/* ── SITUATION BANNERS ─────────────────────────────────── */}
      {situations.emergencyMode ? (
        <div style={{
          padding: "16px 20px", marginBottom: 20,
          background: "rgba(220,38,38,0.15)",
          border: "2px solid #dc2626",
          borderRadius: 10,
          animation: "emergencyPulse 1.5s ease-in-out infinite",
        }}>
          <div style={{ fontSize: 9, color: "#dc2626", fontFamily: "monospace", letterSpacing: ".15em", marginBottom: 6 }}>
            🚨 EMERGENCY STUDY PLAN
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#ff6b6b", fontFamily: "monospace", marginBottom: 4 }}>
            {situations.emergencyExam?.message}
          </div>
          <div style={{ fontSize: 11, color: "#888" }}>
            {situations.emergencyExam?.subMessage}
          </div>
          <style>{`@keyframes emergencyPulse { 0%,100%{opacity:1} 50%{opacity:0.85} }`}</style>
        </div>
      ) : (
        <SituationBanner banners={situations.banners} onAction={handleBannerAction} />
      )}

      {/* ── INSIGHTS ──────────────────────────────────────────── */}
      {(insights.length > 0 || insightLoading) && (
        <InsightCards insights={insights} loading={insightLoading} />
      )}

      {/* ── EXAM HERO CARD ─────────────────────────────────────── */}
      {primaryExam ? (
        <div className="card anim-up" style={{
          marginBottom: 20, cursor: "pointer",
          position: "relative", overflow: "hidden",
          background: `linear-gradient(135deg, var(--s1), var(--s2))`,
          borderColor: daysLeft <= 3 ? "#dc262630" : undefined,
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = c + "30"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = ""; }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${c}60,transparent)`, animation: "shimmer 4s ease-in-out infinite" }} />
          {daysLeft <= 3 && (
            <div style={{ position: "absolute", top: 8, right: 12, fontSize: 9, color: "#dc2626", fontFamily: "monospace", fontWeight: 700, letterSpacing: ".1em" }}>
              ⚡ {daysLeft === 0 ? "TODAY" : `${daysLeft}D LEFT`}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div className="glow-dot" style={{ background: c }} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: c, letterSpacing: ".18em" }}>ACTIVE DUNGEON</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-.4px", marginBottom: 6 }}>{primaryExam.name}</h2>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "var(--t3)" }}>
                {new Date(primaryExam.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {primaryExam.subjects?.length ? ` · ${primaryExam.subjects.length} subjects` : ""}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 28, flexShrink: 0 }}>
              <Countdown targetDate={primaryExam.date} />
              <ReadinessRing pct={readinessPct} color={c} />
            </div>
          </div>
        </div>
      ) : (
        <div className="card anim-up" style={{ marginBottom: 20, textAlign: "center", padding: 36 }}>
          <div style={{ fontSize: 24, marginBottom: 10, opacity: .3 }}>◫</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>No exam configured</div>
          <div style={{ fontSize: 11, color: "var(--t3)" }}>Go to Dungeons to add your first exam.</div>
        </div>
      )}

      {/* ── STATS ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }} className="stagger">
        <StatCard icon="⚡" value={totalXP.toLocaleString()} label={path.xpLabel.toUpperCase()} color={c}
          onClick={() => fireScouter(totalXP || 1234, path.xpLabel.toUpperCase())} />
        <StatCard icon="✓" value={completed} label={path.sessionLabel.toUpperCase()} color="var(--green)"
          onClick={() => fireScouter(completed, "SESSIONS")} />
        <StatCard icon="🔥" value={streak} label={path.streakLabel.toUpperCase()} color="var(--gold)"
          onClick={() => fireScouter(streak, "STREAK DAYS")} sub={streak >= 7 ? "ELITE 🔥" : undefined} />
        <StatCard icon="◈" value={`${todayDone}/${todayTotal}`} label="TODAY'S DONE" color="var(--purple)"
          onClick={() => fireScouter(todayDone, "TODAY")} />
        <StatCard icon="💀" value={`${meta.ghostRate}%`} label="GHOST RATE" color="#ff4e4e"
          onClick={() => fireScouter(meta.ghostRate, "GHOST RATE")} sub={todayGhosted > 0 ? `${todayGhosted} GHOSTS 💀` : "LOW RISK"} />
      </div>

      {/* ── SYSTEM ANALYSIS & CODEX ───────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Intelligence Intel */}
        <div className="card anim-up" style={{ 
          background: "rgba(13,14,26,0.6)", borderLeft: `2px solid ${c}`
        }}>
          <div style={{ fontSize: 9, color: c, fontFamily: "monospace", letterSpacing: ".15em", marginBottom: 12 }}>
            SYSTEM ANALYSIS: USER PATTERN DETECTED
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--t4)", marginBottom: 4 }}>STRATEGY PROFILE</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#e8ecf4", fontFamily: "monospace" }}>{meta.studentType}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "var(--t4)", marginBottom: 4 }}>OPTIMAL FOCUS HOUR</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#e8ecf4", fontFamily: "monospace" }}>{meta.bestTime}</div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: "var(--t3)", marginTop: 14, fontFamily: "monospace", opacity: 0.7 }}>
            {" >> "} Scheduler is automatically shifting high-difficulty topics to your optimal focus windows.
          </div>
        </div>

        {/* Lore Codex */}
        <div className="card anim-up" style={{ 
          background: "rgba(13,14,26,0.6)", borderLeft: "2px solid #5a6070"
        }}>
          <div style={{ fontSize: 9, color: "#5a6070", fontFamily: "monospace", letterSpacing: ".15em", marginBottom: 12 }}>
            SYSTEM CODEX: TERMINOLOGY
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { t: "Dungeon", d: "Active Exam" },
              { t: "Raid",    d: "Study Session" },
              { t: "Ghost",   d: "Distraction penalty" },
              { t: "Rank",    d: "Academic Mastery" },
            ].map(item => (
              <div key={item.t} style={{ fontSize: 10, fontFamily: "monospace" }}>
                <span style={{ color: c }}>{item.t}:</span> <span style={{ color: "var(--t3)" }}>{item.d}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, color: "var(--t4)", marginTop: 10, fontFamily: "monospace" }}>
             // System Monarch Protocol Active
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>

        {/* Today's sessions */}
        <div className="card anim-up" style={{ animationDelay: ".05s" }}>
          <div className="card-hdr">
            <div className="card-title">Today's {path.navSchedule || "Sessions"}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: c, padding: "3px 8px", border: `1px solid ${c}25`, borderRadius: 6, background: `${c}08` }}>
              {todayDone}/{todayTotal} DONE
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">▸</div>
              <div className="empty-title">No sessions yet</div>
              <div className="empty-sub">Click Generate Schedule to create today's intelligent plan.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {tasks.slice(0, 7).map((t, i) => {
                  const isGhosted   = t.status === "ghosted";
                  const statusLabel = isGhosted ? "GHOSTED" : t.status === "completed" ? "DONE" : t.status === "active" ? "ACTIVE" : t.status === "skipped" ? "SKIP" : t.start_time;
                  const statusColor = t.status === "completed" ? "var(--green)" : t.status === "active" ? c : t.status === "skipped" ? "var(--t4)" : "var(--t3)";
                  const typeColors  = { emergency: "#dc2626", deep: "#7c3aed", practice: "#2563eb", revision: "#0891b2", light: "#d97706" };
                  const typeColor   = typeColors[t.session_type || t.sessionType] || (t.color || c);
                  return (
                    <div key={t.id} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                      borderRadius: 10, background: "var(--s2)",
                      borderLeft: `2px solid ${isGhosted ? "#ff4e4e" : typeColor}`,
                      opacity: (t.status === "completed" || isGhosted) ? .5 : 1,
                      transition: "all .18s",
                      boxShadow: (isGhosted || t.session_type === "emergency" || t.sessionType === "emergency") ? `0 0 12px ${isGhosted ? "rgba(255,78,78,0.15)" : "rgba(220,38,38,0.1)"}` : "none",
                    }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${isGhosted ? "#ff4e4e18" : typeColor + "18"}`, color: isGhosted ? "#ff4e4e" : typeColor, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                        {isGhosted ? "💀" : (t.subject_name || "?")[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: (t.status === "completed" || isGhosted) ? "line-through" : "none", color: isGhosted ? "#ff4e4e" : "inherit" }}>
                          {t.subject_name}
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: isGhosted ? "#ff4e4ea0" : "var(--t3)", marginTop: 1 }}>
                          {t.topic} · {t.duration_mins}min
                          {(t.session_type || t.sessionType) && (
                            <span style={{ color: isGhosted ? "#ff4e4e" : typeColor, marginLeft: 4 }}>· {(t.session_type || t.sessionType).toUpperCase()}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: isGhosted ? "#ff4e4e" : statusColor, fontWeight: 600, flexShrink: 0 }}>
                        {statusLabel}
                      </div>
                    </div>
                  );
              })}
              {tasks.length > 7 && (
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--t3)", textAlign: "center", padding: "8px 0" }}>
                  +{tasks.length - 7} more sessions
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right col */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Rank card */}
          <div className="card anim-up" style={{ animationDelay: ".08s", cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = c + "40"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = ""; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: `${c}12`, border: `1px solid ${c}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: c, transition: "all .3s cubic-bezier(.34,1.56,.64,1)" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.15) rotate(8deg)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
              >{rank.rank}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Rank {rank.rank} — {path.name}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: c, marginTop: 2 }}>{path.char.toUpperCase()} PATH</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--t3)" }}>{path.xpLabel.toUpperCase()}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--t2)", fontWeight: 600 }}>{totalXP.toLocaleString()} / {nextRank?.min.toLocaleString() || "MAX"}</div>
            </div>
            <div className="prog-track">
              <div className="prog-fill" style={{ width: nextRank ? `${Math.min(100, ((totalXP - rank.min) / (nextRank.min - rank.min)) * 100)}%` : "100%", background: c }} />
            </div>
            {nextRank && <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--t4)", textAlign: "center", marginTop: 8 }}>{(nextRank.min - totalXP).toLocaleString()} to <span style={{ color: c }}>RANK {nextRank.rank}</span></div>}
          </div>

          {/* Exam Readiness (critical/at-risk only) */}
          {criticalSubjects.length > 0 && (
            <div className="card anim-up" style={{ animationDelay: ".1s" }}>
              <div className="card-hdr">
                <div className="card-title">⚠️ Needs Attention</div>
              </div>
              <ExamReadiness subjects={criticalSubjects.slice(0, 3)} compact />
            </div>
          )}

          {/* Subject readiness (old) */}
          {primaryExam?.subjects?.length > 0 && criticalSubjects.length === 0 && (
            <div className="card anim-up" style={{ animationDelay: ".1s" }}>
              <div className="card-hdr"><div className="card-title">Dungeon Progress</div></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {primaryExam.subjects.slice(0, 5).map(s => {
                  const topics = s.topics || [];
                  const pct = topics.length ? Math.round(topics.reduce((a, t) => a + (t.progress || 0), 0) / topics.length) : 0;
                  const color = pct < 30 ? "var(--red)" : pct < 60 ? "var(--orange)" : pct < 80 ? "var(--a)" : "var(--green)";
                  return (
                    <div key={s.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 5, height: 5, borderRadius: 1, background: color, flexShrink: 0 }} />
                          {s.name}
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 700, color }}>{pct}%</div>
                      </div>
                      <div className="prog-track">
                        <div className="prog-fill" style={{ width: pct + "%", background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showManual && (
        <ManualRaidModal 
          onClose={() => setShowManual(false)} 
          onSave={handleManualInsert}
          color={c}
        />
      )}
    </div>
  );
}

function ManualRaidModal({ onClose, onSave, color }) {
  const [subject, setSubject] = useState("");
  const [topic,   setTopic]   = useState("");
  const [mins,    setMins]    = useState(60);

  return (
    <Portal>
      <div className="modal-overlay" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", zIndex: 10000 }}>
        <div className="card anim-up" style={{ width: 400, padding: 32, borderTop: `4px solid ${color}` }}>
          <div style={{ fontSize: 9, color, fontFamily: "monospace", letterSpacing: ".15em", marginBottom: 8 }}>
            SYSTEM MONARCH: MANUAL OVERRIDE
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 24 }}>Insert Manual Raid</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="input-group">
              <label>SUBJECT NAME</label>
              <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="e.g. Mathematics" />
            </div>
            <div className="input-group">
              <label>TOPIC / OBJECTIVE</label>
              <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Calculus Revision" />
            </div>
            <div className="input-group">
              <label>DURATION (MINUTES)</label>
              <input type="number" value={mins} onChange={e=>setMins(parseInt(e.target.value))} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
            <button className="btn btn-g" style={{ flex: 1 }} onClick={onClose}>ABORT</button>
            <button className="btn btn-p" style={{ flex: 2 }} onClick={() => onSave({ subject_name:subject, topic, duration_mins:mins })}>
              INITIALIZE RAID ▸
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
