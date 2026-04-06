export default function Page({ title, subtitle, children, action }) {
  return (
    <div className="page-enter" style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div className="fu fu-1" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div className="sys-tag" style={{ marginBottom:5 }}>{title?.toUpperCase()}</div>
          <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-.4px' }}>{title}</div>
          {subtitle && (
            <div style={{
              fontSize:13, color:'var(--t2)', marginTop:5,
              fontFamily:'JetBrains Mono,monospace',
              letterSpacing:'.03em',
            }}>
              {subtitle}
            </div>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  );
}
