// ══════════════════════════════════════════════════════════════
// ChatPage.jsx
// ══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { getCurrentPath } from '../../system/paths';
import { ScrambleText } from '../../components/System';

export function ChatPage() {
  const path    = getCurrentPath();
  const c       = path.color;
  const [msgs,   setMsgs]   = useState([]);
  const [input,  setInput]  = useState('');
  const [loading,setLoading]= useState(false);
  const [typing, setTyping] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    api.getChatHistory().then(h => setMsgs(h||[])).catch(()=>{});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [msgs, typing]);

  async function send() {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMsgs(p => [...p, { role:'user', content:msg, id:Date.now() }]);
    setLoading(true);
    setTyping('');
    try {
      const res = await api.chat({ message:msg });
      // Typewriter effect
      let i=0; const reply=res.reply||'';
      const iv=setInterval(()=>{
        i++;
        setTyping(reply.slice(0,i));
        if(i>=reply.length){
          clearInterval(iv);
          setTyping('');
          setMsgs(p=>[...p,{role:'model',content:reply,id:Date.now()}]);
        }
      },14);
    } catch(e) {
      setMsgs(p=>[...p,{role:'model',content:'System unavailable. Check your Gemini key.',id:Date.now()}]);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <div className="page-header anim-fade-up" style={{ flexShrink:0 }}>
        <div>
          <div className="page-tag">{path.name} · {path.nav.chat}</div>
          <h1 className="page-title"><ScrambleText text={path.nav.chat}/></h1>
        </div>
        <button className="btn btn-ghost" style={{ fontSize:11 }}
          onClick={()=>setMsgs([])}>Clear</button>
      </div>

      {/* Messages */}
      <div style={{
        flex:1, overflowY:'auto', display:'flex', flexDirection:'column',
        gap:14, padding:'0 0 16px',
      }}>
        {msgs.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <div className="empty-title">{path.nav.chat}</div>
            <div className="empty-sub">Ask anything about your preparation</div>
          </div>
        )}

        {msgs.map(m => (
          <div key={m.id} style={{
            display:'flex',
            justifyContent: m.role==='user' ? 'flex-end' : 'flex-start',
          }}>
            {m.role==='model' && (
              <div style={{
                width:28, height:28, borderRadius:8, flexShrink:0, marginRight:10,
                background:`${c}15`, border:`1px solid ${c}30`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, color:c,
              }}>◎</div>
            )}
            <div style={{
              maxWidth:'72%', padding:'11px 15px', borderRadius:12,
              background: m.role==='user'
                ? `${c}18`
                : 'rgba(255,255,255,.04)',
              border: `1px solid ${m.role==='user' ? c+'30' : 'rgba(255,255,255,.06)'}`,
              fontSize:13, lineHeight:1.65,
              borderTopRightRadius: m.role==='user' ? 4 : 12,
              borderTopLeftRadius:  m.role==='model' ? 4 : 12,
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {typing && (
          <div style={{ display:'flex' }}>
            <div style={{
              width:28, height:28, borderRadius:8, flexShrink:0, marginRight:10,
              background:`${c}15`, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, color:c,
            }}>◎</div>
            <div style={{
              maxWidth:'72%', padding:'11px 15px', borderRadius:12,
              borderTopLeftRadius:4,
              background:'rgba(255,255,255,.04)',
              border:'1px solid rgba(255,255,255,.06)',
              fontSize:13, lineHeight:1.65,
            }}>
              {typing}
              <span style={{ animation:'glow-pulse 1s ease-in-out infinite', marginLeft:2 }}>▌</span>
            </div>
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div className="glass" style={{ padding:'12px 14px', flexShrink:0 }}>
        <div style={{ display:'flex', gap:10 }}>
          <input
            className="input"
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()}
            placeholder="Ask about your subjects, schedule, or exam strategy..."
            style={{ flex:1 }}
          />
          <button
            className="btn btn-primary"
            onClick={send} disabled={loading||!input.trim()}
            style={{ flexShrink:0 }}
          >{loading?'◌':'Send'}</button>
        </div>
        <div style={{
          fontFamily:'JetBrains Mono,monospace', fontSize:9,
          color:'var(--t3)', marginTop:8,
        }}>Powered by Gemini · Press Enter to send</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SkillsPage.jsx
// ══════════════════════════════════════════════════════════════
export function SkillsPage() {
  const path = getCurrentPath();
  const c    = path.color;
  const [skills, setSkills] = useState([]);
  const [newName,setNewName]= useState('');
  const [newColor,setNewColor]=useState(c);
  const [loading,setLoading]= useState(true);
  const [expanded,setExpanded]=useState({});
  const [newTopic,setNewTopic]=useState({});

  useEffect(()=>{
    api.getSkills().then(s=>setSkills(s||[])).finally(()=>setLoading(false));
  },[]);

  async function addSkill(){
    if(!newName.trim())return;
    const s=await api.addSkill({name:newName.trim(),color:newColor});
    setSkills(p=>[...p,s]); setNewName('');
  }

  async function addSkillTopic(skillId){
    const t=newTopic[skillId];
    if(!t?.trim())return;
    const nt=await api.addSkillTopic(skillId,{name:t.trim()});
    setSkills(p=>p.map(s=>s.id===skillId?{...s,topics:[...(s.topics||[]),nt]}:s));
    setNewTopic(p=>({...p,[skillId]:''}));
  }

  async function cycleTopicStatus(skillId,topic){
    const cycle=['not_touched','in_progress','confident'];
    const idx=cycle.indexOf(topic.status||'not_touched');
    const next=cycle[(idx+1)%cycle.length];
    await api.updateSkillTopic(topic.id,{status:next});
    setSkills(p=>p.map(s=>s.id===skillId?{...s,topics:(s.topics||[]).map(t=>t.id===topic.id?{...t,status:next}:t)}:s));
  }

  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <div className="page-tag">{path.name} · {path.nav.skills}</div>
          <h1 className="page-title"><ScrambleText text={path.nav.skills}/></h1>
        </div>
      </div>

      {/* Add skill */}
      <div className="glass anim-fade-up d1" style={{ padding:20, marginBottom:20 }}>
        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:c, letterSpacing:'.18em', marginBottom:12 }}>NEW SKILL</div>
        <div style={{ display:'flex', gap:8 }}>
          <input className="input" style={{ flex:1 }} value={newName} onChange={e=>setNewName(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&addSkill()} placeholder="Skill name (e.g. Python, Boxing, Guitar)"/>
          <input type="color" value={newColor} onChange={e=>setNewColor(e.target.value)}
            style={{ width:40, height:40, border:'none', borderRadius:8, cursor:'pointer', padding:0 }}/>
          <button className="btn btn-primary" onClick={addSkill}>Add Skill</button>
        </div>
      </div>

      {/* Skills list */}
      {loading ? (
        <div className="empty-state"><div style={{animation:'spin 1s linear infinite',fontSize:20}}>◌</div></div>
      ) : skills.length === 0 ? (
        <div className="glass">
          <div className="empty-state">
            <div className="empty-icon">▤</div>
            <div className="empty-title">No skills added</div>
            <div className="empty-sub">Add skills to track alongside your exam prep</div>
          </div>
        </div>
      ) : (
        <div className="anim-fade-up d2">
          {skills.map(skill=>{
            const topics=skill.topics||[];
            const conf=topics.filter(t=>t.status==='confident').length;
            return (
              <div key={skill.id} className="glass" style={{ marginBottom:12, overflow:'hidden' }}>
                <div style={{
                  padding:'16px 20px', cursor:'pointer',
                  display:'flex', alignItems:'center', gap:12,
                  background:`${skill.color||c}08`,
                  borderBottom: expanded[skill.id] ? '1px solid rgba(255,255,255,.05)' : 'none',
                }} onClick={()=>setExpanded(p=>({...p,[skill.id]:!p[skill.id]}))}>
                  <div style={{ width:8,height:8,borderRadius:1,background:skill.color||c,transform:'rotate(45deg)' }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700 }}>{skill.name}</div>
                    <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'var(--t2)', marginTop:2 }}>
                      {topics.length} topics · {conf} confident
                    </div>
                  </div>
                  <span style={{ color:'var(--t3)', fontSize:11 }}>{expanded[skill.id]?'▲':'▼'}</span>
                </div>

                {expanded[skill.id] && (
                  <div style={{ padding:'14px 20px' }}>
                    {topics.map(t=>{
                      const sc={not_touched:'var(--red)',in_progress:'var(--orange)',confident:'var(--green)'}[t.status||'not_touched'];
                      return (
                        <div key={t.id} style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 0',
                          borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                          <button onClick={()=>cycleTopicStatus(skill.id,t)}
                            style={{ background:'none', border:'none', cursor:'pointer', fontSize:10, color:sc }}>●</button>
                          <span style={{ flex:1, fontSize:12 }}>{t.name}</span>
                          <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:sc }}>
                            {(t.status||'not_touched').replace('_',' ')}
                          </span>
                        </div>
                      );
                    })}
                    <div style={{ display:'flex', gap:8, marginTop:12 }}>
                      <input className="input" style={{ flex:1, height:34, fontSize:12 }}
                        value={newTopic[skill.id]||''} onChange={e=>setNewTopic(p=>({...p,[skill.id]:e.target.value}))}
                        onKeyDown={e=>e.key==='Enter'&&addSkillTopic(skill.id)} placeholder="Add topic..."/>
                      <button className="btn btn-primary" style={{ height:34, padding:'0 14px', fontSize:12 }}
                        onClick={()=>addSkillTopic(skill.id)}>+</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TimetablePage.jsx
// ══════════════════════════════════════════════════════════════
export function TimetablePage() {
  const path = getCurrentPath();
  const c    = path.color;
  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const [slots, setSlots] = useState([]);
  const [form,  setForm]  = useState({ day:'Monday', label:'', start:'09:00', end:'11:00' });
  const [error, setError] = useState('');

  useEffect(()=>{ api.getTimetable().then(s=>setSlots(s||[])).catch(()=>{}); },[]);

  const byDay = DAYS.reduce((m,d)=>({...m,[d]:slots.filter(s=>s.day===d)}),[]);

  async function addSlot(){
    if(!form.label.trim()) return setError('Label required.');
    setError('');
    try {
      const s=await api.addSlot(form);
      setSlots(p=>[...p,s]);
    } catch(e){ setError(e.message); }
  }

  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <div className="page-tag">{path.name} · {path.nav.timetable}</div>
          <h1 className="page-title"><ScrambleText text={path.nav.timetable}/></h1>
        </div>
      </div>

      {/* Add slot */}
      <div className="glass anim-fade-up d1" style={{ padding:20, marginBottom:20 }}>
        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:c, letterSpacing:'.18em', marginBottom:12 }}>ADD TIME SLOT</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <select className="input" style={{ flex:'0 1 130px' }} value={form.day} onChange={e=>setForm(p=>({...p,day:e.target.value}))}>
            {DAYS.map(d=><option key={d}>{d}</option>)}
          </select>
          <input className="input" style={{ flex:'1 1 160px' }} value={form.label}
            onChange={e=>setForm(p=>({...p,label:e.target.value}))} placeholder="Label (e.g. Morning Session)"/>
          <input className="input" type="time" style={{ flex:'0 1 100px' }} value={form.start}
            onChange={e=>setForm(p=>({...p,start:e.target.value}))} style={{colorScheme:'dark'}}/>
          <input className="input" type="time" style={{ flex:'0 1 100px' }} value={form.end}
            onChange={e=>setForm(p=>({...p,end:e.target.value}))} style={{colorScheme:'dark'}}/>
          <button className="btn btn-primary" onClick={addSlot}>Add</button>
        </div>
        {error && <div style={{ marginTop:8, fontSize:11, color:'var(--red)' }}>{error}</div>}
      </div>

      {/* Timetable grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:10 }}>
        {DAYS.map(day => (
          <div key={day} className="glass anim-fade-up" style={{ padding:14, minHeight:120 }}>
            <div style={{
              fontFamily:'JetBrains Mono,monospace', fontSize:9,
              color:c, letterSpacing:'.1em', marginBottom:10,
            }}>{day.slice(0,3).toUpperCase()}</div>
            {(byDay[day]||[]).map(s=>(
              <div key={s.id} style={{
                padding:'7px 8px', borderRadius:7, marginBottom:5,
                background:`${c}10`, border:`1px solid ${c}20`,
                position:'relative',
              }}>
                <div style={{ fontSize:11, fontWeight:600, marginBottom:2 }}>{s.label}</div>
                <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'var(--t2)' }}>
                  {s.start} – {s.end}
                </div>
                <button
                  onClick={()=>{ api.deleteSlot(s.id); setSlots(p=>p.filter(x=>x.id!==s.id)); }}
                  style={{ position:'absolute', top:4, right:4, background:'none', border:'none',
                    cursor:'pointer', fontSize:12, color:'var(--t3)' }}>×</button>
              </div>
            ))}
            {!(byDay[day]||[]).length && (
              <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'var(--t3)' }}>—</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// NotificationsPage.jsx
// ══════════════════════════════════════════════════════════════
export function NotificationsPage() {
  const path = getCurrentPath();
  const c    = path.color;
  const [notifs, setNotifs] = useState([]);
  const [loading,setLoading]= useState(true);

  useEffect(()=>{
    api.getNotifications().then(n=>setNotifs(n||[])).finally(()=>setLoading(false));
  },[]);

  const typeIcons = { info:'◎', warning:'⚠', success:'✓', error:'✕' };
  const typeColors = { info:c, warning:'var(--orange)', success:'var(--green)', error:'var(--red)' };

  async function markRead(id){
    await api.markNotificationRead(id);
    setNotifs(p=>p.map(n=>n.id===id?{...n,read:1}:n));
  }

  async function deleteNotif(id){
    await api.deleteNotification(id);
    setNotifs(p=>p.filter(n=>n.id!==id));
  }

  const unread = notifs.filter(n=>!n.read).length;

  return (
    <div>
      <div className="page-header anim-fade-up">
        <div>
          <div className="page-tag">{path.name} · {path.nav.notifications}</div>
          <h1 className="page-title"><ScrambleText text={path.nav.notifications}/></h1>
        </div>
        {unread > 0 && (
          <div style={{
            fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'var(--t2)',
          }}>{unread} unread</div>
        )}
      </div>

      {loading ? (
        <div className="empty-state"><div style={{animation:'spin 1s linear infinite',fontSize:20}}>◌</div></div>
      ) : notifs.length === 0 ? (
        <div className="glass">
          <div className="empty-state">
            <div className="empty-icon">◉</div>
            <div className="empty-title">No notifications</div>
            <div className="empty-sub">System alerts will appear here</div>
          </div>
        </div>
      ) : (
        <div className="glass anim-fade-up d1" style={{ padding:16 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {notifs.map(n => {
              const tc = typeColors[n.type] || c;
              const ti = typeIcons[n.type] || '◎';
              return (
                <div key={n.id} style={{
                  display:'flex', alignItems:'flex-start', gap:12,
                  padding:'13px 14px', borderRadius:10,
                  background: n.read ? 'rgba(255,255,255,.015)' : 'rgba(255,255,255,.04)',
                  border:`1px solid ${n.read?'rgba(255,255,255,.04)':tc+'20'}`,
                  opacity: n.read ? .6 : 1,
                  cursor:'pointer', transition:'all .18s',
                }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.05)';}}
                onMouseLeave={e=>{e.currentTarget.style.background=n.read?'rgba(255,255,255,.015)':'rgba(255,255,255,.04)';}}
                onClick={()=>!n.read&&markRead(n.id)}>
                  <div style={{
                    width:32, height:32, borderRadius:8, flexShrink:0,
                    background:`${tc}15`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:13, color:tc,
                  }}>{ti}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>{n.title}</div>
                    {n.body && <div style={{ fontSize:12, color:'var(--t2)', lineHeight:1.5 }}>{n.body}</div>}
                    <div style={{
                      fontFamily:'JetBrains Mono,monospace', fontSize:9, color:'var(--t3)', marginTop:4,
                    }}>{new Date(n.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                  </div>
                  {!n.read && (
                    <div style={{
                      width:6, height:6, borderRadius:'50%',
                      background:tc, flexShrink:0, marginTop:4,
                    }}/>
                  )}
                  <button onClick={e=>{e.stopPropagation();deleteNotif(n.id);}}
                    style={{ background:'none',border:'none',cursor:'pointer',fontSize:14,color:'var(--t3)',padding:'0 4px' }}>×</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
