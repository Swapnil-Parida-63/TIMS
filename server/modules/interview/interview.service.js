import Interview from "./interview.model.js";
import Candidate from "../candidate/candidate.model.js";
import { createZoomMeeting } from "../../services/zoom.service.js";
import { generateToken } from "../../utils/token.js";
import { calculateTotalScore } from "../../utils/score.js";
import { CLASS_CODES } from "../../config/classCodes.js";
import { CPC_MAP } from "../../config/cpcMap.js";
import mongoose from "mongoose";
import { sendInterviewEmail } from "../../services/email.service.js";

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
    zoomDetails = await createZoomMeeting({ scheduledAt });
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

  if (interviewId && userId) {
    // Internal judge submitting from the interview detail page
    interview = await Interview.findById(interviewId);
    if (!interview) throw new Error('Interview not found');
    judge = interview.judges.find(j => String(j.user) === String(userId));
    if (!judge) {
      // Admin/super_admin submitting feedback even if not listed as judge — allow it
      judge = { judgeType: 'internal', user: userId };
    }
  } else if (token) {
    // External judge identified by their unique token
    interview = await Interview.findOne({ 'judges.token': token });
    if (!interview) throw new Error('Invalid or expired token');
    judge = interview.judges.find(j => j.token === token);
  } else if (interviewId && !userId) {
    throw new Error('User ID required for internal feedback submission');
  } else if (userId) {
    // Fallback: find interview by judge userId (legacy path)
    interview = await Interview.findOne({ 'judges.user': userId });
    if (!interview) throw new Error('User is not assigned as a judge for any interview');
    judge = interview.judges.find(j => String(j.user) === String(userId));
  } else {
    throw new Error('Either token or user ID must be provided');
  }

  const alreadySubmitted = interview.feedbacks?.find(f =>
    token ? f.token === token : String(f.user) === String(userId)
  );
  if (alreadySubmitted) throw new Error('Feedback already submitted');

  const totalScore = calculateTotalScore(ratings);

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

  console.log("Incoming interviewId:", interviewId);

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

export const assignCPC = async (id, cpc, user) => {     // super admin selecting cpc
  if (user.role !== "super_admin") {
    throw new Error("Only super admin allowed");
  }

  const interview = await Interview.findById(id);

  if (!interview) throw new Error("Interview not found");

  if (!cpc) throw new Error("CPC is required");

  interview.pricing = {
    cpc,
    category: cpc[0],
    classCode: null,
    details: null
  };

  await interview.save();

  return "CPC assigned";
};

export const getClassOptions = async (id) => {
  const interview = await Interview.findById(id);

  if (!interview) {
    throw new Error("Interview not found");
  }

  if (!interview?.pricing?.cpc) {
    throw new Error("Not reviewed yet");
  }
  // console.log("CPC:", interview.pricing.cpc);
  // console.log("MAP VALUE:", CPC_MAP[interview.pricing.cpc]);

  const prefix = interview.pricing.cpc.split("-")[0];

  return CPC_MAP[prefix]?.[interview.pricing.cpc];


};

export const selectClassCode = async (id, classCode, user) => {

  if (!["admin", "super_admin"].includes(user.role)) {
    throw new Error("Unauthorized");
  }

  const interview = await Interview.findById(id);
  if (!interview) {
    throw new Error("Interview not found");
  }

  if (!interview?.pricing?.cpc) {
    throw new Error("Not reviewed yet");
  }

  const prefix = interview.pricing.cpc.split("-")[0];

  const allowed = CPC_MAP[prefix]?.[interview.pricing.cpc];

  if (!allowed) {
    throw new Error("Invalid CPC mapping");
  }

  if (!allowed.includes(classCode)) {
    throw new Error("Invalid class code");
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

import { deleteRecording } from "../../services/zoom.service.js";

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

export const rejectCandidate = async (id, user) => {
  if (!["admin", "super_admin"].includes(user.role)) {
    throw new Error("Unauthorized");
  }

  const interview = await Interview.findById(id);
  if (!interview) throw new Error("Interview not found");

  // 1. Mark candidate as rejected (lowercase to match enum + frontend Badge checks)
  await Candidate.findByIdAndUpdate(interview.candidate, { status: 'rejected' });

  // 2. Mark interview as cancelled
  interview.status = 'cancelled';
  await interview.save();

  // 3. Delete Zoom Recording if it exists
  if (interview.zoomMeetingId && interview.zoomRecordingStatus !== 'deleted') {
    try {
      await deleteRecording(interview.zoomMeetingId);
    } catch (err) {
      console.error('Failed to delete recording on reject:', err.message);
    }
    interview.zoomRecordingStatus = 'deleted';
    interview.zoomRecordingUrl = null;
    await interview.save();
  }

  return 'Candidate rejected';
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
  
  return interview;
};