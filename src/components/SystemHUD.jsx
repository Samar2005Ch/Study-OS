import React from "react";
import { useRank } from "../system/RankContext";
import { useAuth } from "../system/AuthContext";
import { useScheduler } from "../hooks/useScheduler";

export default function SystemHUD({ children, activePage, onNavigate, onLogout }) {
  const { rank, totalXP, pathId } = useRank();
  const { user } = useAuth();
  const { tasks } = useScheduler();

  const isSystem = pathId === "jinwoo";
  if (!isSystem) return children;

  const activeTask = tasks.find(t => t.status === "active") || tasks[0];

  return (
    <div className="fixed inset-0 z-0 bg-[#190e25] text-[#eedcfc] font-body overflow-hidden">
      {/* ── Background Elements ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="portal-glow" />
        <div className="arise-watermark">ARISE</div>
        <div className="shadow-particle" style={{ top: '25%', left: '25%', width: 8, height: 8 }} />
        <div className="shadow-particle" style={{ top: '66%', right: '33%', width: 12, height: 12 }} />
      </div>

      {/* ── Header ── */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-8 system-hud-header">
        <div className="flex items-center gap-6">
          <span 
            className="text-2xl font-bold tracking-tighter text-[#deb7ff] font-headline uppercase cursor-pointer"
            onClick={() => onNavigate('dashboard')}
            style={{ textShadow: '0 0 12px rgba(123,47,190,0.6)' }}
          >
            STUDY_OS_V1.0
          </span>
          <div className="h-4 w-[1px] bg-[#4c4353]/30" />
          <div className="flex items-center gap-2 text-[#00d2fd] font-mono text-[10px] tracking-widest">
            <span className="material-symbols-outlined text-sm">sensors</span>
            SYSTEM_STABLE_V1
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-[#261b32] px-4 py-1.5 border border-[#deb7ff]/20">
            <span className="text-[10px] font-mono font-bold text-[#deb7ff] tracking-[0.2rem]">
              ID: {user?.name?.slice(0,3).toUpperCase() || "JIN"}-{totalXP}
            </span>
            <div className="h-3 w-[1px] bg-[#4c4353]" />
            <span className="text-[9px] font-headline font-bold uppercase tracking-widest text-[#cfc2d5]">
              {rank.formName.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span 
              className="material-symbols-outlined text-[#cfc2d5] cursor-pointer hover:text-[#deb7ff] transition-colors"
              onClick={() => onNavigate('profile')}
            >
              settings
            </span>
            <span 
              className="material-symbols-outlined text-[#ffb4ab] cursor-pointer hover:scale-110 transition-transform"
              onClick={onLogout}
            >
              power_settings_new
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main className="relative z-10 pt-20 h-screen flex flex-row justify-center px-12 gap-10">
        
        {/* LEFT: MISSION LOG */}
        <section className="hidden xl:flex flex-col w-72 h-[75vh] gap-6 mt-10">
          <div className="space-y-1">
            <h2 className="text-[#00d2fd] font-headline font-bold uppercase tracking-[0.2rem] text-[10px]">MISSION_LOG</h2>
            <div className="h-[1px] w-full bg-gradient-to-r from-[#00d2fd]/40 to-transparent" />
          </div>

          <div className="system-hud-panel p-6 border-l border-[#00d2fd]/30 shadow-2xl flex-1 overflow-y-auto">
            <h3 className="text-[#eedcfc] font-headline font-bold text-sm mb-4 uppercase tracking-tight">
              {activeTask ? `QUEST: ${activeTask.subject_name}` : "IDLE_MODE"}
            </h3>
            
            <div className="space-y-8">
              <div className="space-y-2">
                <span className="text-[8px] font-mono text-[#cfc2d5] uppercase tracking-widest">DIFFICULTY_LEVEL</span>
                <div className="flex gap-1 text-[#00d2fd]">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-1 flex-1 ${i < 4 ? 'bg-[#00d2fd]' : 'bg-[#4c4353]/30'}`} />
                  ))}
                </div>
              </div>

              <div className="bg-[#190e25] p-4 border border-[#4c4353]/30">
                <span className="text-[8px] font-mono text-[#cfc2d5] uppercase tracking-widest block mb-2">EXPECTED_XP</span>
                <span className="text-[#deb7ff] font-mono font-bold text-lg">+500_XP</span>
              </div>

              <div className="space-y-3">
                <span className="text-[8px] font-mono text-[#cfc2d5] uppercase tracking-widest block">SYSTEM_LOG</span>
                <div className="font-mono text-[9px] text-[#cfc2d5]/60 space-y-2">
                  <p>{">"} INITIALIZING GATE...</p>
                  <p>{">"} SCANNING BIOMETRICS...</p>
                  <p>{">"} SHADOWS STANDBY: 1.2K</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CENTER: PRIMARY WINDOW content area */}
        <section className="flex-1 max-w-5xl h-[80vh] flex flex-col items-center">
          <div className="w-full h-full glitch-border system-window p-8 overflow-y-auto custom-scrollbar shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            {children}
          </div>
        </section>

        {/* RIGHT: PLAYER PROFILE */}
        <section className="hidden xl:flex flex-col w-72 h-[75vh] gap-6 text-right mt-10">
          <div className="space-y-1">
            <h2 className="text-[#deb7ff] font-headline font-bold uppercase tracking-[0.2rem] text-[10px]">PLAYER_STATUS</h2>
            <div className="h-[1px] w-full bg-gradient-to-l from-[#deb7ff]/40 to-transparent" />
          </div>

          <div className="system-hud-panel p-6 border-r border-[#deb7ff]/30 shadow-2xl space-y-8 flex-1">
            <div>
              <h3 className="text-[#deb7ff] font-headline font-bold text-base mb-1 uppercase tracking-tight">{user?.name || "MONARCH"}</h3>
              <p className="text-[9px] font-mono text-[#cfc2d5] uppercase tracking-widest">
                CLASS: VOID_WALKER | LVL: {Math.floor(totalXP / 100) + 1}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[8px] font-mono text-[#cfc2d5] uppercase tracking-widest">XP_PROGRESS</span>
                <span className="text-[#deb7ff] font-mono text-[9px]">{totalXP % 100}%</span>
              </div>
              <div className="h-[2px] w-full bg-[#190e25] border border-[#4c4353]/30">
                <div 
                  className="h-full bg-[#deb7ff]" 
                  style={{ width: `${totalXP % 100}%`, boxShadow: '0 0 10px rgba(222,183,255,0.4)' }} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="bg-[#190e25] p-4 border border-[#4c4353]/30 flex justify-between items-center">
                <span className="text-[8px] font-mono text-[#cfc2d5] uppercase">STREAK</span>
                <span className="text-xl font-mono text-[#00d2fd]">07D</span>
              </div>
              <div className="bg-[#190e25] p-4 border border-[#4c4353]/30 flex justify-between items-center">
                <span className="text-[8px] font-mono text-[#cfc2d5] uppercase">GLOBAL_RANK</span>
                <span className="text-xl font-mono text-[#deb7ff]">#01</span>
              </div>
            </div>

            <div className="pt-6 border-t border-[#4c4353]/20 space-y-3">
              <span className="text-[8px] font-mono text-[#cfc2d5] uppercase tracking-widest block">ACTIVE_SKILLS</span>
              <div className="flex flex-col gap-2">
                <div className="text-[9px] font-headline text-[#eedcfc]/80 uppercase tracking-widest">
                  {"[ ARISE ]"}
                </div>
                <div className="text-[9px] font-headline text-[#eedcfc]/40 uppercase tracking-widest">
                  {"[ BLOODLUST ]"}
                </div>
              </div>
            </div>
          </div>

          <button 
            className="w-full bg-[#deb7ff]/5 border border-[#deb7ff]/20 py-3 text-[#deb7ff] font-headline font-bold text-[9px] tracking-[0.3rem] uppercase hover:bg-[#deb7ff]/10 transition-colors glitch-border"
            onClick={() => onNavigate('dashboard')}
          >
            RESTORE_MANA
          </button>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="fixed bottom-0 w-full z-50 px-12 flex items-center justify-between system-hud-footer">
        <div className="flex gap-8 items-center text-[9px] font-mono text-[#cfc2d5]/60 tracking-widest">
          <span className="flex items-center gap-2"><span className="w-1 h-1 bg-[#00d2fd] rounded-full"></span> CPU_LOAD: 12%</span>
          <span className="flex items-center gap-2"><span className="w-1 h-1 bg-[#00d2fd] rounded-full"></span> LATENCY: 14MS</span>
          <span className="flex items-center gap-2"><span className="w-1 h-1 bg-[#00d2fd] rounded-full"></span> SHADOW_COUNT: 72,109</span>
        </div>
        <div className="text-[9px] font-mono text-[#00d2fd]/60 tracking-widest uppercase">
          SYSTEM_STATUS: NO_THREATS_DETECTED
        </div>
      </footer>
    </div>
  );
}
