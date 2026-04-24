import { Platform } from 'react-native';
import { postFormData, postJSON } from './httpClient';

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
// ⚠️ REQUIRED: Set REACT_APP_BACKEND_API_KEY in environment variables
// Do NOT commit real API keys to version control
const API_KEY = process.env.REACT_APP_BACKEND_API_KEY;

if (!API_KEY) {
  console.warn(
    '⚠️ WARNING: REACT_APP_BACKEND_API_KEY environment variable is not set. ' +
    'API authentication will fail. See .env.example for configuration.'
  );
}

export const BACKEND_URL = getBackendUrl();
export const BACKEND_API_KEY = API_KEY || '';

// Type definitions for API responses
export interface JobDescription {
  name?: string;
  position?: string;
  description: string;
  requirements?: string[];
  skills?: string[];
  [key: string]: any;
}

export interface RankingResult {
  status: 'success' | 'error';
  data?: {
    rankings?: Array<{
      resume_index: number;
      score: number;
      matched_skills: string[];
      missing_skills: string[];
    }>;
    [key: string]: any;
  };
  detail?: string;
}

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

    // Use centralized HTTP client for consistent error handling and progress tracking
    const result = await postFormData<any>(
      `${BACKEND_URL}/parse`,
      formData,
      { 'X-API-Key': BACKEND_API_KEY },
      onProgress
    );

    if (result.status === 'success' && result.data) {
      // Ensure progress reaches 100%
      onProgress?.(100);
      return {
        ...result.data,
        id: result.file_id || Math.random().toString(36).substr(2, 9),
        uploadDate: new Date().toISOString(),
        status: 'completed',
        fileName: fileName,
      };
    } else {
      throw new Error(result.detail || 'Failed to parse resume');
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
};

/**
 * Parse a Job Description from text or file
 * @param input - Either raw JD text or file URI
 * @param isText - If true, treats input as text; if false, treats as file URI
 * @param fileName - Original file name (for file input)
 * @param mimeType - MIME type (for file input)
 */
export const parseJobDescriptionViaBackend = async (
  input: string,
  isText: boolean = true,
  fileName?: string,
  mimeType?: string,
  onProgress?: (progress: number) => void
): Promise<any> => {
  try {
    if (isText) {
      // Parse from text input using fetch (no progress tracking needed for text)
      const result = await postJSON<any>(
        `${BACKEND_URL}/parse_jd?text=${encodeURIComponent(input)}`,
        {},
        { 'X-API-Key': BACKEND_API_KEY }
      );

      if (result.status === 'success') {
        return result.data;
      }
      throw new Error(result.detail || 'Failed to parse JD');
    } else {
      // Parse from file input using httpClient for progress tracking
      const formData = new FormData();

      // Create a blob from file URI
      const fileResponse = await fetch(input);
      const blob = await fileResponse.blob();

      formData.append('file', blob, fileName || 'document');

      const result = await postFormData<any>(
        `${BACKEND_URL}/parse_jd`,
        formData,
        { 'X-API-Key': BACKEND_API_KEY },
        onProgress
      );

      if (result.status === 'success' && result.data) {
        onProgress?.(100);
        return result.data;
      } else {
        throw new Error(result.detail || 'Failed to parse JD');
      }
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unknown error occurred');
  }
};

/**
 * Rank candidates against a Job Description
 * @param jdData - Parsed JD data
 * @param resumeList - List of parsed resumes
 */
export const rankCandidatesViaBackend = async (
  jdData: JobDescription,
  resumeList: ResumeData[]
): Promise<RankingResult> => {
  try {
    const response = await fetch(`${BACKEND_URL}/rank_candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': BACKEND_API_KEY,
      },
      body: JSON.stringify({
        jd_data: jdData,
        resume_list: resumeList,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to rank candidates');
    }

    const result = await response.json();
    if (result.status === 'success') {
      return result;
    }
    throw new Error('Invalid response from server');
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
