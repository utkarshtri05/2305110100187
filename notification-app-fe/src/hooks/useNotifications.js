import { useEffect, useState } from "react";

import {
  fetchNotifications,
  fetchPriorityNotifications,
  getReadableApiError,
} from "../api/notifications";
import { createLogger } from "../lib/loggingMiddleware";
import { buildSummary } from "../lib/notificationUtils";

const hookLogger = createLogger("hooks.useNotifications");

const initialState = {
  notifications: [],
  pagination: {
    page: 1,
    limit: 12,
    totalPages: 1,
    totalItems: null,
    hasMore: false,
  },
  sourceSummary: null,
  summary: buildSummary([], []),
  loading: true,
  error: null,
  errorCode: null,
  lastUpdated: null,
};

export function useNotifications({
  mode,
  page,
  limit,
  notificationType,
  topCount,
  viewedIds,
  credentials,
}) {
  const [state, setState] = useState(initialState);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadNotifications() {
      setState((currentState) => ({
        ...currentState,
        loading: true,
        error: null,
        errorCode: null,
      }));

      hookLogger.info("load.started", {
        mode,
        page,
        limit,
        notificationType,
        topCount,
      });

      try {
        const result =
          mode === "priority"
            ? await fetchPriorityNotifications({
                topCount,
                notificationType,
                viewedIds,
                accessToken: credentials.accessToken,
                clientId: credentials.clientId,
                apiBaseUrl: credentials.apiBaseUrl,
                signal: controller.signal,
              })
            : await fetchNotifications({
                page,
                limit,
                notificationType,
                accessToken: credentials.accessToken,
                clientId: credentials.clientId,
                apiBaseUrl: credentials.apiBaseUrl,
                signal: controller.signal,
              });

        setState({
          notifications: result.notifications,
          pagination: result.pagination ?? initialState.pagination,
          sourceSummary: result.sourceSummary ?? null,
          summary: buildSummary(result.notifications, viewedIds),
          loading: false,
          error: null,
          errorCode: null,
          lastUpdated: new Date().toISOString(),
        });

        hookLogger.info("load.completed", {
          mode,
          receivedCount: result.notifications.length,
        });
      } catch (error) {
        if (error.code === "ERR_CANCELED") {
          return;
        }

        const readableError = getReadableApiError(error);
        setState((currentState) => ({
          ...currentState,
          loading: false,
          error: readableError,
          errorCode: readableError.code,
          notifications: [],
          summary: buildSummary([], viewedIds),
        }));

        hookLogger.error("load.failed", {
          mode,
          code: readableError.code,
          title: readableError.title,
        });
      }
    }

    loadNotifications();

    return () => {
      controller.abort();
    };
  }, [
    credentials.accessToken,
    credentials.apiBaseUrl,
    credentials.clientId,
    limit,
    mode,
    notificationType,
    page,
    refreshTick,
    topCount,
    viewedIds,
  ]);

  return {
    ...state,
    refresh: () => {
      hookLogger.info("load.manual_refresh_requested", { mode });
      setRefreshTick((currentTick) => currentTick + 1);
    },
  };
}
