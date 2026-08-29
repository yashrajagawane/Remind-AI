import { useAuthStore } from '@/stores/auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const { accessToken, refreshToken, setTokens, logout } = useAuthStore.getState();
  
  const headers = new Headers(options.headers);
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

  if (response.status === 401 && refreshToken) {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (refreshResponse.ok) {
        const payload = await refreshResponse.json();
        // Extract new tokens from our response envelope
        const data = payload.data || payload; 
        setTokens(data.access_token, data.refresh_token);
        
        // Retry original request
        headers.set('Authorization', `Bearer ${data.access_token}`);
        response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
      } else {
        logout();
      }
    } catch (error) {
      logout();
    }
  }

  return response;
};
