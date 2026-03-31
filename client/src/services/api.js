import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach auth token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ──────────────────────────────────────────────────────────────────
export const login = (data) => api.post('/auth/login', data);
export const googleLogin = (credential) => api.post('/auth/google', { credential });

// ─── Candidates ────────────────────────────────────────────────────────────
export const getCandidates = () => api.get('/candidate');
export const getCandidateById = (id) => api.get(`/candidate/${id}`);
export const updateCandidate = (id, data) => api.patch(`/candidate/${id}`, data);
export const deleteCandidate = (id) => api.delete(`/candidate/${id}`);



// ─── Interviews ────────────────────────────────────────────────────────────
export const getInterviews = () => api.get('/interview');
export const createInterview = (data) => api.post('/interview', data);
export const updateInterviewStatus = (id, status) => api.patch(`/interview/${id}/status`, { status });
export const rejectInterview = (id) => api.post(`/interview/${id}/reject`);
export const getInterviewFeedbacks = (id) => api.get(`/interview/${id}/feedback`);
export const assignCPC = (id, cpc) => api.patch(`/interview/${id}/cpc`, { cpc });
export const getClassOptions = (id) => api.get(`/interview/${id}/class-options`);

// ─── Teachers ──────────────────────────────────────────────────────────────
export const getTeachers = () => api.get('/teacher');
export const finalizeTeacher = (interviewId, data) => api.post(`/teacher/${interviewId}/finalize`, data);
export const deleteTeacher = (id) => api.delete(`/teacher/${id}`);
// Builds a direct URL for opening the LoA PDF in a new browser tab (token appended for auth)
export const getTeacherLoAUrl = (teacherId) => {
  const token = localStorage.getItem('token') || '';
  return `/api/teacher/${teacherId}/loa?token=${token}`;
};

// ─── Users / Judges ────────────────────────────────────────────────────────
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUserRole = (id, role) => api.patch(`/users/${id}/role`, { role });
export const deleteUser = (id) => api.delete(`/users/${id}`);

// ─── Feedback ──────────────────────────────────────────────────────────────
export const submitFeedback = (data) => api.post('/interview/feedback', data);
export const getFeedbacks = (interviewId) => api.get(`/interview/${interviewId}/feedback`);

// ─── Zoom ───────────────────────────────────────────────────────────────────
export const testZoomConnection = () => api.get('/interview/test-zoom');
