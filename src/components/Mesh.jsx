import { useEffect, useRef } from "react";

export default function Mesh() {
  const ref = useRef();

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext("2d");
    let W, H, pts;
    const M = { x: 500, y: 400 };

    const resize = () => {
      W = cv.width = window.innerWidth;
      H = cv.height = window.innerHeight;
      const sp = 62, cols = Math.ceil(W/sp)+2, rows = Math.ceil(H/sp)+2;
      pts = [];
      for (let r=0; r<rows; r++) for (let c=0; c<cols; c++)
        pts.push({ ox:c*sp-30+(Math.random()-.5)*8, oy:r*sp-30+(Math.random()-.5)*8, x:0, y:0, ph:Math.random()*Math.PI*2 });
    };

    const onMove = e => { M.x = e.clientX; M.y = e.clientY; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", resize);
    resize();

    const getColor = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--a").trim() || "#4f6ef7";
      const r = parseInt(v.slice(1,3),16), g = parseInt(v.slice(3,5),16), b = parseInt(v.slice(5,7),16);
      return [r,g,b];
    };

    let raf;
    const draw = ts => {
      ctx.clearRect(0,0,W,H);
      const cols = Math.ceil(W/62)+2;
      const [pr,pg,pb] = getColor();

      for (const p of pts) {
        p.ox += Math.sin(ts*.0003+p.ph)*.12;
        p.oy += Math.cos(ts*.00025+p.ph)*.1;
        const dx=p.ox-M.x, dy=p.oy-M.y, d=Math.sqrt(dx*dx+dy*dy);
        const rep = d<130 ? (130-d)/130*16 : 0;
        const tx = p.ox+(rep>0?dx/d*rep:0), ty = p.oy+(rep>0?dy/d*rep:0);
        p.x += (tx-p.x)*.1; p.y += (ty-p.y)*.1;
      }

      for (let i=0; i<pts.length; i++) {
        const p = pts[i];
        const draw = q => {
          const dx=q.x-p.x, dy=q.y-p.y, d=Math.sqrt(dx*dx+dy*dy);
          const mdx=(p.x+q.x)/2-M.x, mdy=(p.y+q.y)/2-M.y, md=Math.sqrt(mdx*mdx+mdy*mdy);
          const op = Math.min(Math.max(0,1-d/92)*.2+Math.max(0,1-md/175)*.42, .55);
          if (op>.015) {
            ctx.strokeStyle=`rgba(${pr},${pg},${pb},${op})`;
            ctx.lineWidth=.8+Math.max(0,1-md/175)*1.6;
            ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
          }
        };
        if ((i+1)%cols!==0&&i+1<pts.length) draw(pts[i+1]);
        if (i+cols<pts.length) draw(pts[i+cols]);
        const pd = Math.sqrt((p.x-M.x)**2+(p.y-M.y)**2);
        const pop = pd<200 ? .06+(1-pd/200)*.5 : .04;
        const pr2 = pd<100 ? 1.4+(1-pd/100)*2 : 1.1;
        ctx.fillStyle=`rgba(${pr},${pg},${pb},${pop})`;
        ctx.beginPath(); ctx.arc(p.x,p.y,pr2,0,Math.PI*2); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} id="mesh" style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none" }}/>;
}
