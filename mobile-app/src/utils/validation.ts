/**
 * Input validation utilities for the resume parser app
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate Job Description input
 */
export const validateJobDescription = (input: string): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!input || input.trim().length === 0) {
    errors.push({
      field: 'jobDescription',
      message: 'Job description cannot be empty',
    });
    return errors;
  }

  const trimmed = input.trim();

  if (trimmed.length < 50) {
    errors.push({
      field: 'jobDescription',
      message: 'Job description must be at least 50 characters',
    });
  }

  if (trimmed.length > 10000) {
    errors.push({
      field: 'jobDescription',
      message: 'Job description cannot exceed 10,000 characters',
    });
  }

  return errors;
};

/**
 * Validate file size
 * @param fileSizeInBytes - File size in bytes
 * @param maxSizeInMB - Maximum allowed size in MB
 */
export const validateFileSize = (
  fileSizeInBytes: number,
  maxSizeInMB: number = 50
): string | null => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  if (fileSizeInBytes > maxSizeInBytes) {
    return `File size exceeds ${maxSizeInMB}MB limit. Current size: ${(
      fileSizeInBytes /
      (1024 * 1024)
    ).toFixed(2)}MB`;
  }

  return null;
};

/**
 * Validate file type
 */
export const validateFileType = (
  fileName: string,
  allowedExtensions: string[] = ['.pdf', '.doc', '.docx', '.txt']
): string | null => {
  const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    return `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`;
  }

  return null;
};

/**
 * Validate resume list
 */
export const validateResumeList = (resumes: any[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!resumes || resumes.length === 0) {
    errors.push({
      field: 'resumes',
      message: 'At least one resume is required for ranking',
    });
  }

  if (resumes.length > 100) {
    errors.push({
      field: 'resumes',
      message: 'Maximum 100 resumes can be ranked at once',
    });
  }

  return errors;
};

/**
 * Combined JD and resume validation for ranking
 */
export const validateRankingInputs = (
  jdData: any,
  resumes: any[]
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate JD
  if (!jdData) {
    errors.push({
      field: 'jobDescription',
      message: 'Job description is required',
    });
  } else if (!jdData.description && !jdData.name) {
    errors.push({
      field: 'jobDescription',
      message: 'Invalid job description format',
    });
  }

  // Validate resumes
  const resumeErrors = validateResumeList(resumes);
  errors.push(...resumeErrors);

  return errors;
};
