/**
 * Role-based access control helpers.
 * Single source of truth for all UI permission decisions.
 * 
 * Hierarchy:  super_admin > admin > micro_observer > expert
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MICRO_OBSERVER: 'micro_observer',
  EXPERT: 'expert',
};

// Can this role finalize teacher selection?
export const canFinalize = (role) => role === ROLES.SUPER_ADMIN;

// Can this role view recordings?
export const canViewRecording = (role) => [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role);

// Can this role view ALL feedback?
export const canViewAllFeedback = (role) => [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role);

// Can this role view SOME feedback (own + expert)?
export const canViewSomeFeedback = (role) => [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MICRO_OBSERVER].includes(role);

// Can this role submit feedback? (any logged-in user who is assigned as a judge)
export const canSubmitFeedback = (role) => [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MICRO_OBSERVER, ROLES.EXPERT].includes(role);

// Can this role schedule interviews?
export const canSchedule = (role) => [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role);

// Can this role manage judges (CRUD)?
export const canManageJudges = (role) => role === ROLES.SUPER_ADMIN;

// Can this role VIEW the judges page?
export const canViewJudges = (role) => [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(role);

// Role display labels
export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MICRO_OBSERVER]: 'Micro Observer',
  [ROLES.EXPERT]: 'Expert',
};

// Role badge colors
export const ROLE_COLORS = {
  [ROLES.SUPER_ADMIN]: 'bg-purple-100 text-purple-800 border-purple-200',
  [ROLES.ADMIN]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ROLES.MICRO_OBSERVER]: 'bg-amber-100 text-amber-800 border-amber-200',
  [ROLES.EXPERT]: 'bg-slate-100 text-slate-700 border-slate-200',
};
