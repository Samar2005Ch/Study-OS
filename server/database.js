const Database = require("better-sqlite3");
const path     = require("path");

const db = new Database(path.join(__dirname, "studyos.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    path          TEXT    DEFAULT 'shadow',
    created_at    TEXT    DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key     TEXT    NOT NULL,
    value   TEXT    NOT NULL,
    PRIMARY KEY (user_id, key)
  );

  CREATE TABLE IF NOT EXISTS timetable_slots (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day     TEXT    NOT NULL,
    label   TEXT    NOT NULL,
    start   TEXT    NOT NULL,
    end     TEXT    NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exams (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT    NOT NULL,
    date       TEXT    NOT NULL,
    created_at TEXT    DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sub_exams (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    name    TEXT    NOT NULL,
    date    TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exam_subjects (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id         INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    name            TEXT    NOT NULL,
    student_level   TEXT    NOT NULL DEFAULT 'not_started',
    exam_weight     TEXT    NOT NULL DEFAULT 'medium',
    question_count  INTEGER NOT NULL DEFAULT 25,
    color           TEXT    NOT NULL DEFAULT '#4f6ef7',
    difficulty      INTEGER NOT NULL DEFAULT 3
  );

  CREATE TABLE IF NOT EXISTS exam_topics (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_subject_id  INTEGER NOT NULL REFERENCES exam_subjects(id) ON DELETE CASCADE,
    name             TEXT    NOT NULL,
    difficulty       TEXT    NOT NULL DEFAULT 'medium',
    status           TEXT    NOT NULL DEFAULT 'not_touched',
    progress         INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS skills (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT    NOT NULL,
    color      TEXT    NOT NULL DEFAULT '#2de2a0',
    created_at TEXT    DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS skill_topics (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    name     TEXT    NOT NULL,
    difficulty TEXT  NOT NULL DEFAULT 'medium',
    status   TEXT    NOT NULL DEFAULT 'not_touched',
    progress INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS study_history (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type  TEXT    NOT NULL DEFAULT 'exam',
    source_id    INTEGER NOT NULL DEFAULT 0,
    topic        TEXT    NOT NULL DEFAULT '',
    planned_mins INTEGER NOT NULL DEFAULT 0,
    actual_mins  INTEGER NOT NULL DEFAULT 0,
    completed    INTEGER NOT NULL DEFAULT 0,
    skipped      INTEGER NOT NULL DEFAULT 0,
    ghosted      INTEGER NOT NULL DEFAULT 0,
    time_of_day  TEXT    NOT NULL DEFAULT 'morning',
    xp_earned    INTEGER NOT NULL DEFAULT 0,
    integrity_score INTEGER NOT NULL DEFAULT 100,
    completion_pct  INTEGER NOT NULL DEFAULT 0,
    tab_hide_count  INTEGER NOT NULL DEFAULT 0,
    inactivity_count INTEGER NOT NULL DEFAULT 0,
    pause_count      INTEGER NOT NULL DEFAULT 0,
    schedule_date TEXT   NOT NULL DEFAULT '',
    created_at   TEXT    DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scheduled_tasks (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type      TEXT    NOT NULL DEFAULT 'exam',
    source_id        INTEGER NOT NULL DEFAULT 0,
    subject_name     TEXT    NOT NULL DEFAULT '',
    topic            TEXT    NOT NULL DEFAULT '',
    topic_diff       TEXT    NOT NULL DEFAULT 'medium',
    topic_status     TEXT    NOT NULL DEFAULT 'not_touched',
    color            TEXT    NOT NULL DEFAULT '#4f6ef7',
    start_time       TEXT    NOT NULL DEFAULT '09:00',
    end_time         TEXT    NOT NULL DEFAULT '10:00',
    duration_mins    INTEGER NOT NULL DEFAULT 60,
    break_mins       INTEGER NOT NULL DEFAULT 15,
    score            REAL    NOT NULL DEFAULT 0,
    ai_reason        TEXT    NOT NULL DEFAULT '',
    xp               INTEGER NOT NULL DEFAULT 0,
    day_type         TEXT    NOT NULL DEFAULT 'coverage',
    student_type     TEXT    NOT NULL DEFAULT 'unknown',
    topic_progress   INTEGER NOT NULL DEFAULT 0,
    expected_progress INTEGER NOT NULL DEFAULT 25,
    status           TEXT    NOT NULL DEFAULT 'pending',
    actual_mins      INTEGER NOT NULL DEFAULT 0,
    ghost_count      INTEGER NOT NULL DEFAULT 0,
    locked           INTEGER NOT NULL DEFAULT 0,
    integrity_score  INTEGER NOT NULL DEFAULT 100,
    completion_pct   INTEGER NOT NULL DEFAULT 0,
    xp_earned        INTEGER NOT NULL DEFAULT 0,
    schedule_date    TEXT    NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT    NOT NULL,
    body       TEXT    NOT NULL DEFAULT '',
    type       TEXT    NOT NULL DEFAULT 'info',
    read       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       TEXT    NOT NULL,
    content    TEXT    NOT NULL,
    created_at TEXT    DEFAULT CURRENT_TIMESTAMP
  );

`);

console.log("[ DATABASE ] Connected — all tables ready");
module.exports = db;
