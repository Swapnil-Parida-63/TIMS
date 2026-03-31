/**
 * Predefined reasons for candidate rejection and deletion.
 * Used on both server (validation) and client (dropdowns).
 */

export const REJECTION_REASONS = [
  "Insufficient subject knowledge",
  "Poor communication skills",
  "Lack of relevant teaching experience",
  "Unsuitable attitude or professionalism",
  "Below required academic qualification",
  "Unsatisfactory demo/trial class performance",
  "Unavailable for required time slots",
  "Service location mismatch",
  "Salary expectations not aligned",
  "Better candidate selected for the role",
];

export const DELETION_REASONS = [
  "Duplicate profile — candidate re-registered",
  "Candidate voluntarily withdrew application",
  "No response after repeated follow-ups",
  "Incorrect or fraudulent information provided",
  "Candidate blacklisted due to misconduct",
  "Test or dummy entry — not a real candidate",
  "Candidate accepted offer elsewhere",
  "Position no longer available",
  "Outside our serviceable area",
  "Data entry error — profile created by mistake",
];
