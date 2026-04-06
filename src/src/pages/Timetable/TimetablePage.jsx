/**
 * pages/Timetable/TimetablePage.jsx
 * Step 2 — Timetable input. Connects AddSlotForm + WeeklyGrid.
 *
 * This page owns nothing of its own — all logic is in useTimetable hook,
 * all UI is in the two sub-components. This file just connects them.
 */

import Page from "../../components/Page";
import AddSlotForm from "./AddSlotForm";
import WeeklyGrid  from "./WeeklyGrid";
import { useTimetable } from "../../hooks/useTimetable";
import { DS } from "../../constants/theme";
import { DAYS } from "../../constants/timetable";

export default function TimetablePage() {
  // All timetable state and logic comes from this hook
  const { slots, addSlot, removeSlot, getFreeSlots } = useTimetable();

  // Total free minutes across all days
  const totalFree = DAYS.reduce((acc, day) => {
    return acc + getFreeSlots(day).reduce((a, s) => a + s.mins, 0);
  }, 0);
  const totalFreeHours = Math.round(totalFree / 60);

  return (
    <Page
      title="Timetable"
      subtitle="Add your fixed daily schedule. The AI will find your free time automatically."
      badge="Step 2"
    >
      {/* Summary bar — shows at top once slots exist */}
      {slots.length > 0 && (
        <div style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
        }}>
          <SummaryCard value={slots.length}        label="Total slots added"  color={DS.primary} />
          <SummaryCard value={`~${totalFreeHours}h`} label="Free time this week" color={DS.success} />
          <SummaryCard value={[...new Set(slots.map(s => s.day))].length} label="Days with schedule" color={DS.warning} />
        </div>
      )}

      {/* Add slot form */}
      <AddSlotForm onAdd={addSlot} />

      {/* Weekly visual grid */}
      <div style={{ fontSize: 13, fontWeight: 600, color: DS.textSecondary, marginBottom: 12 }}>
        Weekly Overview
        <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: DS.textMuted }}>
          Green = free time the scheduler can use
        </span>
      </div>
      <WeeklyGrid slots={slots} getFreeSlots={getFreeSlots} onRemove={removeSlot} />

      {/* Empty state hint */}
      {slots.length === 0 && (
        <div style={{
          marginTop: 16, textAlign: "center",
          fontSize: 12, color: DS.textMuted,
        }}>
          No slots added yet. Add your college and coaching hours above to get started.
        </div>
      )}
    </Page>
  );
}

// Small summary card — only used on this page so defined here
function SummaryCard({ value, label, color }) {
  return (
    <div style={{
      flex: 1,
      background: DS.surface,
      border: `1px solid ${DS.border}`,
      borderRadius: DS.r12,
      padding: "14px 18px",
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: DS.fontMono, marginBottom: 3 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: DS.textMuted }}>{label}</div>
    </div>
  );
}
