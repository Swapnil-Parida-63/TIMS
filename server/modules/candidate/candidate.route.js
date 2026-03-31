import express from 'express';
import { createCandidate, getCandidates, getCandidateById, updateCandidate, deleteCandidate, getDeletedLog } from './candidate.controller.js';
import { protect } from '../../middleware/auth.js';

const candidateRouter = express.Router();

candidateRouter.post('/', createCandidate);
candidateRouter.get('/', protect, getCandidates);
candidateRouter.get('/deleted-log', protect, getDeletedLog);  // admin: view deletion audit log
candidateRouter.get('/:id', protect, getCandidateById);
candidateRouter.patch('/:id', protect, updateCandidate);
candidateRouter.delete('/:id', protect, deleteCandidate);

export default candidateRouter;