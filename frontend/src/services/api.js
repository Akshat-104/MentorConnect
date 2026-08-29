import axios from 'axios';

const API = axios.create({
  baseURL: 'https://mentorconnect-szhf.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to add Auth header on demand for protected routes
export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default API;