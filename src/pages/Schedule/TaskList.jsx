import { useRank } from "../../system/RankContext";

const f = (task, snake, camel) => task[snake] ?? task[camel];

function StatusChip({ status, color }) {
  const S = {
    done:      { label: "CLEARED", bg: "rgba(45,226,160,0.1)", border: "rgba(45,226,160,0.3)", text: "var(--green)" },
    active:    { label: "ENGAGED", bg: "rgba(79,110,247,0.1)", border: "rgba(79,110,247,0.3)", text: "var(--a)" },
    skipped:   { label: "OVERLOOKED", bg: "rgba(240,96,96,0.1)", border: "rgba(240,96,96,0.3)", text: "var(--red)" },
    ghosted:   { label: "ABANDONED", bg: "rgba(240,96,96,0.1)", border: "rgba(240,96,96,0.3)", text: "var(--red)" },
    postponed: { label: "REQUEUED", bg: "rgba(245,200,66,0.1)", border: "rgba(245,200,66,0.3)", text: "var(--gold)" },
    pending:   { label: "AWAITING", bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.1)", text: "var(--t3)" },
  };
  const cfg = S[status] || S.pending;
  
  return (
    <div className="mono" style={{ 
      fontSize: 9, fontWeight: 800, padding: "4px 10px", borderRadius: 6,
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text,
      letterSpacing: ".12em"
    }}>
      {cfg.label}
    </div>
  );
}

export default function TaskList({ tasks, onAction }) {
  const { rank } = useRank();
  const c = rank.primary;

  const isAnyActive = tasks.some(t => t.status === "active");
  const firstPendingId = tasks.find(t => t.status === "pending" || t.status === "postponed")?.id;

  if (!tasks.length) return (
    <div style={{ padding: "60px 0", textAlign: "center", color: "var(--t3)" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>empty</div>
      <div className="mono" style={{ fontSize: 11 }}>No quest segments found. Click Generate to begin.</div>
    </div>
  );

  return (
    <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {tasks.map((task, i) => {
        const sName  = f(task, "subject_name", "subjectName");
        const topic  = task.topic || "Investigation";
        const status = task.status || "pending";
        const isDone = ["done", "skipped", "ghosted"].includes(status);
        const isActive = status === "active";
        
        const nextTask = tasks[i + 1];
        const showInsertionZone = !isActive && !isDone && nextTask;

        return (
          <div key={task.id}>
            <div 
              className={`gl hov ${isActive ? 'neon' : ''}`}
              style={{
                padding: "16px 20px", display: "flex", alignItems: "center", gap: 18,
                borderLeft: `3px solid ${isDone ? 'var(--b2)' : c}`,
                opacity: isDone ? 0.6 : 1, transition: "all .3s",
                marginBottom: 10
              }}
            >
              {/* Subject Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: `linear-gradient(135deg, ${c}20, transparent)`,
                border: `1px solid ${c}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 900, color: c
              }}>
                {(sName || "H").slice(0, 1).toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
                  {sName}
                  <span className="mono" style={{ fontSize: 10, color: "var(--t3)", fontWeight: 500 }}>// {topic}</span>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--t3)" }}>
                    {f(task, "start_time", "start")} – {f(task, "end_time", "end")} // <span style={{ color: "var(--t2)" }}>{f(task, "duration_mins", "durationMins")}M</span>
                  </div>
                  {f(task, "ai_reason", "aiReason") && (
                    <div className="mono" style={{ fontSize: 10, color: c }}>
                      &gt;&gt; {f(task, "ai_reason", "aiReason")}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ textAlign: "right" }}>
                  <div className="mono" style={{ fontSize: 12, color: "var(--t2)", fontWeight: 800 }}>
                    +{task.xp || 0} XP
                  </div>
                </div>
                
                <StatusChip status={status} color={c} />

                {(status === "pending" || status === "postponed") && !isAnyActive && task.id === firstPendingId && (
                  <button 
                    className="btn-primary" 
                    onClick={() => handleStartMission(task.id)}
                    style={{ 
                      height: 36, padding: "0 16px", fontSize: 11,
                      background: isSystem ? "linear-gradient(135deg, #00b7ff, #7000ff)" : "var(--rank-gradient)"
                    }}
                  >
                    {isSystem ? "START QUEST" : "START MISSION"}
                  </button>
                )}
              </div>
            </div>

            {showInsertionZone && (
              <div 
                className="insertion-zone"
                onClick={() => onAction(task.id, "insert", task.end_time)}
                style={{
                  height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "-5px 0 5px 0", cursor: "pointer", position: "relative"
                }}
              >
                <div style={{ width: 1, height: "100%", background: "var(--b2)", position: "absolute", left: 19 }} />
                <div className="ins-btn mono" style={{
                  fontSize: 8, fontWeight: 950, color: "var(--t3)", background: "var(--b1)",
                  padding: "2px 10px", borderRadius: 20, border: "1px solid var(--b2)",
                  zIndex: 2, transition: "all .22s"
                }}>
                  INSERT SEGMENT @ {task.end_time}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <style>{`
        .insertion-zone:hover .ins-btn {
          color: ${c};
          border-color: ${c}60;
          box-shadow: 0 0 10px ${c}30;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
