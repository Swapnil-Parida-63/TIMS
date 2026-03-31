import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "Team Meeting"
  },

  // Who is this meeting for?
  meetingType: {
    type: String,
    enum: ["panelist", "teacher"],
    required: true
  },

  scheduledAt: {
    type: Date,
    required: true
  },

  // Panelist participants (internal users)
  participants: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: String,
      email: String,
    }
  ],

  // Teacher participants
  teacherParticipants: [
    {
      teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
      name: String,
      email: String,
    }
  ],

  // Zoom details
  zoomMeetingId: String,
  zoomJoinUrl: String,
  zoomStartUrl: String,

  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled"
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  notes: String,

}, { timestamps: true });

export default mongoose.model("Meeting", meetingSchema);
