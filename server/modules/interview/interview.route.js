import express from 'express';
import {interview, joinInterview,giveFeedback} from './interview.controller.js';

const interviewRouter = express.Router();

interviewRouter.post('/', interview);
interviewRouter.get('/join', joinInterview);
interviewRouter.post('/feedback', giveFeedback);

export default interviewRouter;