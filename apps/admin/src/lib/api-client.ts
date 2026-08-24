import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL, withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

apiClient.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rf_admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  r => r,
  async error => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      try {
        const res = await axios.post(`${API_URL}/api/v1/auth/refresh`, {}, { withCredentials: true });
        const newToken = res.data?.data?.accessToken;
        if (newToken) {
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          localStorage.setItem('rf_admin_token', newToken);
          document.cookie = `rf_admin_token=${newToken}; path=/; max-age=86400; samesite=lax${secure}`;
          orig.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(orig);
        }
      } catch {
        localStorage.removeItem('rf_admin_token');
        const secure = window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `rf_admin_token=; path=/; max-age=0; samesite=lax${secure}`;
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
