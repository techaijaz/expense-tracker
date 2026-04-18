import { useState, useCallback } from 'react';
import httpMethods from '@/utils/httpMethods';

const useApi = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Function to make an API request
   * @param {string} url - The API endpoint
   * @param {object} options - Axios options (method, data, headers, etc.)
   */
  const makeRequest = useCallback(async (reqOpts) => {
    const { url, method, data, file, params, ...options } = reqOpts || {};
    setLoading(true);
    setError(null);

    try {
      let response;
      const config = { params };
      
      switch (method?.toLowerCase()) {
        case 'get':
          response = await httpMethods.get(url, params || options.params || {});
          break;
        case 'post':
          response = await httpMethods.post(url, data, file);
          break;
        case 'patch':
          response = await httpMethods.patch(url, data, file);
          break;
        case 'put':
          response = await httpMethods.put(url, data, file);
          break;
        case 'delete':
          response = await httpMethods.delete(url, { params });
          break;
        default:
          throw new Error('Invalid HTTP method');
      }
      setData(response?.data);
      return response;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.data || err?.message || 'Request failed';
      setError(msg);
      console.error('API Error:', msg, err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, error, loading, makeRequest };
};

export default useApi;
