/**
 * PathContext.jsx — Provides path-aware colors, labels, dialogue
 * All 8 paths. Each changes: accent color, UI labels, stat names.
 */
import { createContext, useContext, useState, useEffect } from "react";

export const PATHS = {
  shadow:   { name:"Shadow Monarch",    char:"Jin-woo",   primary:"#4f6ef7", secondary:"#8496ff", glow:"rgba(79,110,247,0.12)",   xpLabel:"Shadow Energy",     streakLabel:"Consecutive Raids",  sessionLabel:"Dungeons Cleared", sig:"ARISE.",         navSchedule:"System Quests",  navAnalytics:"Shadow Archive" },
  vegeta:   { name:"Ultra Ego",         char:"Vegeta",    primary:"#bf5af2", secondary:"#d490ff", glow:"rgba(191,90,242,0.12)",   xpLabel:"Power Level",       streakLabel:"Saiyan Pride Days",  sessionLabel:"Battles Won",      sig:"GALICK GUN.",    navSchedule:"Training",       navAnalytics:"Scouter Data"   },
  goku:     { name:"Ultra Instinct",    char:"Goku",      primary:"#c8c8dc", secondary:"#e0e0f0", glow:"rgba(200,200,220,0.10)",  xpLabel:"Ki Mastery",        streakLabel:"Training Days",      sessionLabel:"Sessions",         sig:"HAAA!",          navSchedule:"Training",       navAnalytics:"Progress"       },
  luffy:    { name:"Gear 5",            char:"Luffy",     primary:"#ffd60a", secondary:"#ffe94d", glow:"rgba(255,214,10,0.10)",   xpLabel:"Haki Points",       streakLabel:"Adventure Days",     sessionLabel:"Islands Conquered",sig:"GOMU GOMU!",     navSchedule:"Quests",         navAnalytics:"Journey Log"    },
  gohan:    { name:"Beast Mode",        char:"Gohan",     primary:"#30d158", secondary:"#5ee87a", glow:"rgba(48,209,88,0.10)",    xpLabel:"Latent Power",      streakLabel:"Training Streak",    sessionLabel:"Limits Broken",    sig:"LIMIT BROKEN.",  navSchedule:"Challenges",     navAnalytics:"Power Data"     },
  saitama:  { name:"One Punch",         char:"Saitama",   primary:"#ffc800", secondary:"#ffd84d", glow:"rgba(255,200,0,0.08)",    xpLabel:"Training Points",   streakLabel:"Routine Days",       sessionLabel:"Sessions Done",    sig:"OK.",            navSchedule:"Routine",        navAnalytics:"Stats"          },
  allmight: { name:"Plus Ultra",        char:"All Might", primary:"#1e78ff", secondary:"#5ba0ff", glow:"rgba(30,120,255,0.10)",   xpLabel:"Plus Ultra Points", streakLabel:"Hero Days",          sessionLabel:"Missions",         sig:"SMASH!!!",       navSchedule:"Missions",       navAnalytics:"Hero Log"       },
  levi:     { name:"Humanity's Finest", char:"Levi",      primary:"#a0aabe", secondary:"#c0c8d8", glow:"rgba(160,170,190,0.08)",  xpLabel:"Combat Experience", streakLabel:"Consecutive Days",   sessionLabel:"Operations",       sig:"DEDICATE.",      navSchedule:"Operations",     navAnalytics:"Field Report"   },
};

const PathCtx = createContext(null);

export function PathProvider({ children }) {
  const [pathId, setPathId] = useState(
    () => localStorage.getItem("studyos_path") || "shadow"
  );

  const path = PATHS[pathId] || PATHS.shadow;

  function setPath(id) {
    if (!PATHS[id]) return;
    localStorage.setItem("studyos_path", id);
    setPathId(id);
    // Apply accent CSS var
    document.documentElement.style.setProperty("--a",  PATHS[id].primary);
    document.documentElement.style.setProperty("--a2", PATHS[id].secondary);
    document.documentElement.style.setProperty("--ag", PATHS[id].glow);
  }

  // Apply on mount
  useEffect(() => {
    document.documentElement.style.setProperty("--a",  path.primary);
    document.documentElement.style.setProperty("--a2", path.secondary);
    document.documentElement.style.setProperty("--ag", path.glow);
  }, []);

  return (
    <PathCtx.Provider value={{ pathId, path, setPath, PATHS }}>
      {children}
    </PathCtx.Provider>
  );
}

export function usePath() {
  const ctx = useContext(PathCtx);
  if (!ctx) throw new Error("usePath must be inside PathProvider");
  return ctx;
}
