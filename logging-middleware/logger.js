const LOG_STORAGE_KEY = "notification-app:activity-log";
const MAX_LOG_ENTRIES = 250;

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitizeValue(value, currentDepth = 0) {
  if (currentDepth > 3) {
    return "[truncated]";
  }

  if (Array.isArray(value)) {
    return value.slice(0, 12).map((item) => sanitizeValue(item, currentDepth + 1));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((accumulator, [key, itemValue]) => {
      if (/token|authorization|secret/i.test(key)) {
        accumulator[key] = "[redacted]";
      } else {
        accumulator[key] = sanitizeValue(itemValue, currentDepth + 1);
      }

      return accumulator;
    }, {});
  }

  return value;
}

function loadStoredLogEntries() {
  if (!canUseBrowserStorage()) {
    return [];
  }

  try {
    const rawEntries = window.localStorage.getItem(LOG_STORAGE_KEY);
    if (!rawEntries) {
      return [];
    }

    const parsedEntries = JSON.parse(rawEntries);
    return Array.isArray(parsedEntries) ? parsedEntries : [];
  } catch {
    return [];
  }
}

function saveStoredLogEntries(entries) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(entries.slice(-MAX_LOG_ENTRIES)));
}

function emitLog(entry) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("notification-app-log", {
      detail: entry,
    }),
  );
}

function writeLog(level, scope, event, context = {}) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    level,
    scope,
    event,
    context: sanitizeValue(context),
  };

  const existingEntries = loadStoredLogEntries();
  saveStoredLogEntries([...existingEntries, entry]);
  emitLog(entry);
  return entry;
}

export function createLogger(scope) {
  return {
    info: (event, context) => writeLog("info", scope, event, context),
    warn: (event, context) => writeLog("warn", scope, event, context),
    error: (event, context) => writeLog("error", scope, event, context),
  };
}

export function loadRecentLogs(limit = 20) {
  return loadStoredLogEntries().slice(-limit).reverse();
}
