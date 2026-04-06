/**
 * pages/Timetable/AddSlotForm.jsx
 *
 * WHAT CHANGED:
 *   - Replaced type="time" with AM/PM dropdowns
 *   - Hours 1-12, Minutes 00/15/30/45, AM/PM selector
 *   - Converts to 24hr format internally before saving
 */

import { useState } from "react";
import { DS } from "../../constants/theme";
import { DAYS, SLOT_LABELS } from "../../constants/timetable";
import { to24 } from "../../hooks/useTimetable";

const HOURS   = [1,2,3,4,5,6,7,8,9,10,11,12];
const MINUTES = ["00","15","30","45"];

const lbl = {
  fontSize: 11, color: DS.textMuted,
  letterSpacing: "0.04em", display: "block", marginBottom: 5,
};

const sel = {
  width: "100%", padding: "8px 10px",
  background: "#0d0f14",
  border: "1px solid rgba(79,110,247,0.25)",
  borderRadius: 0,
  color: "#e8ecf4",
  fontSize: 12, fontFamily: "monospace", outline: "none",
  cursor: "pointer",
};

// One AM/PM time picker — three dropdowns side by side
function TimePicker({ value, onChange, label }) {
  // Parse current 24hr value back to 12hr for display
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  const mins   = String(m).padStart(2, "0");

  function update(newHour, newMin, newPeriod) {
    onChange(to24(newHour, newMin, newPeriod));
  }

  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
        {/* Hour */}
        <select
          value={hour12}
          onChange={e => update(e.target.value, mins, period)}
          style={sel}
        >
          {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>

        {/* Minute */}
        <select
          value={mins}
          onChange={e => update(hour12, e.target.value, period)}
          style={sel}
        >
          {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        {/* AM / PM */}
        <select
          value={period}
          onChange={e => update(hour12, mins, e.target.value)}
          style={{ ...sel, fontWeight: 600, color: period === "AM" ? "#4f6ef7" : "#f06060" }}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

export default function AddSlotForm({ onAdd }) {
  const [form, setForm] = useState({
    day: "Mon", label: "College", start: "09:00", end: "12:00",
  });
  const [error, setError] = useState("");

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(""); };

  async function submit() {
    try {
      const err = await onAdd(form);
      if (err) { setError(err); return; }
      setForm({ day: "Mon", label: "College", start: "09:00", end: "12:00" });
    } catch (e) {
      setError("Connection error. Is the server running?");
    }
  }

  return (
    <div className="gl" style={{ marginBottom: 28, padding: "16px 20px", borderLeft: "2px solid #4f6ef7" }}>
      {/* Form grid — 5 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "0.7fr 0.8fr 1.2fr 1.2fr auto", gap: 10, alignItems: "end" }}>
        {/* Day */}
        <div>
          <label style={lbl}>Day</label>
          <select value={form.day} onChange={e => set("day", e.target.value)} style={sel}>
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        {/* Type */}
        <div>
          <label style={lbl}>Type</label>
          <select value={form.label} onChange={e => set("label", e.target.value)} style={sel}>
            {SLOT_LABELS.map(l => <option key={l.value} value={l.value}>{l.value}</option>)}
          </select>
        </div>

        {/* Start time — AM/PM */}
        <TimePicker label="Start" value={form.start} onChange={v => set("start", v)} />

        {/* End time — AM/PM */}
        <TimePicker label="End" value={form.end} onChange={v => set("end", v)} />

        {/* Add button */}
        <button
          onClick={submit}
          style={{
            height: 36, padding: "0 20px",
            background: "rgba(79,110,247,0.18)", border: "1px solid #4f6ef7",
            borderRadius: 0, color: "#4f6ef7",
            fontWeight: 700, fontSize: 12,
            cursor: "pointer", fontFamily: "monospace",
            whiteSpace: "nowrap", alignSelf: "end",
          }}
        >
          Add slot
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 10, fontSize: 12, color: DS.danger, borderLeft: `2px solid ${DS.danger}`, paddingLeft: 10 }}>
          {error}
        </div>
      )}
    </div>
  );
}
