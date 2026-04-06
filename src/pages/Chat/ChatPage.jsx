import { useState, useEffect, useRef } from "react";
import { api } from "../../api/client";
import { usePath } from "../../system/PathContext";

export default function ChatPage() {
  const { path } = usePath();
  const c = path.primary;
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const bottomRef = useRef();

  useEffect(()=>{
    api.getChatHistory().then(h=>setMsgs(h.map(m=>({role:m.role,text:m.content})))).catch(()=>{}).finally(()=>setInitializing(false));
  },[]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  async function send() {
    if (!input.trim()||loading) return;
    const userMsg={role:"user",text:input.trim()};
    setMsgs(p=>[...p,userMsg]);
    setInput(""); setLoading(true);
    try {
      const res = await api.chat({ message:userMsg.text });
      setMsgs(p=>[...p,{role:"model",text:res.reply}]);
    } catch(e) { setMsgs(p=>[...p,{role:"model",text:"System error. Try again."}]); }
    setLoading(false);
  }

  function TypeWriter({ text }) {
    const [displayed, setDisplayed] = useState("");
    useEffect(()=>{
      let i=0; setDisplayed("");
      const iv=setInterval(()=>{ setDisplayed(text.slice(0,++i)); if(i>=text.length)clearInterval(iv); },12);
      return()=>clearInterval(iv);
    },[text]);
    return <span>{displayed}</span>;
  }

  return (
    <div className="page" style={{display:"flex",flexDirection:"column",height:"100vh",padding:0}}>
      {/* Header */}
      <div style={{padding:"24px 32px 18px",borderBottom:"1px solid var(--b1)",flexShrink:0}}>
        <div className="page-tag">{path.name.toUpperCase()} · SYSTEM AI</div>
        <h1 className="page-title">System AI</h1>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t4)",marginTop:4}}>Powered by Gemini · Study-focused assistant</div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"20px 32px",display:"flex",flexDirection:"column",gap:14}}>
        {initializing?<div style={{display:"flex",justifyContent:"center",padding:40}}><div className="spinner"/></div>
        :msgs.length===0?(
          <div className="empty" style={{marginTop:60}}>
            <div className="empty-icon">◎</div>
            <div className="empty-title">System AI online</div>
            <div className="empty-sub">Ask anything about your preparation — subjects, topics, schedule, strategy.</div>
          </div>
        ):msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{
              maxWidth:"75%",padding:"12px 16px",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
              background:m.role==="user"?`${c}18`:"var(--s2)",
              border:m.role==="user"?`1px solid ${c}30`:"1px solid var(--b1)",
              fontSize:13,lineHeight:1.6,
            }}>
              {m.role==="model"&&i===msgs.length-1?<TypeWriter text={m.text}/>:m.text}
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",justifyContent:"flex-start"}}>
            <div style={{padding:"12px 16px",borderRadius:"14px 14px 14px 4px",background:"var(--s2)",border:"1px solid var(--b1)"}}>
              <div style={{display:"flex",gap:4}}>
                {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:c,animation:"glowPulse 1.2s ease infinite",animationDelay:i*.2+"s"}}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"16px 32px 24px",borderTop:"1px solid var(--b1)",flexShrink:0}}>
        <div style={{display:"flex",gap:10}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder="Ask about your preparation..." className="inp" style={{flex:1,height:44}}/>
          <button className="btn btn-p" onClick={send} disabled={loading||!input.trim()} style={{height:44,padding:"0 22px",opacity:!input.trim()?.5:1}}>
            SEND
          </button>
        </div>
      </div>
    </div>
  );
}
