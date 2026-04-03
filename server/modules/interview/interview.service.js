import Interview from "./interview.model.js";
import Candidate from "../candidate/candidate.model.js";
import { createZoomMeeting, deleteRecording } from "../../services/zoom.service.js";
import { generateToken } from "../../utils/token.js";
import { calculateTotalScore } from "../../utils/score.js";
import { CLASS_CODES } from "../../config/classCodes.js";
import { CPC_MAP } from "../../config/cpcMap.js";
import mongoose from "mongoose";
import { sendInterviewEmail } from "../../services/email.service.js";
import { finalizeTeacher as _finalizeTeacher } from "../teacher/teacher.service.js";

export const getInterviews = async () => {
  return await Interview.find({}).populate('candidate').sort({ createdAt: -1 });
};

export const createInterview = async (data) => {
  const { scheduledAt, candidate, judges } = data;

  if (!scheduledAt || !candidate) {
    throw new Error("Missing required fields: scheduledAt, candidate");
  }

  // Candidate existence check
  const candidateExists = await Candidate.findById(candidate);
  if (!candidateExists) {
    throw new Error("Candidate not found");
  }

  // Generate Zoom Meeting
  let zoomDetails;
  try {
    const candidateName = `${candidateExists.firstName || ''} ${candidateExists.lastName || ''}`.trim();
    zoomDetails = await createZoomMeeting({ scheduledAt, topic: `Interview - ${candidateName}` });
  } catch (err) {
    console.error("Zoom Creation Failed:", err.response?.data || err.message);
    throw new Error("Failed to create Zoom Meeting. Please check Zoom credentials.");
  }

  // Validate judges
  // Ensure we can fetch internal judge emails if applicable
  const UserModel = mongoose.model("User");
  
  if (judges && judges.length > 0) {
    for (const judge of judges) {
      if (judge.judgeType === "internal" && !judge.user) {
        throw new Error("Internal judge must have a user ID");
      }

      // Fetch internal judge email if not provided
      if (judge.judgeType === "internal" && judge.user && !judge.email) {
        try {
          const intUser = await UserModel.findById(judge.user);
          if (intUser && intUser.email) {
            judge.email = intUser.email;
          }
        } catch (e) {
          console.error("Failed to populate internal judge email:", e.message);
        }
      }

      if (judge.judgeType === "external" && judge.email != null && !judge.token) {
        judge.token = generateToken();
      }

      if (judge.judgeType === "external" && !judge.email) {
        throw new Error("External judge must have an email");
      }
      else if (!["internal", "external"].includes(judge.judgeType)) {
        throw new Error("Invalid judge type");
      }
    }
  }

  // Create Interview
  const interview = await Interview.create({
    ...data,
    zoomMeetingId: zoomDetails.meetingId,
    zoomJoinUrl: zoomDetails.joinUrl,
    zoomStartUrl: zoomDetails.startUrl,
    zoomRecordingStatus: "pending"
  });

  // If candidate was reserved, re-engage them as 'interview scheduled'
  if (candidateExists.status === 'reserved') {
    await Candidate.findByIdAndUpdate(candidate, {
      status: 'interview scheduled',
      reserveReason: null,
      reserveNotes: null,
    });
  }

  // Intercept and send Email to Candidate and Judges
  // This executes independently so creating the interview doesn't fail if SMTP breaks
  sendInterviewEmail(candidateExists, judges, zoomDetails)
    .catch(err => console.error("Email dispatcher error:", err.message));

  return interview;
}

export const getInterviewByToken = async (token) => {
  const interview = await Interview.findOne({
    "judges.token": token
  })
  if (!interview) {
    throw new Error("Invalid token or expired token");
  }
  const judge = interview.judges.find(j => j.token === token);  // Find the judge associated with the token

  return {
    interviewId: interview._id,
    zoomJoinUrl: interview.zoomJoinUrl,    // Return the Zoom join URL for the interview
    judge,
  };
  // return interview;
}

export const submitFeedback = async ({ interviewId, token, userId, feedbackText, ratings }) => {
  let interview;
  let judge;

  // Normalize userId to string once (handles both ObjectId and plain string)
  const userIdStr = userId ? String(userId) : null;

  if (interviewId && userIdStr) {
    // Internal judge submitting from the interview detail page
    interview = await Interview.findById(interviewId);
    if (!interview) throw new Error('Interview not found');
    judge = interview.judges.find(j => String(j.user) === userIdStr);
    if (!judge) {
      // Admin/super_admin submitting feedback even if not listed as judge — allow it
      judge = { judgeType: 'internal', user: userId };
    }
  } else if (token) {
    // External judge identified by their unique token
    interview = await Interview.findOne({ 'judges.token': token });
    if (!interview) throw new Error('Invalid or expired token');
    judge = interview.judges.find(j => j.token === token);
  } else if (interviewId && !userIdStr) {
    throw new Error('User ID required for internal feedback submission');
  } else if (userIdStr) {
    // Fallback: find interview by judge userId (legacy path)
    interview = await Interview.findOne({ 'judges.user': userId });
    if (!interview) throw new Error('User is not assigned as a judge for any interview');
    judge = interview.judges.find(j => String(j.user) === userIdStr);
  } else {
    throw new Error('Either token or user ID must be provided');
  }

  const alreadySubmitted = interview.feedbacks?.find(f =>
    token ? f.token === token : String(f.user) === userIdStr
  );

  if (alreadySubmitted) throw new Error('Feedback already submitted');

  const totalScore = await calculateTotalScore(ratings);


  interview.feedbacks.push({
    judgeType: judge.judgeType || 'internal',
    user: judge.user,
    email: judge.email,
    token: judge.token,
    feedback: feedbackText,
    ratings,
    totalScore,
    submittedAt: new Date()
  });

  await interview.save();
  return 'Feedback submitted successfully';
}

export const getFeedbackForInterview = async (interviewId) => {

  const interview = await Interview.findById(interviewId);

  if (!interview) {
    throw new Error("Interview not found");
  }
  return interview.feedbacks;   // Return all feedbacks for the specified interview...
}

export const addHRRemark = async (interviewId, user, remark, feedbackIndex = 0) => {

  // 🔒 Only admin or super_admin
  if (!["admin", "super_admin"].includes(user.role)) {
    throw new Error("Only admin can add HR remark");
  }

  const interview = await Interview.findById(interviewId);
  if (!interview) throw new Error("Interview not found");

  // hrRemark belongs inside the feedbacks subdocument, not at interview root
  if (!interview.feedbacks || interview.feedbacks.length === 0) {
    throw new Error("No feedback found to add HR remark to");
  }

  // Default to the first feedback; caller can pass feedbackIndex for a specific one
  const feedback = interview.feedbacks[feedbackIndex];
  if (!feedback) throw new Error(`No feedback at index ${feedbackIndex}`);

  feedback.hrRemark = remark;

  await interview.save();

  return "HR remark added";
};

export const assignCPC = async (id, cpcFrom, cpcTo, user) => {     // super admin selecting cpc range
  if (user.role !== "super_admin") {
    throw new Error("Only super admin allowed");
  }

  const interview = await Interview.findById(id);
  if (!interview) throw new Error("Interview not found");
  if (!cpcFrom || !cpcTo) throw new Error("Both cpcFrom and cpcTo are required");

  // Both must be from the same category (AP, BP, DP, EP)
  const prefixFrom = cpcFrom.split("-")[0];
  const prefixTo   = cpcTo.split("-")[0];
  if (prefixFrom !== prefixTo) throw new Error("Both CPCs must be from the same category");

  const category = prefixFrom;
  const sectionKeys = Object.keys(CPC_MAP[category] || {});

  const fromIdx = sectionKeys.indexOf(cpcFrom);
  const toIdx   = sectionKeys.indexOf(cpcTo);
  if (fromIdx === -1) throw new Error(`${cpcFrom} is not a valid CPC`);
  if (toIdx   === -1) throw new Error(`${cpcTo} is not a valid CPC`);

  // Ensure from <= to
  const [startIdx, endIdx] = fromIdx <= toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
  const resolvedFrom = sectionKeys[startIdx];
  const resolvedTo   = sectionKeys[endIdx];

  const rangeLabel = resolvedFrom === resolvedTo ? resolvedFrom : `${resolvedFrom} to ${resolvedTo}`;

  interview.pricing = {
    cpc:      rangeLabel,   // human-readable label e.g. "AP-2 to AP-5"
    cpcFrom:  resolvedFrom,
    cpcTo:    resolvedTo,
    category,
    classCode: null,
    details:   null,
  };

  await interview.save();
  return "CPC range assigned";
};

/**
 * Returns the UNION of all class codes available across every CPC in the range.
 */
export const getClassOptions = async (id) => {
  const interview = await Interview.findById(id);
  if (!interview) throw new Error("Interview not found");
  if (!interview?.pricing?.cpcFrom) throw new Error("CPC range not assigned yet");

  const { cpcFrom, cpcTo, category } = interview.pricing;
  const sectionKeys = Object.keys(CPC_MAP[category] || {});
  const fromIdx = sectionKeys.indexOf(cpcFrom);
  const toIdx   = sectionKeys.indexOf(cpcTo);

  // Union all class codes in the range
  const allCodes = new Set();
  for (let i = fromIdx; i <= toIdx; i++) {
    const codes = CPC_MAP[category][sectionKeys[i]] || [];
    codes.forEach(c => allCodes.add(c));
  }
  return [...allCodes].sort();
};

export const selectClassCode = async (id, classCode, user) => {

  if (!["admin", "super_admin"].includes(user.role)) {
    throw new Error("Unauthorized");
  }

  const interview = await Interview.findById(id);
  if (!interview) {
    throw new Error("Interview not found");
  }

  if (!interview?.pricing?.cpcFrom) {
    throw new Error("CPC range not yet assigned to this interview");
  }

  // Build union of all class codes in the CPC range (same logic as getClassOptions)
  const { cpcFrom, cpcTo, category } = interview.pricing;
  const sectionKeys = Object.keys(CPC_MAP[category] || {});
  const fromIdx = sectionKeys.indexOf(cpcFrom);
  const toIdx   = sectionKeys.indexOf(cpcTo);

  if (fromIdx === -1 || toIdx === -1) {
    throw new Error("Invalid CPC range stored on interview");
  }

  const allAllowed = new Set();
  for (let i = fromIdx; i <= toIdx; i++) {
    (CPC_MAP[category][sectionKeys[i]] || []).forEach(c => allAllowed.add(c));
  }

  if (!allAllowed.has(classCode)) {
    throw new Error("classCode is not allowed within the assigned CPC range");
  }

  const details = CLASS_CODES[classCode];

  interview.pricing = {
    ...interview.pricing,
    classCode,
    details
  };

  await interview.save();

  return "Class code assigned";
};


export const addStudent = async (id, board, user) => {
  if (!["admin", "super_admin"].includes(user.role)) {
    throw new Error("Unauthorized");
  }

  const interview = await Interview.findById(id);
  if (!interview) throw new Error("Interview not found"); 

  if (!interview.students) {
    interview.students = [];
  }

  interview.students.push({ board });

  await interview.save();

  return "Student added";
};

export const getRecordingUrl = async (id, user) => {
  if (!["admin", "super_admin"].includes(user.role)) {
    throw new Error("Unauthorized");
  }

  const interview = await Interview.findById(id);
  if (!interview) throw new Error("Interview not found");
  
  if (interview.zoomRecordingStatus !== "available" || !interview.zoomRecordingUrl) {
    throw new Error("Recording is not available yet");
  }

  return { downloadUrl: interview.zoomRecordingUrl };
};

export const reserveCandidate = async (id, user, reason, notes = '') => {
  if (!["admin", "super_admin"].includes(user.role)) {
    throw new Error("Unauthorized");
  }

  if (!reason || !reason.trim()) {
    throw new Error('A reserve reason must be provided');
  }

  const interview = await Interview.findById(id);
  if (!interview) throw new Error("Interview not found");

  // 1. Store reason on interview
  interview.rejectionReason = reason;
  interview.rejectionNotes  = notes;
  interview.status = 'reserved';
  await interview.save();

  // 2. Mark candidate as reserved + store reason
  await Candidate.findByIdAndUpdate(interview.candidate, {
    status: 'reserved',
    reserveReason: reason,
    reserveNotes:  notes,
  });

  // 3. Clean up Zoom recording
  if (interview.zoomMeetingId && interview.zoomRecordingStatus !== 'deleted') {
    try {
      await deleteRecording(interview.zoomMeetingId);
    } catch (err) {
      console.error('Failed to delete recording on reserve:', err.message);
    }
    interview.zoomRecordingStatus = 'deleted';
    interview.zoomRecordingUrl = null;
    await interview.save();
  }

  return 'Candidate reserved';
};

export const updateInterviewStatus = async (id, status, user) => {
  if (!["admin", "super_admin"].includes(user?.role)) {
    throw new Error("Unauthorized");
  }
  
  const allowedStatuses = ["scheduled", "completed", "cancelled"];
  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid status type");
  }

  const interview = await Interview.findByIdAndUpdate(
    id, 
    { status }, 
    { new: true }
  );

  if (!interview) throw new Error("Interview not found");

  // When interview is completed → move candidate to "standby" (awaiting evaluation)
  if (status === "completed" && interview.candidate) {
    await Candidate.findByIdAndUpdate(interview.candidate, { status: "standby" });
  }

  // When interview is cancelled → revert candidate to "applied"
  if (status === "cancelled" && interview.candidate) {
    await Candidate.findByIdAndUpdate(interview.candidate, { status: "applied" });
  }
  
  return interview;
};

export const rescheduleInterview = async (id, scheduledAt, user) => {
  if (!["admin", "super_admin"].includes(user?.role)) {
    throw new Error("Unauthorized");
  }

  if (!scheduledAt) throw new Error("New date/time is required");

  const interview = await Interview.findById(id);
  if (!interview) throw new Error("Interview not found");

  if (!["scheduled", "cancelled"].includes(interview.status)) {
    throw new Error("Only scheduled or cancelled interviews can be rescheduled");
  }

  // Update scheduledAt in DB
  interview.scheduledAt = new Date(scheduledAt);
  interview.status = "scheduled"; // re-activates a cancelled interview too
  await interview.save();

  // Best-effort: update the Zoom meeting time (don't fail if Zoom is unavailable)
  if (interview.zoomMeetingId) {
    try {
      const { updateZoomMeeting } = await import("../../services/zoom.service.js");
      await updateZoomMeeting(interview.zoomMeetingId, scheduledAt);
    } catch (err) {
      console.error("Zoom reschedule failed (non-critical):", err.message);
    }
  }

  return interview;
};

// ─────────────────────────────────────────────────────────────────────────────
// LoA / Standby Workflow
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Admin saves class config as a draft (no LoA sent, no teacher created).
 * Admin can re-save multiple times before sending LoA.
 */
export const saveLoaConfig = async (id, configData, user) => {
  if (!["admin", "super_admin"].includes(user.role)) throw new Error("Unauthorized");

  const { classCode, classCodes, boards, classes, subjects, slots, regNo } = configData;
  if (!classCode) throw new Error("classCode is required");

  const interview = await Interview.findById(id);
  if (!interview) throw new Error("Interview not found");
  if (!['completed', 'loa_sent'].includes(interview.status)) {
    throw new Error("Interview must be completed before saving class config");
  }

  interview.loaConfig = { classCode, classCodes, boards, classes, subjects, slots, regNo, savedAt: new Date() };
  await interview.save();
  return "Class config saved";
};

/**
 * Admin sends the LoA PDF email immediately, moves interview → loa_sent,
 * candidate → standby. Teacher record is NOT created yet.
 */
export const sendLoaAndStandby = async (id, configData, user) => {
  if (!["admin", "super_admin"].includes(user.role)) throw new Error("Unauthorized");

  const { classCode, classCodes, boards, classes, subjects, slots, regNo } = configData;
  if (!classCode) throw new Error("classCode is required");

  const interview = await Interview.findById(id).populate('candidate');
  if (!interview) throw new Error("Interview not found");
  if (!['completed', 'loa_sent'].includes(interview.status)) {
    throw new Error("Interview must be completed to send LoA");
  }

  // Save config + mark times
  interview.loaConfig = {
    classCode, classCodes, boards, classes, subjects, slots, regNo,
    savedAt: interview.loaConfig?.savedAt || new Date(),
    loaSentAt: new Date(),
  };
  interview.status = 'loa_sent';
  await interview.save();

  // Candidate → standby
  await Candidate.findByIdAndUpdate(interview.candidate._id || interview.candidate, { status: 'standby' });

  // Generate LoA PDF + send email using teacher service (pass loaOnly: true to skip Teacher creation)
  // We call the full finalizeTeacher but it will bail out from creating Teacher
  // because we pass loaOnly flag — teacher.service handles this
  try {
    await _finalizeTeacher(id, { classCode, classCodes, boards, classes, subjects, slots, regNo, loaOnly: true });
  } catch (err) {
    console.error('LoA email failed (non-critical):', err.message);
  }

  return 'LoA sent — candidate is now in standby';
};

/**
 * Super admin confirms a standby candidate → creates the Teacher record.
 */
export const confirmStandby = async (id, user) => {
  if (user.role !== 'super_admin') throw new Error("Only super admin can confirm standby candidates");

  const interview = await Interview.findById(id);
  if (!interview) throw new Error("Interview not found");
  if (interview.status !== 'loa_sent') throw new Error("Interview is not in loa_sent status");

  const cfg = interview.loaConfig;
  if (!cfg?.classCode) throw new Error("No class config saved — cannot confirm");

  // Create teacher — status will be set to 'selected' inside finalizeTeacher
  await _finalizeTeacher(id, {
    classCode:  cfg.classCode,
    classCodes: cfg.classCodes,
    boards:     cfg.boards,
    classes:    cfg.classes,
    subjects:   cfg.subjects,
    slots:      cfg.slots,
    regNo:      cfg.regNo,
    skipLoaEmail: true,  // LoA was already emailed when LoA was sent
  });

  return 'Candidate confirmed as teacher';
};

/**
 * Super admin reserves a standby (post-LoA) candidate with a chosen reason.
 */
export const reserveStandbyCandidate = async (id, user, reason, notes = '') => {
  if (user.role !== 'super_admin') throw new Error("Only super admin can reserve standby candidates");
  if (!reason?.trim()) throw new Error('A reserve reason must be provided');

  const interview = await Interview.findById(id);
  if (!interview) throw new Error("Interview not found");
  if (interview.status !== 'loa_sent') throw new Error("This candidate is not in standby");

  interview.status = 'reserved';
  interview.rejectionReason = reason;
  interview.rejectionNotes = notes;
  await interview.save();

  await Candidate.findByIdAndUpdate(interview.candidate, {
    status: 'reserved',
    reserveReason: reason,
    reserveNotes:  notes,
  });

  return 'Standby candidate reserved';
};
