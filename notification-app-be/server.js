import dotenv from "dotenv";
import express from "express";

import logger from "./middleware/logger.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json());
app.use(logger);

app.get("/", (_req, res) => {
  res.json({
    service: "notification-app-be",
    status: "running",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.listen(port, () => {
  process.stdout.write(`notification-app-be listening on port ${port}\n`);
});
