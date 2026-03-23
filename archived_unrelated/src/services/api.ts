import { ResumeData } from '../types/resume';

// Backend URL - change this based on environment
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API_KEY = process.env.REACT_APP_BACKEND_API_KEY || 'dev-key-12345';

export const parseResumeViaBackend = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<ResumeData> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress?.(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.status === 'success' && response.data) {
              resolve({
                ...response.data,
                id: response.file_id || crypto.randomUUID(),
                uploadDate: new Date().toISOString(),
                status: 'completed',
              });
            } else {
              reject(new Error(response.detail || 'Failed to parse resume'));
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
      xhr.setRequestHeader('X-API-Key', API_KEY);
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
        'X-API-Key': API_KEY,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const getBackendUrl = (): string => {
  return BACKEND_URL;
};
