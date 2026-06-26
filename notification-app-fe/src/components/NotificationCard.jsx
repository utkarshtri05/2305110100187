import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import FiberManualRecordRoundedIcon from "@mui/icons-material/FiberManualRecordRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";

import {
  formatAbsoluteDateTime,
  formatRelativeTime,
} from "../lib/notificationUtils";

const toneByType = {
  Placement: {
    borderColor: "rgba(11, 107, 203, 0.32)",
    background:
      "linear-gradient(135deg, rgba(11,107,203,0.08), rgba(255,255,255,0.88))",
    chipColor: "primary",
    icon: <WorkRoundedIcon fontSize="small" />,
    helper: "High-impact placement update with the strongest priority weight.",
  },
  Result: {
    borderColor: "rgba(183, 121, 31, 0.28)",
    background:
      "linear-gradient(135deg, rgba(183,121,31,0.08), rgba(255,255,255,0.90))",
    chipColor: "warning",
    icon: <SchoolRoundedIcon fontSize="small" />,
    helper: "Academic result update ranked below placement and above event announcements.",
  },
  Event: {
    borderColor: "rgba(23, 143, 93, 0.24)",
    background:
      "linear-gradient(135deg, rgba(23,143,93,0.08), rgba(255,255,255,0.90))",
    chipColor: "success",
    icon: <EventRoundedIcon fontSize="small" />,
    helper: "Campus event update retained for awareness and chronological browsing.",
  },
};

export function NotificationCard({ notification, isViewed, onMarkViewed }) {
  const tone = toneByType[notification.type] ?? toneByType.Event;

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: "hidden",
        borderRadius: 7,
        border: "1px solid",
        borderColor: tone.borderColor,
        background: isViewed ? "rgba(255,255,255,0.92)" : tone.background,
        boxShadow: isViewed
          ? "0 10px 24px rgba(23, 50, 77, 0.04)"
          : "0 18px 48px rgba(23, 50, 77, 0.08)",
        transition: "transform 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 24px 60px rgba(23, 50, 77, 0.12)",
        },
      }}
    >
      <Stack spacing={0}>
        <Box sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={tone.icon}
                label={notification.type}
                color={tone.chipColor}
              />
              <Chip
                icon={<FiberManualRecordRoundedIcon sx={{ fontSize: 10 }} />}
                label={isViewed ? "Viewed" : "New"}
                variant={isViewed ? "outlined" : "filled"}
                color={isViewed ? "default" : "secondary"}
              />
              {notification.priorityRank ? (
                <Chip
                  icon={<FlagRoundedIcon />}
                  label={`Priority #${notification.priorityRank}`}
                  color="warning"
                  variant="outlined"
                />
              ) : null}
            </Stack>

            <Stack alignItems={{ md: "flex-end" }}>
              <Typography variant="body2" fontWeight={700}>
                {formatRelativeTime(notification.timestampMs)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatAbsoluteDateTime(notification.timestamp)}
              </Typography>
            </Stack>
          </Stack>

          <Typography variant="h5" sx={{ mt: 2, fontSize: { xs: "1.25rem", md: "1.45rem" } }}>
            {notification.displayMessage}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mt: 1.25 }}>
            {tone.helper}
          </Typography>
        </Box>

        <Box
          sx={{
            borderTop: "1px solid rgba(11, 107, 203, 0.08)",
            px: { xs: 2.5, md: 3 },
            py: 2,
            bgcolor: "rgba(255,255,255,0.68)",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ md: "center" }}
          >
            <Typography variant="body2" color="text.secondary">
              {isViewed
                ? "Already reviewed on this device. The viewed state is stored locally."
                : "Mark this item once reviewed to separate fresh updates from already seen ones."}
            </Typography>

            <Button
              variant={isViewed ? "text" : "contained"}
              color={isViewed ? "inherit" : "primary"}
              disabled={isViewed}
              onClick={() => onMarkViewed(notification.id)}
            >
              {isViewed ? "Viewed locally" : "Mark as viewed"}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
