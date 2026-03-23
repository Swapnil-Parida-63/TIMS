import express from "express";
import cors from "cors";
import interviewRouter from "./modules/interview/interview.route.js";
import candidateRouter from "./modules/candidate/candidate.route.js";
import { joinInterview } from "./modules/interview/interview.controller.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


//routes
app.use('/api/candidate', candidateRouter);
app.use("/api/interview", interviewRouter)

// Routes
// router.get("/", (req, res) => {
//   res.send("Welcome to the Task and Issue Management System API");
// });


export default app;