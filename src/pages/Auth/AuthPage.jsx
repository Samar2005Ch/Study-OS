import { useState } from "react";
import { useAuth } from "../../system/AuthContext";
import { api } from "../../api/client";

export default function AuthPage() {
  const { login } = useAuth();
  const [tab, setTab] = useState("login");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [otp, setOtp] = useState(""); const [pendingEmail, setPendingEmail] = useState("");
  const [error, setError] = useState(""); const [info, setInfo] = useState(""); const [loading, setLoading] = useState(false);
  const isOtp = tab === "otp";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSignup() {
    setError(""); setInfo("");
    if (!name.trim()) { setError("Name is required."); return; }
    if (!emailRegex.test(email)) { setError("Enter a valid email."); return; }
    if (password.length < 6) { setError("Password must be 6+ characters."); return; }
    setLoading(true);
    try { const res = await api.signup({name,email,password}); setPendingEmail(email.toLowerCase()); setInfo(res.message); setTab("otp"); }
    catch(e) { setError(e.message); } finally { setLoading(false); }
  }

  async function handleVerifyOtp() {
    setError(""); setLoading(true);
    try { const res = await api.verifyOtp({email:pendingEmail,otp}); login(res.token,res.user); }
    catch(e) { setError(e.message); } finally { setLoading(false); }
  }

  async function handleLogin() {
    setError("");
    if (!emailRegex.test(email)) { setError("Enter a valid email."); return; }
    if (!password) { setError("Password is required."); return; }
    setLoading(true);
    try { const res = await api.login({email,password}); login(res.token,res.user); }
    catch(e) { setError(e.message); } finally { setLoading(false); }
  }

  const inp = { width:"100%", padding:"11px 14px", background:"#0d0f14", border:"1px solid #1c2030", borderRadius:0, color:"#e8ecf4", fontFamily:"monospace", fontSize:13, outline:"none", marginBottom:10 };
  const focus = e => e.target.style.borderColor="#4f6ef7";
  const blur  = e => e.target.style.borderColor="#1c2030";

  return (
    <div style={{minHeight:"100vh",background:"#07090f",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"monospace",backgroundImage:"linear-gradient(rgba(79,110,247,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(79,110,247,.04) 1px,transparent 1px)",backgroundSize:"40px 40px",padding:20,cursor:"auto"}}>
      <div style={{width:"100%",maxWidth:390}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:10,color:"#3a4060",letterSpacing:".14em",marginBottom:8}}>{isOtp?"[ EMAIL VERIFICATION ]":"[ SYSTEM INITIALIZED ]"}</div>
          <div style={{fontSize:28,fontWeight:900,color:"#e8ecf4",letterSpacing:".06em"}}>STUDY<span style={{color:"#4f6ef7"}}>OS</span></div>
          <div style={{fontSize:11,color:"#5a6070",marginTop:4}}>Smart Study Scheduler</div>
        </div>
        <div style={{background:"#0a0c14",borderTop:"2px solid #4f6ef7",borderLeft:"1px solid rgba(79,110,247,.15)",borderRight:"1px solid rgba(79,110,247,.08)",borderBottom:"1px solid rgba(79,110,247,.08)",padding:"24px 28px",position:"relative"}}>
          <div style={{position:"absolute",top:0,left:0,width:10,height:10,borderTop:"2px solid #4f6ef7",borderLeft:"2px solid #4f6ef7"}}/>
          <div style={{position:"absolute",bottom:0,right:0,width:8,height:8,borderBottom:"1px solid rgba(79,110,247,.25)",borderRight:"1px solid rgba(79,110,247,.25)"}}/>

          {isOtp ? (
            <div>
              <div style={{fontSize:9,color:"#3a4060",letterSpacing:".12em",marginBottom:16}}>[ VERIFY YOUR EMAIL ]</div>
              <div style={{fontSize:11,color:"#8090a8",marginBottom:20,lineHeight:1.6}}>6-digit code sent to<br/><span style={{color:"#4f6ef7"}}>{pendingEmail}</span></div>
              <input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} onKeyDown={e=>e.key==="Enter"&&handleVerifyOtp()}
                placeholder="6-digit code" maxLength={6} autoFocus style={{...inp,fontSize:24,letterSpacing:".3em",textAlign:"center",marginBottom:16}} onFocus={focus} onBlur={blur}/>
              {error&&<div style={{fontSize:10,color:"#f06060",borderLeft:"2px solid #f06060",padding:"6px 10px",background:"rgba(240,96,96,.06)",marginBottom:12}}>{error}</div>}
              {info&&<div style={{fontSize:10,color:"#2de2a0",borderLeft:"2px solid #2de2a0",padding:"6px 10px",background:"rgba(45,226,160,.06)",marginBottom:12}}>{info}</div>}
              <button onClick={handleVerifyOtp} disabled={loading||otp.length!==6} style={{width:"100%",padding:13,border:"1px solid #4f6ef7",background:otp.length===6?"rgba(79,110,247,.15)":"#0d0f14",color:otp.length===6?"#4f6ef7":"#3a4060",fontWeight:700,fontSize:12,cursor:otp.length===6?"pointer":"not-allowed",fontFamily:"monospace",letterSpacing:".08em",borderRadius:0,marginBottom:10}}>{loading?"[ VERIFYING... ]":"[ VERIFY OTP ]"}</button>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}>
                <span onClick={async()=>{try{await api.resendOtp({email:pendingEmail});setInfo("New OTP sent.");}catch(e){setError(e.message);}}} style={{color:"#4f6ef7",cursor:"pointer"}}>Resend OTP</span>
                <span onClick={()=>{setTab("signup");setError("");setInfo("");}} style={{color:"#3a4060",cursor:"pointer"}}>Go back</span>
              </div>
            </div>
          ) : (
            <div>
              <div style={{display:"flex",gap:0,marginBottom:24,borderBottom:"1px solid #1c2030"}}>
                {["login","signup"].map(t=><button key={t} onClick={()=>{setTab(t);setError("");setInfo("");}} style={{flex:1,padding:"8px 0",border:"none",background:"transparent",borderBottom:tab===t?"2px solid #4f6ef7":"2px solid transparent",color:tab===t?"#4f6ef7":"#3a4060",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"monospace",letterSpacing:".08em",marginBottom:-1,transition:"all .2s"}}>{t==="login"?"LOGIN":"CREATE ACCOUNT"}</button>)}
              </div>
              <div style={{fontSize:9,color:"#3a4060",letterSpacing:".12em",marginBottom:16}}>{tab==="login"?"[ HUNTER AUTHENTICATION ]":"[ NEW HUNTER REGISTRATION ]"}</div>
              {tab==="signup"&&<><div style={{fontSize:9,color:"#5a6070",marginBottom:5,letterSpacing:".08em"}}>HUNTER NAME</div><input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSignup()} placeholder="Your name" style={inp} onFocus={focus} onBlur={blur}/></>}
              <div style={{fontSize:9,color:"#5a6070",marginBottom:5,letterSpacing:".08em"}}>EMAIL</div>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(tab==="login"?handleLogin():handleSignup())} placeholder="your@email.com" style={inp} onFocus={focus} onBlur={blur}/>
              <div style={{fontSize:9,color:"#5a6070",marginBottom:5,letterSpacing:".08em"}}>PASSWORD</div>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(tab==="login"?handleLogin():handleSignup())} placeholder={tab==="signup"?"Minimum 6 characters":"••••••••"} style={{...inp,marginBottom:16}} onFocus={focus} onBlur={blur}/>
              {error&&<div style={{fontSize:10,color:"#f06060",borderLeft:"2px solid #f06060",padding:"6px 10px",background:"rgba(240,96,96,.06)",marginBottom:14}}>{error}</div>}
              <button onClick={tab==="login"?handleLogin:handleSignup} disabled={loading} style={{width:"100%",padding:13,border:"1px solid #4f6ef7",background:loading?"#0d0f14":"rgba(79,110,247,.15)",color:loading?"#3a4060":"#4f6ef7",fontWeight:700,fontSize:12,cursor:loading?"not-allowed":"pointer",fontFamily:"monospace",letterSpacing:".08em",borderRadius:0,transition:"all .2s"}}>
                {loading?(tab==="login"?"[ AUTHENTICATING... ]":"[ SENDING OTP... ]"):(tab==="login"?"[ LOGIN ]":"[ SEND VERIFICATION CODE ]")}
              </button>
            </div>
          )}
        </div>
        {!isOtp&&<div style={{textAlign:"center",marginTop:16,fontSize:10,color:"#3a4060"}}>{tab==="login"?<>No account? <span onClick={()=>{setTab("signup");setError("");}} style={{color:"#4f6ef7",cursor:"pointer"}}>Create one</span></>:<>Already have one? <span onClick={()=>{setTab("login");setError("");}} style={{color:"#4f6ef7",cursor:"pointer"}}>Login</span></>}</div>}
      </div>
    </div>
  );
}
