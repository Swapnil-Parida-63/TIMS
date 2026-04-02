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

// ── LoA HTML Row Builders (injected into template) ───────────────────────────

/** Builds a single fee row (rows 9-12) — shaded if isShaded is true */
function buildFeeRow(num, label, value, isShaded) {
  const bg = isShaded ? 'background:#D3DFEE;' : '';
  const color = isShaded ? 'color:black' : '';
  return `<tr>
  <td width=64 style='width:47.95pt;border-top:none;border-left:solid #7BA0CD 1.0pt;border-bottom:solid #7BA0CD 1.0pt;border-right:none;${bg}padding:0in 5.4pt 0in 5.4pt'>
    <p class=MsoNoSpacing align=center style='text-align:center'><span style='font-family:"Bahnschrift",sans-serif;${color}'>${num}</span></p>
  </td>
  <td width=255 style='width:191.35pt;border:none;border-bottom:solid #7BA0CD 1.0pt;${bg}padding:0in 5.4pt 0in 5.4pt'>
    <p class=MsoNoSpacing><b><span style='font-family:"Bahnschrift",sans-serif;${color}'>${label}</span></b></p>
  </td>
  <td width=346 style='width:259.45pt;border-top:none;border-left:none;border-bottom:solid #7BA0CD 1.0pt;border-right:solid #7BA0CD 1.0pt;${bg}padding:0in 5.4pt 0in 5.4pt'>
    <p class=MsoNoSpacing><b><span style='font-family:"Bahnschrift",sans-serif;${color}'>${value}</span></b></p>
  </td>
</tr>`;
}

/** Builds the Teacher MentR ID row with 3 sub-columns: Base ID | TMIDP | TMIDS */
function buildMentRIdRow(num, mentRBase, tmidP, tmidS) {
  return `<tr>
  <td width=64 style='width:47.95pt;border-top:none;border-left:solid #7BA0CD 1.0pt;border-bottom:solid #7BA0CD 1.0pt;border-right:none;background:#D3DFEE;padding:0in 5.4pt 0in 5.4pt'>
    <p class=MsoNoSpacing align=center style='text-align:center'><span style='font-family:"Bahnschrift",sans-serif;color:black'>${num}</span></p>
  </td>
  <td width=255 style='width:191.35pt;border:none;border-bottom:solid #7BA0CD 1.0pt;background:#D3DFEE;padding:0in 5.4pt 0in 5.4pt'>
    <p class=MsoNoSpacing><b><span style='font-family:"Bahnschrift",sans-serif;color:black'>Teacher MentR ID –</span></b></p>
  </td>
  <td width=346 style='width:259.45pt;border-top:none;border-left:none;border-bottom:solid #7BA0CD 1.0pt;border-right:solid #7BA0CD 1.0pt;background:#D3DFEE;padding:0in 5.4pt 0in 5.4pt'>
    <table style='width:100%;border-collapse:collapse;table-layout:fixed;'>
      <colgroup>
        <col style='width:28%;'>
        <col style='width:36%;'>
        <col style='width:36%;'>
      </colgroup>
      <tr>
        <td style='padding:2px 4px;vertical-align:top;'>
          <p style='margin:0;font-family:"Bahnschrift",sans-serif;font-size:9pt;word-break:break-all;'><b>MentR ID:</b><br/>${mentRBase}</p>
        </td>
        <td style='padding:2px 4px;vertical-align:top;border-left:1px solid #7BA0CD;'>
          <p style='margin:0;font-family:"Bahnschrift",sans-serif;font-size:9pt;word-break:break-all;'><b>TMIDP:</b><br/>${tmidP}</p>
        </td>
        <td style='padding:2px 4px;vertical-align:top;border-left:1px solid #7BA0CD;'>
          <p style='margin:0;font-family:"Bahnschrift",sans-serif;font-size:9pt;word-break:break-all;'><b>TMIDS:</b><br/>${tmidS}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

export const finalizeTeacher = async (interviewId, adminData = {}) => {
  const { classCode, classCodes, boards, classes, subjects, slots, serialNumber, regNo, loaOnly, skipLoaEmail } = adminData;

  // ── 1. Fetch & validate ──────────────────────────────────────────────────
  const interview = await Interview.findById(interviewId);
  if (!interview) throw new Error("Interview not found");

  // ── Guard: prevent duplicate finalization & double emails ────────────────
  // Allow re-entry if loaOnly (sending LoA for standby) or skipLoaEmail (confirming standby)
  if (interview.status === 'selected' && !loaOnly && !skipLoaEmail) {
    throw new Error("This interview has already been finalized. Confirmation email has already been sent.");
  }

  if (!classCode) throw new Error("classCode must be provided by Admin");
  const p = CLASS_CODES[classCode];
  if (!p) throw new Error("Invalid classCode provided");

  const candidate = await Candidate.findById(interview.candidate);
  if (!candidate) throw new Error("Candidate not found");

  // ── 2. Derive categories from ALL class codes ────────────────────────────
  const allCodes = classCodes
    ? classCodes.map(e => e.code).filter(Boolean)
    : [classCode];

  const hasP = allCodes.some(c => c.startsWith('A') || c.startsWith('B'));
  const hasS = allCodes.some(c => c.startsWith('D') || c.startsWith('E'));
  const category = (hasP && hasS) ? 'P & S' : hasP ? 'P' : 'S';

  let serialStr = serialNumber;
  if (!serialStr) {
    const count = await Teacher.countDocuments();
    serialStr = String(count + 1).padStart(3, '0');
  }

  const mentRBase = `MTBHA${serialStr}`;

  // ── Build TMIDP and TMIDS from assigned codes ─────────────────────────────
  const pCodes = allCodes.filter(c => c.startsWith('A') || c.startsWith('B'));
  const sCodes = allCodes.filter(c => c.startsWith('D') || c.startsWith('E'));

  // TMIDP = MTBHA{serial}A{nn}B{nn}
  let tmidP = 'NULL';
  if (pCodes.length > 0) {
    const aNums = pCodes.filter(c => c.startsWith('A')).map(c => c.split('-')[1].padStart(2, '0'));
    const bNums = pCodes.filter(c => c.startsWith('B')).map(c => c.split('-')[1].padStart(2, '0'));
    const aPart = aNums.length > 0 ? `A${aNums.join('A')}` : 'A00';
    const bPart = bNums.length > 0 ? `B${bNums.join('B')}` : 'B00';
    tmidP = `${mentRBase}${aPart}${bPart}`;
  }

  // TMIDS = MTBHA{serial}D{nn}E{nn}
  let tmidS = 'NULL';
  if (sCodes.length > 0) {
    const dNums = sCodes.filter(c => c.startsWith('D')).map(c => c.split('-')[1].padStart(2, '0'));
    const eNums = sCodes.filter(c => c.startsWith('E')).map(c => c.split('-')[1].padStart(2, '0'));
    const dPart = dNums.length > 0 ? `D${dNums.join('D')}` : 'D00';
    const ePart = eNums.length > 0 ? `E${eNums.join('E')}` : 'E00';
    tmidS = `${mentRBase}${dPart}${ePart}`;
  }

  // Legacy single-string ID (for backward compat / teacher record)
  const teacherMentRId = tmidP !== 'NULL' ? tmidP : tmidS;

  // ── 3. Create Teacher record (skip if loaOnly — we're just sending the LoA email) ────
  let teacher = null;
  if (!loaOnly) {
    teacher = await Teacher.create({
      candidate:    interview.candidate,
      cpc:          interview.pricing?.cpc || "N/A",
      category:     category,
      classCode:    classCode,
      classCodes:   classCodes
                      ? classCodes.map(e => ({ code: e.code, slots: Number(e.slots) || 1 }))
                      : [{ code: classCode, slots: slots || 1 }],
      classes:      classes || [],
      subjects:     subjects || [],
      slots:        slots || 1,
      serialNumber: serialStr,
      pricing:      p,
      students:     (boards || []).map(b => ({ board: b })),
      serviceLocation: candidate.serviceLocation || [],
    });
  }

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

  const boardsStr   = Array.isArray(boards)   ? boards.filter(Boolean).join(', ')   : (boards || '\u2014');
  const classesStr  = Array.isArray(classes)  ? classes.filter(Boolean).join(', ')  : (classes || '\u2014');
  const subjectsStr = Array.isArray(subjects) ? subjects.filter(Boolean).join(', ') : (subjects || '\u2014');

  // If multiple codes map to different slots, sum them up
  const ccs = classCodes || [{ code: classCode, slots: slots || 1 }];
  const totalSlots = ccs.reduce((acc, c) => acc + (Number(c.slots) || 1), 0);
  const slotsDisplay = ccs.length > 1 
    ? `${totalSlots} Slots (${ccs.map(c => `${c.code}: ${c.slots}`).join(', ')})`
    : `${totalSlots} Slots`;

  // ── Category display ──────────────────────────────────────────────────────
  let categoryDisplay = '';
  if (hasP && hasS) categoryDisplay = 'P - Primary & S - Secondary';
  else if (hasP)    categoryDisplay = 'P - Primary';
  else              categoryDisplay = 'S - Secondary';

  // ── Class category mapping (Row 6) — only relevant categories ─────────────
  const classCategoryParts = [];
  if (hasP) {
    const pLabels = pCodes.map(c => `${c.charAt(0)} - ${classesStr}`);
    classCategoryParts.push(...pLabels);
  }
  if (hasS) {
    const sLabels = sCodes.map(c => `${c.charAt(0)} - ${classesStr}`);
    classCategoryParts.push(...sLabels);
  }
  const classCategoryDisplay = classCategoryParts.join(', ');
  const classCategoryLabel = (hasP && hasS) ? 'P & S' : hasP ? 'P' : 'S';

  // ── Fee codes display (Row 7) — list all assigned codes ────────────────────
  const feeCodesDisplay = allCodes.join(', ');

  // ── Conditional fee rows HTML (Rows 9-12) ─────────────────────────────────
  // We build these as HTML and inject via {{feeRowsHtml}} placeholder.
  // Find the best P pricing and S pricing from assigned codes.
  const pPricing = pCodes.length > 0 ? CLASS_CODES[pCodes[0]] : null;
  const sPricing = sCodes.length > 0 ? CLASS_CODES[sCodes[0]] : null;

  let feeRowsHtml = '';
  let rowNum = 9;

  if (pPricing) {
    feeRowsHtml += buildFeeRow(rowNum++, 'Hourly Fees for P -', `Rs. ${pPricing.hourlyRate}`, true);
    feeRowsHtml += buildFeeRow(rowNum++, 'Half-Hourly Fees for P -', `Rs. ${pPricing.teacherExtra30}`, false);
  }
  if (sPricing) {
    feeRowsHtml += buildFeeRow(rowNum++, 'Hourly Fees for S -', `Rs. ${sPricing.hourlyRate}`, true);
    feeRowsHtml += buildFeeRow(rowNum++, 'Half-Hourly Fees for S -', `Rs. ${sPricing.teacherExtra30}`, false);
  }

  // ── Row 13: Teacher MentR ID — three columns ─────────────────────────────
  const mentRIdRowHtml = buildMentRIdRow(rowNum++, mentRBase, tmidP, tmidS);

  const data = {
    // Candidate info
    name: `${candidate.firstName} ${candidate.lastName}`,
    email: candidate.email,
    phone: candidate.phone,
    address: candidate.currentAddress || '\u2014',
    
    // Header
    refNo: `TM-${today.getFullYear()}-${serialStr}`,
    date: dateStr,
    regNo: regNo || '—',
    agreementDate: dateStr,

    // Row values
    boards: boardsStr,
    selectedClasses: classesStr,
    subjectsStr: subjectsStr,
    categoryDisplay: categoryDisplay,
    classCategoryDisplay: classCategoryDisplay,
    classCategoryLabel:   classCategoryLabel,
    feeCodesDisplay: feeCodesDisplay,

    // Pre-built HTML blocks (injected into template)
    feeRowsHtml: feeRowsHtml,
    mentRIdRowHtml: mentRIdRowHtml,

    teacherMentRId: teacherMentRId,
    preferredTimeSlots: '(M, A, E)',
    slots: slotsDisplay,
    slotRowNum: rowNum,        // dynamic row number for "Preferred Time Slots"
    avRowNum: rowNum + 1,      // dynamic row number for "Min. Assessment Visits"

    // Pricing (from primary class code)
    classCode: teacher ? teacher.classCode : classCode,
    cpc: teacher ? teacher.cpc : (interview.pricing?.cpc || "N/A"),
    category: teacher ? teacher.category : category,
    subjects: subjectsStr,
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
  const loaPath     = path.join(UPLOADS_DIR, `loa-${teacher?._id || interview.candidate}.pdf`);
  const earningPath = path.join(UPLOADS_DIR, `earning-${teacher?._id || interview.candidate}.pdf`);

  await generatePDF(loaHTML, loaPath);
  await generatePDF(earningHTML, earningPath);

  // ── 7. Send email with both PDFs attached (skip if confirming standby — already sent) ───
  if (!skipLoaEmail) {
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
  }

  // ── 8. Update statuses & cleanup ──────────────────────────────────────────
  if (!loaOnly) {
    // Only mark selected when actually creating the teacher record
    await Candidate.findByIdAndUpdate(interview.candidate, { status: 'selected' });
    interview.status = 'selected';
    await interview.save();
  }

  // Store LoA path on teacher if teacher was created
  if (teacher) {
    teacher.loaPath = loaPath;
    await teacher.save();
  }

  if (interview.zoomMeetingId && interview.zoomRecordingStatus !== 'deleted' && !loaOnly) {
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

  console.log(`✅ Teacher finalized: ${teacher?._id || 'LoA-only'} | Email ${skipLoaEmail ? 'skipped (already sent)' : `sent to: ${candidate.email}`}`);

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