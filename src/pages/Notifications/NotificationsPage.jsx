import { useState, useEffect } from "react";
import { api } from "../../api/client";
import { usePath } from "../../system/PathContext";

const TYPE_COLORS = { info:"var(--a)", warning:"var(--gold)", critical:"var(--red)", success:"var(--green)" };

export default function NotificationsPage() {
  const { path } = usePath();
  const c = path.primary;
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ api.getNotifications().then(setNotifs).catch(()=>{}).finally(()=>setLoading(false)); },[]);

  async function markRead(id) {
    await api.markRead(id);
    setNotifs(p=>p.map(n=>n.id===id?{...n,read:1}:n));
  }

  async function deleteNotif(id) {
    await api.deleteNotif(id);
    setNotifs(p=>p.filter(n=>n.id!==id));
  }

  const unread = notifs.filter(n=>!n.read).length;

  return (
    <div className="page">
      <div className="page-hdr">
        <div>
          <div className="page-tag">{path.name.toUpperCase()} · SYSTEM ALERTS</div>
          <h1 className="page-title">Notifications {unread>0&&<span style={{fontSize:14,fontWeight:700,color:c,marginLeft:8}}>{unread} new</span>}</h1>
        </div>
        {unread>0&&<button className="btn btn-g" onClick={()=>notifs.filter(n=>!n.read).forEach(n=>markRead(n.id))}>Mark all read</button>}
      </div>

      {loading?<div style={{display:"flex",justifyContent:"center",padding:60}}><div className="spinner"/></div>
      :notifs.length===0?(
        <div className="empty">
          <div className="empty-icon">◉</div>
          <div className="empty-title">No notifications</div>
          <div className="empty-sub">System alerts will appear here — exam reminders, streak warnings, readiness reports.</div>
        </div>
      ):<div style={{display:"flex",flexDirection:"column",gap:8}}>
        {notifs.map(n=>(
          <div key={n.id} style={{display:"flex",gap:14,padding:"14px 16px",borderRadius:12,background:n.read?"var(--s1)":"var(--s2)",border:"1px solid "+(n.read?"var(--b1)":TYPE_COLORS[n.type||"info"]+"25"),opacity:n.read?.6:1,transition:"all .2s"}}
            onClick={()=>!n.read&&markRead(n.id)}>
            <div style={{width:3,borderRadius:2,background:TYPE_COLORS[n.type||"info"],flexShrink:0,alignSelf:"stretch"}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:4}}>{n.title}</div>
              {n.body&&<div style={{fontSize:12,color:"var(--t2)",lineHeight:1.5}}>{n.body}</div>}
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t4)",marginTop:6}}>
                {new Date(n.created_at).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
              </div>
            </div>
            <button onClick={e=>{e.stopPropagation();deleteNotif(n.id);}} style={{background:"none",border:"none",color:"var(--t4)",cursor:"pointer",fontSize:14,flexShrink:0}}>×</button>
          </div>
        ))}
      </div>}
    </div>
  );
}
