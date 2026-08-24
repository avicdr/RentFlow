import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
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

// Attach the stored access token to every request
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rf_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401s with a single coordinated refresh attempt
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only handle 401s that haven't already retried
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    // Queue additional 401s while refresh is in-flight
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const res = await axios.post(
        `${API_URL}/api/v1/auth/refresh`,
        {},
        { withCredentials: true },
      );
      const newToken = res.data?.data?.accessToken;

      if (newToken) {
        localStorage.setItem('rf_access_token', newToken);
        // Refresh the cookie too (7 days)
        const secure = window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `rf_landlord_token=${newToken}; path=/; max-age=604800; samesite=lax${secure}`;
        apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        onRefreshed(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        isRefreshing = false;
        return apiClient(original);
      }
      // No token in the refresh response — treat as failure.
      throw new Error('No access token in refresh response');
    } catch (refreshErr) {
      // Refresh failed — session is truly expired. Reject queued requests so they don't hang,
      // clear everything, and redirect to login.
      isRefreshing = false;
      onRefreshFailed(refreshErr);
      localStorage.removeItem('rf_access_token');
      localStorage.removeItem('rf_auth_landlord');
      delete apiClient.defaults.headers.common.Authorization;
      const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `rf_landlord_token=; path=/; max-age=0; samesite=lax${secure}`;
      if (typeof window !== 'undefined') {
        // Redirect to login cleanly without leaking info in URL
        window.location.replace('/login');
      }
      return Promise.reject(refreshErr);
    }
  },
);

export default apiClient;
