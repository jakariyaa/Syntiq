import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { requireAuth } from "./middleware/auth";
import quizRoutes from "./routes/quiz.routes";

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Adjust origin as needed
    credentials: true, // Allow cookies
  }),
);
app.use(helmet());
app.use(morgan("dev"));

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Protected Route Verification
app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Quiz Routes
app.use("/api/quiz", quizRoutes);

export default app;
