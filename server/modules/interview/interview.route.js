import express from 'express';
import {interview} from './interview.controller.js';

const interviewRouter = express.Router();

interviewRouter.post('/', interview);

export default interviewRouter;