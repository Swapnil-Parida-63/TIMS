import * as authService from './auth.service.js';

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login(email, password);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/auth/google
// Body: { credential: "<Google ID token from frontend>" }
export const googleLoginController = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required.' });
    }
    const data = await authService.googleLogin(credential);
    res.status(200).json({ success: true, data });
  } catch (error) {
    // 403 for whitelist failures, 401 for bad tokens
    const status = error.message.includes('Access denied') ? 403
      : error.message.includes('verification failed') ? 401
      : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};