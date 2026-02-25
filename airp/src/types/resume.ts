export interface ResumeData {
  id: string;
  fileName: string;
  uploadDate: string;
  status: 'processing' | 'completed' | 'failed';
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  skills: string[];
  experience: {
    id: string;
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  education: {
    id: string;
    degree: string;
    school: string;
    graduationDate: string;
  }[];
  languages: {
    language: string;
    proficiency: 'Native' | 'Fluent' | 'Intermediate' | 'Basic';
  }[];
}

export type Theme = 'light' | 'dark' | 'system';
