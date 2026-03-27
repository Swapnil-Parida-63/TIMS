import express from 'express';
import {interview, joinInterview,giveFeedback, getFeedbacks, addHRRemark, assignCPC, getClassOptions,   selectClassCode, addStudent} from './interview.controller.js';
import {protect} from '../../middleware/auth.js';

const interviewRouter = express.Router();

interviewRouter.post('/', interview);
interviewRouter.get('/join', joinInterview);
interviewRouter.post('/feedback', giveFeedback);
interviewRouter.get('/:id/feedback', protect, getFeedbacks);
interviewRouter.post("/:id/hr-remark", protect, addHRRemark);
interviewRouter.patch("/:id/cpc", protect, assignCPC);
interviewRouter.get("/:id/class-options", protect, getClassOptions);
interviewRouter.patch("/:id/class-code", protect, selectClassCode);
interviewRouter.patch("/:id/add-student", protect, addStudent);
export default interviewRouter;