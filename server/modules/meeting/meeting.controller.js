import * as meetingService from "./meeting.service.js";

export const createMeeting = async (req, res) => {
  try {
    const { title, meetingType, scheduledAt, participants, teacherParticipants, notes } = req.body;
    const createdBy = req.user._id;
    const meeting = await meetingService.createMeeting({
      title, meetingType, scheduledAt, participants, teacherParticipants, notes, createdBy
    });
    res.status(201).json({ success: true, data: meeting });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getMeetings = async (req, res) => {
  try {
    const { type } = req.query;
    const meetings = await meetingService.getMeetings(type);
    res.json({ success: true, data: meetings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMeetingById = async (req, res) => {
  try {
    const meeting = await meetingService.getMeetingById(req.params.id);
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });
    res.json({ success: true, data: meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateMeetingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const meeting = await meetingService.updateMeetingStatus(req.params.id, status);
    res.json({ success: true, data: meeting });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const rescheduleMeeting = async (req, res) => {
  try {
    const { scheduledAt } = req.body;
    const meeting = await meetingService.rescheduleMeeting(req.params.id, scheduledAt);
    res.json({ success: true, data: meeting });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteMeeting = async (req, res) => {
  try {
    await meetingService.deleteMeeting(req.params.id);
    res.json({ success: true, message: "Meeting deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
