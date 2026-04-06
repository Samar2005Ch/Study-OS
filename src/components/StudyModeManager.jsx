/**
 * StudyModeManager.jsx
 *
 * Six study modes. Each one changes how the system monitors.
 * Mode can be changed from notification — no need to open app.
 *
 * MODES:
 *   laptop   → normal monitoring, 15 min check
 *   lecture  → audio detection, 30 min check
 *   book     → declared offline, 30 min soft check
 *   phone    → same as book, phone lecture
 *   practice → paper solving, 15 min check
 *   revision → quick read, 15 min check
 *
 * HOW GHOST DETECTION WORKS PER MODE:
 *   Laptop/Practice/Revision:
 *     Any input (key/mouse/touch) in last 15 min → no check
 *     No input → tab title changes to soft prompt
 *     Space to confirm → session continues
 *     5 min no response → ghost
 *
 *   Book/Phone:
 *     Student declared offline — trusted
 *     30 min → tab title soft prompt
 *     5 min no response → ghost
 *     System cannot watch physical world — student is responsible
 *
 *   Lecture:
 *     Audio playing → never ghost, continue
 *     Audio stops → 10 min grace → then normal check
 *     30 min check interval
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ── Mode definitions ──────────────────────────────────────────────
export const MODES = {
  laptop: {
    id:        "laptop",
    label:     "On Laptop",
    icon:      "💻",
    desc:      "Notes, PDFs, browser",
    checkMins: 15,
    graceMins: 5,
    watchAudio:false,
    tabPrompt: "Still here? · tap space",
    color:     "#4f6ef7",
  },
  lecture: {
    id:        "lecture",
    label:     "Video Lecture",
    icon:      "📺",
    desc:      "YouTube, PW, Unacademy",
    checkMins: 30,
    graceMins: 10,
    watchAudio:true,
    tabPrompt: "Lecture mode · tap space",
    color:     "#f06060",
  },
  book: {
    id:        "book",
    label:     "From Book",
    icon:      "📖",
    desc:      "Textbook, printed notes",
    checkMins: 30,
    graceMins: 5,
    watchAudio:false,
    tabPrompt: "Book mode · tap space",
    color:     "#2de2a0",
  },
  phone: {
    id:        "phone",
    label:     "Phone Lecture",
    icon:      "📱",
    desc:      "Watching on phone",
    checkMins: 30,
    graceMins: 5,
    watchAudio:false,
    tabPrompt: "Phone mode · tap space",
    color:     "#f5c842",
  },
  practice: {
    id:        "practice",
    label:     "Practising",
    icon:      "✏️",
    desc:      "Solving on paper",
    checkMins: 15,
    graceMins: 5,
    watchAudio:false,
    tabPrompt: "Practice · tap space",
    color:     "#9b6dff",
  },
  revision: {
    id:        "revision",
    label:     "Quick Revision",
    icon:      "⚡",
    desc:      "Flashcards, quick read",
    checkMins: 15,
    graceMins: 5,
    watchAudio:false,
    tabPrompt: "Revision · tap space",
    color:     "#38bdf8",
  },
};

// ── Notification helper ───────────────────────────────────────────
let _activeNotif = null;

function sendNotif(title, body, { tag="studyos", requireInteraction=false }={}) {
  if (Notification.permission !== "granted") return;
  _activeNotif?.close();
  _activeNotif = new Notification(title, {
    body,
    tag,
    requireInteraction,
    icon: "/favicon.ico",
    silent: false,
  });
  _activeNotif.onclick = () => { window.focus(); _activeNotif?.close(); };
  return _activeNotif;
}

function closeNotif() {
  _activeNotif?.close();
  _activeNotif = null;
}

async function requestNotifPermission() {
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied")  return false;
  const r = await Notification.requestPermission();
  return r === "granted";
}

// ── Tab title ─────────────────────────────────────────────────────
const _origTitle = document.title;
function setTab(t) { document.title = t; }
function resetTab() { document.title = _origTitle; }
function fmtSecs(s) {
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}

// ══════════════════════════════════════════════════════════════════
// MODE SELECTOR UI
// ══════════════════════════════════════════════════════════════════
export function ModeSelector({ current, onChange, compact=false }) {
  const modes = Object.values(MODES);

  if (compact) {
    return (
      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
        {modes.map(m => {
          const active = current === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              title={`${m.label} — ${m.desc}`}
              style={{
                height:28, padding:"0 10px",
                background: active ? `${m.color}18` : "rgba(255,255,255,0.03)",
                border: `1px solid ${active ? m.color+"44" : "rgba(255,255,255,0.07)"}`,
                borderRadius:7,
                color: active ? m.color : "#555",
                fontSize:11, fontWeight:600, cursor:"pointer",
                fontFamily:"Inter,sans-serif",
                transition:"all .18s",
                display:"flex", alignItems:"center", gap:5,
              }}
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = `${m.color}10`;
                  e.currentTarget.style.borderColor = `${m.color}30`;
                  e.currentTarget.style.color = m.color;
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.color = "#555";
                }
              }}
            >
              <span style={{ fontSize:14 }}>{m.icon}</span>
              {m.label}
            </button>
          );
        })}
      </div>
    );
  }

  // Full selector — shown at session start
  return (
    <div style={{
      background: "rgba(10,10,14,0.97)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 20,
      padding: 28,
      backdropFilter: "blur(32px)",
    }}>
      <div style={{
        fontFamily:"JetBrains Mono,monospace",
        fontSize:10, color:"#4f6ef7",
        letterSpacing:".18em", marginBottom:6,
      }}>HOW ARE YOU STUDYING?</div>

      <div style={{
        fontSize:13, color:"#444",
        marginBottom:22, lineHeight:1.5,
      }}>
        Pick your mode. Switch anytime — even from the desktop notification.
        System adjusts ghost detection automatically.
      </div>

      <div style={{
        display:"grid",
        gridTemplateColumns:"1fr 1fr 1fr",
        gap:9,
      }}>
        {modes.map(m => {
          const active = current === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              style={{
                padding:"16px 14px",
                background: active ? `${m.color}12` : "rgba(255,255,255,0.025)",
                border: `1px solid ${active ? m.color+"35" : "rgba(255,255,255,0.06)"}`,
                borderRadius:13,
                cursor:"pointer",
                transition:"all .2s cubic-bezier(.4,0,.2,1)",
                textAlign:"left",
                fontFamily:"Inter,sans-serif",
                position:"relative",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${m.color}10`;
                e.currentTarget.style.borderColor = `${m.color}30`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = active ? `${m.color}12` : "rgba(255,255,255,0.025)";
                e.currentTarget.style.borderColor = active ? `${m.color}35` : "rgba(255,255,255,0.06)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {active && (
                <div style={{
                  position:"absolute", top:8, right:8,
                  width:6, height:6,
                  background:m.color, borderRadius:"50%",
                  boxShadow:`0 0 8px ${m.color}`,
                }}/>
              )}
              <div style={{ fontSize:24, marginBottom:8 }}>{m.icon}</div>
              <div style={{
                fontSize:12, fontWeight:700,
                color: active ? m.color : "#efefef",
                marginBottom:4,
              }}>{m.label}</div>
              <div style={{
                fontSize:10, color:"#444", lineHeight:1.4,
              }}>{m.desc}</div>
              <div style={{
                fontFamily:"JetBrains Mono,monospace",
                fontSize:9, color:"#2a2a2a",
                marginTop:8,
              }}>
                Check every {m.checkMins}min
              </div>
            </button>
          );
        })}
      </div>

      <div style={{
        fontFamily:"JetBrains Mono,monospace",
        fontSize:9, color:"#222",
        textAlign:"center", marginTop:16,
        letterSpacing:".1em",
      }}>
        BOOK / PHONE MODE = SYSTEM TRUSTS YOU · YOUR RESULTS REVEAL THE TRUTH
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// STUDY MONITOR HOOK
// ══════════════════════════════════════════════════════════════════
export function useStudyMonitor({
  isRunning,
  mode = "laptop",
  onGhost,
  onSoftCheck,   // called when soft check fires ("checking" | "confirmed")
  subjectName = "Session",
  secsRemaining = 0,
}) {
  const cfg           = MODES[mode] || MODES.laptop;
  const lastInput     = useRef(Date.now());
  const awaiting      = useRef(false);
  const audioActive   = useRef(false);
  const checkTimer    = useRef(null);
  const graceTimer    = useRef(null);
  const notifOk       = useRef(false);

  // Request permission once
  useEffect(() => {
    requestNotifPermission().then(ok => { notifOk.current = ok; });
  }, []);

  // Track ANY user input
  useEffect(() => {
    if (!isRunning) return;
    const up = () => { lastInput.current = Date.now(); };
    ["keydown","mousemove","mousedown","touchstart","scroll"].forEach(ev =>
      window.addEventListener(ev, up, { passive:true })
    );
    return () => {
      ["keydown","mousemove","mousedown","touchstart","scroll"].forEach(ev =>
        window.removeEventListener(ev, up)
      );
    };
  }, [isRunning]);

  // Spacebar to confirm presence
  useEffect(() => {
    if (!isRunning) return;
    const onKey = (e) => {
      if (e.code === "Space" && awaiting.current) {
        e.preventDefault();
        confirmPresent();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRunning]);

  // Audio detection for lecture mode
  useEffect(() => {
    if (!isRunning || !cfg.watchAudio) return;
    let ctx, src, raf;
    const init = async () => {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        src = ctx.createMediaStreamSource(stream);
        src.connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);
        const tick = () => {
          analyser.getByteTimeDomainData(buf);
          const vol = buf.reduce((a,b) => a + Math.abs(b-128), 0) / buf.length;
          audioActive.current = vol > 1.5;
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch { audioActive.current = false; }
    };
    init();
    return () => {
      cancelAnimationFrame(raf);
      ctx?.close();
    };
  }, [isRunning, cfg.watchAudio]);

  const confirmPresent = useCallback(() => {
    awaiting.current = false;
    clearTimeout(graceTimer.current);
    resetTab();
    closeNotif();
    onSoftCheck?.("confirmed");
    // Reset check timer
    scheduleCheck();
  }, []);

  const fireGhost = useCallback(() => {
    awaiting.current = false;
    resetTab();
    closeNotif();
    onGhost?.();
  }, [onGhost]);

  const softCheck = useCallback(() => {
    if (!isRunning) return;

    const minsSinceInput = (Date.now() - lastInput.current) / 60000;

    // Recent input → no check needed
    if (minsSinceInput < cfg.checkMins * 0.75) {
      scheduleCheck();
      return;
    }

    // Lecture mode + audio playing → no ghost
    if (cfg.watchAudio && audioActive.current) {
      scheduleCheck();
      return;
    }

    // Fire soft check
    awaiting.current = true;
    onSoftCheck?.("checking");

    // Tab title prompt
    const timer = fmtSecs(secsRemaining);
    setTab(`${cfg.icon} ${cfg.tabPrompt} · ${timer}`);

    // Desktop notification with mode info
    if (notifOk.current) {
      sendNotif(
        `StudyOS · ${subjectName}`,
        `Still studying?\n${cfg.icon} ${cfg.label} · Tap space or click to confirm`,
        { tag:"liveness", requireInteraction:true }
      );
    }

    // Grace period → then ghost
    graceTimer.current = setTimeout(() => {
      if (awaiting.current) fireGhost();
    }, cfg.graceMins * 60 * 1000);

  }, [isRunning, cfg, secsRemaining, subjectName, onSoftCheck, fireGhost]);

  const scheduleCheck = useCallback(() => {
    clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(softCheck, cfg.checkMins * 60 * 1000);
  }, [softCheck, cfg.checkMins]);

  // Start/stop
  useEffect(() => {
    if (isRunning) {
      scheduleCheck();
    } else {
      clearTimeout(checkTimer.current);
      clearTimeout(graceTimer.current);
      awaiting.current = false;
      resetTab();
      closeNotif();
    }
    return () => {
      clearTimeout(checkTimer.current);
      clearTimeout(graceTimer.current);
    };
  }, [isRunning, scheduleCheck]);

  // Update tab title every second while running
  useEffect(() => {
    if (!isRunning || awaiting.current) return;
    const iv = setInterval(() => {
      if (!awaiting.current) {
        setTab(`${cfg.icon} ${fmtSecs(secsRemaining)} · ${subjectName}`);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [isRunning, secsRemaining, subjectName, cfg]);

  return { confirmPresent };
}

// ══════════════════════════════════════════════════════════════════
// NOTIFICATION SCHEDULER — exam alerts, streak warnings
// Called once on app load
// ══════════════════════════════════════════════════════════════════
export async function scheduleStudyNotifications({
  exams = [],
  streak = 0,
  pathId = "shadow",
  subjects = [],
  sessionsToday = 0,
}) {
  const ok = await requestNotifPermission();
  if (!ok) return;

  const now  = new Date();
  const hour = now.getHours();

  // Exam countdown alerts
  for (const exam of exams) {
    const days = Math.ceil((new Date(exam.date) - now) / 86400000);

    if (days === 7) {
      const weak = subjects.filter(s => s.pct < 50).map(s => s.name).join(", ");
      sendNotif(
        `📅 One week to ${exam.name}`,
        weak ? `Critical topics: ${weak}` : "Final week. Full focus.",
        { tag:"exam-week" }
      );
    }

    if (days === 3) {
      sendNotif(
        `⚠️ 3 days to ${exam.name}`,
        "No casual sessions. Every minute counts now.",
        { tag:"exam-3d", requireInteraction:true }
      );
    }

    if (days === 1) {
      sendNotif(
        `Tomorrow: ${exam.name}`,
        "Revise today. No new topics. Sleep on time.",
        { tag:"exam-1d", requireInteraction:true }
      );
    }

    if (days === 0) {
      sendNotif(
        `Today: ${exam.name}`,
        "You have trained. Enter.",
        { tag:"exam-day", requireInteraction:true }
      );
    }
  }

  // Morning reminder (7-9am, no session yet today)
  if (hour >= 7 && hour <= 9 && sessionsToday === 0) {
    sendNotif(
      "StudyOS · Morning",
      "No session yet today. Schedule is waiting.",
      { tag:"morning" }
    );
  }

  // Evening streak risk (8-10pm, no session today, streak > 3)
  if (hour >= 20 && hour <= 22 && sessionsToday === 0 && streak > 3) {
    sendNotif(
      `🔥 ${streak} day streak at risk`,
      "No session recorded today. Study now to keep it.",
      { tag:"streak-risk", requireInteraction:true }
    );
  }
}

export default { ModeSelector, useStudyMonitor, scheduleStudyNotifications, MODES };
