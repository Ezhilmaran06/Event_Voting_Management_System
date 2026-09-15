import api, { API_BASE_URL } from './api';

export { API_BASE_URL };

export const fetchUsers = async () => {
  return await api.auth.getUsers();
};

export const sendOtp = async (email) => {
  return await api.auth.sendOtp(email);
};

export const verifyOtp = async (email, otp) => {
  return await api.auth.verifyOtp(email, otp);
};

export const createUser = async (userData) => {
  return await api.auth.register(userData);
};

export const login = async (credentials) => {
  return await api.auth.login(credentials);
};
