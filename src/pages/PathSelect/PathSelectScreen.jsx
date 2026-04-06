import { usePath, PATHS } from "../../system/PathContext";

const PATH_LIST = [
  {id:"shadow",  icon:"🌑", sig:"ARISE.",        desc:"Silent. Inevitable. The weakest becomes strongest."},
  {id:"vegeta",  icon:"👑", sig:"GALICK GUN.",   desc:"Pride of a Saiyan. Pain is just more power."},
  {id:"goku",    icon:"⚡", sig:"HAAA!",         desc:"Empty your mind. Let the body move on its own."},
  {id:"luffy",   icon:"☀️", sig:"GOMU GOMU!",   desc:"Freedom above all. Joy in battle. No limit."},
  {id:"gohan",   icon:"🐉", sig:"LIMIT BROKEN.", desc:"Sleeping power that shatters limits when pushed."},
  {id:"saitama", icon:"👊", sig:"OK.",           desc:"100 push-ups. 100 sit-ups. Every day. No excuses."},
  {id:"allmight",icon:"💪", sig:"SMASH!!!",      desc:"Go beyond. Smile no matter what. Plus Ultra."},
  {id:"levi",    icon:"⚔️", sig:"DEDICATE.",     desc:"Give everything. Regret nothing. The strong protect."},
];

export default function PathSelectScreen({ onPathChosen }) {
  const { pathId, setPath, PATHS } = usePath();

  function choose(id) {
    setPath(id);
    setTimeout(() => onPathChosen(), 400);
  }

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:32,flexDirection:"column",gap:32}}>
      <div style={{textAlign:"center"}}>
        <div className="tag" style={{marginBottom:10}}>SYSTEM INITIALIZATION — PATH SELECTION</div>
        <h1 style={{fontSize:36,fontWeight:900,letterSpacing:"-1px",marginBottom:8}}>Choose Your Identity.</h1>
        <div style={{fontSize:13,color:"var(--t3)",maxWidth:480}}>This defines who you are in the system. It cannot be changed. Your path shapes your UI, labels, and power-ups.</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,width:"100%",maxWidth:900}}>
        {PATH_LIST.map(p=>{
          const pData = PATHS[p.id];
          const selected = pathId===p.id;
          return (
            <div key={p.id} onClick={()=>choose(p.id)} style={{
              background:"var(--s1)",border:`1px solid ${selected?pData.primary+"50":"var(--b1)"}`,borderRadius:16,padding:"20px 18px",cursor:"pointer",
              boxShadow:selected?`0 0 0 1px ${pData.primary}40,0 20px 60px rgba(0,0,0,.4)`:"none",
              transform:selected?"translateY(-4px)":"",transition:"all .25s",
            }}>
              <div style={{fontSize:28,marginBottom:10}}>{p.icon}</div>
              <div style={{fontSize:13,fontWeight:800,marginBottom:3,color:selected?pData.primary:"var(--t1)"}}>{pData.name}</div>
              <div className="tag" style={{marginBottom:8}}>{pData.char}</div>
              <div style={{fontSize:11,color:"var(--t3)",lineHeight:1.5,marginBottom:10}}>{p.desc}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:5,display:"inline-block",background:`${pData.primary}15`,color:pData.primary,border:`1px solid ${pData.primary}30`}}>{p.sig}</div>
            </div>
          );
        })}
      </div>

      <div className="tag">THIS CANNOT BE CHANGED — CHOOSE WISELY</div>
    </div>
  );
}
