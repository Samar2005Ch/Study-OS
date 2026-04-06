/**
 * pages/Timetable/AddSlotForm.jsx
 * Form to add a new busy slot. Private to Timetable page.
 *
 * PROPS:
 *   onAdd(slot) — called when form is submitted with valid data
 */

import { useState } from "react";
import { DS } from "../../constants/theme";
import { DAYS, SLOT_LABELS } from "../../constants/timetable";

// Reusable label style for form fields
const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: DS.textSecondary,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  display: "block",
  marginBottom: 6,
};

// Reusable input style
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  background: DS.bg,
  border: `1px solid ${DS.border}`,
  borderRadius: DS.r8,
  color: DS.textPrimary,
  fontSize: 13,
  fontFamily: DS.fontBody,
  outline: "none",
};

export default function AddSlotForm({ onAdd }) {
  // Form field state — one object holds all fields
  const [form, setForm] = useState({
    day:   "Mon",
    label: "College",
    start: "09:00",
    end:   "12:00",
  });
  const [error, setError] = useState("");

  // Update one field without touching the others
  // e.g. setField("day", "Tue") → form.day = "Tue"
  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(""); // clear error when user types
  }

  function handleSubmit() {
    const err = onAdd(form); // onAdd returns error string or null
    if (err) {
      setError(err);
    } else {
      // Reset to defaults on success
      setForm({ day: "Mon", label: "College", start: "09:00", end: "12:00" });
    }
  }

  return (
    <div style={{
      background: DS.surface,
      border: `1px solid ${DS.border}`,
      borderRadius: DS.r16,
      padding: "22px 24px",
      marginBottom: 28,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: DS.textPrimary, marginBottom: 18 }}>
        Add Busy Slot
      </div>

      {/* Form grid — 4 fields side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* Day picker */}
        <div>
          <label style={labelStyle}>Day</label>
          <select
            value={form.day}
            onChange={(e) => setField("day", e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Label picker */}
        <div>
          <label style={labelStyle}>Type</label>
          <select
            value={form.label}
            onChange={(e) => setField("label", e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {SLOT_LABELS.map((l) => (
              <option key={l.value} value={l.value}>{l.value}</option>
            ))}
          </select>
        </div>

        {/* Start time */}
        <div>
          <label style={labelStyle}>Start</label>
          <input
            type="time"
            value={form.start}
            onChange={(e) => setField("start", e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* End time */}
        <div>
          <label style={labelStyle}>End</label>
          <input
            type="time"
            value={form.end}
            onChange={(e) => setField("end", e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          fontSize: 12, color: DS.danger,
          background: `${DS.danger}12`,
          border: `1px solid ${DS.danger}30`,
          borderRadius: DS.r8,
          padding: "8px 12px",
          marginBottom: 12,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        style={{
          padding: "10px 22px",
          borderRadius: DS.r8,
          border: "none",
          background: `linear-gradient(135deg, ${DS.primary}, #7ba7f5)`,
          color: "#fff",
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          fontFamily: DS.fontBody,
        }}
      >
        + Add Slot
      </button>
    </div>
  );
}
