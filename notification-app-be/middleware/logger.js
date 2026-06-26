import axios from "axios";

const LOG_API_URL =
  process.env.AFFORDMED_LOG_API_URL ??
  "http://4.224.186.213/evaluation-service/logs";
const ACCESS_TOKEN = process.env.AFFORDMED_ACCESS_TOKEN ?? "";

const logClient = axios.create({
  timeout: 10000,
});

function buildAuthorizationHeaders() {
  if (!ACCESS_TOKEN) {
    return {};
  }

  return {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
  };
}

async function pushLog(level, message) {
  await logClient.post(
    LOG_API_URL,
    {
      stack: "backend",
      level,
      package: "middleware",
      message,
    },
    {
      headers: {
        "Content-Type": "application/json",
        ...buildAuthorizationHeaders(),
      },
    },
  );
}

export default async function logger(req, res, next) {
  try {
    await pushLog("info", `${req.method} ${req.originalUrl}`);
  } catch (error) {
    res.locals.loggingMiddlewareError = error.response?.data?.message || error.message;
  }

  next();
}
