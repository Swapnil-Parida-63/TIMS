import Interview from "./interview.model.js";
import Candidate from "../candidate/candidate.model.js";
import { createZoomMeeting } from "../../services/zoom.service.js";
import { generateToken } from "../../utils/token.js";

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