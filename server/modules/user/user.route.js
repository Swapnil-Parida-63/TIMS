import express from 'express';
import { protect } from '../../middleware/auth.js';
import User from './user.model.js';

const userRouter = express.Router();

// GET /api/users — list all judges (admin+)
userRouter.get('/', protect, async (req, res) => {
  try {
    const { role } = req.user;
    if (!['super_admin', 'admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/users — create a new user/judge (super_admin only)
userRouter.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only super_admin can create users' });
    }
    const bcrypt = await import('bcrypt');
    const { name, email, password, role, phone } = req.body;
    const hashed = await bcrypt.default.hash(password || 'TheMentR@2024', 10);
    const user = await User.create({ name, email, password: hashed, role, phone: phone || null });
    const { password: _, ...safe } = user.toObject();
    res.status(201).json({ success: true, data: safe });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/users/:id/role — promote/demote (super_admin only)
userRouter.patch('/:id/role', protect, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only super_admin can change roles' });
    }
    const { role } = req.body;
    const allowed = ['admin', 'panelist'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ success: false, message: `Role must be one of: ${allowed.join(', ')}` });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/:id — remove user (super_admin only)
userRouter.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Only super_admin can delete users' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User removed' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default userRouter;
