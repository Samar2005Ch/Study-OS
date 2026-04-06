/**
 * pages/Schedule/GhostModal.jsx
 * Shown when a student abandons a session (ghost).
 * Progressive — gets harsher with each ghost.
 */

import { DS } from "../../constants/theme";
import { useRank } from "../../system/RankContext";

const MSGS = {
  1: [
    "One ghost already? The NIMCET exam doesn't ghost you. It shows up.",
    "You vanished from your session. Your syllabus didn't.",
    "25 minutes wasted. That's one full mock-test question gone.",
  ],
  2: [
    "Twice now. That's 50 minutes this exam won't forget.",
    "Two ghosts. The algorithm is noticing your pattern. You should too.",
    "Two abandoned sessions. Your rank just dropped.",
  ],
  3: [
    "Three ghosts. Subject locked for today. Come back tomorrow.",
    "Three strikes. CUET PG doesn't have a retry button.",
    "Session banned. The app gave you chances. The exam won't.",
  ],
};

function getMsg(ghostCount, subjectName) {
  const pool = MSGS[Math.min(ghostCount, 3)];
  const idx  = subjectName.split("").reduce((a,c) => a+c.charCodeAt(0), 0) % pool.length;
  return pool[idx];
}

export default function GhostModal({ task, onResume, onSkip }) {
  const { rank } = useRank();
  const gc     = task.ghostCount;
  const locked = gc >= 3;
  const emoji  = gc >= 3 ? "💀" : gc >= 2 ? "😤" : "👻";
  const msg    = getMsg(gc, task.subjectName);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      background:"rgba(0,0,0,0.92)",
      display:"flex", alignItems:"center", justifyContent:"center",
      backdropFilter:"blur(8px)",
    }}>
      <div style={{
        background: DS.surface,
        border:`1px solid ${DS.danger}33`,
        borderRadius: DS.r20,
        padding:"36px",
        maxWidth:400, width:"90%",
        textAlign:"center",
      }}>
        <div style={{ fontSize:52, marginBottom:12 }}>{emoji}</div>

        <div style={{ fontSize:11, color:DS.danger, fontFamily:DS.fontMono, letterSpacing:"0.1em", marginBottom:8 }}>
          {locked ? "[ SESSION LOCKED ]" : "[ SESSION ABANDONED ]"}
        </div>

        <div style={{ fontSize:18, fontWeight:700, color:DS.textPrimary, marginBottom:6 }}>
          {task.subjectName}
        </div>

        {/* AI message */}
        <div style={{
          fontSize:13, color:DS.textSecondary,
          lineHeight:1.65, padding:"12px 16px",
          background:`${DS.danger}08`,
          border:`1px solid ${DS.danger}20`,
          borderLeft:`3px solid ${DS.danger}`,
          borderRadius:DS.r8,
          textAlign:"left", marginBottom:20,
        }}>
          {msg}
        </div>

        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:20 }}>
          {[
            { icon:"👻", val:gc,           lbl:"ghost(s)"     },
            { icon:"⏱",  val:`${gc*25}m`, lbl:"wasted"       },
            { icon: locked?"🔒":"⚠️", val:locked?"LOCKED":"WARN", lbl:"status" },
          ].map(s => (
            <div key={s.lbl} style={{ background:DS.surfaceAlt, borderRadius:DS.r8, padding:"10px 6px" }}>
              <div style={{ fontSize:18 }}>{s.icon}</div>
              <div style={{ fontSize:15, fontWeight:700, color:s.lbl==="status"&&locked?DS.danger:DS.textPrimary }}>{s.val}</div>
              <div style={{ fontSize:10, color:DS.textMuted }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {locked ? (
          <div style={{ padding:14, borderRadius:DS.r12, background:`${DS.danger}11`, color:DS.danger, fontWeight:600, fontSize:13 }}>
            3 ghosts reached. Subject locked for today.
            <div style={{ fontSize:11, color:DS.textMuted, fontWeight:400, marginTop:4 }}>
              Returns tomorrow with priority boost.
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onResume} style={{ flex:1, padding:13, borderRadius:DS.r12, border:`1px solid ${DS.success}33`, background:`${DS.success}0c`, color:DS.success, fontWeight:600, cursor:"pointer", fontFamily:DS.fontBody }}>
              🔄 Try Again
            </button>
            <button onClick={onSkip} style={{ flex:1, padding:13, borderRadius:DS.r12, border:`1px solid ${DS.danger}33`, background:`${DS.danger}0c`, color:DS.danger, fontWeight:600, cursor:"pointer", fontFamily:DS.fontBody }}>
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
