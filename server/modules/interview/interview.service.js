import Interview from "./interview.model.js";
import Candidate from "../candidate/candidate.model.js";
import { createZoomMeeting } from "../../services/zoom.service.js";

export const createInterview = async (data) => {
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

      else if (judge.judgeType === "external" && !judge.email){
        throw new Error("External judge must have an email"); // Ensuring external judges have an email
      }
      else if (!["internal", "external"].includes(judge.judgeType)) {
        throw new Error("Invalid judge type");              // Ensuring judge type is either internal or external
}
    }

  }

  const interview = await Interview.create({
            ...data,
        zoomMeetingId: zoomDetails.meetingId,  // Saving Zoom meeting details in the interview document
        zoomJoinUrl: zoomDetails.joinUrl,
  });
  return interview;
}