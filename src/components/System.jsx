import { useEffect, useRef, useState, useCallback } from 'react';
import { getCurrentPath } from '../system/paths';

// ── MESH BACKGROUND ───────────────────────────────────────────
export function MeshBackground() {
  const cvRef = useRef(null);
  const path  = getCurrentPath();

  useEffect(() => {
    const cv  = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let W, H, pts, raf;
    const M = { x: 400, y: 400 };

    // Parse color
    const hex = path.color;
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);

    function resize() {
      W = cv.width  = window.innerWidth;
      H = cv.height = window.innerHeight;
      buildPts();
    }

    function buildPts() {
      pts = [];
      const sp = 64, cols = Math.ceil(W/sp)+2, rows = Math.ceil(H/sp)+2;
      for (let r=0; r<rows; r++)
        for (let c=0; c<cols; c++)
          pts.push({
            ox: c*sp - 30 + (Math.random()-.5)*10,
            oy: r*sp - 30 + (Math.random()-.5)*10,
            x:0, y:0,
            ph: Math.random()*Math.PI*2,
          });
    }

    function draw(ts) {
      ctx.clearRect(0,0,W,H);
      const cols = Math.ceil(W/64)+2;

      for (const p of pts) {
        p.ox += Math.sin(ts*.0003+p.ph)*.12;
        p.oy += Math.cos(ts*.00025+p.ph)*.1;
        const dx=p.ox-M.x, dy=p.oy-M.y, d=Math.sqrt(dx*dx+dy*dy);
        const rep = d<140 ? (140-d)/140*18 : 0;
        const tx = p.ox+(rep>0?dx/d*rep:0);
        const ty = p.oy+(rep>0?dy/d*rep:0);
        p.x += (tx-p.x)*.1;
        p.y += (ty-p.y)*.1;
      }

      for (let i=0; i<pts.length; i++) {
        const p = pts[i];
        const drawEdge = (q) => {
          const dx=q.x-p.x, dy=q.y-p.y, d=Math.sqrt(dx*dx+dy*dy);
          const mdx=(p.x+q.x)/2-M.x, mdy=(p.y+q.y)/2-M.y, md=Math.sqrt(mdx*mdx+mdy*mdy);
          const op = Math.min(Math.max(0,1-d/92)*.2 + Math.max(0,1-md/180)*.44, .55);
          if (op > .015) {
            ctx.strokeStyle = `rgba(${r},${g},${b},${op})`;
            ctx.lineWidth   = .8 + Math.max(0,1-md/180)*1.6;
            ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
          }
        };
        if ((i+1)%cols!==0 && i+1<pts.length) drawEdge(pts[i+1]);
        if (i+cols<pts.length) drawEdge(pts[i+cols]);

        const pd = Math.sqrt((p.x-M.x)**2+(p.y-M.y)**2);
        const pop = pd<200 ? .06+(1-pd/200)*.52 : .04;
        const pr  = pd<100 ? 1.4+(1-pd/100)*2 : 1.1;
        ctx.fillStyle = `rgba(${r},${g},${b},${pop})`;
        ctx.beginPath(); ctx.arc(p.x,p.y,pr,0,Math.PI*2); ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    const onMove = e => { M.x = e.clientX; M.y = e.clientY; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', resize);
    resize();
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={cvRef} id="mesh-canvas"/>;
}

// ── CUSTOM CURSOR ─────────────────────────────────────────────
export function Cursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);
  const pos     = useRef({ mx:0, my:0, rx:0, ry:0 });

  useEffect(() => {
    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const onMove = e => { pos.current.mx = e.clientX; pos.current.my = e.clientY; };
    window.addEventListener('mousemove', onMove, { passive:true });

    let raf;
    const anim = () => {
      const { mx,my,rx,ry } = pos.current;
      const nrx = rx + (mx-rx)*.14;
      const nry = ry + (my-ry)*.14;
      pos.current.rx = nrx;
      pos.current.ry = nry;
      dot.style.left  = mx+'px';
      dot.style.top   = my+'px';
      ring.style.left = nrx+'px';
      ring.style.top  = nry+'px';
      raf = requestAnimationFrame(anim);
    };
    raf = requestAnimationFrame(anim);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <>
      <div id="cur-dot"  ref={dotRef}/>
      <div id="cur-ring" ref={ringRef}/>
    </>
  );
}

// ── SCOUTER EFFECT ────────────────────────────────────────────
export function ScouterOverlay({ active }) {
  return (
    <div className={`scouter-overlay ${active?'active':''}`}>
      <div className="scouter-line"/>
      <div className="scouter-corner sc-tl"/>
      <div className="scouter-corner sc-tr"/>
      <div className="scouter-corner sc-bl"/>
      <div className="scouter-corner sc-br"/>
    </div>
  );
}

// ── POWER LEVEL READING ────────────────────────────────────────
export function PowerReading({ show, value, label }) {
  const [displayed, setDisplayed] = useState(0);
  const [over9k, setOver9k]       = useState(false);

  useEffect(() => {
    if (!show) { setDisplayed(0); setOver9k(false); return; }
    let n = 0;
    const step = value / 50;
    const iv = setInterval(() => {
      n = Math.min(n+step, value);
      setDisplayed(Math.floor(n));
      if (n >= value) {
        clearInterval(iv);
        if (value > 9000) setTimeout(() => setOver9k(true), 400);
      }
    }, 25);
    return () => clearInterval(iv);
  }, [show, value]);

  if (!show) return null;

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:8889,
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      pointerEvents:'none',
      animation:'fadeIn .3s ease',
    }}>
      <div style={{
        fontFamily:'JetBrains Mono,monospace', fontSize:10,
        color:'rgba(48,255,80,.6)', letterSpacing:'.2em', marginBottom:6,
      }}>{label}</div>
      {over9k ? (
        <div style={{
          fontSize:42, fontWeight:900, color:'#f06060',
          textShadow:'0 0 30px rgba(240,96,96,.8)',
          animation:'numPop .3s cubic-bezier(.34,1.56,.64,1)',
        }}>IT'S OVER 9000!</div>
      ) : (
        <div style={{
          fontSize:52, fontWeight:900, letterSpacing:'-2px',
          color:'rgba(48,255,80,.9)',
          animation:'numPop .3s cubic-bezier(.34,1.56,.64,1)',
        }}>{displayed.toLocaleString()}</div>
      )}
    </div>
  );
}

// ── RANK UP CINEMATIC ─────────────────────────────────────────
export function RankUpCinematic({ show, onDone, pathId, rankLetter }) {
  const path = getCurrentPath();

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [show, onDone]);

  if (!show) return null;

  return (
    <div className="rankup-overlay active" onClick={onDone}>
      {/* Shadow army effect for shadow path */}
      {pathId === 'shadow' && (
        <div style={{
          position:'absolute', bottom:0, left:0, right:0, height:180,
          background:`linear-gradient(to top,${path.color}20,transparent)`,
          animation:'fadeUp 2s ease forwards',
        }}/>
      )}

      {/* Rank letter */}
      <div style={{
        fontSize:120, fontWeight:900, letterSpacing:'-4px',
        color: path.color,
        textShadow:`0 0 60px ${path.color}80`,
        animation:'numPop .6s cubic-bezier(.34,1.56,.64,1) .3s both',
      }}>{rankLetter}</div>

      <div style={{
        fontFamily:'JetBrains Mono,monospace', fontSize:14,
        color: path.color, letterSpacing:'.3em',
        animation:'fadeUp .5s ease .8s both',
      }}>RANK UP</div>

      <div style={{
        fontSize:20, fontWeight:700,
        color:'rgba(255,255,255,.4)',
        animation:'fadeUp .5s ease 1.1s both',
      }}>{path.signature}</div>

      <div style={{
        fontFamily:'JetBrains Mono,monospace', fontSize:9,
        color:'rgba(255,255,255,.2)', marginTop:24,
        animation:'fadeUp .5s ease 1.4s both',
      }}>TAP TO DISMISS</div>
    </div>
  );
}

// ── TOAST ──────────────────────────────────────────────────────
export function Toast({ msg, onHide }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onHide, 3500);
    return () => clearTimeout(t);
  }, [msg, onHide]);

  const path = getCurrentPath();

  return (
    <div className={`toast ${msg?'show':''}`}>
      <div style={{
        width:2, height:32, borderRadius:1,
        background: path.color,
        boxShadow:`0 0 8px ${path.color}`,
        flexShrink:0,
      }}/>
      <div style={{flex:1}}>
        <div style={{fontSize:12, fontWeight:600}}>{msg?.title}</div>
        {msg?.sub && (
          <div style={{
            fontFamily:'JetBrains Mono,monospace',
            fontSize:10, color:'var(--t2)', marginTop:2,
          }}>{msg.sub}</div>
        )}
      </div>
      {msg?.val && (
        <div style={{
          fontFamily:'JetBrains Mono,monospace',
          fontSize:11, fontWeight:700, color:'var(--gold)',
        }}>{msg.val}</div>
      )}
    </div>
  );
}

// ── TEXT SCRAMBLE ─────────────────────────────────────────────
export function ScrambleText({ text, trigger=true }) {
  const [display, setDisplay] = useState(text);
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!';

  useEffect(() => {
    if (!trigger) return;
    let f=0; const total=40;
    const iv = setInterval(() => {
      f++;
      const prog = f/total;
      setDisplay(text.split('').map((c,i) => {
        if (c===' ') return ' ';
        if (i/text.length < prog) return c;
        return CHARS[Math.floor(Math.random()*CHARS.length)];
      }).join(''));
      if (f>=total) { clearInterval(iv); setDisplay(text); }
    }, 18);
    return () => clearInterval(iv);
  }, [text, trigger]);

  return <span>{display}</span>;
}

// ── HOOK: useScouter ──────────────────────────────────────────
export function useScouter() {
  const [active,    setActive]    = useState(false);
  const [pwrShow,   setPwrShow]   = useState(false);
  const [pwrValue,  setPwrValue]  = useState(0);
  const [pwrLabel,  setPwrLabel]  = useState('');

  const fire = useCallback((val, label) => {
    setActive(true);
    setTimeout(() => setActive(false), 1400);
    if (val !== undefined) {
      setPwrValue(val);
      setPwrLabel(label || 'POWER LEVEL');
      setPwrShow(true);
      setTimeout(() => setPwrShow(false), 2800);
    }
  }, []);

  return { active, pwrShow, pwrValue, pwrLabel, fire };
}

// ── HOOK: useToast ─────────────────────────────────────────────
export function useToast() {
  const [msg, setMsg] = useState(null);
  const show = useCallback((title, sub, val) => setMsg({ title, sub, val }), []);
  const hide = useCallback(() => setMsg(null), []);
  return { msg, show, hide };
}
