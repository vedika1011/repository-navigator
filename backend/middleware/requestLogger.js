// requestLogger.js — Logs every incoming request with timestamp, method, path, and body.

function requestLogger(req, res, next) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.originalUrl || req.url;
  const body = req.body && Object.keys(req.body).length > 0
    ? JSON.stringify(req.body)
    : "(empty)";

  console.log(`[${timestamp}] ${method} ${path} — body: ${body}`);

  next();
}

module.exports = requestLogger;
