/**
 * Predefined reasons for candidate reservation and deletion.
 *
 * Reserve reasons map to the candidate journey stages:
 *   1. Could Not Reach Out         — candidate applied, admin couldn't reach them
 *   2. Did Not Show Up (Interview) — interview scheduled, candidate was absent
 *   3. LoA Could Not Be Assigned   — interview done, LoA not given (with sub-reason)
 *   4. Did Not Show Up (Post-LoA)  — LoA assigned, candidate didn't show up afterwards
 */

export const RESERVE_REASONS = [
  "Could Not Reach Out",
  "Did Not Show Up for Interview",
  "LoA Could Not Be Assigned",
  "Did Not Show Up After LoA",
];

// Reasons available to super admin when reserving a standby (post-LoA) candidate
export const STANDBY_RESERVE_REASONS = [
  "Negotiation Failed",
  "Did Not Show Up After LoA",
  "Candidate Withdrew After LoA",
  "Terms Could Not Be Agreed Upon",
  "Other",
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
