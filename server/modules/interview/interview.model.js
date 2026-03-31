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
        token: String, // for external
        // Per-interview role assignment (independent of global user role)
        interviewRole: {
          type: String,
          enum: ["micro_observer", "subject_expert", null],
          default: null,
        },
      },
    ],

    //

    zoomMeetingId: String,
    zoomJoinUrl: String,
    zoomStartUrl: String,

    zoomRecordingUrl: String,
    zoomRecordingStatus: {
      type: String,
      enum: ["pending", "available", "deleted"],
      default: "pending"
    },

    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "selected", "rejected"],
      default: "scheduled",
    },

    rejectionReason: { type: String, default: null },
    rejectionNotes:  { type: String, default: null },

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

    totalScore: {
      type: Number,
      default: null
    },

    submittedAt: Date
  }
],

pricing: {
  cpc: String,           // human-readable range label e.g. "AP-2 to AP-5" (super admin)
  cpcFrom: String,       // start of range e.g. "AP-2"
  cpcTo: String,         // end of range e.g. "AP-5"
  category: String,      // A/B/D/E (super admin)

  classCode: String,     // A-4 (admin)

  details: {
    subjects: String,
    minClasses: Number,
    hourlyRate: Number,
    parentMonthly: Number,
    parentExtra30: Number,
    teacherExtra30: Number
  }
},

students: [
  {
    board: String   // CBSE / ICSE etc (future-ready)
  }
],
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);