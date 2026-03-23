import React, { createContext, useContext, useState, useEffect } from 'react';
import { ResumeData } from '../types/resume';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ResumeContextType {
  resumes: ResumeData[];
  addResume: (resume: ResumeData) => Promise<void>;
  updateResume: (id: string, data: Partial<ResumeData>) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  getResume: (id: string) => ResumeData | undefined;
  isLoading: boolean;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load resumes from AsyncStorage on mount
  useEffect(() => {
    const loadResumes = async () => {
      try {
        const stored = await AsyncStorage.getItem('parsed_resumes');
        if (stored) {
          setResumes(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load resumes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResumes();
  }, []);

  // Save resumes to AsyncStorage whenever they change
  useEffect(() => {
    const saveResumes = async () => {
      try {
        await AsyncStorage.setItem('parsed_resumes', JSON.stringify(resumes));
      } catch (error) {
        console.error('Failed to save resumes:', error);
      }
    };

    if (!isLoading) {
      saveResumes();
    }
  }, [resumes, isLoading]);

  const addResume = async (resume: ResumeData) => {
    setResumes((prev) => [resume, ...prev]);
  };

  const updateResume = async (id: string, data: Partial<ResumeData>) => {
    setResumes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r))
    );
  };

  const deleteResume = async (id: string) => {
    setResumes((prev) => prev.filter((r) => r.id !== id));
  };

  const getResume = (id: string) => resumes.find((r) => r.id === id);

  return (
    <ResumeContext.Provider
      value={{
        resumes,
        addResume,
        updateResume,
        deleteResume,
        getResume,
        isLoading,
      }}
    >
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
