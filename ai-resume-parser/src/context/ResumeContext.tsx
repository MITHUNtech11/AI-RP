import React, { createContext, useContext, useState, useEffect } from 'react';
import { ResumeData, Theme } from '../types/resume';
import { openDB } from 'idb';

interface ResumeContextType {
  resumes: ResumeData[];
  addResume: (resume: ResumeData) => void;
  updateResume: (id: string, data: Partial<ResumeData>) => void;
  deleteResume: (id: string) => void;
  getResume: (id: string) => ResumeData | undefined;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  isOnboardingComplete: boolean;
  completeOnboarding: () => void;
  logout: () => void;
  jobDescription: string;
  setJobDescription: (jd: string) => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

const MOCK_RESUMES: ResumeData[] = [
  {
    id: "mock-123",
    fileName: "alex_turner_resume.pdf",
    uploadDate: new Date().toISOString(),
    status: "completed",
    personalInfo: {
      fullName: "Alex Turner",
      email: "alex.turner@example.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      linkedin: "linkedin.com/in/alex-turner",
      website: "alexturner.dev"
    },
    summary: "Senior Frontend Engineer with 7+ years of experience building scalable web applications. Passionate about UX/UI, performance optimization, and mentoring junior developers.",
    skills: ["React", "TypeScript", "Node.js", "GraphQL", "Tailwind CSS", "Figma", "Jest", "AWS"],
    experience: [
      {
        id: "exp-1",
        title: "Senior Frontend Engineer",
        company: "TechNova Solutions",
        startDate: "Jan 2021",
        endDate: "Present",
        description: "Lead the frontend development of the core SaaS product. Improved performance by 40% and mentored a team of 5 developers."
      },
      {
        id: "exp-2",
        title: "Frontend Developer",
        company: "Creative Web Agency",
        startDate: "Mar 2018",
        endDate: "Dec 2020",
        description: "Developed responsive websites for various clients. Collaborated closely with designers to implement pixel-perfect UIs."
      }
    ],
    education: [
      {
        id: "edu-1",
        degree: "B.S. Computer Science",
        school: "University of California, Berkeley",
        graduationDate: "May 2017"
      }
    ],
    languages: [
      { language: "English", proficiency: "Native" },
      { language: "Spanish", proficiency: "Intermediate" }
    ],
    hrEvaluation: {
      matchScore: 85,
      recommendation: "Strong Hire",
      evaluationSummary: "Alex is a very strong candidate for the Senior Frontend role. They have extensive experience with our core stack (React, TypeScript) and a proven track record of leadership. The only minor gap is a lack of explicit Vue.js experience, but their strong React background makes this a non-issue.",
      matchingSkills: ["React", "TypeScript", "Tailwind CSS", "Mentorship", "Performance Optimization"],
      missingSkills: ["Vue.js", "Docker"]
    }
  },
  {
    id: "mock-124",
    fileName: "sarah_jenkins_cv.docx",
    uploadDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    status: "completed",
    personalInfo: {
      fullName: "Sarah Jenkins",
      email: "s.jenkins@email.com",
      phone: "+1 (555) 987-6543",
      location: "Austin, TX",
      linkedin: "linkedin.com/in/sarahjenkins",
    },
    summary: "Mid-level Full Stack Developer transitioning from a backend-heavy role. Eager to learn and contribute to user-facing applications.",
    skills: ["Java", "Spring Boot", "MySQL", "JavaScript", "HTML", "CSS", "Git"],
    experience: [
      {
        id: "exp-3",
        title: "Backend Developer",
        company: "Enterprise Systems Inc.",
        startDate: "Jun 2019",
        endDate: "Present",
        description: "Maintained legacy Java applications and developed new REST APIs using Spring Boot."
      }
    ],
    education: [
      {
        id: "edu-2",
        degree: "B.A. Information Technology",
        school: "University of Texas",
        graduationDate: "Dec 2018"
      }
    ],
    languages: [
      { language: "English", proficiency: "Native" }
    ],
    hrEvaluation: {
      matchScore: 45,
      recommendation: "Reject",
      evaluationSummary: "Sarah has a solid backend background but lacks the necessary modern frontend skills (React, TypeScript) required for this role. Her experience is too heavily skewed towards Java/Spring Boot.",
      matchingSkills: ["JavaScript", "HTML", "CSS"],
      missingSkills: ["React", "TypeScript", "Tailwind CSS", "Figma", "Mentorship"]
    }
  },
  {
    id: "mock-125",
    fileName: "michael_chen_resume.pdf",
    uploadDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    status: "completed",
    personalInfo: {
      fullName: "Michael Chen",
      email: "mchen.dev@example.com",
      phone: "+1 (555) 456-7890",
      location: "Remote",
      linkedin: "linkedin.com/in/michaelchen",
      website: "mchen.io"
    },
    summary: "Frontend Developer with 3 years of experience specializing in React and Vue.js. Passionate about creating accessible and performant web interfaces.",
    skills: ["React", "Vue.js", "JavaScript", "CSS3", "SASS", "Redux", "Webpack", "Docker"],
    experience: [
      {
        id: "exp-4",
        title: "UI Developer",
        company: "StartupX",
        startDate: "Aug 2021",
        endDate: "Present",
        description: "Built and maintained multiple Vue.js and React applications. Implemented a new design system that reduced development time by 20%."
      }
    ],
    education: [
      {
        id: "edu-3",
        degree: "B.S. Software Engineering",
        school: "Washington University",
        graduationDate: "May 2021"
      }
    ],
    languages: [
      { language: "English", proficiency: "Native" },
      { language: "Mandarin", proficiency: "Fluent" }
    ],
    hrEvaluation: {
      matchScore: 68,
      recommendation: "Hold",
      evaluationSummary: "Michael is a promising mid-level developer with good React and Vue.js experience (which is a plus). However, he lacks TypeScript experience and the seniority/mentorship background we are looking for in this specific role. Worth keeping on hold if we open a mid-level position.",
      matchingSkills: ["React", "Vue.js", "Docker", "CSS3"],
      missingSkills: ["TypeScript", "Tailwind CSS", "Mentorship", "Senior Leadership"]
    }
  }
];

const MOCK_JD = "We are looking for a Senior Frontend Engineer to join our core product team. The ideal candidate will have deep expertise in React and TypeScript, a strong eye for design (Tailwind CSS, Figma), and experience mentoring junior developers. Experience with Vue.js and Docker is a plus but not strictly required. You will be responsible for architecting scalable UI components and optimizing web performance.";

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [theme, setTheme] = useState<Theme>('light');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [jobDescription, setJobDescriptionState] = useState('');

  // Initialize DB
  useEffect(() => {
    const init = async () => {
      const db = await openDB('resume-parser-db', 1, {
        upgrade(db) {
          db.createObjectStore('resumes', { keyPath: 'id' });
        },
      });
      let allResumes = await db.getAll('resumes');
      
      // Inject mock data if missing
      let addedMocks = false;
      for (const mock of MOCK_RESUMES) {
        if (!allResumes.find(r => r.id === mock.id)) {
          await db.put('resumes', mock);
          allResumes.push(mock);
          addedMocks = true;
        }
      }
      
      setResumes(allResumes.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
    };
    init();

    // Load local storage settings
    const storedApiKey = localStorage.getItem('gemini_api_key');
    if (storedApiKey) setApiKey(storedApiKey);

    const onboarding = localStorage.getItem('onboarding_complete');
    if (onboarding === 'true') setIsOnboardingComplete(true);

    const storedJd = localStorage.getItem('hr_job_description');
    if (storedJd) {
      setJobDescriptionState(storedJd);
    } else {
      setJobDescriptionState(MOCK_JD);
      localStorage.setItem('hr_job_description', MOCK_JD);
    }
  }, []);

  // Theme effect - Force Light
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
  }, []);

  const addResume = async (resume: ResumeData) => {
    const db = await openDB('resume-parser-db', 1);
    await db.put('resumes', resume);
    setResumes(prev => [resume, ...prev]);
  };

  const updateResume = async (id: string, data: Partial<ResumeData>) => {
    const db = await openDB('resume-parser-db', 1);
    const existing = await db.get('resumes', id);
    if (existing) {
      const updated = { ...existing, ...data };
      await db.put('resumes', updated);
      setResumes(prev => prev.map(r => r.id === id ? updated : r));
    }
  };

  const deleteResume = async (id: string) => {
    const db = await openDB('resume-parser-db', 1);
    await db.delete('resumes', id);
    setResumes(prev => prev.filter(r => r.id !== id));
  };

  const getResume = (id: string) => resumes.find(r => r.id === id);

  const handleSetApiKey = (key: string | null) => {
    setApiKey(key);
    if (key) localStorage.setItem('gemini_api_key', key);
    else localStorage.removeItem('gemini_api_key');
  };

  const completeOnboarding = () => {
    setIsOnboardingComplete(true);
    localStorage.setItem('onboarding_complete', 'true');
  };

  const logout = () => {
    setIsOnboardingComplete(false);
    localStorage.removeItem('onboarding_complete');
  };

  const setJobDescription = (jd: string) => {
    setJobDescriptionState(jd);
    localStorage.setItem('hr_job_description', jd);
  };

  return (
    <ResumeContext.Provider value={{
      resumes,
      addResume,
      updateResume,
      deleteResume,
      getResume,
      theme,
      setTheme,
      apiKey,
      setApiKey: handleSetApiKey,
      isOnboardingComplete,
      completeOnboarding,
      logout,
      jobDescription,
      setJobDescription
    }}>
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
}
