import express from "express";
import cors from "cors";
import "dotenv/config";

import { healthRouter } from "./routes/health";
import { libraryRouter } from "./routes/library";
import { trainingRouter } from "./routes/training";
import { traineesRouter } from "./routes/trainees";
import importRouter from "./routes/import";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api/health", healthRouter);
app.use("/api/library", libraryRouter);
app.use("/api/training", trainingRouter);
app.use("/api/trainees", traineesRouter);
app.use("/api/import", importRouter);

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => {
  console.log(`API running on :${port}`);
});
