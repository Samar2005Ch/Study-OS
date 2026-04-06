/**
 * system/RankUpCinematic.jsx
 * Full-screen rank-up animation — Solo Leveling style.
 *
 * Sequence:
 *  0.0s  — Black screen
 *  0.3s  — "[ SYSTEM MESSAGE ]" types in
 *  1.0s  — Screen flash
 *  1.3s  — Rank badge scales in with glow
 *  1.8s  — Rank label types in
 *  2.5s  — Description types in
 *  3.5s  — Particles fade in
 *  5.0s  — Auto dismiss (or tap to dismiss)
 */

import { useEffect, useState } from "react";

function TypeWriter({ text, delay = 0, speed = 40, color = "#e8ecf4", size = 14 }) {
  const [displayed, setDisplayed] = useState("");
  const [started,   setStarted]   = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const t = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);
    return () => clearTimeout(t);
  }, [started, displayed, text, speed]);

  return (
    <span style={{ fontFamily: "monospace", fontSize: size, color, letterSpacing: "0.05em" }}>
      {displayed}
      {displayed.length < text.length && started && (
        <span style={{ animation: "blink 0.6s step-end infinite" }}>|</span>
      )}
    </span>
  );
}

function Particle({ color, delay }) {
  const x     = Math.random() * 100;
  const size  = Math.random() * 4 + 2;
  const dur   = Math.random() * 2 + 1.5;
  return (
    <div style={{
      position: "absolute",
      left:     `${x}%`,
      bottom:   "-10px",
      width:    size,
      height:   size,
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 ${size * 2}px ${color}`,
      animation: `rise ${dur}s ease-out ${delay}s forwards`,
      opacity: 0,
    }} />
  );
}

export default function RankUpCinematic({ rank, theme, prevRank, onDismiss }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1300),
      setTimeout(() => setPhase(4), 1800),
      setTimeout(() => setPhase(5), 2500),
      setTimeout(() => setPhase(6), 3500),
      setTimeout(() => onDismiss(), 7000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const particles = Array.from({ length: 30 }, (_, i) => i);

  // Cinematic flashes per character
  const renderSignatureFlash = () => {
    if (!theme) return <div style={{ position: "absolute", inset: 0, background: rank.primary, animation: "flashIn 0.5s ease forwards", pointerEvents: "none" }} />;
    
    switch (theme.id) {
      case "goku":
      case "vegeta":
        return <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at center, #fff 10%, ${rank.primary} 60%)`, animation: "flashIn 0.8s ease-out forwards", pointerEvents: "none" }} />;
      case "zoro":
      case "levi":
        return (
          <>
            <div style={{ position: "absolute", top:"50%", left:"-50%", width:"200%", height:4, background:"#fff", transform:"rotate(-30deg)", animation: "flashIn 0.3s ease-in forwards", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top:"50%", left:"-50%", width:"200%", height:4, background:"#fff", transform:"rotate(10deg)", animation: "flashIn 0.4s ease-in forwards", pointerEvents: "none" }} />
          </>
        );
      case "gojo":
        return <div style={{ position: "absolute", inset: 0, background: "#fff", animation: "flashIn 1.2s ease forwards", pointerEvents: "none" }} />;
      case "killua":
      case "tanjiro":
        return <div style={{ position: "absolute", inset: 0, background: rank.primary, boxShadow: `inset 0 0 100px ${rank.primary}`, animation: "flashIn 0.2s cubic-bezier(0,2,1,2) 3 forwards", pointerEvents: "none" }} />;
      case "saitama":
        return <div style={{ position: "absolute", inset: 0, background: "#fff", animation: "flashIn 0.1s linear forwards", pointerEvents: "none" }} />;
      default:
        return <div style={{ position: "absolute", inset: 0, background: rank.primary, animation: "flashIn 0.5s ease forwards", pointerEvents: "none" }} />;
    }
  };

  const getSystemMessage = () => {
    if (theme && theme.quotes && theme.quotes.length > 0) {
       return `[ ${theme.quotes[0].toUpperCase()} ]`;
    }
    return `[ ${theme?.tagline?.toUpperCase() || "SYSTEM MESSAGE"} ]`;
  };

  return (
    <div
      onClick={onDismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "#000",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes blink { 50% { opacity: 0 } }
        @keyframes rise {
          0%   { opacity: 0; transform: translateY(0) scale(1); }
          20%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(-60vh) scale(0.3); }
        }
        @keyframes rankGlow {
          0%, 100% { box-shadow: 0 0 30px ${rank.primary}66, 0 0 60px ${rank.primary}33; }
          50%       { box-shadow: 0 0 60px ${rank.primary}aa, 0 0 120px ${rank.primary}55; }
        }
        @keyframes flashIn {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes scaleIn {
          0%   { transform: scale(0.3); opacity: 0; }
          60%  { transform: scale(1.15); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Screen flash */}
      {phase >= 2 && renderSignatureFlash()}

      {/* Particles */}
      {phase >= 6 && particles.map(i => (
        <Particle key={i} color={rank.primary} delay={Math.random() * 1} />
      ))}

      {/* Content */}
      <div style={{ textAlign: "center", padding: "0 24px", position: "relative", zIndex: 1 }}>

        {/* System label */}
        {phase >= 1 && (
          <div style={{ marginBottom: 32, animation: "fadeUp 0.5s ease forwards" }}>
            <TypeWriter
              text={getSystemMessage()}
              delay={0} speed={40}
              color={rank.primary} size={13}
            />
          </div>
        )}

        {/* Rank badge */}
        {phase >= 3 && (
          <div style={{
            width: 120, height: 120,
            borderRadius: 20,
            background: `${rank.primary}18`,
            border: `2px solid ${rank.primary}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 32px",
            animation: "scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards, rankGlow 2s ease infinite 0.6s",
          }}>
            <span style={{
              fontSize: 64, fontWeight: 900,
              color: rank.primary,
              fontFamily: "monospace",
              textShadow: `0 0 20px ${rank.primary}`,
            }}>
              {rank.rank}
            </span>
          </div>
        )}

        {/* Rank label */}
        {phase >= 4 && (
          <div style={{ marginBottom: 12, animation: "fadeUp 0.5s ease forwards" }}>
            <TypeWriter
              text={`RANK ${rank.rank} — ${rank.label.toUpperCase()}`}
              delay={0} speed={45}
              color="#e8ecf4" size={22}
            />
          </div>
        )}

        {/* Evolution Form */}
        {phase >= 4 && (
          <div style={{ marginBottom: 16, animation: "fadeUp 0.6s ease forwards", animationDelay: "0.2s", opacity: 0 }}>
            <span style={{ fontSize: 10, color: "#5a6070", fontFamily: "monospace", letterSpacing: ".1em" }}>NEW FORM UNLOCKED: </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: rank.primary, fontFamily: "monospace", letterSpacing: ".05em", textShadow: `0 0 10px ${rank.primary}` }}>
              {rank.formName?.toUpperCase() || "AWAKENED"}
            </span>
          </div>
        )}

        {/* Description & special move */}
        {phase >= 5 && (
          <div style={{ marginBottom: 40, animation: "fadeUp 0.5s ease forwards" }}>
            <div style={{ marginBottom: 12 }}>
              <TypeWriter
                text={rank.desc}
                delay={0} speed={40}
                color={rank.primary} size={13}
              />
            </div>
            
            <div style={{ padding: "8px 16px", background: `${rank.primary}15`, border: `1px solid ${rank.primary}40`, display: "inline-block" }}>
              <span style={{ fontSize: 9, color: "#8090a8", fontFamily: "monospace", display: "block", marginBottom: 3 }}>SIGNATURE MOVE ACQUIRED</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#fff", fontFamily: "monospace", letterSpacing: ".1em", textShadow: `0 0 14px ${rank.primary}` }}>
                {rank.specialMove?.toUpperCase() || "MAXIMUM POWER"}
              </span>
            </div>
          </div>
        )}

        {/* Dismiss hint */}
        {phase >= 6 && (
          <div style={{ fontSize: 11, color: "#ffffff44", animation: "fadeUp 0.5s ease forwards" }}>
            tap anywhere to continue
          </div>
        )}
      </div>

      {/* Horizontal scan line effect */}
      {phase >= 2 && (
        <div style={{
          position: "absolute", left: 0, right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${rank.primary}, transparent)`,
          animation: "rise 3s ease-out 0s infinite",
          opacity: 0.6,
        }} />
      )}
    </div>
  );
}
