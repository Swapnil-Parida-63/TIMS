import express from "express";
import cors from "cors";
import interviewRouter from "./modules/interview/interview.route.js";
import candidateRouter from "./modules/candidate/candidate.route.js";
import authRouter from "./modules/auth/auth.route.js";
import teacherRouter from "./modules/teacher/teacher.route.js";
import webhookRouter from "./modules/webhook/webhook.route.js";
import userRouter from "./modules/user/user.route.js";
import meetingRouter from "./modules/meeting/meeting.route.js";
import reportRouter  from "./modules/reports/reports.route.js";
import { initCronJobs } from "./services/cron.service.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/candidate', candidateRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/auth", authRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/webhook", webhookRouter);
app.use("/api/users", userRouter);
app.use("/api/meeting", meetingRouter);
app.use("/api/reports", reportRouter);

// 404 handler — unmatched routes return JSON, not HTML
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler — catches any unhandled errors thrown in routes/middleware
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error("[Global Error]", err.stack || err.message);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// Initialize cron jobs
initCronJobs();

export default app;