## Logging Middleware

`logger.js` contains the shared structured logger used by the notification
frontend. It redacts sensitive fields, stores recent activity in local storage,
and exposes `createLogger()` plus `loadRecentLogs()`.
