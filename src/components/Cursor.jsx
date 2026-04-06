import { useEffect, useRef } from "react";

export default function Cursor() {
  const dotRef  = useRef();
  const ringRef = useRef();
  const mx = useRef(0), my = useRef(0);
  const rx = useRef(0), ry = useRef(0);

  useEffect(() => {
    const onMove = e => { mx.current = e.clientX; my.current = e.clientY; };
    window.addEventListener("mousemove", onMove);

    let raf;
    const tick = () => {
      rx.current += (mx.current - rx.current) * .14;
      ry.current += (my.current - ry.current) * .14;
      if (dotRef.current)  { dotRef.current.style.left  = mx.current+"px"; dotRef.current.style.top  = my.current+"px"; }
      if (ringRef.current) { ringRef.current.style.left = rx.current+"px"; ringRef.current.style.top = ry.current+"px"; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const hover = e => {
      const t = e.target.closest("button,a,[data-hover],.card");
      ringRef.current?.classList.toggle("h", !!t);
    };
    window.addEventListener("mouseover", hover);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", hover);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cur-ring" style={{position:"fixed"}}/>
      <div ref={dotRef}  className="cur-dot"  style={{position:"fixed"}}/>
    </>
  );
}
