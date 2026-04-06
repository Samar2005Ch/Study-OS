/**
 * system/SystemNotification.jsx
 * Solo Leveling-style toast notification with typewriter effect.
 *
 * Types: success | warning | danger | info | rankup
 */

import { useEffect, useState } from "react";
import { useRank } from "./RankContext";

const TYPE_CONFIG = {
  success: { prefix: "[ QUEST COMPLETE ]",  color: "#00c6a0" },
  warning: { prefix: "[ WARNING ]",          color: "#ff8c42" },
  danger:  { prefix: "[ ALERT ]",            color: "#ff3c3c" },
  info:    { prefix: "[ SYSTEM ]",           color: "#3b9eff" },
  rankup:  { prefix: "[ RANK UP ]",          color: null },     // uses rank color
  ghost:   { prefix: "[ GHOST DETECTED ]",   color: "#ff3c3c" },
};

function TypeWriter({ text, speed = 30 }) {
  const [out, setOut] = useState("");
  useEffect(() => {
    setOut("");
    let i = 0;
    const t = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text]);
  return <>{out}</>;
}

export default function SystemNotification({ type = "info", message, onDone }) {
  const { rank }    = useRank();
  const config      = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const color       = config.color || rank.primary;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone?.(), 400);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: "fixed", top: 20, right: 20,
      zIndex: 9998, maxWidth: 340, width: "90%",
      background: "#07090f",
      border: `1px solid ${color}50`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10,
      padding: "14px 18px",
      boxShadow: `0 0 20px ${color}22`,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateX(0)" : "translateX(20px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
    }}>
      {/* Prefix — typed */}
      <div style={{
        fontSize: 10, fontWeight: 700,
        fontFamily: "monospace",
        color, letterSpacing: "0.1em",
        marginBottom: 6,
      }}>
        <TypeWriter text={config.prefix} speed={25} />
      </div>

      {/* Message */}
      <div style={{
        fontSize: 12, color: "#c8d0e0",
        fontFamily: "monospace",
        lineHeight: 1.5,
      }}>
        <TypeWriter text={message} speed={20} />
      </div>

      {/* Progress bar draining */}
      <div style={{ marginTop: 10, height: 2, background: "#1c2030", borderRadius: 1, overflow: "hidden" }}>
        <div style={{
          height: "100%", background: color,
          borderRadius: 1,
          animation: "drain 4s linear forwards",
        }} />
      </div>

      <style>{`
        @keyframes drain {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
