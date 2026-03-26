import express from 'express';
import { loginController, register } from './auth.controller.js';

const authRouter = express.Router();

authRouter.post('/login', loginController);
authRouter.post("/register", register);

export default authRouter;