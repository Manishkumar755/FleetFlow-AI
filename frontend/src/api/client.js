import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8000';
export const DJANGO_BASE_URL = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

const rawMlUrl = import.meta.env.VITE_ML_API_URL || import.meta.env.VITE_FASTAPI_API_URL || 'http://localhost:8001';
export const FASTAPI_BASE_URL = rawMlUrl.replace(/\/$/, '');

// Django REST Backend Client
export const djangoClient = axios.create({
  baseURL: DJANGO_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token
djangoClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fleetflow_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh handling
djangoClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('fleetflow_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${DJANGO_BASE_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          if (res.data.access) {
            localStorage.setItem('fleetflow_access_token', res.data.access);
            originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
            return djangoClient(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('fleetflow_access_token');
          localStorage.removeItem('fleetflow_refresh_token');
        }
      }
    }
    return Promise.reject(error);
  }
);

// FastAPI Machine Learning Microservice Client
export const fastapiClient = axios.create({
  baseURL: FASTAPI_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Health check helpers
export const checkDjangoHealth = async () => {
  const response = await djangoClient.get('/api/health/');
  return response.data;
};

export const checkFastAPIHealth = async () => {
  const response = await fastapiClient.get('/health');
  return response.data;
};
