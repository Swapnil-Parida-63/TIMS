import Interview from "./interview.model.js";
import Candidate from "../candidate/candidate.model.js";
import { createZoomMeeting } from "../../services/zoom.service.js";
import { generateToken } from "../../utils/token.js";
import { calculateTotalScore } from "../../utils/score.js";
import { CLASS_CODES } from "../../config/classCodes.js";
import { CPC_MAP } from "../../config/cpcMap.js";

export const createInterview = async (data) => {          //create interview function which takes the interview details as input and creates an interview document in the database, it also creates a Zoom meeting and saves the meeting details in the interview document.
  const  {scheduledAt, candidate, judges} = data;

  // const ZoomDetails = await createZoomMeeting({scheduledAt}); // Create Zoom meeting and get details

//   try {
//   const zoomDetails = await createZoomMeeting({scheduledAt}); // Create Zoom meeting and get details
// } catch (err) {
//   console.log(err.response?.data || err.message);
// }

  const zoomDetails = {
  meetingId: "dummy123",
  joinUrl: "https://zoom.us/dummy"  // Dummy data for testing without actual Zoom integration
};

 //Get required details
   if (!scheduledAt || !candidate ){
    throw new Error("Missing required fields: scheduledAt, candidate");
   } 

  //Candidate existence check
  const candidateExists = await Candidate.findById(candidate);
  if (!candidateExists) {
    throw new Error("Candidate not found");
  }

  //Validate judges
  // for clarity the internal judges are "Externals who are also employees or not temporary and have their account created and info saved in the db, the external judges are "Externals" whoa are guests and, not a permanent member and don't have an account hence no info saved int to the db.
  if(judges && judges.length > 0){
    for (const judge of judges){
      if (judge.judgeType === "internal" && !judge.user){
        throw new Error("Internal judge must have a user ID"); // Ensuring internal judges have a user ID
      }

       if (judge.judgeType === "external" && judge.email != null && !judge.token){ 
        judge.token = generateToken(); // Generating token for external judges if email is provided but token is missing
      }

       if (judge.judgeType === "external" && !judge.email){
        throw new Error("External judge must have an email"); // Ensuring external judges have an email
      }
      else if (!["internal", "external"].includes(judge.judgeType)) {
        throw new Error("Invalid judge type");         // Ensuring judge type is either internal or external
}
    }

  };
 

  const interview = await Interview.create({
            ...data,
        zoomMeetingId: zoomDetails.meetingId,    // Saving Zoom meeting details in the interview document
        zoomJoinUrl: zoomDetails.joinUrl,
  });
  return interview;
}

  export const getInterviewByToken = async (token) => {
      const interview = await Interview. findOne({
        "judges.token": token
      })
      if (!interview){
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

 export const submitFeedback = async ({token, userId, feedbackText, ratings}) => {
         let interview;
         let judge;
         if (token){           //Case one: Judge is an external judge and will be identified by the token
          interview = await Interview.findOne({
            "judges.token": token
          });
          if(!interview){
            throw new Error("Invalid token");
          }
             judge = interview.judges.find(j => j.token === token);  // Find the judge associated with the token
         }
         else if (user){   //Case two: Judge is an internal judge and will be identified by the user ID
          interview = await Interview.findOne({
            "judges.user": userId
          });
          if(!interview){
            throw new Error("User is not assigned as a judge for any interview");
          }
           judge = interview.judges.find(j => String(j.user) === String(user));  // Find the judge associated with the user ID
         }
         else {
          throw new Error("Either token or user ID must be provided");
         }

         const alreadySubmitted = interview.feedbacks?.find(f =>        // Check if feedback has already been submitted by this judge
            token ? f.token === token : String(f.user) === String(user)
          );
          if (alreadySubmitted){
            throw new Error("Feedback already submitted");
          }
     const totalScore = calculateTotalScore(ratings);
     
            interview.feedbacks.push({         // Push feedback into the interview document's feedbacks array
            judgeType: judge.judgeType,
            user: judge.user,
            email: judge.email,
            token: judge.token,
            feedback: feedbackText,
            ratings,
            totalScore,
            submittedAt: new Date()
            });

            await interview.save();

            return "Feedback submitted successfully";
  }
 
        export const getFeedbackForInterview = async (interviewId) => {

          const interview = await Interview.findById(interviewId);

          console.log("Incoming interviewId:", interviewId);

          if (!interview){
            throw new Error("Interview not found");
          }
            return interview.feedbacks;   // Return all feedbacks for the specified interview...
          } 
    
export const addHRRemark = async (interviewId, user, remark) => {

          // 🔒 Only admin
          if (user.role !== "admin") {
            throw new Error("Only admin can add HR remark");
          }

          const interview = await Interview.findById(interviewId);
          if (!interview) throw new Error("Interview not found");

          interview.hrRemark = remark;

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

    const prefix = interview.pricing.cpc.slice(0, 2);

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

  const prefix = interview.pricing.cpc.slice(0, 2);

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