import express from "express";
import { finalizeTeacher, getTeachers, getTeacherLoA, deleteTeacher } from "./teacher.controller.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getTeachers);
router.post("/:id/finalize", protect, finalizeTeacher);
router.get("/:id/loa", getTeacherLoA);
router.delete("/:id", protect, deleteTeacher);

export default router;