import axios from 'axios';
import { refreshEmployeeActivity } from '../utils/employeeSession';

const resolveApiBaseUrl = () => {
  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'http://localhost:5000/api/auth';
  }

  const configuredBaseUrl = String(process.env.REACT_APP_API_URL || '').trim();
  return configuredBaseUrl ? `${configuredBaseUrl}/api/auth` : '/api/auth';
};

const API = axios.create({
  baseURL: resolveApiBaseUrl()
}); // Backend URL

console.log('API URL:', API.defaults.baseURL);

// Add token in headers if available
API.interceptors.request.use((req) => {
  if (localStorage.getItem('token')) {
    req.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => {
    const method = String(response.config?.method || '').toLowerCase();
    if (localStorage.getItem('loginAs') === 'employee' && ['post', 'put', 'patch', 'delete'].includes(method)) {
      refreshEmployeeActivity();
    }
    return response;
  },
  (error) => Promise.reject(error)
);

export default API;
