/**
 * pages/Timetable/WakeSlotRow.jsx
 * Lets the student set their own wake and sleep times.
 * These are used by the free-slot calculator and AI scheduler.
 */

import { DS } from "../../constants/theme";
import { fmt12 } from "../../hooks/useTimetable";

const WAKE_HOURS  = ["04","05","06","07","08","09","10"];
const SLEEP_HOURS = ["20","21","22","23","00"];
const WAKE_LABELS = { "04":"4 AM","05":"5 AM","06":"6 AM","07":"7 AM","08":"8 AM","09":"9 AM","10":"10 AM" };
const SLEEP_LABELS= { "20":"8 PM","21":"9 PM","22":"10 PM","23":"11 PM","00":"12 AM" };

const sel = {
  padding: "7px 12px",
  background: "#0a0c14",
  border: `0.5px solid`,
  borderRadius: "8px",
  color: "inherit",
  fontSize: 12, fontFamily: "inherit",
  cursor: "pointer", outline: "none",
};

export default function WakeSlotRow({ wakeTime, sleepTime, onWakeChange, onSleepChange }) {
  const wakeHr  = wakeTime.split(":")[0];
  const sleepHr = sleepTime.split(":")[0];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 20,
      padding: "12px 16px", marginBottom: 24,
      background: DS.surfaceAlt,
      border: `0.5px solid ${DS.border}`,
      borderRadius: DS.r12,
    }}>
      <span style={{ fontSize: 12, color: DS.textMuted, whiteSpace: "nowrap" }}>
        Your day
      </span>

      {/* Wake time */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>🌅</span>
        <span style={{ fontSize: 12, color: DS.textSecondary }}>Wake up</span>
        <select
          value={wakeHr}
          onChange={e => onWakeChange(`${e.target.value}:00`)}
          style={{ ...sel, borderColor: DS.primary + "60", color: DS.primary }}
        >
          {WAKE_HOURS.map(h => (
            <option key={h} value={h}>{WAKE_LABELS[h]}</option>
          ))}
        </select>
      </div>

      <span style={{ color: DS.border, fontSize: 18 }}>—</span>

      {/* Sleep time */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20 }}>🌙</span>
        <span style={{ fontSize: 12, color: DS.textSecondary }}>Sleep</span>
        <select
          value={sleepHr}
          onChange={e => onSleepChange(`${e.target.value}:00`)}
          style={{ ...sel, borderColor: DS.warning + "60", color: DS.warning }}
        >
          {SLEEP_HOURS.map(h => (
            <option key={h} value={h}>{SLEEP_LABELS[h]}</option>
          ))}
        </select>
      </div>

      {/* Live preview */}
      <div style={{ marginLeft: "auto", fontSize: 11, color: DS.textMuted }}>
        Active hours: <span style={{ color: DS.textSecondary, fontFamily: DS.fontMono }}>
          {fmt12(wakeTime)} – {fmt12(sleepTime)}
        </span>
      </div>
    </div>
  );
}
