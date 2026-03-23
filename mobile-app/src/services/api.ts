import { Platform } from 'react-native';

// Get the backend URL based on platform and environment
const getBackendUrl = (): string => {
  if (Platform.OS === 'web') {
    // Web version
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
  }
  
  // Mobile (iOS/Android)
  // For development: use your machine's IP address on the same WiFi network
  // For production: use your deployed backend URL
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    // Development mode - using localhost
    return 'http://127.0.0.1:8000';
  }
  
  // Production backend URL
  return 'https://your-backend-domain.com';
};

// API Key for backend authentication
const API_KEY = process.env.REACT_APP_BACKEND_API_KEY || 'dev-key-12345';

export const BACKEND_URL = getBackendUrl();
export const BACKEND_API_KEY = API_KEY;

export interface ResumeData {
  id: string;
  fileName: string;
  uploadDate: string;
  status: 'processing' | 'completed' | 'error';
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    location?: string;
    linkedin?: string;
    website?: string;
  };
  summary?: string;
  skills?: string[];
  experience?: Array<{
    id: string;
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education?: Array<{
    id: string;
    degree: string;
    school: string;
    graduationDate: string;
  }>;
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;
  [key: string]: any;
}

export const parseResumeViaBackend = async (
  fileUri: string,
  fileName: string,
  mimeType: string,
  onProgress?: (progress: number) => void
): Promise<ResumeData> => {
  try {
    const formData = new FormData();

    // Create a blob from file URI
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    formData.append('file', blob, fileName);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress?.(Math.min(percentComplete, 95)); // Cap at 95% until complete
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            if (result.status === 'success' && result.data) {
              onProgress?.(100);
              resolve({
                ...result.data,
                id: result.file_id || Math.random().toString(36).substr(2, 9),
                uploadDate: new Date().toISOString(),
                status: 'completed',
                fileName: fileName,
              });
            } else {
              reject(new Error(result.detail || 'Failed to parse resume'));
            }
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.detail || `Server error: ${xhr.status}`));
          } catch {
            reject(new Error(`Server error: ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error - unable to reach backend server'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', `${BACKEND_URL}/parse`);
      xhr.setRequestHeader('X-API-Key', BACKEND_API_KEY);
      xhr.send(formData);
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
};

export const testBackendConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'X-API-Key': BACKEND_API_KEY,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
};
