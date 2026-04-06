# StudyOS — Smart Study Scheduler

A rule-based AI study scheduling system for competitive exam students (NIMCET, CUET PG).

## Student Info
- **Name:** [Your Name]
- **Roll No:** [Your Roll No]
- **College:** [Your College Name]
- **Course:** BCA Final Year Project

## What It Does
- Detects free time slots from your college/coaching timetable
- Auto-schedules study tasks using a priority scoring algorithm
- Pomodoro timer with liveness detection (checks if you're actually studying)
- Ghost detection — if you abandon a session, the system learns and adjusts
- Analytics dashboard showing study patterns and AI insights

## Priority Scoring Algorithm
```
Score = difficulty × urgency × engagement × timeBonus
```
- **difficulty** — how hard the subject is (1–5)
- **urgency** — based on days until exam (3× if <7 days)
- **engagement** — penalises subjects you ghost often
- **timeBonus** — 1.3× if scheduled at your historically best time

## Tech Stack
- React 18
- Vite (build tool)
- Plain CSS (no UI library)
- localStorage (data persistence)

## How to Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure
```
src/
  constants/     — shared data (colors, nav items)
  components/    — reusable UI pieces
  pages/         — one folder per page
  hooks/         — reusable React logic
  utils/         — pure helper functions
```

## Build Progress
- [x] Step 1 — Project structure & UI shell
- [ ] Step 2 — Timetable input
- [ ] Step 3 — Subjects & exam setup
- [ ] Step 4 — AI scheduling algorithm
- [ ] Step 5 — Analytics dashboard
