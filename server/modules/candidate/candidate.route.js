import express from 'express';
import {createCandidate} from './candidate.controller.js';

const router = express.Router();


router.post('/', createCandidate);


export default router;