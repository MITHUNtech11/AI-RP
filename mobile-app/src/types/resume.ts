import { ResumeData } from '../services/api';

export type { ResumeData };

// Job Description Types
export interface JobDescription {
  job_title: string;
  required_skills: string[];
  minimum_experience_years: number;
  preferred_experience_years?: number;
  required_education: string;
  seniority_level: string;
  key_responsibilities?: string[];
  benefits_summary?: string;
  industry?: string;
  employment_type?: string;
}

// Ranking Score Breakdown
export interface CandidateScoreBreakdown {
  skills: number;
  experience: number;
  job_title: number;
  education: number;
}

export interface CandidateScoreDetails {
  matched_skills: string[];
  missing_skills: string[];
  candidate_experience_years: number;
  jd_required_experience_years: number;
  candidate_education: string;
  jd_required_education: string;
  candidate_job_titles: string[];
}

export interface RankingResult {
  resume_index: number;
  candidate_name: string;
  overall_score: number;
  score_percentage: number;
  scores: CandidateScoreBreakdown;
  details: CandidateScoreDetails;
  reasoning: string;
  error?: string;
}

export interface RankingSession {
  id: string;
  jd: JobDescription;
  resumes: ResumeData[];
  rankings: RankingResult[];
  createdAt: string;
  processingTime: number;
}
