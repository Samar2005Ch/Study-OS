/**
 * components/SegmentedBar.jsx
 * Segmented power-meter style bar — like a game HP/XP bar.
 * Each segment fills individually, glows when active.
 */

export default function SegmentedBar({ pct, color, segments=20, height=8 }) {
  const filled = Math.round((pct / 100) * segments);
  return (
    <div style={{ display:"flex", gap:2, alignItems:"center" }}>
      {Array.from({length:segments}).map((_,i) => {
        const active = i < filled;
        const isTip  = i === filled - 1;
        return (
          <div key={i} style={{
            flex:1, height,
            background: active ? color : "#1c2030",
            transition: `background 0.3s ease ${i*0.02}s`,
            boxShadow: isTip ? `0 0 8px ${color}` : active ? `0 0 3px ${color}55` : "none",
            clipPath: "polygon(2px 0, 100% 0, calc(100% - 2px) 100%, 0 100%)",
          }}/>
        );
      })}
      <style>{`
        @keyframes segCharge {
          from { opacity:0.3; }
          to   { opacity:1; }
        }
      `}</style>
    </div>
  );
}
