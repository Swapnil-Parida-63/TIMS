import User from '../user/user.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// ─── Password login (kept for seeded admin accounts) ─────────────────────────

export const login = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new Error('User not found. Contact super admin to get access.');
  if (!user.password) throw new Error('This account uses Google Sign-In. Please use the Google button.');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  const token = signToken(user);
  return { token, user };
};

export const registerUser = async (data) => {
  const { email, password, role, name } = data;
  const hashed = password ? await bcrypt.hash(password, 10) : null;
  const user = await User.create({ email: email.toLowerCase().trim(), password: hashed, role, name });
  return user;
};

// ─── Google OAuth login ───────────────────────────────────────────────────────

export const googleLogin = async (credential) => {
  // 1. Verify the Google ID token — throws if expired/tampered/wrong audience
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    throw new Error(`Google token verification failed: ${err.message}`);
  }

  const { email, name, picture, email_verified } = payload;

  // 2. Reject unverified Google accounts
  if (!email_verified) {
    throw new Error('Your Google account email is not verified.');
  }

  // 3. Whitelist check — ONLY existing users in DB may log in
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new Error(
      'Access denied. Your Google account is not registered in the system. Contact the super admin.'
    );
  }

  // 4. Keep profile info fresh (non-destructive update)
  if (name && user.name !== name) user.name = name;
  if (picture && user.picture !== picture) user.picture = picture;
  await user.save();

  // 5. Issue JWT (same shape as password login — frontend is unchanged)
  const token = signToken(user);
  return { token, user };
};