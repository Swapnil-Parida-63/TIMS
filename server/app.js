import express from "express";
import cors from "cors";
import router from './modules/candidate/candidate.route.js';


const app = express();



// Middleware
app.use(cors());
app.use(express.json());

//routes
app.use('/api/candidates', router);

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the Task and Issue Management System API");
});

export default app;