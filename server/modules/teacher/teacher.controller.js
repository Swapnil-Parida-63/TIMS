import * as teacherService from "./teacher.service.js";
import Teacher from "./teacher.model.js";
import fs from 'fs';
import jwt from 'jsonwebtoken';

export const getTeachers = async (req, res) => {
  try {
    const teachers = await teacherService.getTeachers();
    res.json({ success: true, data: teachers });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const finalizeTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const adminData = req.body;
    const teacher = await teacherService.finalizeTeacher(id, adminData);
    res.json({ success: true, data: teacher });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * GET /teacher/:id/loa?token=<jwt>
 * Streams the stored LoA PDF for inline browser viewing.
 * Accepts token via query param because anchor hrefs can't set Authorization headers.
 */
export const getTeacherLoA = async (req, res) => {
  try {
    // Verify auth — either from protect middleware (req.user) or via ?token= query param
    if (!req.user) {
      const qToken = req.query.token;
      if (!qToken) return res.status(401).json({ success: false, message: 'Unauthorized' });
      try {
        jwt.verify(qToken, process.env.JWT_SECRET);
      } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }
    }

    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });
    if (!teacher.loaPath) return res.status(404).json({ success: false, message: 'LoA not generated yet' });
    if (!fs.existsSync(teacher.loaPath)) return res.status(404).json({ success: false, message: 'LoA file missing on disk' });

    const fileName = `LoA-${teacher.serialNumber || teacher._id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    fs.createReadStream(teacher.loaPath).pipe(res);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const message = await teacherService.deleteTeacher(req.params.id, req.user);
    res.json({ success: true, message });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};