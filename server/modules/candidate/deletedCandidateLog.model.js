import mongoose from "mongoose";

/**
 * Audit log for permanently deleted candidates.
 * Only minimal identifiers + deletion context are stored.
 * This record is permanent and never auto-deleted.
 */
const deletedCandidateLogSchema = new mongoose.Schema({
  // Identity snapshot (taken at deletion time)
  firstName:   { type: String, required: true },
  lastName:    { type: String, default: '' },
  email:       { type: String, required: true },
  phone:       { type: String, required: true },

  // Deletion context
  reason:      { type: String, required: true },  // predefined reason
  notes:       { type: String, default: '' },       // optional extra note
  deletedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deletedAt:   { type: Date, default: Date.now },
}, { timestamps: false });

export default mongoose.model("DeletedCandidateLog", deletedCandidateLogSchema);
