const express = require("express");
const cors    = require("cors");
require("./database"); // init DB on start

const app  = express();
const PORT = 3001;

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"] }));
app.use(express.json());

app.use("/api/auth",         require("./routes/auth"));
app.use("/api/exams",        require("./routes/exams"));
app.use("/api/skills",       require("./routes/skills"));
app.use("/api/schedule",     require("./routes/schedule"));
app.use("/api/history",      require("./routes/history"));
app.use("/api/settings",     require("./routes/settings"));
app.use("/api/timetable",    require("./routes/timetable"));
app.use("/api/notifications",require("./routes/notifications"));
app.use("/api/chat",         require("./routes/chat"));

app.get("/api/health", (req, res) =>
  res.json({ status:"online", time:new Date().toISOString() })
);

app.listen(PORT, () => {
  console.log("");
  console.log("  [ STUDYOS BACKEND ]");
  console.log(`  http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log("");
});
