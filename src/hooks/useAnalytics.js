/**
 * hooks/useAnalytics.js  v2
 * Fixed: handles both snake_case (SQLite) and camelCase field names
 * Fixed: ghost/skip/completed check works with 0/1 integers from SQLite
 */

// Helper to read both snake_case and camelCase
const fld = (obj, snake, camel) => obj[snake] ?? obj[camel] ?? 0;
const isTrue = (v) => v === 1 || v === true;

export function calcAnalytics(history, subjects) {
  if (!history.length) return null;

  const total     = history.length;
  const completed = history.filter(h => isTrue(h.completed)).length;
  const ghosted   = history.filter(h => isTrue(h.ghosted)).length;
  const skipped   = history.filter(h => isTrue(h.skipped)).length;
  const totalXP   = history.reduce((a,h) => a + (fld(h,"xp_earned","xpEarned")||0), 0);
  const totalMins = history
    .filter(h => isTrue(h.completed))
    .reduce((a,h) => a + (fld(h,"actual_mins","actualMins") || fld(h,"planned_mins","plannedMins") || 0), 0);

  const completionRate = Math.round((completed / total) * 100);
  const ghostRate      = Math.round((ghosted   / total) * 100);
  const skipRate       = Math.round((skipped   / total) * 100);

  // Per-subject stats — handle both subject_id and subjectId
  const bySubject = subjects.map(s => {
    const sh    = history.filter(h => fld(h,"subject_id","subjectId") === s.id);
    const sDone  = sh.filter(h => isTrue(h.completed)).length;
    const sGhost = sh.filter(h => isTrue(h.ghosted)).length;
    const sSkip  = sh.filter(h => isTrue(h.skipped)).length;
    const sMins  = sh.filter(h => isTrue(h.completed))
      .reduce((a,h) => a + (fld(h,"actual_mins","actualMins") || fld(h,"planned_mins","plannedMins") || 0), 0);
    const sXP   = sh.reduce((a,h) => a + (fld(h,"xp_earned","xpEarned")||0), 0);
    const sRate = sh.length ? Math.round((sDone/sh.length)*100) : 0;

    const timeCounts = {};
    sh.filter(h => isTrue(h.completed)).forEach(h => {
      const t = fld(h,"time_of_day","timeOfDay") || "morning";
      timeCounts[t] = (timeCounts[t]||0)+1;
    });
    const bestTime = Object.entries(timeCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;

    return {
      id:s.id, name:s.name, color:s.color, difficulty:s.difficulty,
      total:sh.length, done:sDone, ghost:sGhost, skip:sSkip,
      completionRate:sRate, totalMins:sMins, totalXP:sXP, bestTime,
    };
  }).filter(s => s.total > 0);

  // Time of day breakdown
  const timeSlots = ["morning","afternoon","evening","night"];
  const byTime = timeSlots.map(slot => ({
    label: slot,
    done:  history.filter(h => fld(h,"time_of_day","timeOfDay")===slot && isTrue(h.completed)).length,
    ghost: history.filter(h => fld(h,"time_of_day","timeOfDay")===slot && isTrue(h.ghosted)).length,
    total: history.filter(h => fld(h,"time_of_day","timeOfDay")===slot).length,
  }));
  const bestTimeSlot  = [...byTime].sort((a,b)=>b.done -a.done)[0];
  const worstTimeSlot = [...byTime].sort((a,b)=>b.ghost-a.ghost)[0];

  // Streak
  const doneDates = [...new Set(
    history.filter(h=>isTrue(h.completed)).map(h=>h.date)
  )].sort().reverse();
  let streak = 0;
  for (let i=0;i<doneDates.length;i++){
    const d=new Date(); d.setDate(d.getDate()-i);
    if(doneDates[i]===d.toISOString().split("T")[0]) streak++;
    else break;
  }

  // Weekly — last 7 days
  const weekly = [];
  for (let i=6;i>=0;i--){
    const d=new Date(); d.setDate(d.getDate()-i);
    const ds=d.toISOString().split("T")[0];
    const dh=history.filter(h=>h.date===ds);
    weekly.push({
      date:ds,
      label:d.toLocaleDateString("en-IN",{weekday:"short"}),
      done: dh.filter(h=>isTrue(h.completed)).length,
      ghost:dh.filter(h=>isTrue(h.ghosted)).length,
      mins: dh.filter(h=>isTrue(h.completed))
              .reduce((a,h)=>a+(fld(h,"actual_mins","actualMins")||fld(h,"planned_mins","plannedMins")||0),0),
      xp:  dh.reduce((a,h)=>a+(fld(h,"xp_earned","xpEarned")||0),0),
      isToday:i===0,
    });
  }

  // Insights — only when real data
  const insights = [];
  if (completionRate>=70 && total>=5)
    insights.push({type:"success",msg:`Strong ${completionRate}% completion rate. Keep the momentum.`});
  else if (completionRate<40 && total>=5)
    insights.push({type:"warning",msg:`Only ${completionRate}% completion. Try shorter sessions.`});
  if (ghostRate>30 && total>=5)
    insights.push({type:"danger",msg:`${ghostRate}% ghost rate. You lose focus most in the ${worstTimeSlot?.label||"evening"}.`});
  if (streak>=3)
    insights.push({type:"success",msg:`${streak}-day streak! Consistency is your biggest advantage.`});
  if (bestTimeSlot?.done>0)
    insights.push({type:"info",msg:`Most productive time: ${bestTimeSlot.label} — ${bestTimeSlot.done} sessions completed.`});
  const bestS  = [...bySubject].sort((a,b)=>b.completionRate-a.completionRate)[0];
  const worstS = [...bySubject].sort((a,b)=>a.completionRate-b.completionRate)[0];
  if (bestS&&worstS&&bestS.id!==worstS.id&&total>=5)
    insights.push({type:"info",msg:`${bestS.name} ${bestS.completionRate}% vs ${worstS.name} ${worstS.completionRate}%. Schedule ${worstS.name} in ${worstS.bestTime||"morning"}.`});

  return {
    total,completed,ghosted,skipped,
    completionRate,ghostRate,skipRate,
    totalXP,totalMins,
    bySubject,byTime,bestTimeSlot,worstTimeSlot,
    streak,weekly,insights,
  };
}
