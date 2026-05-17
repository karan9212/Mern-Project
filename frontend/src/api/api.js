import axios from 'axios';
import { refreshEmployeeActivity } from '../utils/employeeSession';

const API = axios.create({ baseURL: 'http://localhost:5000/api/auth' }); // Backend URL

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
