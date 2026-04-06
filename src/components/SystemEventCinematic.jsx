import { useState, useEffect } from "react";
import { useRank } from "../system/RankContext";

const QUOTES = [
  "I alone level up.",
  "The weak have no rights or freedom.",
  "Arise."
];

export default function SystemEventCinematic({ type, onComplete }) {
  const { pathId } = useRank();
  const [visible, setVisible] = useState(true);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  const isSoloLeveling = pathId === "jinwoo";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: type === "arise" ? "radial-gradient(circle, rgba(123,47,190,0.2) 0%, rgba(5,0,16,0.95) 100%)" : "rgba(5,0,16,0.9)",
      pointerEvents: "none",
      animation: "fadeIn .5s ease forwards"
    }}>
      {/* Level Up Cinematic */}
      {type === "levelup" && (
        <div style={{ textAlign: "center", maxWidth: "80%" }}>
          <div className="level-up-text" style={{ fontFamily: 'Orbitron', color: "#00D4FF", textShadow: "0 0 30px rgba(0, 212, 255, 0.4)" }}>
            LEVEL UP
          </div>
          <div style={{ 
            color: "#C8B8FF", fontFamily: "Share Tech Mono", fontSize: 18, 
            letterSpacing: 8, marginTop: 10, opacity: 0,
            animation: "fadeUp .5s .8s ease forwards",
            textTransform: "uppercase"
          }}>
            SYSTEM STATUS: Monarch Evolution
          </div>
          <p className="mono" style={{ color: "rgba(255,255,255,0.4)", marginTop: 40, animation: "fadeIn .8s 1.2s ease forwards", opacity: 0 }}>
             "{quote}"
          </p>
          {/* Particles */}
          {[...Array(30)].map((_, i) => (
             <div key={i} style={{
               position: "absolute", left: "50%", top: "50%",
               width: 3, height: 3, background: "#00D4FF", borderRadius: "50%",
               boxShadow: "0 0 10px #00D4FF",
               animation: `floatParticle ${1 + Math.random() * 2}s ease-out forwards`,
               animationDelay: `${Math.random()}s`,
               transform: `rotate(${Math.random() * 360}deg) translateX(${100 + Math.random() * 200}px)`
             }} />
          ))}
        </div>
      )}

      {/* Arise Cinematic */}
      {type === "arise" && isSoloLeveling && (
        <div style={{ textAlign: "center", position: "relative" }}>
          <div 
             className="arise-glow"
             style={{ 
               fontFamily: "Orbitron", fontSize: "10rem", color: "#fff",
               letterSpacing: 25, marginBottom: 20, fontWeight: 900,
               textShadow: "0 0 40px #7B2FBE, 0 0 80px #00D4FF"
             }}
          >
            ARISE
          </div>
          <div style={{ 
            color: "#00D4FF", fontFamily: "Share Tech Mono", fontSize: 24, 
            marginTop: 20, animation: "fadeUp 1s 0.5s ease forwards", opacity: 0
          }}>
            +100 SYSTEM XP
          </div>
          <div style={{ 
            height: 2, width: 400, background: "linear-gradient(90deg, transparent, #7B2FBE, #00D4FF, #7B2FBE, transparent)",
            margin: "0 auto", animation: "slideInLeft 1s ease forwards", marginTop: 40
          }} />
          {/* Smoke/Shadow Effects (CSS) */}
          <div style={{
            position: "absolute", inset: -150, transform: "scale(2)",
            background: "radial-gradient(circle, transparent 20%, rgba(123,47,190,0.15) 50%, transparent 70%)",
            filter: "blur(60px)", animation: "portalPulse 4s ease-in-out infinite"
          }} />
        </div>
      )}
    </div>
  );
}
