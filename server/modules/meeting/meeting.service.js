import Meeting from "./meeting.model.js";
import { createZoomMeeting, updateZoomMeeting } from "../../services/zoom.service.js";

export const createMeeting = async ({ title, meetingType, scheduledAt, participants, teacherParticipants, notes, createdBy }) => {
  // Create Zoom meeting
  let zoomDetails;
  try {
    zoomDetails = await createZoomMeeting({ scheduledAt });
  } catch (err) {
    throw new Error("Failed to create Zoom meeting: " + (err.message || "Unknown error"));
  }

  const meeting = await Meeting.create({
    title: title || (meetingType === "panelist" ? "Panelist Meeting" : "Teacher Meeting"),
    meetingType,
    scheduledAt,
    participants:         participants         || [],
    teacherParticipants:  teacherParticipants  || [],
    notes,
    createdBy,
    zoomMeetingId: zoomDetails.meetingId,
    zoomJoinUrl:   zoomDetails.joinUrl,
    zoomStartUrl:  zoomDetails.startUrl,
  });

  return meeting;
};

export const getMeetings = async (meetingType) => {
  const query = meetingType ? { meetingType } : {};
  return await Meeting.find(query)
    .populate("participants.user",            "name email role")
    .populate("teacherParticipants.teacher",  "candidate cpc classCode serialNumber")
    .populate("createdBy",                    "name email")
    .sort({ scheduledAt: -1 });
};

export const getMeetingById = async (id) => {
  return await Meeting.findById(id)
    .populate("participants.user",            "name email role")
    .populate("teacherParticipants.teacher",  "candidate cpc classCode serialNumber")
    .populate("createdBy",                    "name email");
};

export const updateMeetingStatus = async (id, status) => {
  const meeting = await Meeting.findByIdAndUpdate(id, { status }, { new: true });
  if (!meeting) throw new Error("Meeting not found");
  return meeting;
};

export const rescheduleMeeting = async (id, scheduledAt) => {
  const meeting = await Meeting.findById(id);
  if (!meeting) throw new Error("Meeting not found");

  meeting.scheduledAt = new Date(scheduledAt);
  meeting.status = "scheduled";

  // Best-effort Zoom update
  if (meeting.zoomMeetingId) {
    try {
      await updateZoomMeeting(meeting.zoomMeetingId, scheduledAt);
    } catch (err) {
      console.warn("Zoom reschedule failed (non-blocking):", err.message);
    }
  }

  await meeting.save();
  return meeting;
};

export const deleteMeeting = async (id) => {
  const meeting = await Meeting.findByIdAndDelete(id);
  if (!meeting) throw new Error("Meeting not found");
  return meeting;
};
