import express from 'express';
import {createCandidate} from './candidate.controller.js';

const candidateRouter = express.Router();


candidateRouter.post('/', createCandidate);


export default candidateRouter;