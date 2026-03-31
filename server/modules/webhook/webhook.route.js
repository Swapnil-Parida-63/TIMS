import express from 'express';
import { handleGoogleFormWebhook } from './webhook.controller.js';

const webhookRouter = express.Router();

webhookRouter.post('/google-form', handleGoogleFormWebhook);

export default webhookRouter;
