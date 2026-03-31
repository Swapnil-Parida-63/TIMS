import express from 'express';
import { loginController, register, googleLoginController } from './auth.controller.js';

const authRouter = express.Router();

authRouter.post('/login', loginController);
authRouter.post('/register', register);
authRouter.post('/google', googleLoginController); // Google OAuth token exchange

export default authRouter;