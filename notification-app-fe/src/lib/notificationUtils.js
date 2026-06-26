export const REMOTE_NOTIFICATION_API_BASE_URL =
  "http://4.224.186.213/evaluation-service";
export const LOCAL_NOTIFICATION_API_PROXY_PATH = "/evaluation-service";
export const DEFAULT_NOTIFICATION_CLIENT_ID =
  import.meta.env.VITE_NOTIFICATION_CLIENT_ID ??
  "c5076a3c-5b68-45b8-9e73-719627fce2b1";
export const DEFAULT_NOTIFICATION_ACCESS_TOKEN =
  import.meta.env.VITE_NOTIFICATION_ACCESS_TOKEN ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJ1dGthcnNoLnRyaXBhdGhpMjAyM0BnbGJhamFqZ3JvdXAub3JnIiwiZXhwIjoxNzgyNDUxODAzLCJpYXQiOjE3ODI0NTA5MDMsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiJjMmNiYjQyYi1hYTc3LTRmNTEtYTY1ZC1lZjAzMWExODNjMzEiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJ1dGthcnNoIHRyaXBhdGhpIiwic3ViIjoiYzUwNzZhM2MtNWI2OC00NWI4LTllNzMtNzE5NjI3ZmNlMmIxIn0sImVtYWlsIjoidXRrYXJzaC50cmlwYXRoaTIwMjNAZ2xiYWphamdyb3VwLm9yZyIsIm5hbWUiOiJ1dGthcnNoIHRyaXBhdGhpIiwicm9sbE5vIjoiMjMwNTExMDEwMDE4NyIsImFjY2Vzc0NvZGUiOiJ4eGtKbmsiLCJjbGllbnRJRCI6ImM1MDc2YTNjLTViNjgtNDViOC05ZTczLTcxOTYyN2ZjZTJiMSIsImNsaWVudFNlY3JldCI6InJnSFZ0WXRVVlNURE5rdXMifQ.ph9tAAXnNOrjg6JraqyeoQxRlAn6oxWUSlrhFy6uEl0";

export function getPreferredNotificationApiBaseUrl() {
  const configuredBaseUrl =
    import.meta.env.VITE_NOTIFICATION_API_BASE_URL ??
    REMOTE_NOTIFICATION_API_BASE_URL;

  if (typeof window === "undefined") {
    return configuredBaseUrl;
  }

  const hostname = window.location.hostname;
  const isLocalRun =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]";

  if (!isLocalRun) {
    return configuredBaseUrl;
  }

  return LOCAL_NOTIFICATION_API_PROXY_PATH;
}

export function normalizeApiBaseUrl(apiBaseUrl) {
  const normalizedBaseUrl = apiBaseUrl?.trim();

  if (!normalizedBaseUrl) {
    return getPreferredNotificationApiBaseUrl();
  }

  if (
    normalizedBaseUrl === REMOTE_NOTIFICATION_API_BASE_URL &&
    getPreferredNotificationApiBaseUrl() === LOCAL_NOTIFICATION_API_PROXY_PATH
  ) {
    return LOCAL_NOTIFICATION_API_PROXY_PATH;
  }

  return normalizedBaseUrl;
}

export const NOTIFICATION_TYPE_WEIGHTS = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

const viewedStorageKey = "notification-app:viewed-notifications";
const credentialsStorageKey = "notification-app:credentials";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJsonFromStorage(storageKey, fallbackValue) {
  if (!canUseStorage()) {
    return fallbackValue;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return fallbackValue;
    }

    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
}

function writeJsonToStorage(storageKey, value) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

function toDisplayCase(value) {
  if (!value) {
    return "Untitled Notification";
  }

  return `${value}`
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((segment) => {
      if (segment === segment.toUpperCase()) {
        return segment;
      }

      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join(" ");
}

function toNullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function normalizeNotificationType(value) {
  const normalizedValue = `${value ?? ""}`.trim().toLowerCase();

  if (normalizedValue === "placement") {
    return "Placement";
  }

  if (normalizedValue === "result") {
    return "Result";
  }

  if (normalizedValue === "event") {
    return "Event";
  }

  return toDisplayCase(normalizedValue || "Event");
}

export function normalizeNotification(notification, index = 0) {
  const type = normalizeNotificationType(
    notification.Type ?? notification.type ?? notification.notification_type,
  );
  const timestamp =
    notification.Timestamp ??
    notification.timestamp ??
    notification.createdAt ??
    notification.created_at ??
    new Date().toISOString();
  const parsedTimestamp = Date.parse(timestamp);

  return {
    id:
      notification.ID ??
      notification.id ??
      `${type}-${timestamp}-${notification.Message ?? notification.message ?? index}`,
    type,
    message:
      notification.Message ??
      notification.message ??
      notification.title ??
      "Untitled notification",
    displayMessage: toDisplayCase(
      notification.Message ?? notification.message ?? notification.title,
    ),
    timestamp,
    timestampMs: Number.isNaN(parsedTimestamp) ? 0 : parsedTimestamp,
    typeWeight: NOTIFICATION_TYPE_WEIGHTS[type] ?? 0,
    raw: notification,
  };
}

export function normalizeNotifications(notifications) {
  if (!Array.isArray(notifications)) {
    return [];
  }

  return notifications
    .map((notification, index) => normalizeNotification(notification, index))
    .sort((firstNotification, secondNotification) => {
      return secondNotification.timestampMs - firstNotification.timestampMs;
    });
}

export function extractNotificationsPayload(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return (
    payload?.notifications ??
    payload?.data?.notifications ??
    payload?.data ??
    payload?.results ??
    []
  );
}

export function extractPagination(payload, fallbackPage, fallbackLimit, receivedCount) {
  const page =
    toNullableNumber(
      payload?.page ??
        payload?.currentPage ??
        payload?.current_page ??
        payload?.pagination?.page ??
        payload?.meta?.page,
    ) ?? fallbackPage;

  const limit =
    toNullableNumber(
      payload?.limit ??
        payload?.pageSize ??
        payload?.page_size ??
        payload?.pagination?.limit ??
        payload?.meta?.limit,
    ) ?? fallbackLimit;

  const totalPages = toNullableNumber(
    payload?.totalPages ??
      payload?.total_pages ??
      payload?.pagination?.totalPages ??
      payload?.pagination?.total_pages ??
      payload?.meta?.totalPages ??
      payload?.meta?.total_pages,
  );

  const totalItems = toNullableNumber(
    payload?.total ??
      payload?.totalCount ??
      payload?.total_count ??
      payload?.pagination?.total ??
      payload?.meta?.total,
  );

  let hasMore = Boolean(
    payload?.hasMore ??
      payload?.has_more ??
      payload?.pagination?.hasMore ??
      payload?.pagination?.has_more ??
      payload?.meta?.hasMore ??
      payload?.meta?.has_more,
  );

  if (!hasMore && totalPages) {
    hasMore = page < totalPages;
  }

  if (!hasMore && !totalPages) {
    hasMore = receivedCount === limit && receivedCount > 0;
  }

  return {
    page,
    limit,
    totalPages,
    totalItems,
    hasMore,
  };
}

export function buildPriorityNotifications(
  notifications,
  { notificationType = "All", topCount = 10, viewedIds = [] },
) {
  const viewedIdSet = new Set(viewedIds);

  return [...notifications]
    .filter((notification) => !viewedIdSet.has(notification.id))
    .filter((notification) => {
      return notificationType === "All" || notification.type === notificationType;
    })
    .sort((firstNotification, secondNotification) => {
      if (secondNotification.typeWeight !== firstNotification.typeWeight) {
        return secondNotification.typeWeight - firstNotification.typeWeight;
      }

      return secondNotification.timestampMs - firstNotification.timestampMs;
    })
    .slice(0, topCount)
    .map((notification, index) => ({
      ...notification,
      priorityRank: index + 1,
    }));
}

export function buildSummary(notifications, viewedIds = []) {
  const viewedIdSet = new Set(viewedIds);

  return notifications.reduce(
    (summary, notification) => {
      summary.total += 1;

      if (!viewedIdSet.has(notification.id)) {
        summary.unread += 1;
      }

      summary.byType[notification.type] =
        (summary.byType[notification.type] ?? 0) + 1;

      return summary;
    },
    {
      total: 0,
      unread: 0,
      byType: {
        Placement: 0,
        Result: 0,
        Event: 0,
      },
    },
  );
}

export function formatAbsoluteDateTime(value) {
  const parsedValue = Date.parse(value);
  if (Number.isNaN(parsedValue)) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(parsedValue));
}

export function formatRelativeTime(timestampMs) {
  if (!timestampMs) {
    return "Time unavailable";
  }

  const differenceInMinutes = Math.round((timestampMs - Date.now()) / 60000);
  const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
    numeric: "auto",
  });

  const absoluteMinutes = Math.abs(differenceInMinutes);

  if (absoluteMinutes < 60) {
    return relativeTimeFormatter.format(differenceInMinutes, "minute");
  }

  const differenceInHours = Math.round(differenceInMinutes / 60);
  if (Math.abs(differenceInHours) < 24) {
    return relativeTimeFormatter.format(differenceInHours, "hour");
  }

  const differenceInDays = Math.round(differenceInHours / 24);
  return relativeTimeFormatter.format(differenceInDays, "day");
}

export function loadViewedIds() {
  const storedValue = readJsonFromStorage(viewedStorageKey, []);
  return Array.isArray(storedValue) ? storedValue : [];
}

export function saveViewedIds(viewedIds) {
  writeJsonToStorage(viewedStorageKey, viewedIds);
}

export function loadStoredCredentials() {
  const defaults = {
    apiBaseUrl: getPreferredNotificationApiBaseUrl(),
    clientId: DEFAULT_NOTIFICATION_CLIENT_ID,
    accessToken: DEFAULT_NOTIFICATION_ACCESS_TOKEN,
  };

  const storedCredentials = readJsonFromStorage(credentialsStorageKey, {});

  return {
    apiBaseUrl: normalizeApiBaseUrl(storedCredentials.apiBaseUrl || defaults.apiBaseUrl),
    clientId: storedCredentials.clientId || defaults.clientId,
    accessToken: storedCredentials.accessToken || defaults.accessToken,
  };
}

export function saveStoredCredentials(credentials) {
  const nextCredentials = {
    apiBaseUrl: normalizeApiBaseUrl(credentials.apiBaseUrl),
    clientId: credentials.clientId?.trim() || DEFAULT_NOTIFICATION_CLIENT_ID,
    accessToken:
      credentials.accessToken?.trim() || DEFAULT_NOTIFICATION_ACCESS_TOKEN,
  };

  writeJsonToStorage(credentialsStorageKey, nextCredentials);
  return nextCredentials;
}

export function clearStoredCredentials() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(credentialsStorageKey);
}

export function credentialsAreConfigured(credentials) {
  return Boolean(credentials.apiBaseUrl && credentials.accessToken);
}
