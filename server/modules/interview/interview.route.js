import express from 'express';
import {interview, getInterviews, joinInterview,giveFeedback, getFeedbacks, addHRRemark, assignCPC, getClassOptions, selectClassCode, addStudent, getRecording, rejectCandidate, updateInterviewStatus, testZoom} from './interview.controller.js';
import {protect, softProtect} from '../../middleware/auth.js';

const interviewRouter = express.Router();

interviewRouter.get('/', protect, getInterviews);
interviewRouter.post('/', protect, interview);
interviewRouter.get('/test-zoom', protect, testZoom);
interviewRouter.get('/join', joinInterview);
interviewRouter.post('/feedback', softProtect, giveFeedback);
interviewRouter.get('/:id/feedback', protect, getFeedbacks);
interviewRouter.post("/:id/hr-remark", protect, addHRRemark);
interviewRouter.patch("/:id/cpc", protect, assignCPC);
interviewRouter.get("/:id/class-options", protect, getClassOptions);
interviewRouter.patch("/:id/class-code", protect, selectClassCode);
interviewRouter.patch("/:id/add-student", protect, addStudent);
interviewRouter.get("/:id/recording", protect, getRecording);
interviewRouter.post("/:id/reject", protect, rejectCandidate);
interviewRouter.patch("/:id/status", protect, updateInterviewStatus);

export default interviewRouter;