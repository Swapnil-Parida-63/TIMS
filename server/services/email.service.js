import nodemailer from "nodemailer";

// ── Singleton transporter — created once, reused for all emails ───────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS  // Must be a Gmail App Password, not your regular password
  }
});

/**
 * Sends an email with file attachments using Gmail SMTP.
 * Requires EMAIL_USER and EMAIL_PASS (App Password) in .env
 */
export const sendEmailWithAttachments = async ({
  to,
  subject,
  text,
  html,
  attachments = []
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"TheMentR HR" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
      attachments
    });
    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (err) {
    console.error("Email sending failed:", err.message);
    throw err;
  }
};

/**
 * Sends interview schedule email to Candidate and Judges
 */
export const sendInterviewEmail = async (candidate, judges, meetingDetails) => {
  const dateObj = new Date(meetingDetails.scheduledAt);
  const formattedDate = dateObj.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  try {
    // 1. Email to Candidate
    if (candidate && candidate.email) {
      await transporter.sendMail({
        from: `"TheMentR HR" <${process.env.EMAIL_USER}>`,
        to: candidate.email,
        subject: `Interview Scheduled – ${formattedDate}`,
        html: `
          <h3>Interview Invitation</h3>
          <p>Dear ${candidate.firstName},</p>
          <p>Your interview has been officially scheduled for <strong>${formattedDate}</strong>.</p>
          <p><strong>Join Link:</strong> <a href="${meetingDetails.joinUrl}">${meetingDetails.joinUrl}</a></p>
          <p>Please join 5 minutes early and ensure your camera/microphone are working properly.</p>
          <br/>
          <p>Best regards,<br/>HR Department<br/>TheMentR</p>
        `
      });
      console.log(`Interview email sent to candidate: ${candidate.email}`);
    }

    // 2. Email to all assigned Judges
    const judgeEmails = judges.map(j => j.email || (j.user && j.user.email)).filter(Boolean);
    if (judgeEmails.length > 0) {
      await transporter.sendMail({
        from: `"TheMentR HR" <${process.env.EMAIL_USER}>`,
        to: judgeEmails,
        subject: `Interview Assignment – ${formattedDate}`,
        html: `
          <h3>Interview Assignment</h3>
          <p>Hello,</p>
          <p>You have been assigned as a judge for an interview on <strong>${formattedDate}</strong>.</p>
          <p><strong>Candidate:</strong> ${candidate.firstName} ${candidate.lastName}</p>
          <p><strong>Start Meeting Link:</strong> <a href="${meetingDetails.startUrl || meetingDetails.joinUrl}">Click here to start/join</a></p>
          <br/>
          <p>Please be on time.</p>
          <p>HR Department</p>
        `
      });
      console.log(`Interview email sent to judges: ${judgeEmails.join(', ')}`);
    }
  } catch (err) {
    console.error("Failed to send interview emails:", err.message);
    // Don't throw to prevent interview creation failure just because of an email error
  }
};