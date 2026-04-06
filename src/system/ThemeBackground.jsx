/**
 * system/ThemeBackground.jsx
 * Immersive CSS animated backgrounds based on active theme
 */
import React from 'react';

export default function ThemeBackground({ theme }) {
  if (!theme) return null;

  const bgStyle = {
    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden"
  };

  switch (theme.id) {
    case "goku":
      return (
        <div style={bgStyle}>
          <style>{`
            @keyframes floatUp { from { transform: translateY(100vh) rotate(0deg); opacity: 0; } 50% { opacity: 0.8; } to { transform: translateY(-100px) rotate(360deg); opacity: 0; } }
            .g-particle { position: absolute; width: 4px; height: 4px; background: #ffd700; box-shadow: 0 0 10px #ffd700; border-radius: 50%; opacity: 0; animation: floatUp linear infinite; }
          `}</style>
          <div style={{ position:"absolute", inset:0, background: "radial-gradient(circle at center, transparent 30%, rgba(255,107,0,0.15) 100%)" }} />
          <div style={{ position:"absolute", inset:0, backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px", transform: "perspective(500px) rotateX(60deg) translateY(-100px) scale(3)", transformOrigin: "top" }} />
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="g-particle" style={{ left: (Math.random() * 100) + "%", animationDuration: (Math.random() * 5 + 3) + "s", animationDelay: (Math.random() * 5) + "s" }} />
          ))}
        </div>
      );

    case "vegeta":
      return (
        <div style={bgStyle}>
          <style>{`
            @keyframes pulseGrav { 0%, 100% { transform: scale(1); opacity: 0.1; } 50% { transform: scale(1.05); opacity: 0.3; } }
            @keyframes crackle { 0%, 100% { opacity: 0; } 5% { opacity: 0.8; } 10% { opacity: 0; } 15% { opacity: 0.5; } 20% { opacity: 0; } }
          `}</style>
          {/* Steel walls pattern */}
          <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 10px)"}}/>
          {/* Gravity distortion */}
          <div style={{ position:"absolute", top:"20%", left:"20%", right:"20%", bottom:"20%", borderRadius:"50%", background:"radial-gradient(circle, rgba(108,60,225,0.15) 0%, transparent 70%)", animation:"pulseGrav 4s ease-in-out infinite" }} />
          {/* Blue electricity borders */}
          <div style={{ position:"absolute", left: 0, top: 0, bottom: 0, width: 4, background: "#00bfff", boxShadow: "0 0 20px #00bfff", animation: "crackle 3s infinite" }} />
          <div style={{ position:"absolute", right: 0, top: 0, bottom: 0, width: 4, background: "#00bfff", boxShadow: "0 0 20px #00bfff", animation: "crackle 4s infinite 1s" }} />
        </div>
      );

    case "jinwoo":
      return (
        <div style={bgStyle}>
          <style>{`
            @keyframes riseShadow { from { transform: translateY(100vh); opacity:0; } 50% { opacity:0.6; } to { transform: translateY(-20vh); opacity:0; } }
            .shadow-p { position: absolute; background: #7b2fbe; box-shadow: 0 0 15px #7b2fbe; filter: blur(2px); opacity: 0; animation: riseShadow linear infinite; }
            @keyframes gatePulse { 0%, 100% { background: radial-gradient(circle at bottom center, rgba(0,212,255,0.1), transparent 60%); } 50% { background: radial-gradient(circle at bottom center, rgba(0,212,255,0.2), transparent 70%); } }
          `}</style>
          {/* Floor cracks */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"40vh", animation: "gatePulse 4s infinite ease-in-out" }} />
          {/* Shadows */}
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="shadow-p" style={{ left: (Math.random() * 100) + "%", width: Math.random()*20+5, height: Math.random()*40+20, animationDuration: (Math.random() * 4 + 2) + "s", animationDelay: (Math.random() * 5) + "s" }} />
          ))}
        </div>
      );

    case "naruto":
      return (
        <div style={bgStyle}>
          <style>{`
            @keyframes leafFall { from { transform: translate(0, -10px) rotate(0deg); opacity: 0; } 20% { opacity: 0.8; } 80% { opacity: 0.8; } to { transform: translate(-300px, 100vh) rotate(360deg); opacity: 0; } }
            .leaf { position: absolute; width: 12px; height: 6px; background: #ff6600; border-radius: 50% 0 50% 0; opacity: 0; animation: leafFall linear infinite; }
          `}</style>
          {/* Fire glow horizon */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"30vh", background: "linear-gradient(to top, rgba(255,102,0,0.15), transparent)" }} />
          {/* Leaves */}
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="leaf" style={{ right: (Math.random() * 100 - 50) + "%", top: "-20px", animationDuration: (Math.random() * 8 + 6) + "s", animationDelay: (Math.random() * 10) + "s" }} />
          ))}
        </div>
      );

    case "luffy":
      return (
        <div style={bgStyle}>
          <style>{`
            @keyframes waveMove { 0% { background-position-x: 0; } 100% { background-position-x: 1000px; } }
            .wave { position:absolute; bottom:0; left:0; width:100%; height:15vh; background: radial-gradient(circle at 50% 0%, transparent 20%, rgba(0,26,51,0.5) 21%); background-size: 100px 100%; animation: waveMove 10s linear infinite; }
            .wave2 { position:absolute; bottom:-2vh; left:0; width:100%; height:10vh; background: radial-gradient(circle at 50% 0%, transparent 20%, rgba(0,51,102,0.4) 21%); background-size: 80px 100%; animation: waveMove 7s linear infinite reverse; }
          `}</style>
          {/* Stars */}
          <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(white 1px, transparent 1px)", backgroundSize:"60px 60px", opacity:0.1 }} />
          {/* Waves */}
          <div className="wave" />
          <div className="wave2" />
        </div>
      );

    case "zoro":
      return (
        <div style={bgStyle}>
          <style>{`
            @keyframes fogMove { 0% { transform: translateX(-10%); opacity:0.3; } 50% { opacity:0.5; } 100% { transform: translateX(10%); opacity:0.3; } }
          `}</style>
          {/* Dark green ambient */}
          <div style={{ position:"absolute", inset:0, background: "linear-gradient(to bottom, rgba(10,15,8,1), rgba(45,90,39,0.1))" }} />
          {/* Fog */}
          <div style={{ position:"absolute", bottom:0, left:"-20%", right:"-20%", height:"50vh", background: "linear-gradient(transparent, rgba(45,90,39,0.3))", filter:"blur(20px)", animation:"fogMove 20s ease-in-out infinite alternate" }} />
        </div>
      );
    
    case "tanjiro":
      return (
        <div style={bgStyle}>
          <style>{`
            @keyframes snowFall { from { transform: translateY(-50px); opacity:0; } 20% { opacity:0.8; } to { transform: translateY(100vh); opacity:0; } }
            .tsnow { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: #fff; opacity:0; animation: snowFall linear infinite; filter: blur(1px); }
          `}</style>
          <div style={{ position:"absolute", inset:0, background: "linear-gradient(to top, rgba(43,76,155,0.15), transparent)" }} />
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="tsnow" style={{ left: (Math.random() * 100) + "%", animationDuration: (Math.random() * 5 + 4) + "s", animationDelay: (Math.random() * 5) + "s" }} />
          ))}
        </div>
      );

    case "killua":
      return (
        <div style={bgStyle}>
          <style>{`
            @keyframes lightningFlash { 0%, 95% { opacity: 0; } 96% { opacity: 0.8; background: #00bfff; } 97% { opacity: 0; } 98% { opacity: 1; background: #fff; } 100% { opacity: 0; } }
            @keyframes fastSnow { from { transform: translate(50px, -50px); opacity:0; } 50%{opacity:1;} to { transform: translate(-300px, 100vh); opacity:0; } }
            .ksnow { position: absolute; width: 20px; height: 1px; background: #fff; opacity:0; animation: fastSnow linear infinite; transform: rotate(-45deg); filter: blur(1px); }
          `}</style>
          {/* Flashes */}
          <div style={{ position:"absolute", inset:0, animation: "lightningFlash 8s infinite", pointerEvents:"none" }} />
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="ksnow" style={{ left: (Math.random() * 150) + "%", top:-100, animationDuration: (Math.random() * 1.5 + 0.5) + "s", animationDelay: (Math.random() * 2) + "s" }} />
          ))}
        </div>
      );

    case "levi":
      return (
        <div style={bgStyle}>
          <style>{`
            @keyframes wireFlash { 0%, 90% { opacity: 0; } 91% { opacity: 0.6; transform: translateX(100vh) rotate(-45deg); } 92% { opacity: 0; } 100% { opacity: 0; } }
            @keyframes wireFlash2 { 0%, 80% { opacity: 0; } 81% { opacity: 0.6; transform: translateX(-100vh) rotate(45deg); } 82% { opacity: 0; } 100% { opacity: 0; } }
          `}</style>
          {/* Wall texture */}
          <div style={{ position:"absolute", inset:0, backgroundImage: "linear-gradient(rgba(255,255,255,0.01) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.01) 2px, transparent 2px)", backgroundSize: "100px 50px" }} />
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"60vh", background: "linear-gradient(transparent, rgba(230,230,230,0.05))", filter:"blur(30px)" }} />
          {/* Wires slicing */}
          <div style={{ position:"absolute", top:"50%", left:"-50%", width:"200%", height:2, background:"#c0c0c0", boxShadow:"0 0 10px #fff", transform:"rotate(-45deg)", transformOrigin:"center", opacity:0, animation: "wireFlash 5s infinite" }} />
          <div style={{ position:"absolute", top:"30%", left:"-50%", width:"200%", height:1, background:"#c0c0c0", boxShadow:"0 0 10px #fff", transform:"rotate(45deg)", transformOrigin:"center", opacity:0, animation: "wireFlash2 7s infinite" }} />
        </div>
      );

    case "gojo":
      return (
        <div style={bgStyle}>
          <style>{`
            @keyframes voidExpand { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1); opacity: 0.2; } 100% { transform: scale(1.2); opacity: 0; } }
            @keyframes centerGlow { 0%, 100% { filter: brightness(1) blur(40px); } 50% { filter: brightness(1.5) blur(60px); } }
          `}</style>
          <div style={{ position:"absolute", inset:0, background: "radial-gradient(circle at center, rgba(0,207,255,0.1), transparent 70%)" }} />
          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"40vw", height:"40vw", background:"#fff", borderRadius:"50%", opacity:0.05, animation:"centerGlow 6s ease-in-out infinite" }} />
          <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(#fff 1px, transparent 1px)", backgroundSize:"80px 80px", opacity:0.1 }} />
          {/* Infinity symbols fading */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ position:"absolute", top:(20 + Math.random()*60) + "%", left:(20 + Math.random()*60) + "%", color:"#fff", fontSize:120, opacity:0, animation: "voidExpand " + (Math.random() * 6 + 6) + "s infinite " + (Math.random()*4) + "s" }}>∞</div>
          ))}
        </div>
      );

    case "saitama":
      return (
        <div style={bgStyle}>
          <style>{`
            @keyframes meteorDrop { 0% { transform: translate(100vw, -100px) rotate(45deg); opacity: 1; } 5% { transform: translate(-100px, 100vh) rotate(45deg); opacity: 1; } 6%, 100% { opacity: 0; } }
          `}</style>
          <div style={{ position:"absolute", inset:0, background:"#0a0a0a" }} />
          <div style={{ position:"absolute", left:0, right:0, bottom:0, height:"30vh", backgroundColor:"#151515", borderTop:"2px solid #222" }} />
          {/* Singular meteor randomly every 12 seconds */}
          <div style={{ position:"absolute", width:40, height:4, background:"linear-gradient(90deg, transparent, #cc0000, #ffea8e)", top:0, left:0, opacity:0, animation: "meteorDrop 12s infinite 5s" }} />
        </div>
      );

    case "itachi":
      return (
        <div style={bgStyle}>
          <style>{`
            @keyframes crowFly { 0% { transform: translate(-10vw, 10vh) scale(0.8); opacity:0; } 10% { opacity: 0.4; } 90% { opacity: 0.4; } 100% { transform: translate(110vw, -10vh) scale(1.2); opacity:0; } }
          `}</style>
          {/* Red Moon */}
          <div style={{ position:"absolute", top:"10%", right:"15%", width: 140, height: 140, borderRadius:"50%", background:"#400000", boxShadow:"0 0 60px #8b0000" }} />
          {/* Crows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ position:"absolute", top:(Math.random() * 50 + 20) + "%", opacity:0, animation:"crowFly " + (Math.random() * 10 + 10) + "s linear infinite " + (Math.random()*15) + "s", fontSize:24 }}>🐦‍⬛</div>
          ))}
        </div>
      );

    case "light":
      return (
        <div style={bgStyle}>
          <style>{`
            @keyframes rainDrop { 0% { transform: translateY(-10px); opacity:0; } 10% { opacity:0.5; } 100% { transform: translateY(100vh); opacity:0.1; } }
          `}</style>
          <div style={{ position:"absolute", inset:0, background:"rgba(5,5,5,0.6)", filter:"blur(4px)" }} />
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"40vh", backgroundImage:"radial-gradient(rgba(204,0,0,0.1) 2px, transparent 10px)", backgroundSize:"60px 40px", animation:"centerGlow 4s infinite alternate" }} />
          {/* Rain streaks */}
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} style={{ position:"absolute", width:2, height:Math.random()*40+20, background:"rgba(255,255,255,0.1)", left:(Math.random()*100) + "%", top:-50, opacity:0, animation:"rainDrop " + (Math.random()*0.8+0.4) + "s linear infinite " + Math.random() + "s" }} />
          ))}
        </div>
      );

    default:
      return null;
  }
}
