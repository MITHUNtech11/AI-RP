/**
 * API Service - Handles all backend API calls
 * Uses the backend endpoints instead of client-side parsing
 */

import type { ResumeData } from '../types/resume';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Backend response format from the resume upload endpoint
 */
export interface BackendResumeResponse {
  id: string;
  user_id: string;
  file_name: string;
  resume_json: {
    personalInfo?: {
      fullName?: string;
      email?: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      website?: string;
      [key: string]: any;
    };
    skills?: string[];
    experience?: any[];
    education?: any[];
    languages?: any[];
    summary?: string;
    [key: string]: any;
  };
  hr_notes?: string;
  match_score?: number;
  recommendation?: string;
  upload_date: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type Recommendation = NonNullable<ResumeData['hrEvaluation']>['recommendation'];
type Proficiency = ResumeData['languages'][number]['proficiency'];

function normalizeRecommendation(value?: string): Recommendation {
  switch (value) {
    case 'Strong Hire':
    case 'Hire':
    case 'Hold':
    case 'Reject':
      return value;
    default:
      return 'Hold';
  }
}

function normalizeProficiency(value?: string): Proficiency {
  switch (value) {
    case 'Native':
    case 'Fluent':
    case 'Intermediate':
    case 'Basic':
      return value;
    default:
      return 'Intermediate';
  }
}

/**
 * Map backend response to frontend ResumeData format
 */
function mapBackendResumeToFrontend(backendResume: BackendResumeResponse): ResumeData {
  const json = backendResume.resume_json || {};
  const hasEvaluation =
    typeof backendResume.match_score === 'number' || !!backendResume.recommendation;
  const evaluationSummary =
    json.hrEvaluation?.evaluationSummary ||
    json.evaluationSummary ||
    json.summary ||
    'Auto-generated evaluation.';
  
  return {
    id: backendResume.id,
    fileName: backendResume.file_name,
    uploadDate: backendResume.upload_date || backendResume.created_at,
    status: 'completed',
    personalInfo: {
      fullName: json.personalInfo?.fullName || 'Unknown',
      email: json.personalInfo?.email || '',
      phone: json.personalInfo?.phone || '',
      location: json.personalInfo?.location || '',
      linkedin: json.personalInfo?.linkedin || undefined,
      website: json.personalInfo?.website || undefined,
    },
    summary: json.summary || '',
    skills: Array.isArray(json.skills) ? json.skills : [],
    experience: Array.isArray(json.experience)
      ? json.experience.map((exp: any) => ({
          id: exp.id || `${backendResume.id}-exp-${Math.random().toString(36).slice(2, 9)}`,
          title: exp.title || exp.jobTitle || '',
          company: exp.company || '',
          startDate: exp.startDate || '',
          endDate: exp.endDate || (exp.current ? 'Present' : ''),
          description: exp.description || '',
        }))
      : [],
    education: Array.isArray(json.education)
      ? json.education.map((edu: any) => ({
          id: edu.id || `${backendResume.id}-edu-${Math.random().toString(36).slice(2, 9)}`,
          degree: edu.degree || '',
          school: edu.school || edu.university || '',
          graduationDate: edu.graduationDate || edu.year || '',
        }))
      : [],
    languages: Array.isArray(json.languages)
      ? json.languages.map((lang: any) => ({
          language: typeof lang === 'string' ? lang : lang.language || '',
          proficiency: normalizeProficiency(lang?.proficiency),
        })).filter((lang: ResumeData['languages'][number]) => !!lang.language)
      : [],
    hrEvaluation: hasEvaluation
      ? {
          matchScore: backendResume.match_score ?? 0,
          recommendation: normalizeRecommendation(backendResume.recommendation),
          evaluationSummary,
          matchingSkills: Array.isArray(json.hrEvaluation?.matchingSkills)
            ? json.hrEvaluation.matchingSkills
            : [],
          missingSkills: Array.isArray(json.hrEvaluation?.missingSkills)
            ? json.hrEvaluation.missingSkills
            : [],
        }
      : undefined,
    hrNotes: backendResume.hr_notes,
  };
}

/**
 * Upload and parse a single resume file using the backend
 * @param file - The file to upload
 * @param accessToken - JWT access token for authentication
 * @returns Parsed resume data
 */
export async function uploadAndParseResume(
  file: File,
  accessToken: string
): Promise<ResumeData> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/uploads/resume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Upload failed: ${response.status}`);
    }

    const backendData: BackendResumeResponse = await response.json();
    return mapBackendResumeToFrontend(backendData);
  } catch (error: any) {
    console.error('Resume upload error:', error);
    throw error;
  }
}

/**
 * Upload and parse multiple resume files in batch
 * @param files - Array of files to upload
 * @param accessToken - JWT access token for authentication
 * @returns Batch processing results
 */
export async function uploadAndParseBatch(
  files: File[],
  accessToken: string
): Promise<{
  status: string;
  total_files: number;
  successful: number;
  failed: number;
  processing_time_ms: number;
  results: Array<{
    filename: string;
    status: 'success' | 'failed';
    data?: ResumeData;
    error?: string;
  }>;
}> {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/uploads/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Batch upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Batch upload error:', error);
    throw error;
  }
}

/**
 * Get all resumes for the current user
 * @param accessToken - JWT access token for authentication
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 20)
 * @param search - Search query (optional)
 * @returns List of resumes
 */
export async function getResumes(
  accessToken: string,
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<{
  resumes: ResumeData[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}> {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);

    const response = await fetch(`${API_BASE_URL}/resumes?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch resumes: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Get resumes error:', error);
    throw error;
  }
}

/**
 * Get a single resume by ID
 * @param resumeId - Resume ID
 * @param accessToken - JWT access token for authentication
 * @returns Resume data
 */
export async function getResume(
  resumeId: string,
  accessToken: string
): Promise<ResumeData> {
  try {
    const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch resume: ${response.status}`);
    }

    const data = await response.json();
    return data as ResumeData;
  } catch (error: any) {
    console.error('Get resume error:', error);
    throw error;
  }
}

/**
 * Update resume metadata (notes, score, recommendation)
 * @param resumeId - Resume ID
 * @param updates - Fields to update
 * @param accessToken - JWT access token for authentication
 * @returns Updated resume data
 */
export async function updateResume(
  resumeId: string,
  updates: {
    hr_notes?: string;
    match_score?: number;
    recommendation?: string;
  },
  accessToken: string
): Promise<ResumeData> {
  try {
    const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update resume: ${response.status}`);
    }

    const data = await response.json();
    return data as ResumeData;
  } catch (error: any) {
    console.error('Update resume error:', error);
    throw error;
  }
}

/**
 * Delete a resume by ID
 * @param resumeId - Resume ID
 * @param accessToken - JWT access token for authentication
 */
export async function deleteResume(
  resumeId: string,
  accessToken: string
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/resumes/${resumeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete resume: ${response.status}`);
    }
  } catch (error: any) {
    console.error('Delete resume error:', error);
    throw error;
  }
}

/**
 * Bulk delete multiple resumes
 * @param resumeIds - Array of resume IDs to delete
 * @param accessToken - JWT access token for authentication
 */
export async function bulkDeleteResumes(
  resumeIds: string[],
  accessToken: string
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/resumes/bulk-delete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resume_ids: resumeIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete resumes: ${response.status}`);
    }
  } catch (error: any) {
    console.error('Bulk delete error:', error);
    throw error;
  }
}

// ============ AUTHENTICATION ============

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

/**
 * Sign up a new user
 * @param email - User email
 * @param password - User password
 * @param fullName - User full name (optional)
 * @returns Auth token and user info
 */
export async function signup(
  email: string,
  password: string,
  fullName?: string
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Signup failed: ${response.status}`);
    }

    const data = await response.json();
    return data as AuthResponse;
  } catch (error: any) {
    console.error('Signup error:', error);
    throw error;
  }
}

/**
 * Log in an existing user
 * @param email - User email
 * @param password - User password
 * @returns Auth token and user info
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Login failed: ${response.status}`);
    }

    const data = await response.json();
    return data as AuthResponse;
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Refresh the access token using a refresh token
 * @param refreshToken - Refresh token from a previous login
 * @returns New auth token
 */
export async function refreshToken(
  refreshToken: string
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = await response.json();
    return data as AuthResponse;
  } catch (error: any) {
    console.error('Token refresh error:', error);
    throw error;
  }
}

/**
 * Get current user information
 * @param accessToken - JWT access token for authentication
 * @returns User information
 */
export async function getCurrentUser(
  accessToken: string
): Promise<{
  id: string;
  email: string;
  full_name?: string;
  created_at?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Get user error:', error);
    throw error;
  }
}
