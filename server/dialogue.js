function getMessage(userPath, type, params = {}) {
  // Default messages for different paths (e.g. shadow, scholar, etc)
  if (type === "scheduleGenerated") {
    return `Generated ${params.n || 0} sessions for today. Stay focused.`;
  }
  if (type === "sessionDone") {
    return `Session completed. Well done!`;
  }
  return "Action recorded.";
}

function getSkipMessage(userPath, count) {
  return `Session skipped. That is ${count} skip(s) today. Discipline is key.`;
}

function getGhostMessage(userPath, ghostCount) {
  return `Ghost detected. This is your warning #${ghostCount}. Focus on the task.`;
}

module.exports = {
  getMessage,
  getSkipMessage,
  getGhostMessage
};
