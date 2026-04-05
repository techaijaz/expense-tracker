import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Ensure cookies are sent with requests
});

const cancelMap = new Map();

let isRefreshing = false; // To prevent multiple simultaneous refresh calls
let failedQueue = []; // Queue to store failed requests during token refresh

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Function to get access token from persisted redux state
const getAccessToken = () => {
  try {
    const root = localStorage.getItem('persist:root');
    if (!root) return null;
    const parsedRoot = JSON.parse(root);
    const auth = JSON.parse(parsedRoot.auth);
    return auth.user?.accessToken;
  } catch (error) {
    return null;
  }
};

// Request interceptor
instance.interceptors.request.use(
  function (config) {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const requestKey = `${config.method}:${config.url}`;
    if (cancelMap.has(requestKey)) {
      cancelMap.get(requestKey).cancel('Canceled due to a new request.');
    }

    const source = axios.CancelToken.source();
    config.cancelToken = source.token;
    cancelMap.set(requestKey, source);

    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// Response interceptor
instance.interceptors.response.use(
  function (response) {
    const requestKey = `${response.config.method}:${response.config.url}`;
    cancelMap.delete(requestKey);
    return response;
  },
  async function (error) {
    const originalRequest = error.config;

    if (axios.isCancel(error)) {
      return new Promise(() => {});
    }
    // console.log('Error Response:', error);

    if (error.response?.status === 401) {
      // If the request was to the refresh token endpoint and it failed, OR if we've already retried
      if (originalRequest.url === '/user/refresh-token' || originalRequest._retry) {
        localStorage.clear();
        window.location.href = '/';
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const { data } = await instance.post('/user/refresh-token', {});
        const { accessToken } = data.data;

        processQueue(null, accessToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Clear session and redirect to login if refresh fails
        localStorage.clear();
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }


    if (error.config) {
      const requestKey = `${error.config.method}:${error.config.url}`;
      cancelMap.delete(requestKey);
    }

    return Promise.reject(error);
  }
);

export default instance;
