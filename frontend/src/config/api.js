// API Configuration
// This file centralizes the API URL configuration for easy deployment

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const API_URL = API_BASE_URL;

// Helper function to build API endpoints
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export default API_URL;
