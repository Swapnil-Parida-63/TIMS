import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true
  },

  cpc: String,
  category: String,
  classCode: String,            // primary class code (LoA / pricing basis)
  classCodes: [{
    code:  { type: String },
    slots: { type: Number },
  }],                           // all class codes (may be multiple)
  classes: [String],
  slots: Number,                // primary slot count
  subjects: { type: [String], default: [] },  // admin-selected subjects (e.g. Mathematics, Physics)
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

  serviceLocation: { type: [String], default: [] }, // BBSR, Cuttack, Khorda — copied from Candidate on finalization

  students: [
    {
      board: String
    }
  ]

}, { timestamps: true });

export default mongoose.model("Teacher", teacherSchema);