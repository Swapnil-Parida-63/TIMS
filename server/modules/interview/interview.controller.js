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