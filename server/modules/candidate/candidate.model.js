// The flow for candidate is: Route → Controller → Service → Model
import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
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
    enum: ["applied", "interview scheduled", "pending", "hired", "rejected"],
    default: "applied"
  },
},
{timestamps: true} // This will automatically add createdAt and updatedAt fields)
);

const  Candidate = mongoose.model("Candidate", candidateSchema);
export default Candidate;
