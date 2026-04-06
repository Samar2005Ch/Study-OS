/**
 * Panel.jsx — Premium glass card
 * replaces old Panel with new glass morphism design
 */
import { useState } from 'react';
import { useRank } from '../system/RankContext';

export default function Panel({
  children, style={}, title, action, glow=false,
  gradient=false, shimmer=true, className='',
}) {
  const { rank } = useRank();
  const [hov, setHov] = useState(false);

  const base = {
    background:'rgba(13,14,26,0.58)',
    border:`1px solid ${hov ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.052)'}`,
    borderRadius:18,
    backdropFilter:'blur(22px)',
    WebkitBackdropFilter:'blur(22px)',
    position:'relative',
    overflow:'hidden',
    padding:22,
    transition:'all .3s cubic-bezier(.4,0,.2,1)',
    transform: hov ? 'translateY(-2px)' : 'translateY(0)',
    boxShadow: hov
      ? glow ? `0 12px 32px rgba(0,0,0,0.3),0 0 0 1px ${rank.primary}22` : '0 10px 28px rgba(0,0,0,0.28)'
      : 'none',
    ...(gradient ? {
      background:'linear-gradient(135deg,rgba(79,110,247,0.1),rgba(155,109,255,0.07),rgba(224,64,251,0.05))',
      border:'1px solid rgba(79,110,247,0.18)',
    } : {}),
    ...style,
  };

  return (
    <div
      className={className}
      style={base}
      onMouseEnter={()=>setHov(true)}
      onMouseLeave={()=>setHov(false)}
    >
      {/* Top shimmer line */}
      <div style={{
        position:'absolute',top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${hov?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.07)'},transparent)`,
        transition:'opacity .3s',
        pointerEvents:'none',
      }}/>

      {/* Shimmer sweep on hover */}
      {shimmer && hov && (
        <div style={{
          position:'absolute',top:0,left:'-100%',bottom:0,width:'60%',
          background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.018),transparent)',
          animation:'shimmerSweep .65s ease forwards',
          pointerEvents:'none',
        }}/>
      )}

      {/* Header */}
      {(title || action) && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
          {title && (
            <div style={{fontSize:14,fontWeight:700,display:'flex',alignItems:'center',gap:8}}>
              <div style={{
                width:6,height:6,borderRadius:1,transform:'rotate(45deg)',
                background:'linear-gradient(135deg,var(--g1),var(--g2))',
                boxShadow:'0 0 6px var(--a)',flexShrink:0,
              }}/>
              {title}
            </div>
          )}
          {action}
        </div>
      )}

      {children}

      <style>{`
        @keyframes shimmerSweep{
          from{left:-100%}to{left:150%}
        }
      `}</style>
    </div>
  );
}
