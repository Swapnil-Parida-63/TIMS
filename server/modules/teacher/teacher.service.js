import path from 'path';
import { fileURLToPath } from 'url';
import Teacher from "./teacher.model.js";
import Interview from "../interview/interview.model.js";
import Candidate from "../candidate/candidate.model.js";
import { loadTemplate } from "../../utils/templateLoader.js";
import { generatePDF } from "../../services/pdf.service.js";
import { sendEmailWithAttachments } from "../../services/email.service.js";
import { CLASS_CODES } from "../../config/classCodes.js";
import { deleteRecording } from "../../services/zoom.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

export const getTeachers = async () => {
  return await Teacher.find({}).populate('candidate').sort({ createdAt: -1 });
};

export const finalizeTeacher = async (interviewId, adminData = {}) => {
  const { classCode, boards, classes, slots, serialNumber } = adminData;

  // ── 1. Fetch & validate ──────────────────────────────────────────────────
  const interview = await Interview.findById(interviewId);
  if (!interview) throw new Error("Interview not found");

  // ── Guard: prevent duplicate finalization & double emails ────────────────
  if (interview.status === 'selected') {
    throw new Error("This interview has already been finalized. Confirmation email has already been sent.");
  }

  if (!classCode) throw new Error("classCode must be provided by Admin");
  const p = CLASS_CODES[classCode];
  if (!p) throw new Error("Invalid classCode provided");

  const candidate = await Candidate.findById(interview.candidate);
  if (!candidate) throw new Error("Candidate not found");


  // ── 2. Derive logic & MENTR ID ──────────────────────────────────────────
  const category = (classCode.startsWith('A') || classCode.startsWith('B')) ? 'P' : 'S';

  let serialStr = serialNumber;
  if (!serialStr) {
    const count = await Teacher.countDocuments();
    serialStr = String(count + 1).padStart(3, '0');
  }

  let classMapping = '';
  if (category === 'P') {
    if (classCode.startsWith('A')) {
      classMapping = `A${classCode.split('-')[1].padStart(2, '0')}B00`;
    } else {
      classMapping = `A00B${classCode.split('-')[1].padStart(2, '0')}`;
    }
  } else {
    // category S (D or E)
    if (classCode.startsWith('D')) {
      classMapping = `D${classCode.split('-')[1].padStart(2, '0')}E00`;
    } else {
      classMapping = `D00E${classCode.split('-')[1].padStart(2, '0')}`;
    }
  }
  const teacherMentRId = `MTBHA${serialStr}${category}${classMapping}`;

  // ── 3. Create Teacher record ─────────────────────────────────────────────
  const teacher = await Teacher.create({
    candidate: interview.candidate,
    cpc: interview.pricing?.cpc || "N/A",
    category: category,
    classCode: classCode,
    classes: classes || [],
    slots: slots || 1,
    serialNumber: serialStr,
    pricing: p,
    students: (boards || []).map(b => ({ board: b }))
  });

  // ── 4. Build template data ──────────────────────────────────────────────
  const studentCount = Number(slots) || 1;
  const fullAmount = p.hourlyRate * 20;
  const halfAmount = p.teacherExtra30 * 5;
  const total = fullAmount + halfAmount;
  const grandTotal = total * studentCount;
  const maxTotal = total * 10;
  const maxFullAmount = p.hourlyRate * 20 * 10;
  const maxHalfAmount = p.teacherExtra30 * 5 * 10;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  const boardsStr = Array.isArray(boards) ? boards.join(', ') : (boards || '—');
  const classesStr = Array.isArray(classes) ? classes.join(', ') : (classes || '—');

  const data = {
    // Candidate info
    name: `${candidate.firstName} ${candidate.lastName}`,
    email: candidate.email,
    phone: candidate.phone,
    address: candidate.currentAddress || '—',
    
    // Header
    refNo: `TM-${today.getFullYear()}-${serialStr}`,
    date: dateStr,
    regNo: '051315',
    agreementDate: '01.04.2026',

    // Row Logic Overrides
    boards: boardsStr,
    selectedClasses: classesStr,
    categoryDisplay: category === 'P' ? 'P - Primary' : 'S - Secondary',
    classCodeMapping: `${classCode.charAt(0)} - ${classesStr}`,
    teacherMentRId: teacherMentRId,
    preferredTimeSlots: 'Flexible (M, A, E)',
    slots: studentCount,

    // Pricing
    classCode: teacher.classCode,
    cpc: teacher.cpc,
    category: teacher.category,
    subjects: p.subjects,
    minClasses: p.minClasses,
    hourlyRate: p.hourlyRate,
    halfRate: p.teacherExtra30,
    parentMonthly: p.parentMonthly,

    // Earning calculations (per student)
    fullAmount: fullAmount.toLocaleString('en-IN'),
    halfAmount: halfAmount.toLocaleString('en-IN'),
    total: total.toLocaleString('en-IN'),

    // Multi-student totals
    studentCount: studentCount,
    grandFullAmount: (fullAmount * studentCount).toLocaleString('en-IN'),
    grandHalfAmount: (halfAmount * studentCount).toLocaleString('en-IN'),
    grandTotal: grandTotal.toLocaleString('en-IN'),

    // Projection (10 students)
    maxStudentCount: 10,
    maxSlotsOpted: 10,
    totalSlots: 11,
    maxFullAmount: maxFullAmount.toLocaleString('en-IN'),
    maxHalfAmount: maxHalfAmount.toLocaleString('en-IN'),
    maxTotal: maxTotal.toLocaleString('en-IN'),

    // Assessment visits
    minAV: p.minAV || p.minAssessmentVisits || 1,
  };

  // ── 5. Render HTML templates ────────────────────────────────────────────
  const loaHTML      = await loadTemplate('loaTemplate.html', data);
  const earningHTML  = await loadTemplate('earningTemplate.html', data);

  // ── 6. Generate PDFs ────────────────────────────────────────────────────
  const loaPath     = path.join(UPLOADS_DIR, `loa-${teacher._id}.pdf`);
  const earningPath = path.join(UPLOADS_DIR, `earning-${teacher._id}.pdf`);

  await generatePDF(loaHTML, loaPath);
  await generatePDF(earningHTML, earningPath);

  // ── 7. Send email with both PDFs attached ───────────────────────────────
  await sendEmailWithAttachments({
    to:      candidate.email,
    subject: `Selection Confirmation — Letter of Agreement & Earning Structure | TheMentR`,
    text: `Dear ${candidate.firstName},\n\nCongratulations! You have been selected as a Teacher Partner with TheMentR (BUDIN Candor Pvt. Ltd.).\n\nPlease find attached:\n1. Letter of Agreement (LoA) — Provisional\n2. Earning Structure\n\nKindly review the documents and reach out to us if you have any questions.\n\nBest regards,\nHR Department\nBUDIN Candor Pvt. Ltd. (For TheMentR)`,
    html: `
      <p>Dear <strong>${candidate.firstName}</strong>,</p>
      <p>Congratulations! You have been selected as a <strong>Teacher Partner</strong> with TheMentR (BUDIN Candor Pvt. Ltd.).</p>
      <p>Please find attached:</p>
      <ol>
        <li><strong>Letter of Agreement (LoA)</strong> — Provisional</li>
        <li><strong>Earning Structure</strong></li>
      </ol>
      <p>Kindly review the documents and reach out to us if you have any questions.</p>
      <br/>
      <p>Best regards,<br/><strong>HR Department</strong><br/>BUDIN Candor Pvt. Ltd. (For TheMentR)</p>
    `,
    attachments: [
      { filename: 'LetterOfAgreement.pdf',   path: loaPath      },
      { filename: 'EarningStructure.pdf',     path: earningPath  }
    ]
  });

  // ── 8. Update candidate status, interview status & Delete Recording ─────────
  await Candidate.findByIdAndUpdate(interview.candidate, { status: 'selected' });

  // Mark interview as 'selected' so UI hides the class config panel
  interview.status = 'selected';
  await interview.save();

  // Store the LoA path on the teacher record for later retrieval
  teacher.loaPath = loaPath;
  await teacher.save();

  if (interview.zoomMeetingId && interview.zoomRecordingStatus !== 'deleted') {
    try {
      await deleteRecording(interview.zoomMeetingId);
      console.log(`✅ Zoom recording deleted for selected candidate: ${candidate.email}`);
    } catch (err) {
      console.error(`❌ Failed to delete Zoom recording for ${candidate.email}:`, err.message);
    }
    interview.zoomRecordingStatus = 'deleted';
    interview.zoomRecordingUrl = null;
    await interview.save();
  }

  console.log(`✅ Teacher finalized: ${teacher._id} | Email sent to: ${candidate.email}`);

  return teacher;
};

/**
 * Permanently deletes a Teacher record.
 * - Deletes the stored LoA PDF from disk.
 * - Resets the linked candidate's status back to 'applied' so they can re-enter the pipeline.
 * - Only super_admin can perform this action.
 */
export const deleteTeacher = async (teacherId, user) => {
  if (!['admin', 'super_admin'].includes(user?.role)) {
    throw new Error('Unauthorized — only admin or super_admin can delete teachers');
  }

  const teacher = await Teacher.findById(teacherId).populate('candidate');
  if (!teacher) throw new Error('Teacher not found');

  const candidateName = teacher.candidate
    ? `${teacher.candidate.firstName} ${teacher.candidate.lastName}`
    : 'Unknown';

  // Delete stored LoA PDF if it exists
  if (teacher.loaPath) {
    try {
      const fs = await import('fs/promises');
      await fs.default.unlink(teacher.loaPath);
      console.log(`🗑️ LoA PDF deleted: ${teacher.loaPath}`);
    } catch (e) {
      console.error('Could not delete LoA PDF:', e.message);
    }
  }

  // Reset candidate status back to 'applied' so they can be re-interviewed if needed
  if (teacher.candidate?._id) {
    await Candidate.findByIdAndUpdate(teacher.candidate._id, { status: 'applied' });
  }

  await teacher.deleteOne();
  return `Teacher "${candidateName}" permanently removed. Candidate status reset to 'applied'.`;
};