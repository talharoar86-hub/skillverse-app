import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Extremely important for HttpOnly cookies (Refresh Token)
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('skillverse_user'));
    if (user && user.accessToken) {
      config.headers['Authorization'] = `Bearer ${user.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for refresh token handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
       // Prevent infinite loops if the /refresh call itself fails
       if (originalRequest.url === '/auth/refresh') {
          return Promise.reject(error);
       }
       
       originalRequest._retry = true;

       try {
          // Attempt to refresh the accessToken using the HttpOnly cookie or stored refresh token
          const storedUser = JSON.parse(localStorage.getItem('skillverse_user'));
          const { data } = await api.post('/auth/refresh', {
            refreshToken: storedUser?.refreshToken
          });
          
          // Update user in local storage with new short-lived access token
          const user = JSON.parse(localStorage.getItem('skillverse_user'));
          if (user) {
            user.accessToken = data.accessToken;
            localStorage.setItem('skillverse_user', JSON.stringify(user));
            // Safely update auth header for the retry
            originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
          }
          
          // Retry the original request
          return api(originalRequest);
        } catch (refreshErr) {
         // Refresh completely failed (e.g., cookie expired), clear storage
         localStorage.removeItem('skillverse_user');
         window.location.href = '/login';
         return Promise.reject(refreshErr);
       }
    }
    return Promise.reject(error);
  }
);

export default api;
