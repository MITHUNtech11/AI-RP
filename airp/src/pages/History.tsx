import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { FileText, Clock, Search, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { TopBar } from '../components/layout/TopBar';

export function History() {
  const { resumes, deleteResume } = useResume();
  const [search, setSearch] = useState('');

  const filteredResumes = resumes.filter(r => 
    r.personalInfo.fullName.toLowerCase().includes(search.toLowerCase()) ||
    r.fileName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-20 min-h-screen bg-[var(--color-background)]">
      <TopBar title="History" />
      
      <div className="p-4 max-w-md mx-auto space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-[var(--color-muted-foreground)]" size={16} />
          <Input 
            placeholder="Search resumes..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredResumes.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-muted-foreground)]">
            <p>No resumes found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredResumes.map((resume) => (
              <Card key={resume.id} className="group relative overflow-hidden">
                <Link to={`/result/${resume.id}`} className="block">
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
                  </CardContent>
                </Link>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm('Delete this resume?')) {
                      deleteResume(resume.id);
                    }
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
