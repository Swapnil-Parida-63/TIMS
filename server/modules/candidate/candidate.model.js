// The flow for candidate is: Route → Controller → Service → Model
import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: false,   // some names from sheet may be single-word
    default: ''
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["applied", "interview scheduled", "standby", "selected", "rejected", "cancelled"],
    default: "applied"
  },
  fatherName: String,
  motherName: String,
  dob: String,
  highestQualification: String,
  technicalQualification: String,
  specialisation: String,
  experience: String,
  currentAddress: String,
  declaration: String,

  // ─── Teaching Profile (new fields) ───────────────────────────────────────
  boardsToTeach:     { type: [String], default: [] },  // boards willing to teach
  boardsTaught:      { type: [String], default: [] },  // boards already taught
  classesToTeach:    { type: [String], default: [] },  // grades willing to teach
  classesTaught:     { type: [String], default: [] },  // grades already taught
  subjectToTeach:    { type: String, default: '' },    // subject applying for
  subjectTaught:     { type: String, default: '' },    // subject previously taught

  mediumOfInstruction: { type: [String], default: [] }, // Hindi, English, Odia (multi)
  mediumComfortable:   { type: String, default: '' },   // most comfortable medium

  institutionalExperience: { type: String, default: '' }, // school/institution exp
  tuitionExperience:       { type: String, default: '' }, // private tuition exp

  serviceLocation: { type: [String], default: [] }, // BBSR, Cuttack, Khorda

}, { timestamps: true });

const Candidate = mongoose.model("Candidate", candidateSchema);
export default Candidate;
