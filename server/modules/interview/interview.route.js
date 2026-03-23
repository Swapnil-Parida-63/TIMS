import express from 'express';
import {interview, joinInterview} from './interview.controller.js';

const interviewRouter = express.Router();

interviewRouter.post('/', interview);
interviewRouter.get('/join', joinInterview);

export default interviewRouter;