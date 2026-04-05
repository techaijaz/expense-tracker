import instance from './axiosInstance';

// Function to get request headers
const getRequestHeader = (file = false) => {
  const controller = new AbortController();
  const signal = controller.signal;
  return {
    headers: {
      'Content-Type': file ? 'multipart/form-data' : 'application/json',
    },
    signal: signal,
    withCredentials: true,
  };
};
// Function to make a POST request
export default {
  post: async (url, data = {}, file = false) => {
    const response = await instance.post(url, data, getRequestHeader(file));
    return response.data;
  },

  get: async (url) => {
    const response = await instance.get(url, getRequestHeader());
    return response.data;
  },
  put: async (url, data = {}, file = false) => {
    const response = await instance.put(url, data, getRequestHeader(file));
    return response.data;
  },
  patch: async (url, data = {}, file = false) => {
    const response = await instance.patch(url, data, getRequestHeader(file));
    return response.data;
  },
  delete: async (url) => {
    try {
      const response = await instance.delete(url, getRequestHeader());
      return response.data;
    } catch (error) {
      console.error('Error in DELETE request:', error);
      throw error;
    }
  },
};
