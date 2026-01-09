// lib/axios.ts
import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://insightly-backend-f847.onrender.com';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token - prioritize localStorage (synchronous) then sync with Supabase
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      // First, try localStorage (synchronous, fast)
      let token = localStorage.getItem('access_token');
      
      // Then, try to sync with Supabase session (async, but don't block)
      try {
        const { data } = await supabase.auth.getSession();
        const supabaseToken = data.session?.access_token;
        
        if (supabaseToken) {
          // Use Supabase token if available (more up-to-date)
          token = supabaseToken;
          // Sync to localStorage for consistency
          localStorage.setItem('access_token', supabaseToken);
        }
      } catch (error) {
        // If Supabase call fails, use localStorage token (already set above)
        // This ensures we always have a token if it exists in localStorage
      }
      
      // Add token to request if we have one
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        // Don't redirect here - let the component handle it
        // This prevents infinite loops
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

