import axios from 'axios';

export const API_BASE_URL = 'http://localhost:3000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to format errors gracefully
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected server error occurred';
    return Promise.reject(new Error(message));
  }
);

export const api = {
  // Authentication & Users
  auth: {
    login: async (credentials) => {
      const res = await client.post('/users/login', credentials);
      return res.data;
    },
    register: async (data) => {
      const res = await client.post('/users/register', data);
      return res.data;
    },
    getMe: async () => {
      const res = await client.get('/users/me');
      return res.data;
    },
    updateProfile: async (data) => {
      const res = await client.put('/users/me', data);
      return res.data;
    },
    sendOtp: async (email) => {
      const res = await client.post('/users/send-otp', { email });
      return res.data;
    },
    verifyOtp: async (email, otp) => {
      const res = await client.post('/users/verify-otp', { email, otp });
      return res.data;
    },
    forgotPassword: async (email) => {
      const res = await client.post('/users/forgot-password', { email });
      return res.data;
    },
    resetPassword: async (data) => {
      const res = await client.post('/users/reset-password', data);
      return res.data;
    },
    getUsers: async () => {
      const res = await client.get('/users');
      return res.data;
    },
    updateUserRole: async (id, role) => {
      const res = await client.put(`/users/${id}/role`, { role });
      return res.data;
    },
  },

  // Events
  events: {
    getAll: async () => {
      const res = await client.get('/events');
      return res.data;
    },
    getById: async (id) => {
      const res = await client.get(`/events/${id}`);
      return res.data;
    },
    create: async (data) => {
      const res = await client.post('/events', data);
      return res.data;
    },
    update: async (id, data) => {
      const res = await client.put(`/events/${id}`, data);
      return res.data;
    },
    delete: async (id) => {
      const res = await client.delete(`/events/${id}`);
      return res.data;
    },
  },

  // Candidates / User Events
  candidates: {
    register: async (data) => {
      const res = await client.post('/user_events', data);
      return res.data;
    },
    getByEvent: async (eventId) => {
      const res = await client.get(`/user_events/event/${eventId}`);
      return res.data;
    },
    getAll: async () => {
      const res = await client.get('/user_events');
      return res.data;
    },
    getUserRegistrations: async (userId) => {
      const res = await client.get(`/user_events/user/${userId}`);
      return res.data;
    },
    update: async (id, data) => {
      const res = await client.put(`/user_events/${id}`, data);
      return res.data;
    },
    delete: async (id) => {
      const res = await client.delete(`/user_events/${id}`);
      return res.data;
    },
  },

  // Voting
  votes: {
    castVote: async (data) => {
      const res = await client.post('/votes', data);
      return res.data;
    },
    getResults: async (eventId) => {
      const res = await client.get(`/votes/${eventId}`);
      return res.data;
    },
    getParticipantVotes: async (eventId, participantId) => {
      const res = await client.get(`/votes/${eventId}/participant/${participantId}`);
      return res.data;
    },
    getUserHistory: async (userId) => {
      const res = await client.get('/votes/user/history', { params: { userId } });
      return res.data;
    },
  },

  // Admin & Analytics
  admin: {
    getStats: async () => {
      const res = await client.get('/admin/stats');
      return res.data;
    },
    getAuditLogs: async (limit = 50) => {
      const res = await client.get('/admin/audit-logs', { params: { limit } });
      return res.data;
    },
    exportUrl: (type, id) => `${API_BASE_URL}/admin/export/${type}/${id}`,
  },

  // Notifications
  notifications: {
    getAll: async (userId) => {
      const res = await client.get('/notifications', { params: { userId } });
      return res.data;
    },
    markAsRead: async (id) => {
      const res = await client.put(`/notifications/${id}/read`);
      return res.data;
    },
    markAllAsRead: async (userId) => {
      const res = await client.put('/notifications/read-all', { userId });
      return res.data;
    },
  },
};

export default api;
