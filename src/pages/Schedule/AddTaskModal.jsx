import { useState } from "react";
import { useRank } from "../../system/RankContext";

export default function AddTaskModal({ isOpen, onClose, onAdd, atTime }) {
  const { rank } = useRank();
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(45);

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
      animation: "fadeIn .3s ease"
    }}>
      <div className="gl neon" style={{
        width: 480, padding: 32, display: "flex", flexDirection: "column", gap: 24,
        background: "var(--surface)", border: `1px solid ${rank.primary}40`,
        boxShadow: `0 0 50px ${rank.primary}15`,
        animation: "scaleIn .3s cubic-bezier(.34,1.56,.64,1)"
      }}>
        <div>
          <div className="label-tag" style={{ color: rank.primary, marginBottom: 8 }}>Manual Deployment</div>
          <h2 style={{ fontSize: 24, fontWeight: 900 }}>Insert Quest Segment</h2>
          <p className="mono" style={{ fontSize: 11, color: "var(--t3)", marginTop: 8 }}>
            TARGET TIME: <span style={{ color: rank.primary }}>{atTime || "??:??"}</span>
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="mono" style={{ fontSize: 10, color: "var(--t3)" }}>SUBJECT DESIGNATION</label>
            <input 
              className="gl" 
              type="text" 
              placeholder="e.g. Mathematics, Advanced Physics"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              style={{ padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--b2)" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="mono" style={{ fontSize: 10, color: "var(--t3)" }}>OBJECTIVE / TOPIC</label>
            <input 
              className="gl" 
              type="text" 
              placeholder="e.g. Calculus Integration"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              style={{ padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--b2)" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="mono" style={{ fontSize: 10, color: "var(--t3)" }}>DURATION (MINUTES)</label>
            <input 
              className="gl" 
              type="number" 
              value={duration}
              onChange={e => setDuration(parseInt(e.target.value))}
              style={{ padding: "14px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--b2)" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>CANCEL</button>
          <button 
            className="btn-primary" 
            onClick={() => onAdd({ subject_name: subject, topic, duration_mins: duration, atTime })}
            style={{ flex: 2 }}
            disabled={!subject}
          >
            CONFIRM INSERTION
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        input:focus {
          outline: none;
          border-color: ${rank.primary} !important;
          box-shadow: 0 0 15px ${rank.primary}30;
        }
      `}</style>
    </div>
  );
}
