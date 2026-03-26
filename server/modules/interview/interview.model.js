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

    //

    zoomMeetingId: String,
    zoomJoinUrl: String,

    recordingUrl: String,

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },

// feedbacks: [
//   {
//     judgeType: String,
//     user: mongoose.Schema.Types.ObjectId,
//     email: String,
//     feedback: String,
//     submittedAt: Date
//   }
// ]
feedbacks: [
  {
    judgeType: String,
    user: mongoose.Schema.Types.ObjectId,
    email: String,
    token: String,

    ratings: {
      communication: {
        score: Number, // 1–5
        languages: [String], // ["English", "Hindi"]
        comment: String
      },

      subject: {
        subject: String, // "Math"
        classLevel: String, // "Class 10"
        depthRating: Number, // 1–5
        comment: String
      },

      personality: {
        score: Number,
        comment: String
      },

      presentation: {
        score: Number,
        comment: String
      },

      overallRemark: {
        tag: String, // "Not Good" | "Okay" | "Excellent"
        comment: String
      }
    },

    hrRemark: {
      type: String,
      default: null
    },

    submittedAt: Date
  }
]
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);