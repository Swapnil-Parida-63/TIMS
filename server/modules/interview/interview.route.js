import express from 'express';
import {interview, joinInterview,giveFeedback, getFeedbacks, addHRRemark} from './interview.controller.js';
import {protect} from '../../middleware/auth.js';

const interviewRouter = express.Router();

interviewRouter.post('/', interview);
interviewRouter.get('/join', joinInterview);
interviewRouter.post('/feedback', giveFeedback);
interviewRouter.get('/:id/feedback', protect, getFeedbacks);
interviewRouter.post("/:id/hr-remark", protect, addHRRemark);
export default interviewRouter;