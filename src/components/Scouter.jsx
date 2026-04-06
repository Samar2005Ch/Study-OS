import { useState, useCallback } from "react";

let _fire = null;
export function fireScouter(val, label) { _fire?.({ val, label }); }

export default function Scouter() {
  const [active, setActive] = useState(false);
  const [data, setData] = useState(null);
  const [count, setCount] = useState(0);
  const [over9k, setOver9k] = useState(false);

  _fire = useCallback(({ val, label }) => {
    setData({ val, label }); setActive(true); setOver9k(false);
    let n = 0;
    const iv = setInterval(() => {
      n = Math.min(n + Math.ceil(val/40), val);
      setCount(n);
      if (n >= val) { clearInterval(iv); if (val > 9000) setOver9k(true); }
    }, 30);
    setTimeout(() => { setActive(false); clearInterval(iv); }, 2600);
  }, []);

  return (
    <>
      <div className={`sc-ov ${active?"on":""}`}>
        <div className="sc-line"/>
        <div className="sc-c sc-tl"/> <div className="sc-c sc-tr"/>
        <div className="sc-c sc-bl"/> <div className="sc-c sc-br"/>
      </div>
      {active && data && (
        <div style={{
          position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          zIndex:8889,pointerEvents:"none",textAlign:"center",animation:"fadeIn .3s ease",
        }}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"rgba(48,255,80,.7)",letterSpacing:".2em",marginBottom:6}}>
            {data.label} READING
          </div>
          <div style={{
            fontSize:over9k?28:52,fontWeight:900,letterSpacing:"-2px",
            color:over9k?"#f06060":"rgba(48,255,80,.9)",
            animation:"countUp .5s ease",
            textShadow:over9k?"0 0 30px rgba(240,96,96,.8)":"0 0 20px rgba(48,255,80,.6)",
          }}>
            {over9k ? "IT'S OVER 9000!" : count.toLocaleString()}
          </div>
        </div>
      )}
    </>
  );
}
