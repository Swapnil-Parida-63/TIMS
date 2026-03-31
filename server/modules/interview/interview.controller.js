import Interview from './interview.model.js';
import * as interviewService from './interview.service.js';

export const getInterviews = async (req, res) => {
  try {
    const interviews = await interviewService.getInterviews();
    res.json({ success: true, data: interviews });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const testZoom = async (req, res) => {
  try {
    const { getZoomAccessToken } = await import('../../services/zoom.service.js');
    const token = await getZoomAccessToken();
    res.json({ success: true, message: 'Zoom credentials are valid ✓', tokenPreview: token.slice(0, 20) + '...' });
  } catch (err) {
    const detail = err.response?.data || err.message;
    res.status(400).json({ success: false, message: 'Zoom credential check failed', detail });
  }
};

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
      const token = req.query.token || req.body.token;
      const { feedback, ratings, interviewId } = req.body;
      const userId = req.user?._id;  // internal users — set by protect middleware

      const result = await interviewService.submitFeedback({
        interviewId,
        token,
        userId,
        feedbackText: feedback,
        ratings
      });
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

export const assignCPC = async (req, res) => {
  try {
    const { id } = req.params;
    const { cpc } = req.body;
    const user = req.user;

    const result = await interviewService.assignCPC(id, cpc, user);

    res.json({ success: true, message: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getClassOptions = async (req, res) => {
  try {
    const { id } = req.params;

    const options = await interviewService.getClassOptions(id); // this will go and get the class options for the id we provide here from req.params

    res.status(200).json({
      success: true,
      data: options
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const selectClassCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { classCode } = req.body;
    const user = req.user;

    const result = await interviewService.selectClassCode(id, classCode, user);

    res.json({ success: true, message: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};


export const addStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { board } = req.body;

    const result = await interviewService.addStudent(id, board, req.user);

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

export const getRecording = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await interviewService.getRecordingUrl(id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const rejectCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await interviewService.rejectCandidate(id, req.user);
    res.json({ success: true, message: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateInterviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const interview = await interviewService.updateInterviewStatus(id, status, req.user);
    res.json({ success: true, data: interview });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};