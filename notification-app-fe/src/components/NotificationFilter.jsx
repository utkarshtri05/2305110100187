import { Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import WorkRoundedIcon from "@mui/icons-material/WorkRounded";

const filters = [
  {
    label: "All",
    value: "All",
    icon: <DashboardRoundedIcon fontSize="small" />,
  },
  {
    label: "Placement",
    value: "Placement",
    icon: <WorkRoundedIcon fontSize="small" />,
  },
  {
    label: "Result",
    value: "Result",
    icon: <SchoolRoundedIcon fontSize="small" />,
  },
  {
    label: "Event",
    value: "Event",
    icon: <EventRoundedIcon fontSize="small" />,
  },
];

export function NotificationFilter({ value, onChange }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, nextValue) => {
        if (nextValue) {
          onChange(nextValue);
        }
      }}
      sx={{
        flexWrap: "wrap",
        gap: 1,
      }}
    >
      {filters.map((type) => (
        <ToggleButton
          key={type.value}
          value={type.value}
          sx={{
            textTransform: "none",
            px: 2,
            py: 1,
            borderRadius: "999px !important",
            border: "1px solid rgba(11, 107, 203, 0.14) !important",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            {type.icon}
            <Typography variant="body2" fontWeight={700}>
              {type.label}
            </Typography>
          </Stack>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
