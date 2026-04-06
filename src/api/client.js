const BASE = "http://localhost:3001/api";

function getToken() { return localStorage.getItem("studyos_token"); }

async function request(method, path, body) {
  const token = getToken();
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res  = await fetch(`${BASE}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Server error");
  return data;
}

export const api = {
  signup:          d => request("POST",   "/auth/signup",     d),
  verifyOtp:       d => request("POST",   "/auth/verify-otp", d),
  resendOtp:       d => request("POST",   "/auth/resend-otp", d),
  login:           d => request("POST",   "/auth/login",      d),
  getMe:           () => request("GET",    "/auth/me"),

  getExams:        () => request("GET",    "/exams"),
  addExam:         d  => request("POST",   "/exams", d),
  deleteExam:      id => request("DELETE", `/exams/${id}`),
  addSubExam:      (id,d)  => request("POST",   `/exams/${id}/subexams`, d),
  addExamSubject:  (id,d)  => request("POST",   `/exams/${id}/subjects`, d),
  updateSubject:   (id,d)  => request("PUT",    `/exams/subjects/${id}`, d),
  deleteSubject:   id => request("DELETE", `/exams/subjects/${id}`),
  addTopic:        (id,d)  => request("POST",   `/exams/subjects/${id}/topics`, d),
  updateTopic:     (id,d)  => request("PUT",    `/exams/topics/${id}`, d),
  deleteTopic:     id => request("DELETE", `/exams/topics/${id}`),

  getSkills:       () => request("GET",    "/skills"),
  addSkill:        d  => request("POST",   "/skills", d),
  deleteSkill:     id => request("DELETE", `/skills/${id}`),
  addSkillTopic:   (id,d)  => request("POST",   `/skills/${id}/topics`, d),
  updateSkillTopic:(id,d)  => request("PUT",    `/skills/topics/${id}`, d),

  generateSchedule:() => request("POST",   "/schedule/generate"),
  getTodayTasks:   () => request("GET",    "/schedule/today"),
  updateTaskStatus:(id,d)  => request("PUT",    `/schedule/${id}/status`, d),
  insertTask:      d  => request("POST",   "/schedule/insert", d),

  getHistory:      () => request("GET",    "/history"),
  addHistory:      d  => request("POST",   "/history", d),
  recordSession:   d  => request("POST",   "/history", d), // alias with full session data

  // Subjects (extracted from exams for intelligence engine)
  getSubjects:     () => request("GET",    "/exams").then(exams => {
    const subjects = [];
    (exams || []).forEach(exam => {
      (exam.subjects || []).forEach(s => {
        subjects.push({
          ...s,
          examId:    exam.id,
          examName:  exam.name,
          examDate:  exam.date,
          subjectIds: [s.id],
        });
      });
    });
    return subjects;
  }),

  getSettings:     () => request("GET",    "/settings"),
  saveSetting:     (k,v) => request("POST",   "/settings", { key:k, value:v }),

  getTimetable:    () => request("GET",    "/timetable"),
  addSlot:         d  => request("POST",   "/timetable", d),
  deleteSlot:      id => request("DELETE", `/timetable/${id}`),

  getNotifications:() => request("GET",    "/notifications"),
  markRead:        id => request("PUT",    `/notifications/${id}/read`),
  deleteNotif:     id => request("DELETE", `/notifications/${id}`),

  chat:            d  => request("POST",   "/chat", d),
  getChatHistory:  () => request("GET",    "/chat/history"),
};
