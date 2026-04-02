import Candidate from "./candidate.model.js";

export async function createCandidate(data) {

  const {firstName, lastName, email, phone} = data;

  if (!firstName || !email || !phone) {
    throw new Error("Missing required fields: firstName, email, phone");
  }

  const existingCandidate = await Candidate.findOne({email})
  if (existingCandidate){
    throw new Error("A candidate with this email already exists");
  }

  const candidate = await Candidate.create(data);
  return candidate;
}

export async function getCandidates() {
  return await Candidate.find({}).sort({ createdAt: -1 });
}

export async function getCandidateById(id) {
  const candidate = await Candidate.findById(id);
  if (!candidate) throw new Error("Candidate not found");
  return candidate;
}

export async function updateCandidate(id, data, user) {
  if (!['admin', 'super_admin', 'executer'].includes(user?.role)) {
    throw new Error('Unauthorized — only admin, super_admin, or executer can edit candidates');
  }

  const candidate = await Candidate.findById(id);
  if (!candidate) throw new Error('Candidate not found');

  // Only system fields are blocked — all candidate data is now editable
  const BLOCKED = [
    'status', '_id', '__v',
    'createdAt', 'updatedAt',
  ];

  const update = {};
  for (const [k, v] of Object.entries(data)) {
    if (!BLOCKED.includes(k)) update[k] = v;
  }

  const updated = await Candidate.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  return updated;
}


import { normalizeKeys } from "../../utils/normalizeKeys.js";

// Webhook Candidate Ingestion Parser
export async function createCandidateFromWebhook(rawData) {
  // Google Sheets sends each value as an array e.g. { "Full Name:-": ["Swapnil"] }
  // Unwrap single-element arrays before normalizing keys
  const unwrapped = {};
  for (const [key, value] of Object.entries(rawData)) {
    unwrapped[key] = Array.isArray(value) ? value[0] : value;
  }

  const normalizedData = normalizeKeys(unwrapped);
  console.log("Normalized Payload mapping keys:", normalizedData);

  // Flexible dynamic mapping (Loose structure as per current Google Form understanding)
  const mappedData = {
    // Split "Full Name:-" into first + last
    firstName: normalizedData.fullname
      ? normalizedData.fullname.split(' ')[0]
      : (normalizedData.firstname || 'Unknown'),
    lastName: normalizedData.fullname
      ? normalizedData.fullname.split(' ').slice(1).join(' ')
      : (normalizedData.lastname || ''),

    // Core contacts
    email: normalizedData.emailaddress || normalizedData.email || null,
    phone: normalizedData.phonewhatsappnumber || normalizedData.phone || normalizedData.whatsapp || null,

    // Profile fields mapped from actual Google Form column names:
    // "Father's Name:-"                    → fathersname
    // "Mother's Name:-"                    → mothersname
    // "Date Of Birth:-"                    → dateofbirth
    // "Highest Qualification:-"            → highestqualification
    // "Technical Qualification:-"          → technicalqualification
    // "Specialisation On Subject/Stream:-" → specialisationonsubjectstream
    // "Teaching Experience"                → teachingexperience  (no "inyears" suffix)
    // "Current Address:-"                  → currentaddress
    fatherName:              normalizedData.fathersname || null,
    motherName:              normalizedData.mothersname || null,
    dob:                     normalizedData.dateofbirth || null,
    highestQualification:    normalizedData.highestqualification || null,
    technicalQualification:  normalizedData.technicalqualification || null,
    specialisation:          normalizedData.specialisationonsubjectstream
                               || normalizedData.specialisation || null,
    experience:              normalizedData.teachingexperience           // actual key
                               || normalizedData.teachingexperienceinyears // legacy fallback
                               || null,
    currentAddress:          normalizedData.currentaddress || null,

    status: 'applied'
  };

  console.log("Dynamically Mapped Candidate Schema Data:", mappedData);

  // Skip or Log Duplicates placeholder constraint
  if (mappedData.email || mappedData.phone) {
    const existingQuery = [];
    if (mappedData.email) existingQuery.push({ email: mappedData.email });
    if (mappedData.phone) existingQuery.push({ phone: mappedData.phone });

    const existingCandidate = await Candidate.findOne({ $or: existingQuery });

    if (existingCandidate) {
      console.log(`Duplicate skipped in Webhook logic for candidate: ${mappedData.email || mappedData.phone}`);
      return { status: "duplicate_skipped", candidate: existingCandidate };
    }
  } else {
    console.log("Webhook payload did not provide trackable email or phone. Skipping creation to prevent empty ghost profiles.");
    return { status: "missing_identifiers", candidate: null };
  }

  const candidate = await Candidate.create(mappedData);
  return { status: "created", candidate };
}

/**
 * Permanently deletes a candidate from the DB.
 * - BLOCKED if the candidate has been finalized as a teacher (must remove teacher record first).
 * - Cascades to delete linked interviews + Zoom recordings.
 * - Teacher records are completely independent — they are NOT affected.
 */
export async function deleteCandidate(id, user, reason, notes = '') {
  if (!['admin', 'super_admin'].includes(user?.role)) {
    throw new Error('Unauthorized — only admin or super_admin can delete candidates');
  }

  if (!reason || !reason.trim()) {
    throw new Error('A deletion reason must be provided');
  }

  const candidate = await Candidate.findById(id);
  if (!candidate) throw new Error('Candidate not found');

  // Guard: block if candidate has been finalized as a teacher
  const Teacher = (await import('../teacher/teacher.model.js')).default;
  const existingTeacher = await Teacher.findOne({ candidate: id });
  if (existingTeacher) {
    throw new Error(
      `Cannot delete — "${candidate.firstName} ${candidate.lastName}" has been finalized as a teacher. ` +
      `Remove them from the Teachers list first.`
    );
  }

  // ── Log before deleting ────────────────────────────────────────────────────
  const DeletedCandidateLog = (await import('./deletedCandidateLog.model.js')).default;
  await DeletedCandidateLog.create({
    firstName:  candidate.firstName,
    lastName:   candidate.lastName,
    email:      candidate.email,
    phone:      candidate.phone,
    reason,
    notes,
    deletedBy:  user._id,
  });

  // Cascade: delete all linked interviews + their Zoom recordings
  const Interview = (await import('../interview/interview.model.js')).default;
  const interviews = await Interview.find({ candidate: id });

  for (const iv of interviews) {
    if (iv.zoomMeetingId && iv.zoomRecordingStatus !== 'deleted') {
      try {
        const { deleteRecording } = await import('../../services/zoom.service.js');
        await deleteRecording(iv.zoomMeetingId);
      } catch (e) {
        console.error(`Zoom recording cleanup failed for ${iv._id}:`, e.message);
      }
    }
    await iv.deleteOne();
  }

  await candidate.deleteOne();
  return `Candidate "${candidate.firstName} ${candidate.lastName}" and ${interviews.length} linked interview(s) permanently deleted.`;
}