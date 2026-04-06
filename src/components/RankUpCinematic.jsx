import { useEffect, useState } from "react";
import { usePath } from "../system/PathContext";

export default function RankUpCinematic({ rank, onDismiss }) {
  const { path } = usePath();
  const [phase, setPhase] = useState(0);
  const c = path.primary;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1800);
    const t4 = setTimeout(() => onDismiss?.(), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:9990,background:"#060608",
      display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,
    }}>
      {/* Shadow army effect */}
      <div style={{
        position:"absolute",bottom:0,left:0,right:0,
        height: phase>=1 ? 220 : 0,
        background:`linear-gradient(to top,${c}18,transparent)`,
        transition:"height 1.5s ease",
      }}/>

      {/* Rank letter */}
      {phase>=2 && (
        <div style={{
          fontSize:112,fontWeight:900,color:c,letterSpacing:"-4px",
          textShadow:`0 0 60px ${c}`,
          animation:"rankPop 1s cubic-bezier(.34,1.56,.64,1) both",
          position:"relative",zIndex:1,
        }}>
          @keyframes rankPop { from{transform:scale(0) rotate(-20deg);opacity:0} to{transform:scale(1) rotate(0);opacity:1} }
          {rank?.rank}
        </div>
      )}

      {phase>=3 && (
        <>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:c,letterSpacing:".25em",animation:"fadeIn .5s ease"}}>
            RANK UP
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--t3)",letterSpacing:".15em",animation:"fadeIn .5s .2s ease both"}}>
            {path.name.toUpperCase()} PATH — ADVANCING
          </div>
        </>
      )}
    </div>
  );
}
