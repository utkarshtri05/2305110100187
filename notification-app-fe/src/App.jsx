import { startTransition, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  Paper,
  Stack,
  Tab,
  Tabs,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import LanRoundedIcon from "@mui/icons-material/LanRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import PriorityHighRoundedIcon from "@mui/icons-material/PriorityHighRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { CredentialsDialog } from "./components/CredentialsDialog";
import { NotificationsPage } from "./pages/NotificationsPage";
import { createLogger } from "./lib/loggingMiddleware";
import {
  clearStoredCredentials,
  credentialsAreConfigured,
  loadStoredCredentials,
  loadViewedIds,
  saveStoredCredentials,
  saveViewedIds,
} from "./lib/notificationUtils";

const appLogger = createLogger("app");

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0b6bcb",
      dark: "#084a8f",
      light: "#e8f3ff",
    },
    secondary: {
      main: "#178f5d",
      dark: "#0d6843",
      light: "#e7f8f0",
    },
    warning: {
      main: "#b7791f",
    },
    background: {
      default: "#f4f8fc",
      paper: "#ffffff",
    },
    text: {
      primary: "#17324d",
      secondary: "#50637a",
    },
  },
  shape: {
    borderRadius: 24,
  },
  typography: {
    fontFamily: '"Segoe UI Variable", "Segoe UI", "Trebuchet MS", sans-serif',
    h2: {
      fontWeight: 800,
      letterSpacing: "-0.04em",
    },
    h3: {
      fontWeight: 800,
      letterSpacing: "-0.04em",
    },
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.03em",
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
      },
    },
  },
});

function getPageFromHash() {
  if (typeof window === "undefined") {
    return "all";
  }

  const value = window.location.hash.replace("#/", "").trim().toLowerCase();
  return value === "priority" ? "priority" : "all";
}

function StatusTile({ icon, label, value, tone = "default" }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        px: 2,
        py: 1.5,
        minWidth: { xs: "100%", sm: 180 },
        borderRadius: 4,
        borderColor:
          tone === "success"
            ? "rgba(23, 143, 93, 0.25)"
            : tone === "warning"
              ? "rgba(183, 121, 31, 0.24)"
              : "rgba(11, 107, 203, 0.18)",
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 40,
            height: 40,
            borderRadius: 3,
            bgcolor:
              tone === "success"
                ? "secondary.light"
                : tone === "warning"
                  ? "rgba(183, 121, 31, 0.12)"
                  : "primary.light",
            color:
              tone === "success"
                ? "secondary.dark"
                : tone === "warning"
                  ? "warning.main"
                  : "primary.main",
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="subtitle1" fontWeight={800}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState(() => getPageFromHash());
  const [credentials, setCredentials] = useState(() => loadStoredCredentials());
  const [viewedIds, setViewedIds] = useState(() => loadViewedIds());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSession, setSettingsSession] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/all");
    }

    const syncHash = () => {
      const nextPage = getPageFromHash();
      setActivePage(nextPage);
      appLogger.info("navigation.hash_synced", { nextPage });
    };

    window.addEventListener("hashchange", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);

  const connectionReady = credentialsAreConfigured(credentials);

  const handlePageChange = (_, nextPage) => {
    if (!nextPage || nextPage === activePage) {
      return;
    }

    appLogger.info("navigation.page_selected", { nextPage });

    startTransition(() => {
      if (typeof window !== "undefined") {
        window.location.hash = `#/${nextPage}`;
      }
      setActivePage(nextPage);
    });
  };

  const handleMarkViewed = (notificationId) => {
    setViewedIds((currentIds) => {
      if (currentIds.includes(notificationId)) {
        return currentIds;
      }

      const nextIds = [notificationId, ...currentIds].slice(0, 500);
      saveViewedIds(nextIds);
      appLogger.info("notifications.marked_viewed", {
        notificationId,
        totalViewed: nextIds.length,
      });
      return nextIds;
    });
  };

  const handleSaveCredentials = (nextCredentials) => {
    const savedCredentials = saveStoredCredentials(nextCredentials);
    setCredentials(savedCredentials);
    setSettingsOpen(false);
    appLogger.info("auth.credentials_saved", {
      apiBaseUrl: savedCredentials.apiBaseUrl,
      hasAccessToken: Boolean(savedCredentials.accessToken),
      hasClientId: Boolean(savedCredentials.clientId),
    });
  };

  const handleResetCredentials = () => {
    clearStoredCredentials();
    const fallbackCredentials = loadStoredCredentials();
    setCredentials(fallbackCredentials);
    setSettingsOpen(false);
    appLogger.warn("auth.credentials_reset", {
      apiBaseUrl: fallbackCredentials.apiBaseUrl,
      hasAccessToken: Boolean(fallbackCredentials.accessToken),
      hasClientId: Boolean(fallbackCredentials.clientId),
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",
          "::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top left, rgba(11, 107, 203, 0.18), transparent 28%), radial-gradient(circle at top right, rgba(23, 143, 93, 0.12), transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.75), rgba(244,248,252,0.98))",
            pointerEvents: "none",
          },
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            position: "relative",
            py: { xs: 3, md: 5 },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              p: { xs: 2.5, md: 4 },
              borderRadius: 7,
              border: "1px solid rgba(11, 107, 203, 0.10)",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.97), rgba(243, 250, 255, 0.92))",
              boxShadow: "0 24px 60px rgba(23, 50, 77, 0.08)",
            }}
          >
            <Stack spacing={3}>
              <Stack
                direction={{ xs: "column", lg: "row" }}
                spacing={3}
                justifyContent="space-between"
                alignItems={{ lg: "flex-start" }}
              >
                <Box maxWidth={760}>
                  <Chip
                    icon={<ShieldRoundedIcon />}
                    label="Affordmed Campus Evaluation"
                    color="primary"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="h3" sx={{ fontSize: { xs: "2rem", md: "3.25rem" } }}>
                    Campus Notification Command Center
                  </Typography>
                  <Typography
                    variant="h6"
                    color="text.secondary"
                    sx={{ mt: 1.5, maxWidth: 700, lineHeight: 1.5 }}
                  >
                    Live notification streams, priority ranking, local viewed-state
                    tracking, and resilient API handling built for the Stage 2
                    frontend submission.
                  </Typography>
                </Box>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  flexWrap="wrap"
                  useFlexGap
                  alignItems="stretch"
                >
                  <StatusTile
                    icon={<LanRoundedIcon fontSize="small" />}
                    label="Connection"
                    value={connectionReady ? "Token ready" : "Token needed"}
                    tone={connectionReady ? "success" : "warning"}
                  />
                  <StatusTile
                    icon={<VisibilityRoundedIcon fontSize="small" />}
                    label="Viewed Cache"
                    value={`${viewedIds.length} items`}
                    tone="default"
                  />
                  <StatusTile
                    icon={<TuneRoundedIcon fontSize="small" />}
                    label="App Target"
                    value="localhost:3000"
                    tone="default"
                  />
                </Stack>
              </Stack>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                justifyContent="space-between"
                alignItems={{ md: "center" }}
              >
                <Tabs
                  value={activePage}
                  onChange={handlePageChange}
                  variant="scrollable"
                  allowScrollButtonsMobile
                  sx={{
                    "& .MuiTab-root": {
                      minHeight: 54,
                      borderRadius: 999,
                      mr: 1,
                    },
                  }}
                >
                  <Tab
                    value="all"
                    icon={<NotificationsRoundedIcon />}
                    iconPosition="start"
                    label="All Notifications"
                  />
                  <Tab
                    value="priority"
                    icon={<PriorityHighRoundedIcon />}
                    iconPosition="start"
                    label="Priority Inbox"
                  />
                </Tabs>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<TuneRoundedIcon />}
                  onClick={() => {
                    setSettingsSession((currentSession) => currentSession + 1);
                    setSettingsOpen(true);
                  }}
                >
                  Connection Settings
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <NotificationsPage
            key={activePage}
            mode={activePage}
            credentials={credentials}
            viewedIds={viewedIds}
            onMarkViewed={handleMarkViewed}
            onOpenSettings={() => {
              setSettingsSession((currentSession) => currentSession + 1);
              setSettingsOpen(true);
            }}
          />
        </Container>

        <CredentialsDialog
          key={settingsSession}
          open={settingsOpen}
          credentials={credentials}
          onClose={() => setSettingsOpen(false)}
          onSave={handleSaveCredentials}
          onReset={handleResetCredentials}
        />
      </Box>
    </ThemeProvider>
  );
}
