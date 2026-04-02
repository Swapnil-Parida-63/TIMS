/**
 * Role-based access control helpers.
 * Single source of truth for all UI permission decisions.
 *
 * Global roles (4):  super_admin > admin > executer > panelist
 *
 * Interview-level roles (assigned per interview, stored on judges[].interviewRole):
 *   micro_observer | subject_expert | null (plain panelist)
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN:       'admin',
  EXECUTER:    'executer',
  PANELIST:    'panelist',
};

// Interview-level role labels (for the schedule modal)
export const INTERVIEW_ROLE_LABELS = {
  micro_observer: 'Micro Observer',
  subject_expert: 'Subject Expert',
  null:           'Panelist (no special role)',
};

// Can this role finalize teacher selection?
export const canFinalize = (role) => role === ROLES.SUPER_ADMIN;

// Can this role view recordings?
export const canViewRecording = (role) => [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role);

// Can this role view ALL feedback?
export const canViewAllFeedback = (role) => [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role);

// Can this role view SOME feedback (admin-level visibility)?
export const canViewSomeFeedback = (role) => [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role);

// Can this role submit feedback? All logged-in users can (panelist, executer, admin, super_admin)
export const canSubmitFeedback = (role) => [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EXECUTER, ROLES.PANELIST].includes(role);

// Can this role schedule interviews?
export const canSchedule = (role) => [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role);

// Can this role manage panelists (CRUD)?
export const canManageJudges = (role) => role === ROLES.SUPER_ADMIN;

// Can this role VIEW the panelists page?
export const canViewJudges = (role) => [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role);

// Can this role EDIT candidate info? (admin, super_admin, executer)
export const canEditCandidate = (role) => [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EXECUTER].includes(role);

// Role display labels
export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]:       'Admin',
  [ROLES.EXECUTER]:    'Executer',
  [ROLES.PANELIST]:    'Panelist',
};

// Role badge colors
export const ROLE_COLORS = {
  [ROLES.SUPER_ADMIN]: 'bg-purple-100 text-purple-800 border-purple-200',
  [ROLES.ADMIN]:       'bg-blue-100 text-blue-800 border-blue-200',
  [ROLES.EXECUTER]:    'bg-teal-100 text-teal-800 border-teal-200',
  [ROLES.PANELIST]:    'bg-slate-100 text-slate-700 border-slate-200',
};
