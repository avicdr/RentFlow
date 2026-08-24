import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
});

let isRefreshing = false;
// Each queued 401 keeps BOTH callbacks so it can be resolved on success or rejected on failure —
// otherwise a failed refresh leaves queued requests pending forever.
interface RefreshWaiter {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}
let refreshSubscribers: RefreshWaiter[] = [];

function subscribeTokenRefresh(waiter: RefreshWaiter) {
  refreshSubscribers.push(waiter);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((w) => w.resolve(token));
  refreshSubscribers = [];
}

function onRefreshFailed(err: unknown) {
  refreshSubscribers.forEach((w) => w.reject(err));
  refreshSubscribers = [];
}

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rf_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const orig = error.config;
    if (error.response?.status !== 401 || orig._retry) {
      return Promise.reject(error);
    }

    orig._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh({
          resolve: (token) => {
            orig.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(orig));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const res = await axios.post(`${API_URL}/api/v1/auth/refresh`, {}, { withCredentials: true });
      const newToken = res.data?.data?.accessToken;
      if (newToken) {
        localStorage.setItem('rf_access_token', newToken);
        document.cookie = `rf_tenant_token=${newToken}; path=/; max-age=604800; samesite=lax`;
        apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        onRefreshed(newToken);
        orig.headers.Authorization = `Bearer ${newToken}`;
        isRefreshing = false;
        return apiClient(orig);
      }
      throw new Error('No access token in refresh response');
    } catch (refreshErr) {
      isRefreshing = false;
      onRefreshFailed(refreshErr);
      localStorage.removeItem('rf_access_token');
      localStorage.removeItem('rf_auth_tenant');
      delete apiClient.defaults.headers.common.Authorization;
      document.cookie = `rf_tenant_token=; path=/; max-age=0; samesite=lax`;
      if (typeof window !== 'undefined') {
        // Clean redirect — no URL params that leak session state
        window.location.replace('/login');
      }
      return Promise.reject(refreshErr);
    }
  },
);

export default apiClient;
