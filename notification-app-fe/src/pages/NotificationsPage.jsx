import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";
import { createLogger } from "../lib/loggingMiddleware";
import { formatAbsoluteDateTime } from "../lib/notificationUtils";

const pageLogger = createLogger("pages.notifications");

const pageSizeOptions = [6, 12, 24];
const topCountOptions = [5, 10, 15, 20];

const pageCopy = {
  all: {
    title: "All Notifications",
    description:
      "Browse the live campus feed with pagination, type filters, and local viewed-state tracking for every update.",
    emptyMessage:
      "No notifications matched the current filter. Adjust the type filter or refresh the live feed.",
  },
  priority: {
    title: "Priority Inbox",
    description:
      "Unread items are ranked by notification weight first and recency second, so high-impact updates stay visible.",
    emptyMessage:
      "No unread priority items are available for the selected filter. Review settings or refresh the feed.",
  },
};

function StatCard({ label, value, hint }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.25,
        borderRadius: 5,
        borderColor: "rgba(11, 107, 203, 0.12)",
        boxShadow: "0 16px 40px rgba(23, 50, 77, 0.04)",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h4" sx={{ mt: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
        {hint}
      </Typography>
    </Paper>
  );
}

export function NotificationsPage({
  mode,
  credentials,
  viewedIds,
  onMarkViewed,
  onOpenSettings,
}) {
  const [notificationType, setNotificationType] = useState("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [topCount, setTopCount] = useState(10);

  const { notifications, pagination, sourceSummary, summary, loading, error, errorCode, lastUpdated, refresh } =
    useNotifications({
      mode,
      page,
      limit,
      notificationType,
      topCount,
      viewedIds,
      credentials,
    });

  const currentPageCopy = pageCopy[mode];
  const visiblePageCount = Math.max(
    1,
    pagination.totalPages ?? (pagination.hasMore && mode === "all" ? page + 1 : page),
  );

  const handleTypeChange = (nextType) => {
    pageLogger.info("filter.type_changed", { mode, nextType });
    setNotificationType(nextType);
    setPage(1);
  };

  const handlePageChange = (_, nextPage) => {
    pageLogger.info("pagination.page_changed", { mode, nextPage });
    setPage(nextPage);
  };

  const handleMarkVisibleAsViewed = () => {
    notifications.forEach((notification) => {
      onMarkViewed(notification.id);
    });

    pageLogger.info("notifications.visible_marked_viewed", {
      mode,
      count: notifications.length,
    });
  };

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 7,
          border: "1px solid rgba(11, 107, 203, 0.10)",
          background: "rgba(255, 255, 255, 0.88)",
          boxShadow: "0 18px 48px rgba(23, 50, 77, 0.05)",
        }}
      >
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ lg: "flex-start" }}
          >
            <Box maxWidth={720}>
              <Typography variant="h4">{currentPageCopy.title}</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {currentPageCopy.description}
              </Typography>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.25}
              alignItems={{ sm: "center" }}
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                startIcon={<RefreshRoundedIcon />}
                onClick={refresh}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<MarkEmailReadRoundedIcon />}
                onClick={handleMarkVisibleAsViewed}
                disabled={!notifications.length}
              >
                Mark Visible as Viewed
              </Button>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(5, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <StatCard
              label={mode === "priority" ? "Priority Visible" : "Visible Now"}
              value={summary.total}
              hint={mode === "priority" ? "Top ranked unread items" : "Items in the current page"}
            />
            <StatCard
              label="Unread / New"
              value={summary.unread}
              hint="Based on local viewed-state persistence"
            />
            <StatCard
              label="Placement"
              value={summary.byType.Placement}
              hint="Highest priority bucket"
            />
            <StatCard
              label="Result"
              value={summary.byType.Result}
              hint="Academic outcome updates"
            />
            <StatCard
              label="Event"
              value={summary.byType.Event}
              hint="Campus event announcements"
            />
          </Box>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 7,
          border: "1px solid rgba(11, 107, 203, 0.10)",
          background: "rgba(255, 255, 255, 0.90)",
        }}
      >
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", xl: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xl: "center" }}
          >
            <NotificationFilter value={notificationType} onChange={handleTypeChange} />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.25}
              alignItems={{ sm: "center" }}
              useFlexGap
            >
              {mode === "all" ? (
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <Select
                    value={String(limit)}
                    onChange={(event) => {
                      const nextLimit = Number(event.target.value);
                      pageLogger.info("pagination.limit_changed", { nextLimit });
                      setLimit(nextLimit);
                      setPage(1);
                    }}
                  >
                    {pageSizeOptions.map((value) => (
                      <MenuItem key={value} value={String(value)}>
                        {value} per page
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <Select
                    value={String(topCount)}
                    onChange={(event) => {
                      const nextTopCount = Number(event.target.value);
                      pageLogger.info("priority.top_count_changed", { nextTopCount });
                      setTopCount(nextTopCount);
                    }}
                  >
                    {topCountOptions.map((value) => (
                      <MenuItem key={value} value={String(value)}>
                        Top {value}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Button
                variant="outlined"
                startIcon={<TuneRoundedIcon />}
                onClick={onOpenSettings}
              >
                Update Token
              </Button>
            </Stack>
          </Stack>

          {mode === "priority" && (
            <Alert severity="info" icon={<AutoAwesomeRoundedIcon />}>
              Priority ranking follows the evaluation rule: Placement &gt; Result
              &gt; Event, then newest first within the same type.
            </Alert>
          )}

          {sourceSummary && (
            <Typography variant="body2" color="text.secondary">
              Scanned {sourceSummary.scannedCount} live notifications across{" "}
              {sourceSummary.fetchedPages} page(s) to assemble this priority
              view.
            </Typography>
          )}

          {lastUpdated && !loading && !error && (
            <Typography variant="body2" color="text.secondary">
              Last synced: {formatAbsoluteDateTime(lastUpdated)}
            </Typography>
          )}
        </Stack>
      </Paper>

      {error && (
        <Alert
          severity="error"
          action={
            <Stack direction="row" spacing={1}>
              <Button color="inherit" size="small" onClick={refresh}>
                Retry
              </Button>
              {(errorCode === "MISSING_ACCESS_TOKEN" || errorCode === "UNAUTHORIZED") && (
                <Button color="inherit" size="small" onClick={onOpenSettings}>
                  Fix Token
                </Button>
              )}
            </Stack>
          }
          sx={{ borderRadius: 5 }}
        >
          <Typography variant="subtitle2" fontWeight={800}>
            {error.title}
          </Typography>
          <Typography variant="body2">{error.description}</Typography>
        </Alert>
      )}

      {loading ? (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 7,
            border: "1px solid rgba(11, 107, 203, 0.10)",
            background: "rgba(255,255,255,0.88)",
          }}
        >
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography variant="body1" color="text.secondary">
              Loading live campus notifications...
            </Typography>
          </Stack>
        </Paper>
      ) : null}

      {!loading && !error && notifications.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 5,
            borderRadius: 7,
            border: "1px solid rgba(11, 107, 203, 0.10)",
            background: "rgba(255,255,255,0.88)",
            textAlign: "center",
          }}
        >
          <Typography variant="h5">Nothing to show right now</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5 }}>
            {currentPageCopy.emptyMessage}
          </Typography>
        </Paper>
      )}

      {!loading && !error && notifications.length > 0 && (
        <Stack spacing={2}>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              isViewed={viewedIds.includes(notification.id)}
              onMarkViewed={onMarkViewed}
            />
          ))}
        </Stack>
      )}

      {!loading && !error && mode === "all" && notifications.length > 0 && (
        <Box display="flex" justifyContent="center" pb={2}>
          <Pagination
            count={visiblePageCount}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Stack>
  );
}
