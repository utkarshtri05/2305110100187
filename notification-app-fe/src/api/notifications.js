import axios from "axios";

import { createLogger } from "../lib/loggingMiddleware";
import {
  DEFAULT_NOTIFICATION_ACCESS_TOKEN,
  DEFAULT_NOTIFICATION_CLIENT_ID,
  buildPriorityNotifications,
  extractNotificationsPayload,
  extractPagination,
  normalizeApiBaseUrl,
  normalizeNotificationType,
  normalizeNotifications,
} from "../lib/notificationUtils";

const apiLogger = createLogger("api.notifications");

const httpClient = axios.create({
  timeout: 15000,
});

function resolveAuthCredentials({ accessToken, clientId }) {
  return {
    accessToken: accessToken?.trim() || DEFAULT_NOTIFICATION_ACCESS_TOKEN,
    clientId: clientId?.trim() || DEFAULT_NOTIFICATION_CLIENT_ID,
  };
}

httpClient.interceptors.request.use((config) => {
  apiLogger.info("request.started", {
    method: config.method?.toUpperCase(),
    url: config.url,
    params: config.params,
  });
  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    const list = extractNotificationsPayload(response.data);
    apiLogger.info("request.succeeded", {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      receivedCount: Array.isArray(list) ? list.length : 0,
    });
    return response;
  },
  (error) => {
    apiLogger.error("request.failed", {
      message: error.message,
      status: error.response?.status,
      apiMessage: error.response?.data?.message,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
    });
    return Promise.reject(error);
  },
);

function buildHeaders({ accessToken, clientId }) {
  const resolvedCredentials = resolveAuthCredentials({ accessToken, clientId });
  const headers = {
    Accept: "application/json",
  };

  if (resolvedCredentials.accessToken) {
    headers.Authorization = `Bearer ${resolvedCredentials.accessToken}`;
  }

  return headers;
}

function getEndpoint(apiBaseUrl) {
  return `${normalizeApiBaseUrl(apiBaseUrl).replace(/\/+$/, "")}/notifications`;
}

export async function fetchNotifications({
  page = 1,
  limit = 12,
  notificationType = "All",
  accessToken,
  clientId,
  apiBaseUrl,
  signal,
}) {
  const resolvedCredentials = resolveAuthCredentials({ accessToken, clientId });

  if (!apiBaseUrl) {
    const missingUrlError = new Error("Notification API base URL is missing.");
    missingUrlError.code = "MISSING_BASE_URL";
    throw missingUrlError;
  }

  if (!resolvedCredentials.accessToken) {
    const missingTokenError = new Error("Notification access token is missing.");
    missingTokenError.code = "MISSING_ACCESS_TOKEN";
    throw missingTokenError;
  }

  const params = {
    page,
    limit,
  };

  if (notificationType && notificationType !== "All") {
    params.notification_type = normalizeNotificationType(notificationType);
  }

  const response = await httpClient.get(getEndpoint(apiBaseUrl), {
    headers: buildHeaders(resolvedCredentials),
    params,
    signal,
  });

  const payload = response.data ?? {};
  const notifications = normalizeNotifications(extractNotificationsPayload(payload));
  const pagination = extractPagination(payload, page, limit, notifications.length);

  return {
    notifications,
    pagination,
    raw: payload,
  };
}

export async function fetchPriorityNotifications({
  topCount = 10,
  notificationType = "All",
  viewedIds = [],
  accessToken,
  clientId,
  apiBaseUrl,
  signal,
  scanLimit = 25,
  maxPagesToScan = 4,
}) {
  const collectedNotifications = [];
  let currentPage = 1;
  let hasMore = true;
  let lastPagination = {
    page: 1,
    limit: scanLimit,
    totalPages: 1,
    totalItems: null,
    hasMore: false,
  };

  while (hasMore && currentPage <= maxPagesToScan) {
    const pageResult = await fetchNotifications({
      page: currentPage,
      limit: scanLimit,
      notificationType,
      accessToken,
      clientId,
      apiBaseUrl,
      signal,
    });

    collectedNotifications.push(...pageResult.notifications);
    lastPagination = pageResult.pagination;
    hasMore = Boolean(pageResult.pagination.hasMore);

    if (!pageResult.notifications.length) {
      break;
    }

    currentPage += 1;
  }

  const prioritizedNotifications = buildPriorityNotifications(collectedNotifications, {
    notificationType,
    topCount,
    viewedIds,
  });

  return {
    notifications: prioritizedNotifications,
    pagination: lastPagination,
    sourceSummary: {
      scannedCount: collectedNotifications.length,
      fetchedPages: Math.max(1, currentPage - 1),
      hasMoreSource: hasMore,
    },
  };
}

export function getReadableApiError(error) {
  if (error.code === "MISSING_ACCESS_TOKEN") {
    return {
      code: "MISSING_ACCESS_TOKEN",
      title: "Access token missing",
      description:
        "Add a valid notification access token in Connection Settings or update the local .env file.",
    };
  }

  if (error.code === "MISSING_BASE_URL") {
    return {
      code: "MISSING_BASE_URL",
      title: "API base URL missing",
      description:
        "Set the notification API base URL before trying to load live campus notifications.",
    };
  }

  const status = error.response?.status;
  const apiMessage = error.response?.data?.message;

  if (status === 401 || /invalid authorization token/i.test(apiMessage ?? "")) {
    return {
      code: "UNAUTHORIZED",
      title: "Authorization failed",
      description:
        "The notification API rejected the current token. Replace it with a fresh one and retry.",
      status,
    };
  }

  if (status === 403) {
    return {
      code: "FORBIDDEN",
      title: "Access denied",
      description:
        "The API received the request but refused access. Verify the token scope and client identifier.",
      status,
    };
  }

  if (status === 404) {
    return {
      code: "NOT_FOUND",
      title: "Notifications endpoint not found",
      description:
        "The configured API base URL does not expose the expected notifications endpoint.",
      status,
    };
  }

  if (
    error.code === "ECONNABORTED" ||
    /network error/i.test(error.message ?? "") ||
    /failed to fetch/i.test(error.message ?? "")
  ) {
    return {
      code: "NETWORK",
      title: "Notification API unreachable",
      description:
        "The frontend could not reach the live notifications service. Check the network connection or base URL.",
    };
  }

  return {
    code: "UNKNOWN",
    title: "Unable to load notifications",
    description:
      apiMessage || error.message || "An unexpected error occurred while loading campus notifications.",
    status,
  };
}
