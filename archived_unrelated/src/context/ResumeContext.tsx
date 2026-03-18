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
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [theme, setTheme] = useState<Theme>('light');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // Initialize DB
  useEffect(() => {
    const init = async () => {
      const db = await openDB('resume-parser-db', 1, {
        upgrade(db) {
          db.createObjectStore('resumes', { keyPath: 'id' });
        },
      });
      const allResumes = await db.getAll('resumes');
      setResumes(allResumes.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
    };
    init();

    // Load local storage settings
    const storedApiKey = localStorage.getItem('gemini_api_key');
    if (storedApiKey) setApiKey(storedApiKey);

    const onboarding = localStorage.getItem('onboarding_complete');
    if (onboarding === 'true') setIsOnboardingComplete(true);
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
      completeOnboarding
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
