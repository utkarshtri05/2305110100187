import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

export function CredentialsDialog({
  open,
  credentials,
  onClose,
  onSave,
  onReset,
}) {
  const [draft, setDraft] = useState(() => credentials);
  const [showToken, setShowToken] = useState(false);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Connection Settings</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            These values are stored only on this machine and let the app talk to
            the protected campus notifications API without a login screen.
          </Typography>

          <Alert severity="info" sx={{ borderRadius: 4 }}>
            The app first uses locally saved values and falls back to the
            `.env.local` defaults when local overrides are cleared.
          </Alert>

          <FormControl fullWidth>
            <TextField
              label="API Base URL"
              value={draft.apiBaseUrl}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  apiBaseUrl: event.target.value,
                }))
              }
              placeholder="http://4.224.186.213/evaluation-service"
            />
          </FormControl>

          <FormControl fullWidth>
            <TextField
              label="Client ID"
              value={draft.clientId}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  clientId: event.target.value,
                }))
              }
              placeholder="c5076a3c-5b68-45b8-9e73-719627fce2b1"
            />
          </FormControl>

          <FormControl fullWidth>
            <TextField
              label="Access Token"
              type={showToken ? "text" : "password"}
              value={draft.accessToken}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  accessToken: event.target.value,
                }))
              }
              placeholder="Paste a fresh bearer token here"
              autoComplete="off"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={() => setShowToken((currentState) => !currentState)}
                    >
                      {showToken ? (
                        <VisibilityOffRoundedIcon />
                      ) : (
                        <VisibilityRoundedIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Button color="inherit" onClick={onReset}>
          Use .env defaults
        </Button>
        <Stack direction="row" spacing={1.25}>
          <Button color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => onSave(draft)}>
            Save Local Override
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
