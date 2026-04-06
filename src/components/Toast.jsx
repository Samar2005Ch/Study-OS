import { useState, useCallback } from "react";

let _showToast = null;
export function showToast(title, sub="", val="") {
  _showToast?.({ title, sub, val });
}

export default function Toast() {
  const [msg, setMsg] = useState(null);
  const [visible, setVisible] = useState(false);
  let timer;

  const show = useCallback(m => {
    setMsg(m); setVisible(true);
    clearTimeout(timer);
    timer = setTimeout(() => setVisible(false), 3200);
  }, []);

  _showToast = show;

  return (
    <div className={`toast ${visible?"show":""}`}>
      <div style={{width:2,height:30,borderRadius:1,background:"var(--a)",boxShadow:"0 0 8px var(--a)",flexShrink:0}}/>
      <div style={{flex:1}}>
        <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{msg?.title}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--t3)"}}>{msg?.sub}</div>
      </div>
      {msg?.val && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:"var(--gold)",flexShrink:0}}>{msg.val}</div>}
    </div>
  );
}
