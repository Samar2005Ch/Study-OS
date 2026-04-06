import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth }     from "./system/AuthContext";
import { PathProvider, usePath }     from "./system/PathContext";
import { RankProvider }              from "./system/RankContext";
import Cursor                        from "./components/Cursor";
import Mesh                          from "./components/Mesh";
import Toast                         from "./components/Toast";
import Scouter                       from "./components/Scouter";
import Sidebar                       from "./components/Sidebar";
import AuthPage                      from "./pages/Auth/AuthPage";
import OnboardingScreen              from "./pages/Onboarding/OnboardingScreen";
import PathSelectScreen              from "./pages/PathSelect/PathSelectScreen";
import DashboardPage                 from "./pages/Dashboard/DashboardPage";
import ExamsPage                     from "./pages/Exams/ExamsPage";
import SchedulePage                  from "./pages/Schedule/SchedulePage";
import AnalyticsPage                 from "./pages/Analytics/AnalyticsPage";
import SkillsPage                    from "./pages/Skills/SkillsPage";
import TimetablePage                 from "./pages/Timetable/TimetablePage";
import ChatPage                      from "./pages/Chat/ChatPage";
import NotificationsPage             from "./pages/Notifications/NotificationsPage";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError:false, error:null }; }
  static getDerivedStateFromError(e) { return { hasError:true, error:e }; }
  render() {
    if (this.state.hasError) return (
      <div style={{background:"#07090f",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,fontFamily:"monospace",padding:24,color:"#e8ecf4",cursor:"auto"}}>
        <div style={{fontSize:10,color:"#f06060",letterSpacing:".14em"}}>[ SYSTEM ERROR ]</div>
        <div style={{fontSize:13}}>{this.state.error?.message}</div>
        <div style={{fontSize:10,color:"#5a6070"}}>Make sure backend is running: <span style={{color:"#4f6ef7"}}>node server/server.js</span></div>
        <button onClick={()=>window.location.reload()} style={{padding:"8px 20px",background:"rgba(79,110,247,.15)",border:"1px solid #4f6ef7",color:"#4f6ef7",cursor:"pointer",fontFamily:"monospace",fontSize:11,borderRadius:8}}>RELOAD</button>
      </div>
    );
    return this.props.children;
  }
}

function PageRouter({ page }) {
  switch(page) {
    case "dashboard":     return <DashboardPage/>;
    case "exams":         return <ExamsPage/>;
    case "schedule":      return <SchedulePage/>;
    case "analytics":     return <AnalyticsPage/>;
    case "skills":        return <SkillsPage/>;
    case "timetable":     return <TimetablePage/>;
    case "chat":          return <ChatPage/>;
    case "notifications": return <NotificationsPage/>;
    default:              return <DashboardPage/>;
  }
}

function AppInner() {
  const { isLoggedIn } = useAuth();
  const { pathId }     = usePath();
  const [page, setPage]         = useState("dashboard");
  const [pathChosen, setPathChosen] = useState(() => !!localStorage.getItem("studyos_path"));
  const [onboarded, setOnboarded]   = useState(() => localStorage.getItem("studyos_onboarded") === "1");

  // Not logged in
  if (!isLoggedIn) return <AuthPage/>;

  // No path chosen
  if (!pathChosen) return (
    <PathSelectScreen onPathChosen={() => {
      setPathChosen(true);
      // don't reload — just proceed to onboarding
    }}/>
  );

  // Not onboarded
  if (!onboarded) return (
    <OnboardingScreen onDone={() => {
      localStorage.setItem("studyos_onboarded","1");
      setOnboarded(true);
    }}/>
  );

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"var(--bg)" }}>
      <Sidebar activePage={page} onNavigate={setPage}/>
      <div style={{ flex:1, overflow:"hidden" }}>
        <PageRouter page={page}/>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PathProvider>
          <RankProvider>
            <Cursor/>
            <Mesh/>
            <Scouter/>
            <Toast/>
            <AppInner/>
          </RankProvider>
        </PathProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
