import { useAuth } from "../../system/AuthContext";
import { useRank } from "../../system/RankContext";
import { useStudyHistory } from "../../hooks/useStudyHistory";
import { useSubjects } from "../../hooks/useSubjects";
import { calcAnalytics } from "../../hooks/useAnalytics";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { rank, totalXP, pathId } = useRank();
  const { history } = useStudyHistory();
  const { subjects } = useSubjects();
  const stats = calcAnalytics(history, subjects);

  const c = rank.primary;

  return (
    <div className="page-enter" style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div className="label-tag" style={{ color: c, marginBottom: 8 }}>Internal Registry</div>
        <h1 style={{ fontSize: 36, fontWeight: 950, letterSpacing: "-1.5px" }}>{rank.uiLabels?.profile || "Identification Card"}</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        
        {/* Hunter Card Left */}
        <div className="gl neon" style={{ padding: 40, display: "flex", flexDirection: "column", gap: 24, position: "relative" }}>
          <div style={{ position: "absolute", top: 12, right: 20 }} className="mono t3">V3.0.2</div>
          
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <div style={{ 
              width: 100, height: 100, borderRadius: 20, background: rank.gradient,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 42, fontWeight: 950, color: "#fff", border: `1px solid ${c}40`,
              boxShadow: `0 15px 35px ${c}40`
            }}>
              {(user?.name || "H").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{user?.name || "Hunter"}</h2>
              <div className="mono" style={{ fontSize: 11, color: c, marginTop: 4 }}>ID: {user?.id ? user.id.toString().slice(0, 8) : "S-092"} // STATUS: AWAKENED</div>
            </div>
          </div>

          <div style={{ padding: "16px 20px", background: "rgba(0,0,0,0.2)", borderRadius: 12, border: "1px solid var(--b1)" }}>
             <div className="label-tag" style={{ marginBottom: 8 }}>Current Resonance</div>
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
               <span style={{ fontSize: 20, fontWeight: 800, color: c }}>{rank.name?.toUpperCase()}</span>
               <span className="mono" style={{ fontSize: 12, color: "var(--t3)" }}>{totalXP} TOTAL XP</span>
             </div>
          </div>

          <button onClick={logout} className="btn-ghost" style={{ width: "100%", color: "var(--red)", border: "1px solid rgba(240,96,96,0.2)", marginTop: "auto" }}>
            TERMINATE SESSION
          </button>
        </div>

        {/* Tactical Metrics Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="gl" style={{ padding: 24 }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--t3)", marginBottom: 20 }}>[ PERFORMANCE METRICS ]</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Completion Rate", val: `${stats?.completionRate || 0}%`, color: "var(--green)" },
                { label: "Missions Resolved", val: stats?.completed || 0, color: "var(--a)" },
                { label: "Study Duration", val: `${Math.floor((stats?.totalMins||0)/60)}h`, color: "var(--gold)" },
              ].map(st => (
                <div key={st.label} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid var(--b1)" }}>
                  <span style={{ fontSize: 14, color: "var(--t2)" }}>{st.label}</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 800, color: st.color }}>{st.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="gl hov" style={{ padding: 24 }}>
             <div className="mono" style={{ fontSize: 11, color: "var(--t3)", marginBottom: 16 }}>[ ACCOUNT SYNC ]</div>
             <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
               <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 10px var(--green)" }} />
               <div style={{ fontSize: 13, color: "var(--t2)" }}>Local Data & Cloud Sync: <span style={{ color: "var(--green)" }}>NOMINAL</span></div>
             </div>
             <p className="mono" style={{ fontSize: 9, color: "var(--t3)", marginTop: 12, lineHeight: 1.5 }}>
               Your metrics are encrypted and utilized solely for intelligent scheduling. System version: Celestial Terminal v3.0.2-AnimeEngine
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}
