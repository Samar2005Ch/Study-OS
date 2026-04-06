# StudyOS: System Monarch 👑

**StudyOS** is an intelligent, high-fidelity study orchestration platform designed to transform academic preparation into a gamified, data-driven "System" experience. Inspired by the peak aesthetics of modern anime UI, it combines rigorous behavioral coaching with an adaptive AI scheduling engine.

---

## 🌌 The Concept: "System Monarch"

In StudyOS, you don't just "study"—you embark on **Raids** within **Dungeons** (Exams) to achieve **Rank-Up** status. The platform is built on the philosophy of **Absolute Focus**, where every second spent on a tab is tracked, and every distraction (Ghost) is penalized by the system.

---

## 🛠️ Core Intelligence Modules

### 1. The Priority Engine (Scheduler)
The backbone of StudyOS is a dynamic, multi-factor scheduling algorithm (`server/scheduler.js`).
- **Pattern Learning**: Automatically detects your **Strategy Profile** (Topper, Consistent, Struggling, or Inconsistent) based on the last 14 days of history.
- **Optimal Focus Hour**: Identifies your peak performance time-of-day and automatically schedules the most difficult topics during your high-focus windows.
- **Topic Synergy**: Intelligentsly de-duplicates identical topics across different exams, allowing for "Mastery Overlap" to save time.
- **Manual Override (NEW)**: Use the "+ Manual Raid" button to inject urgent study sessions on-the-fly. The system will automatically shift your remaining schedule to ensure synchronization.

### 2. V3 Anti-Cheat Focus Engine
A hardware-hardened study timer integrated directly into the OS environment.
- **Tab Integrity**: Automatically pauses the session if the user leaves the tab. Total "Focus Time" vs "Wall Clock Time" is used to calculate XP.
- **Grace Period (NEW)**: Added a 1.5s grace window for rapid tab switching to prevent accidental session pauses.
- **Liveness Checks**: Randomly triggers "Liveness Prompts" to ensure the user is physically present.
- **Ghost Detection**: Failed liveness checks or excessive tab switching result in a **Ghost Session**, which penalizes future session length calculations.

### 3. Progressive Rank System & Analytics
Experience Points (XP) are awarded based on **Focus Integrity**, not just duration.
- **Timezone-Aware Analytics (NEW)**: High-resolution heatmap grid that accurately tracks your activity across all timezones, ensuring your streaks are never lost.
- **Difficulty Multipliers**: Harder topics grant significantly more XP.
- **Path Selection**: Users choose a unique visual "Path" (Shadow, Solar, Void, etc.) which changes the entire aesthetic of the Monarch HUD.

---

## 🚀 Technical Architecture

- **Frontend**: Vite + React with a custom "Matte Black + Glass" design system.
- **Backend**: Node.js + Express + SQLite3 (Better-SQLite3 for high-performance transactions).
- **Communication**: RESTful API with JWT-based authentication.
- **Persistence**: Hybrid storage (SQLite for long-term history, SessionStorage for transient states).

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Clone & Install
```bash
npm install
```

### 2. Launch Backend & Frontend
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev
```

---

## 🗺️ The Roadmap (Upcoming)
- [ ] **AI Mentor Integration**: Real-time study advice based on your focus metadata.
- [ ] **Global Leaderboards**: Compare your "Monarch Rank" with students worldwide.
- [ ] **Mobile Scouter**: A companion app for quick schedule checks.

---

> **"The System has acknowledged your presence. Arise."**
