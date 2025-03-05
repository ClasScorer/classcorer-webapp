// Base URL for the Django API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper function to get the authentication token
function getAuthHeaders() {
  let token = null;
  
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('authToken');
    
    // If token not in localStorage, try to get it from cookies
    if (!token) {
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(cookie => cookie.trim().startsWith('authToken='));
      if (authCookie) {
        token = authCookie.split('=')[1];
      }
    }
  }
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Token ${token}` } : {})
  };
}

// Generic API request function
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = getAuthHeaders();
  
  // Create a new headers object that includes both the auth headers and any custom headers
  const mergedHeaders = {
    ...headers,
    ...options.headers,
  };
  
  const requestOptions: RequestInit = {
    ...options,
    headers: mergedHeaders,
    // Add credentials to include cookies in the request
    credentials: 'include',
  };
  
  const response = await fetch(url, requestOptions);
  
  if (!response.ok) {
    // Try to parse the error response
    const errorData = await response.json().catch(() => ({}));
    
    // Create a more informative error object
    const error = new Error(
      errorData.detail || 
      errorData.message || 
      errorData.error || 
      `Request failed with status ${response.status}`
    );
    
    // Attach the status code and response data for more context
    (error as any).status = response.status;
    (error as any).data = errorData;
    
    throw error;
  }
  
  return response.json();
}

// API functions for different endpoints
export const api = {
  // Auth endpoints
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(
          errorData.detail || 
          errorData.message || 
          errorData.error || 
          'Invalid credentials'
        );
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
      }
      
      const data = await response.json();
      
      // Store the token in localStorage for client-side requests
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', data.token);
      }
      
      return data;
    },
    
    signup: async (userData: any) => {
      const response = await fetch(`${API_BASE_URL}/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error('Signup failed');
        (error as any).status = response.status;
        (error as any).data = errorData;
        (error as any).response = { data: errorData };
        throw error;
      }
      
      const data = await response.json();
      
      // Store the token in localStorage for client-side requests
      if (typeof window !== 'undefined' && data.token) {
        localStorage.setItem('authToken', data.token);
      }
      
      return data;
    },
    
    register: async (userData: any) => {
      return apiRequest('/register/', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    
    logout: async () => {
      return apiRequest('/logout/', {
        method: 'POST',
      });
    },
    
    getCurrentUser: async () => {
      return apiRequest('/user/');
    },
  },
  
  // Courses endpoints
  courses: {
    getAll: async () => {
      return apiRequest('/courses/');
    },
    
    getById: async (id: string) => {
      return apiRequest(`/courses/${id}/`);
    },
    
    create: async (courseData: any) => {
      return apiRequest('/courses/', {
        method: 'POST',
        body: JSON.stringify(courseData),
      });
    },
    
    update: async (id: string, courseData: any) => {
      return apiRequest(`/courses/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(courseData),
      });
    },
    
    delete: async (id: string) => {
      return apiRequest(`/courses/${id}/`, {
        method: 'DELETE',
      });
    },
  },
  
  // Students endpoints
  students: {
    getAll: async () => {
      return apiRequest('/students/');
    },
    
    getById: async (id: string) => {
      return apiRequest(`/students/${id}/`);
    },
    
    create: async (studentData: any) => {
      return apiRequest('/students/', {
        method: 'POST',
        body: JSON.stringify(studentData),
      });
    },
    
    update: async (id: string, studentData: any) => {
      return apiRequest(`/students/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(studentData),
      });
    },
    
    delete: async (id: string) => {
      return apiRequest(`/students/${id}/`, {
        method: 'DELETE',
      });
    },
  },
  
  // Events endpoints
  events: {
    getAll: async () => {
      return apiRequest('/events/');
    },
    
    getById: async (id: string) => {
      return apiRequest(`/events/${id}/`);
    },
    
    create: async (eventData: any) => {
      return apiRequest('/events/', {
        method: 'POST',
        body: JSON.stringify(eventData),
      });
    },
    
    update: async (id: string, eventData: any) => {
      return apiRequest(`/events/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(eventData),
      });
    },
    
    delete: async (id: string) => {
      return apiRequest(`/events/${id}/`, {
        method: 'DELETE',
      });
    },
  },
}; 