import { useState } from "react";
import { usePath } from "../system/PathContext";
import { useRank } from "../system/RankContext";
import { useAuth } from "../system/AuthContext";

const NAV = [
  { id:"dashboard",      icon:"⊞", label:"Command Center" },
  { id:"exams",          icon:"◫", label:"Dungeons" },
  { id:"schedule",       icon:"▸", label:"Schedule",      pathKey:"navSchedule" },
  { id:"analytics",      icon:"◈", label:"Analytics",     pathKey:"navAnalytics" },
  { id:"skills",         icon:"▤", label:"Skills" },
  { id:"timetable",      icon:"▦", label:"Timetable" },
  { id:"chat",           icon:"◎", label:"System AI" },
  { id:"notifications",  icon:"◉", label:"Alerts" },
];

export default function Sidebar({ activePage, onNavigate }) {
  const { path } = usePath();
  const { rank, totalXP, nextRank } = useRank();
  const { user, logout } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const [hovered, setHovered] = useState(false);
  const c = path.primary;

  function handleLogout() {
    if (!confirm) { setConfirm(true); setTimeout(() => setConfirm(false), 4000); return; }
    logout();
  }

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: hovered ? 220 : 68, height:"100vh", flexShrink:0,
        background:"rgba(5,5,8,.95)", backdropFilter:"blur(40px)",
        borderRight:`1px solid var(--b1)`,
        display:"flex", flexDirection:"column",
        transition:"width .25s cubic-bezier(.4,0,.2,1)",
        overflow:"hidden", position:"relative", zIndex:10,
      }}
    >
      {/* Accent line */}
      <div style={{ position:"absolute",top:0,right:0,width:1,height:"100%",
        background:`linear-gradient(180deg,transparent,${c},transparent)`,opacity:.3 }}/>

      {/* Logo */}
      <div style={{ display:"flex",alignItems:"center",gap:11,padding:"22px 14px 18px",flexShrink:0 }}>
        <div style={{
          width:36,height:36,background:c,borderRadius:10,flexShrink:0,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:14,fontWeight:900,color:"#fff",
          boxShadow:`0 0 20px ${c}50`,
          transition:"all .3s cubic-bezier(.34,1.56,.64,1)",
          transform:hovered?"scale(1.06)":"scale(1)",
        }}>S</div>
        {hovered && (
          <div style={{opacity:hovered?1:0,transition:"opacity .2s .1s"}}>
            <div style={{fontSize:13,fontWeight:800,whiteSpace:"nowrap"}}>StudyOS</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:c,letterSpacing:".15em",marginTop:2}}>{path.name.toUpperCase()}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex:1,overflowY:"auto",overflowX:"hidden",padding:"4px 10px" }}>
        {NAV.map(item => {
          const label = item.pathKey ? (path[item.pathKey] || item.label) : item.label;
          const active = activePage === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display:"flex",alignItems:"center",gap:10,
                padding:"9px 8px",borderRadius:10,cursor:"pointer",
                marginBottom:2,
                background:active ? `${c}12` : "transparent",
                borderLeft:active ? `2px solid ${c}` : "2px solid transparent",
                color:active ? c : "var(--t3)",
                transition:"all .18s",
                paddingLeft:active?"10px":"10px",
              }}
              onMouseEnter={e => { if(!active) { e.currentTarget.style.background="var(--s2)"; e.currentTarget.style.color="var(--t1)"; }}}
              onMouseLeave={e => { if(!active) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--t3)"; }}}
            >
              <span style={{fontSize:14,width:20,textAlign:"center",flexShrink:0,opacity:active?1:.7}}>{item.icon}</span>
              {hovered && <span style={{fontSize:12,fontWeight:active?700:500,whiteSpace:"nowrap",opacity:hovered?1:0,transition:"opacity .15s .08s"}}>{label}</span>}
            </div>
          );
        })}
      </nav>

      {/* Rank + XP bar */}
      {hovered && (
        <div style={{padding:"10px 14px",borderTop:"1px solid var(--b1)",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{width:28,height:28,borderRadius:8,background:`${c}15`,border:`1px solid ${c}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:c}}>{rank.rank}</div>
            <div>
              <div style={{fontSize:10,fontWeight:700}}>Rank {rank.rank}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--t3)",marginTop:1}}>{totalXP.toLocaleString()} {path.xpLabel.toUpperCase()}</div>
            </div>
          </div>
          {nextRank && (
            <div style={{height:2,background:"var(--b1)",borderRadius:1,overflow:"hidden"}}>
              <div style={{height:"100%",background:c,width:`${Math.min(100,((totalXP-rank.min)/(nextRank.min-rank.min))*100)}%`,transition:"width 1s ease"}}/>
            </div>
          )}
        </div>
      )}

      {/* User + logout */}
      <div style={{padding:"10px 12px",borderTop:"1px solid var(--b1)",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <div style={{width:32,height:32,borderRadius:9,background:`linear-gradient(135deg,${c},#7c3aed)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#fff",flexShrink:0}}>
          {(user?.name||"U")[0].toUpperCase()}
        </div>
        {hovered && (
          <>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name||"Hunter"}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--t3)",marginTop:1}}>ONLINE</div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding:"4px 9px",border:`1px solid ${confirm?"#f06060":"var(--b1)"}`,
                background:confirm?"rgba(240,96,96,.1)":"transparent",
                color:confirm?"#f06060":"var(--t3)",fontSize:9,cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace",borderRadius:6,
                transition:"all .2s",whiteSpace:"nowrap",flexShrink:0,
              }}
            >{confirm?"SURE?":"EXIT"}</button>
          </>
        )}
      </div>
    </aside>
  );
}
