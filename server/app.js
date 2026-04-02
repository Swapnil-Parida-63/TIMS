import express from "express";
import cors from "cors";
import interviewRouter from "./modules/interview/interview.route.js";
import candidateRouter from "./modules/candidate/candidate.route.js";
import authRouter from "./modules/auth/auth.route.js";
import teacherRouter from "./modules/teacher/teacher.route.js"
import webhookRouter from "./modules/webhook/webhook.route.js";
import userRouter from "./modules/user/user.route.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


import meetingRouter from "./modules/meeting/meeting.route.js";
import reportRouter  from "./modules/reports/reports.route.js";

//routes
app.use('/api/candidate', candidateRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/auth", authRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/webhook", webhookRouter);
app.use("/api/users", userRouter);
app.use("/api/meeting", meetingRouter);
app.use("/api/reports", reportRouter);

// Routes
// router.get("/", (req, res) => {
//   res.send("Welcome to the Task and Issue Management System API");
// });

import { initCronJobs } from "./services/cron.service.js";
initCronJobs();

export default app;