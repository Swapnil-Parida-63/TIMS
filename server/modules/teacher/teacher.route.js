import express from "express";
import { finalizeTeacher } from "./teacher.controller.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

router.post("/:id/finalize", protect, finalizeTeacher);

export default router;