import { useState, useEffect, useMemo } from 'react';
import { useRank } from '../system/RankContext';

// ── Dynamic Titles per Theme ─────────────────────────────────────
const getThemeTitles = (pathId) => {
  const defaults = {
    dashboard:     "[ COMMAND CENTER ]",
    exams:         "[ EXAM REGISTRY ]",
    skills:        "[ SKILL MATRIX ]",
    timetable:     "[ TIMETABLE ]",
    schedule:      "[ DAILY QUESTS ]",
    analytics:     "[ HUNTER STATS ]",
    chat:          "[ AI ASSISTANT ]",
    notifications: "[ SYSTEM ALERTS ]",
    rankpreview:   "[ RANK SYSTEM ]",
    profile:       "[ HUNTER PROFILE ]",
  };

  const themes = {
    goku: {
      dashboard: "[ CORE HQ ]",
      exams:     "[ WORLD TOURNAMENT ]",
      schedule:  "[ TRAINING LOG ]",
      analytics: "[ POWER LEVEL ]",
      skills:    "[ TECHNIQUES ]",
    },
    jinwoo: {
      dashboard: "[ DUNGEON GATE ]",
      exams:     "[ GATE REGISTRY ]",
      schedule:  "[ DAILY QUEST ]",
      analytics: "[ HUNTER STATS ]",
      skills:    "[ SHADOW ARMY ]",
    },
    naruto: {
      dashboard: "[ HOKAGE OFFICE ]",
      exams:     "[ CHUNIN EXAMS ]",
      schedule:  "[ NINJA MISSIONS ]",
      analytics: "[ CHAKRA INTEL ]",
      skills:    "[ JUTSU GALLERY ]",
    },
    gojo: {
      dashboard: "[ INFINITY CORE ]",
      exams:     "[ GRADE FILTER ]",
      schedule:  "[ EXORCISM LOG ]",
      analytics: "[ VOID INTEL ]",
      skills:    "[ SIX EYES ]",
    },
    luffy: {
      dashboard: "[ GRAND LINE ]",
      exams:     "[ BOUNTY BOARD ]",
      schedule:  "[ LOG POSE ]",
      analytics: "[ NAV STATS ]",
      skills:    "[ NAKAMA SKILL ]",
    },
  };

  return themes[pathId] || themes.jinwoo || defaults;
};

export default function Topbar({ activePage, onNavigate }) {
  const { rank, pathId, theme } = useRank();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const isSystem = pathId === "jinwoo";
  const titles = useMemo(() => getThemeTitles(pathId), [pathId]);

  const hh = String(time.getHours()).padStart(2,'0');
  const mm = String(time.getMinutes()).padStart(2,'0');
  const ss = String(time.getSeconds()).padStart(2,'0');

  return (
    <header 
      className={`gl ${isSystem ? 'system-window' : ''}`}
      style={{
        padding: '12px 24px',
        borderRadius: 0,
        borderBottom: isSystem ? 'none' : '1px solid rgba(255,255,255,0.04)',
        background: isSystem ? 'rgba(8,9,18,0.85)' : 'rgba(8,9,18,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, position: 'relative', zIndex: 100
      }}
    >
      {/* Bottom accent glow line */}
      <div style={{
        position: 'absolute', bottom: -1, left: '10%', right: '10%', height: 1,
        background: isSystem ? "linear-gradient(90deg, transparent, #00b7ff, transparent)" : `linear-gradient(90deg, transparent, ${rank.primary}, transparent)`,
        boxShadow: isSystem ? "0 0 12px #00b7ff" : `0 0 12px ${rank.primary}`, opacity: 0.6
      }} />

      {/* Left: Page Title */}
      <div 
        className="mono"
        style={{
          fontSize: 11, color: isSystem ? "#00b7ff" : rank.primary,
          letterSpacing: '.18em', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8
        }}
      >
        <div style={{
          width: 6, height: 6, background: isSystem ? "#00b7ff" : rank.primary, 
          borderRadius: 1, transform: 'rotate(45deg)',
          boxShadow: isSystem ? "0 0 8px #00b7ff" : `0 0 8px ${rank.primary}`
        }} />
        {isSystem ? `[ ${activePage.toUpperCase().replace('_',' ')} ]` : (titles[activePage] || '[ SYSTEM ]')}
        <span style={{ animation: 'blinkCursor .8s step-end infinite', color: 'var(--t2)' }}>_</span>
      </div>

      {/* Right: Time + Rank + Theme Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        
        {/* Clock */}
        <div className="mono" style={{ fontSize: 13, letterSpacing: '.05em', color: 'var(--t1)' }}>
          <span style={{ color: 'var(--t1)' }}>{hh}</span>
          <span style={{ color: isSystem ? "#00b7ff" : rank.primary, animation: 'blinkCursor 1s step-end infinite', margin: '0 2px' }}>:</span>
          <span style={{ color: 'var(--t1)' }}>{mm}</span>
          <span style={{ color: isSystem ? "#00b7ff" : rank.primary, animation: 'blinkCursor 1s step-end infinite', margin: '0 2px' }}>:</span>
          <span style={{ color: 'var(--t3)', fontSize: 11 }}>{ss}</span>
        </div>

        {/* Theme Pill */}
        <div
          onClick={() => onNavigate('rankpreview')}
          className={`gl hov neon ${isSystem ? 'system-window' : ''}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '5px 14px', borderRadius: 20,
            background: 'rgba(255,255,255,0.03)',
            cursor: 'pointer', border: isSystem ? 'none' : `1px solid ${rank.primary}20`
          }}
        >
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isSystem ? "#00b7ff" : rank.primary, 
            boxShadow: isSystem ? "0 0 8px #00b7ff" : `0 0 8px ${rank.primary}`,
            animation: 'dotGlow 3s infinite'
          }} />
          <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', color: isSystem ? "#00b7ff" : rank.primary }}>
            {theme?.character?.toUpperCase() || 'SYSTEM'} ACTIVE
          </span>
          <div style={{
            fontFamily: 'Space Grotesk', fontSize: 11, fontWeight: 800,
            color: '#fff', borderLeft: '1px solid rgba(255,255,255,0.1)',
            paddingLeft: 10, marginLeft: 2
          }}>
            {rank.name?.toUpperCase() || 'RANK E'}
          </div>
        </div>

        {/* Profile/Menu trigger (optional for now, maps to profile) */}
        <div 
          onClick={() => onNavigate('profile')}
          style={{
            width: 34, height: 34, borderRadius: '50%', 
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all .22s'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = rank.primary}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
        >
          <span style={{ fontSize: 14 }}>⚙</span>
        </div>
      </div>

      <style>{`
        @keyframes blinkCursor { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </header>
  );
}
