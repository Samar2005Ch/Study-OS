/**
 * pages/Schedule/LivenessModal.jsx
 * Fullscreen check-in modal — appears after every 25-min work block.
 * Student has 5 minutes to respond. No response = ghost.
 */

import { useState, useEffect } from "react";
import { DS } from "../../constants/theme";
import { useRank } from "../../system/RankContext";
import { GHOST_SECS } from "../../hooks/useStudySession";

function fmtSecs(s) {
  return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
}

const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excluding easily confused chars O/0, I/1
  let res = '';
  for(let i=0; i<3; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
  return res;
};

export default function LivenessModal({ task, cdSecs, onAlive, onStop }) {
  const { rank } = useRank();
  const [captcha, setCaptcha] = useState("");
  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    setCaptcha(generateCaptcha());
    // play a quick ping
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch(e) {}
  }, []);

  const handleAttempt = () => {
    if (inputVal.toUpperCase() === captcha) {
      onAlive();
    } else {
      setInputVal("");
    }
  };
  const pct     = Math.round((cdSecs / GHOST_SECS) * 100);
  const urgColor = pct > 60 ? rank.primary : pct > 25 ? DS.warning : DS.danger;
  const r = 36, circ = 2 * Math.PI * r;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      background:"rgba(0,0,0,0.88)",
      display:"flex", alignItems:"center", justifyContent:"center",
      backdropFilter:"blur(8px)",
    }}>
      <div style={{
        background: DS.surface,
        border:`1px solid ${urgColor}40`,
        borderRadius: DS.r20,
        padding:"40px 36px",
        maxWidth:360, width:"90%",
        textAlign:"center",
      }}>
        {/* Eye icon */}
        <div style={{ fontSize:52, marginBottom:12 }}>👁️</div>

        {/* System style title */}
        <div style={{ fontSize:11, color:rank.primary, fontFamily:DS.fontMono, letterSpacing:"0.1em", marginBottom:8 }}>
          [ SYSTEM CHECK ]
        </div>
        <div style={{ fontSize:20, fontWeight:700, color:DS.textPrimary, marginBottom:6 }}>
          Still studying?
        </div>
        <div style={{ fontSize:13, color:DS.textSecondary, marginBottom:4 }}>
          {task.subjectName} · {task.topic}
        </div>
        <div style={{ fontSize:11, color:DS.textMuted, marginBottom:24 }}>
          You completed a 25-min focus block.
        </div>

        {/* Countdown ring */}
        <div style={{ position:"relative", display:"inline-flex", marginBottom:20 }}>
          <svg width={88} height={88} style={{ transform:"rotate(-90deg)" }}>
            <circle cx={44} cy={44} r={r} fill="none" stroke={DS.surfaceAlt} strokeWidth={6}/>
            <circle cx={44} cy={44} r={r} fill="none" stroke={urgColor} strokeWidth={6}
              strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
              strokeLinecap="round" style={{ transition:"stroke-dashoffset 1s linear, stroke .4s" }}/>
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontSize:20, fontWeight:700, color:urgColor, fontFamily:DS.fontMono }}>{fmtSecs(cdSecs)}</div>
            <div style={{ fontSize:9, color:DS.textMuted }}>to respond</div>
          </div>
        </div>

        {/* Warning */}
        <div style={{
          fontSize:11, color:DS.danger, marginBottom:20,
          padding:"8px 12px", background:`${DS.danger}12`,
          borderRadius:DS.r8,
        }}>
          No response = session marked abandoned.
          {task.ghostCount > 0 && ` (${task.ghostCount} ghost(s) already)`}
        </div>

        <div style={{
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <div style={{ fontSize: 18, fontFamily: DS.fontMono, letterSpacing: "0.2em", background: `${DS.surfaceAlt}80`, padding: "8px 16px", borderRadius: DS.r8, marginBottom: 12, fontWeight: 700, color: rank.primary, userSelect: "none" }}>
            {captcha}
          </div>
          <input
            autoFocus
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => { if(e.key === "Enter") handleAttempt(); }}
            placeholder="Type code..."
            style={{
              padding: "12px", borderRadius: DS.r8, border: `1px solid ${urgColor}40`,
              background: "rgba(0,0,0,0.2)", color: "#fff", fontFamily: DS.fontMono,
              fontSize: 14, textAlign: "center", width: "100%", letterSpacing: "0.1em"
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={handleAttempt} style={{
            flex:2, padding:14, borderRadius:DS.r12,
            border:"none", background: inputVal.toUpperCase() === captcha ? rank.primary : DS.surfaceAlt,
            color:"#fff", fontWeight:700, fontSize:14,
            cursor: inputVal.toUpperCase() === captcha ? "pointer" : "not-allowed",
            fontFamily:DS.fontBody, transition: "all 0.2s"
          }}>
            ✅ VERIFY
          </button>
          <button onClick={onStop} style={{
            flex:1, padding:14, borderRadius:DS.r12,
            border:`1px solid ${DS.danger}33`,
            background:`${DS.danger}0c`,
            color:DS.danger, fontWeight:600,
            fontSize:13, cursor:"pointer",
            fontFamily:DS.fontBody,
          }}>
            Stop
          </button>
        </div>
      </div>
    </div>
  );
}
