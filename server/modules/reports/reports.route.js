import express from 'express';
import { protect } from '../../middleware/auth.js';
import { getReport } from './reports.controller.js';

const router = express.Router();

// Only admins and super_admins can access reports
router.use(protect);

router.get('/', getReport);

export default router;
