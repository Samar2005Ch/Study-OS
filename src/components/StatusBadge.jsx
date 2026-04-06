/**
 * components/StatusBadge.jsx
 * Status indicator with blinking cursor for ACTIVE/PENDING states.
 */

import { useState, useEffect } from "react";

const STATUS = {
  pending:   { color:"#5a6070", label:"STANDBY"  },
  active:    { color:null,      label:"ACTIVE",  blink:true },
  done:      { color:"#00c6a0", label:"COMPLETE" },
  skipped:   { color:"#ff3c3c", label:"SKIPPED"  },
  ghosted:   { color:"#ff3c3c", label:"GHOST"    },
  locked:    { color:"#ff3c3c", label:"LOCKED"   },
};

export default function StatusBadge({ status, rankColor }) {
  const [cursor, setCursor] = useState(true);
  const cfg = STATUS[status] || STATUS.pending;
  const c   = cfg.color || rankColor || "#8892a4";

  useEffect(() => {
    if (!cfg.blink) return;
    const t = setInterval(() => setCursor(v=>!v), 500);
    return () => clearInterval(t);
  }, [cfg.blink]);

  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      color: c,
      fontFamily: "monospace",
      letterSpacing: "0.08em",
      padding: "3px 8px",
      border: `1px solid ${c}40`,
      background: `${c}10`,
      borderRadius: 0,
    }}>
      {cfg.label}{cfg.blink && (cursor ? "_" : " ")}
    </span>
  );
}
