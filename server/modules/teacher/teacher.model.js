import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true
  },

  cpc: String,
  category: String,
  classCode: String,
  classes: [String],
  slots: Number,
  serialNumber: String,
  loaPath: String,   // absolute path to the generated LoA PDF on disk

  pricing: {
    subjects: String,
    minClasses: Number,
    hourlyRate: Number,
    parentMonthly: Number,
    parentExtra30: Number,
    teacherExtra30: Number
  },

  students: [
    {
      board: String
    }
  ]

}, { timestamps: true });

export default mongoose.model("Teacher", teacherSchema);