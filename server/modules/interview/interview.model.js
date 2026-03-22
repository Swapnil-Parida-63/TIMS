import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },

    scheduledAt: {
      type: Date,
      required: true,
    },

          //Judges array only stores who is assigned
          //Roles & permissions are handled separately

    judges: [
      {
        judgeType: {
          type: String,
          enum: ["internal", "external"],
          required: true,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // for internal
        },
        email: String,
        token: String // for external
      },
    ],

    zoomMeetingId: String,
    zoomJoinUrl: String,

    recordingUrl: String,

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },

    feedback: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);