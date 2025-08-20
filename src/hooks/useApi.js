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
  const makeRequest = useCallback(async ({ url, method, data, file }) => {
    setLoading(true);
    setError(null);

    try {
      if (method === 'get') {
        const response = await httpMethods.get(url);
        setData(response.data);
      } else if (method === 'post') {
        const response = await httpMethods.post(url, data, file);
        setData(response.data);
      } else if (method === 'put') {
        const response = await httpMethods.put(url, data, file);
        setData(response.data);
      } else if (method === 'delete') {
        const response = await httpMethods.delete(url);
        setData(response.data);
      }
    } catch (err) {
      setError(err.response.data.data || err.message);
      console.error('API Error:', err.response.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, error, loading, makeRequest };
};

export default useApi;
