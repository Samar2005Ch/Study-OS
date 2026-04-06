/**
 * pages/Subjects/AddSubjectForm.jsx
 * Inline form to add a new subject — name, color, difficulty.
 */

import { useState } from "react";
import { DS } from "../../constants/theme";

// Preset colors to pick from
const COLORS = [
  "#5b8dee","#3dd68c","#f0544f","#f5a623",
  "#a78bfa","#00C6FF","#f472b6","#34d399",
];

export default function AddSubjectForm({ onAdd }) {
  const [name,       setName]       = useState("");
  const [color,      setColor]      = useState(COLORS[0]);
  const [difficulty, setDifficulty] = useState(3);
  const [error,      setError]      = useState("");

  async function submit() {
    try {
      const err = await onAdd({ name, color, difficulty });
      if (err) { setError(err); return; }
      setName(""); setColor(COLORS[0]); setDifficulty(3); setError("");
    } catch(e) {
      setError("Connection error. Is the server running?");
    }
  }

  const inp = {
    padding: "8px 12px", background: DS.surfaceAlt,
    border: `0.5px solid ${DS.border}`,
    borderRadius: DS.r8, color: DS.textPrimary,
    fontSize: 13, fontFamily: DS.fontBody, outline: "none",
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
        {/* Subject name */}
        <div style={{ flex: 2, minWidth: 160 }}>
          <label style={{ fontSize: 11, color: DS.textMuted, display: "block", marginBottom: 5 }}>
            Subject name
          </label>
          <input
            value={name}
            onChange={e => { setName(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="e.g. Mathematics"
            style={{ ...inp, width: "100%" }}
          />
        </div>

        {/* Difficulty */}
        <div>
          <label style={{ fontSize: 11, color: DS.textMuted, display: "block", marginBottom: 5 }}>
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={e => setDifficulty(Number(e.target.value))}
            style={{ ...inp, cursor: "pointer" }}
          >
            <option value={1}>1 — Very Easy</option>
            <option value={2}>2 — Easy</option>
            <option value={3}>3 — Medium</option>
            <option value={4}>4 — Hard</option>
            <option value={5}>5 — Very Hard</option>
          </select>
        </div>

        {/* Color picker */}
        <div>
          <label style={{ fontSize: 11, color: DS.textMuted, display: "block", marginBottom: 5 }}>
            Color
          </label>
          <div style={{ display: "flex", gap: 5, alignItems: "center", height: 36 }}>
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: c, border: "none", cursor: "pointer",
                  outline: color === c ? `2px solid ${DS.textPrimary}` : "none",
                  outlineOffset: 2, transition: "all .15s",
                  transform: color === c ? "scale(1.2)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={submit}
          style={{
            padding: "8px 20px", borderRadius: DS.r8,
            border: "none", background: DS.primary,
            color: "#fff", fontWeight: 600, fontSize: 13,
            cursor: "pointer", fontFamily: DS.fontBody,
            height: 36,
          }}
        >
          Add subject
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 8, fontSize: 12, color: DS.danger, borderLeft: `2px solid ${DS.danger}`, paddingLeft: 10 }}>
          {error}
        </div>
      )}
    </div>
  );
}
