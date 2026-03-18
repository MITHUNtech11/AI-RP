import React from 'react';
import { useResume } from '../context/ResumeContext';
import { Link } from 'react-router-dom';
import { Plus, FileText, Clock, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { TopBar } from '../components/layout/TopBar';

export function Home() {
  const { resumes } = useResume();
  const recentResumes = resumes.slice(0, 5);

  return (
    <div className="pb-20">
      <TopBar title="AI Resume Parser" />
      
      <div className="p-4 space-y-6 max-w-md mx-auto">
        {/* Quick Action */}
        <Card className="bg-gradient-to-br from-[var(--color-primary)] to-blue-600 text-white border-none">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Plus size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold">New Scan</h2>
              <p className="text-blue-100 text-sm">Upload or take a photo of a resume</p>
            </div>
            <Button asChild variant="secondary" className="w-full font-semibold text-[var(--color-primary)]">
              <Link to="/upload">Start Parsing</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Recent Scans</h3>
            <Link to="/history" className="text-sm text-[var(--color-primary)]">View All</Link>
          </div>

          {recentResumes.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted-foreground)] border-2 border-dashed border-[var(--color-border)] rounded-lg">
              <FileText className="mx-auto mb-2 opacity-50" size={32} />
              <p>No resumes yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentResumes.map((resume) => (
                <Link key={resume.id} to={`/result/${resume.id}`}>
                  <Card className="hover:bg-[var(--color-accent)] transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-[var(--color-secondary)] rounded-lg text-[var(--color-primary)]">
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{resume.personalInfo.fullName || "Untitled Resume"}</p>
                          <div className="flex items-center text-xs text-[var(--color-muted-foreground)] space-x-2">
                            <Clock size={12} />
                            <span>{new Date(resume.uploadDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-[var(--color-muted-foreground)]" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
