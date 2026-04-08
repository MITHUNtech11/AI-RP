import React, { useMemo } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { TopBar } from '../components/layout/TopBar';
import { Card, CardContent } from '../components/ui/card';
import { Target, Briefcase, GraduationCap, Code } from 'lucide-react';
import { motion } from 'motion/react';

export function Compare() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resumes } = useResume();
  const ids = location.state?.ids as string[] || [];

  const candidates = useMemo(() => {
    return resumes.filter(r => ids.includes(r.id));
  }, [resumes, ids]);

  if (candidates.length < 2) {
    return <Navigate to="/history" replace />;
  }

  return (
    <div className="pb-20 min-h-screen bg-[var(--color-background)] font-sans">
      <TopBar title="Compare Candidates" showBack />
      
      <div className="p-5 max-w-md mx-auto space-y-6">
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-5 px-5 hide-scrollbar">
          {candidates.map((candidate, index) => (
            <motion.div 
              key={candidate.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="snap-center shrink-0 w-[85%] max-w-[300px]"
            >
              <Card className="h-full border-[var(--color-border)] shadow-md bg-[var(--color-card)] overflow-hidden rounded-3xl">
                <div className="bg-[var(--color-secondary)]/30 p-5 border-b border-[var(--color-border)]/50 text-center">
                  <div className="w-16 h-16 mx-auto bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full flex items-center justify-center text-xl font-bold mb-3">
                    {candidate.personalInfo.fullName?.charAt(0) || '?'}
                  </div>
                  <h3 className="font-bold text-lg text-[var(--color-foreground)] truncate">
                    {candidate.personalInfo.fullName || "Untitled"}
                  </h3>
                  <p className="text-sm text-[var(--color-muted-foreground)] truncate mt-1">
                    {candidate.experience[0]?.title || "No title"}
                  </p>
                </div>
                
                <CardContent className="p-5 space-y-6">
                  {/* Score */}
                  <div className="text-center">
                    <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-2">Match Score</p>
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-[var(--color-primary)]/20 relative">
                      <span className="text-2xl font-black text-[var(--color-primary)]">
                        {candidate.hrEvaluation?.matchScore || 0}%
                      </span>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider flex items-center gap-1">
                      <Target size={14} /> Recommendation
                    </p>
                    <div className="font-medium text-sm p-3 bg-[var(--color-secondary)]/50 rounded-xl border border-[var(--color-border)]/50">
                      {candidate.hrEvaluation?.recommendation || "Not evaluated"}
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider flex items-center gap-1">
                      <Briefcase size={14} /> Experience
                    </p>
                    <div className="text-sm text-[var(--color-foreground)] space-y-2">
                      {candidate.experience.slice(0, 2).map((exp, i) => (
                        <div key={i} className="p-3 bg-[var(--color-secondary)]/30 rounded-xl border border-[var(--color-border)]/30">
                          <p className="font-semibold truncate">{exp.title}</p>
                          <p className="text-xs text-[var(--color-muted-foreground)] truncate">{exp.company}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider flex items-center gap-1">
                      <Code size={14} /> Top Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.slice(0, 5).map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-md text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 5 && (
                        <span className="px-2 py-1 bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] rounded-md text-xs font-medium">
                          +{candidate.skills.length - 5}
                        </span>
                      )}
                    </div>
                  </div>

                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center text-xs text-[var(--color-muted-foreground)]">
          Swipe horizontally to compare candidates
        </div>
      </div>
    </div>
  );
}
