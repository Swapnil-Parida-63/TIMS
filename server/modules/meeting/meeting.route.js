import express from "express";
import { protect } from "../../middleware/auth.js";
import {
  createMeeting, getMeetings, getMeetingById,
  updateMeetingStatus, rescheduleMeeting, deleteMeeting
} from "./meeting.controller.js";

const router = express.Router();

router.use(protect);

router.post("/",                          createMeeting);
router.get("/",                           getMeetings);
router.get("/:id",                        getMeetingById);
router.patch("/:id/status",               updateMeetingStatus);
router.patch("/:id/reschedule",           rescheduleMeeting);
router.delete("/:id",                     deleteMeeting);

export default router;
