import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { coupleRouter } from "./routes/couple.routes.js";
import { knowledgeRouter } from "./routes/knowledge.routes.js";
import { memoryRouter } from "./routes/memory.routes.js";
import { timelineRouter } from "./routes/timeline.routes.js";
import { searchRouter } from "./routes/search.routes.js";
import { quizRouter } from "./routes/quiz.routes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true, // necesario para la cookie httpOnly del refresh token
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Rate limit global suave; los endpoints sensibles (auth) tienen el suyo propio.
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/couples", coupleRouter);
app.use("/api/knowledge", knowledgeRouter);
app.use("/api/memories", memoryRouter);
app.use("/api/timeline", timelineRouter);
app.use("/api/search", searchRouter);
app.use("/api/quiz", quizRouter);

app.use(notFound);
app.use(errorHandler);
