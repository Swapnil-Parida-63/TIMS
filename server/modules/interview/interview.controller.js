import * as interviewService from './interview.service.js';

export const interview = async (req, res) => {
  
  try{
    const interview = await interviewService.createInterview(req.body);
     res.status(201).json({
      success: true,
      data: interview
     })
      console.log("Interview created successfully:", interview);
  }
  catch (error){
    res.status(400).json({
      success: false,
      message: error.message
    });
   console.log("Error creating interview:", error);
  }
  
}

export const joinInterview = async (req, res) => {
     try{
      const { token } = req.query;
            if (!token) {
              return res.status(400).json({ 
                success: false, 
                message: "Token is required" });
            }
      const interview = await interviewService.getInterviewByToken(token);
            res.status(200).json({
              success: true,
              data: interview
            });
     }
     catch (error){
      res.status(400).json({
        success: false,
        message: error.message
      });
     }
}

export const giveFeedback = async (req, res) => {
    try {
      let feedbackText;
      const token = req.query.token || req.body.token; // Accept token from query parameters or request body
      const {feedback } = req.body;
      feedbackText = feedback;
      const userId = req.user?._id;  // 🔥 internal (from JWT)

      const { ratings } = req.body;

      const result = await interviewService.submitFeedback({ token, userId, feedbackText, ratings });
      res.status(200).json({
        success: true,
        message: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
}

export const getFeedbacks = async (req, res) => {
  try {
    // const {role} = req.query; // Get the role of the user from query parameters (or you can get it from the authenticated user object if using authentication middleware)
    const {id} = req.params;
    const user = req.user;
    // Only allow access to feedback if the user is an admin or Suuuuuuuuperr admin
    if (!["admin", "super_admin"].includes(user.role)){
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions to view feedback."
      });
     }
     const feedbacks = await interviewService.getFeedbackForInterview(id);
     res.status(200).json({
      success: true,
      data: feedbacks
     });
  }
    catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
}

export const addHRRemark = async (req, res) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;

    const result = await interviewService.addHRRemark(
      id,
      req.user,
      remark
    );

    res.json({
      success: true,
      message: result
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};