import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { FileText, Clock, Search, Trash2, ChevronRight, Briefcase, Filter, X, CheckSquare, Square, Scale } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { TopBar } from '../components/layout/TopBar';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export function History() {
  const { resumes, deleteResume } = useResume();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clean up timer on unmount
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
    };
  }, []);

  const handleTouchStart = (id: string, e: React.TouchEvent | React.MouseEvent) => {
    if (isSelectionMode) return;
    pressTimer.current = setTimeout(() => {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      setIsSelectionMode(true);
      setSelectedIds([id]);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
    }
  };
  
  // Filter states
  const [minScore, setMinScore] = useState<number>(0);
  const [recommendationFilter, setRecommendationFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score_high' | 'score_low'>('newest');
  const [skillFilter, setSkillFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('All');
  const [educationFilter, setEducationFilter] = useState('All');

  const filteredResumes = useMemo(() => {
    let result = resumes.filter(r => 
      r.personalInfo.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.fileName.toLowerCase().includes(search.toLowerCase())
    );

    if (minScore > 0) {
      result = result.filter(r => (r.hrEvaluation?.matchScore || 0) >= minScore);
    }

    if (recommendationFilter !== 'All') {
      result = result.filter(r => r.hrEvaluation?.recommendation === recommendationFilter);
    }

    if (skillFilter.trim() !== '') {
      const searchSkills = skillFilter.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
      result = result.filter(r => {
        const resumeSkills = r.skills.map(s => s.toLowerCase());
        return searchSkills.every(searchSkill => resumeSkills.some(rs => rs.includes(searchSkill)));
      });
    }

    if (experienceFilter !== 'All') {
      result = result.filter(r => {
        let totalYears = 0;
        r.experience.forEach(exp => {
          const start = new Date(exp.startDate);
          const end = exp.endDate.toLowerCase() === 'present' ? new Date() : new Date(exp.endDate);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
             totalYears += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
          }
        });
        if (experienceFilter === '0-2 years') return totalYears <= 2;
        if (experienceFilter === '3-5 years') return totalYears > 2 && totalYears <= 5;
        if (experienceFilter === '5+ years') return totalYears > 5;
        return true;
      });
    }

    if (educationFilter !== 'All') {
      result = result.filter(r => {
        const degrees = r.education.map(e => e.degree.toLowerCase());
        if (educationFilter === 'Bachelors') {
          return degrees.some(d => d.includes('bachelor') || d.includes('b.s') || d.includes('b.a') || d.match(/\bbs\b/) || d.match(/\bba\b/));
        }
        if (educationFilter === 'Masters') {
          return degrees.some(d => d.includes('master') || d.includes('m.s') || d.includes('m.a') || d.match(/\bms\b/) || d.match(/\bma\b/) || d.includes('mba'));
        }
        if (educationFilter === 'PhD') {
          return degrees.some(d => d.includes('phd') || d.includes('doctorate') || d.includes('ph.d'));
        }
        return true;
      });
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      if (sortBy === 'oldest') return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      if (sortBy === 'score_high') return (b.hrEvaluation?.matchScore || 0) - (a.hrEvaluation?.matchScore || 0);
      if (sortBy === 'score_low') return (a.hrEvaluation?.matchScore || 0) - (b.hrEvaluation?.matchScore || 0);
      return 0;
    });

    return result;
  }, [resumes, search, minScore, recommendationFilter, sortBy, skillFilter, experienceFilter, educationFilter]);

  const clearFilters = () => {
    setMinScore(0);
    setRecommendationFilter('All');
    setSortBy('newest');
    setSkillFilter('');
    setExperienceFilter('All');
    setEducationFilter('All');
  };

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const activeFilterCount = (minScore > 0 ? 1 : 0) + 
    (recommendationFilter !== 'All' ? 1 : 0) + 
    (sortBy !== 'newest' ? 1 : 0) +
    (skillFilter.trim() !== '' ? 1 : 0) +
    (experienceFilter !== 'All' ? 1 : 0) +
    (educationFilter !== 'All' ? 1 : 0);

  return (
    <div className="pb-20 min-h-screen bg-[var(--color-background)] font-sans">
      <TopBar 
        title="Candidate History" 
        actions={
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedIds([]);
            }}
            className={`rounded-full ${isSelectionMode ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : ''}`}
          >
            {isSelectionMode ? <X size={18} className="mr-1" /> : <CheckSquare size={18} className="mr-1" />}
            {isSelectionMode ? 'Cancel' : 'Select'}
          </Button>
        }
      />
      
      <div className="p-5 max-w-md mx-auto space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" size={18} />
            <Input 
              placeholder="Search candidates..." 
              className="pl-11 h-12 rounded-2xl bg-[var(--color-card)] border-[var(--color-border)]/50 shadow-sm focus-visible:ring-[var(--color-primary)] text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            variant={activeFilterCount > 0 ? "default" : "outline"}
            className="h-12 w-12 rounded-2xl shrink-0 p-0 relative"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Card className="rounded-2xl border-[var(--color-border)] shadow-sm bg-[var(--color-card)] mb-4">
                <CardContent className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-sm">Filters</h3>
                    {activeFilterCount > 0 && (
                      <button onClick={clearFilters} className="text-xs text-[var(--color-primary)] font-medium hover:underline">
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--color-muted-foreground)]">Min Match Score: {minScore}%</label>
                    <input 
                      type="range" 
                      min="0" max="100" step="10"
                      value={minScore}
                      onChange={(e) => setMinScore(parseInt(e.target.value))}
                      className="w-full accent-[var(--color-primary)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--color-muted-foreground)]">Recommendation</label>
                    <div className="flex flex-wrap gap-2">
                      {['All', 'Strong Hire', 'Hire', 'Hold', 'Reject'].map(rec => (
                        <button
                          key={rec}
                          onClick={() => setRecommendationFilter(rec)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            recommendationFilter === rec 
                              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' 
                              : 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-border)]'
                          }`}
                        >
                          {rec}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--color-muted-foreground)]">Skills (comma separated)</label>
                    <Input 
                      placeholder="e.g. React, TypeScript" 
                      className="h-10 rounded-xl bg-[var(--color-card)] border-[var(--color-border)] text-sm"
                      value={skillFilter}
                      onChange={(e) => setSkillFilter(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--color-muted-foreground)]">Experience Level</label>
                    <div className="flex flex-wrap gap-2">
                      {['All', '0-2 years', '3-5 years', '5+ years'].map(exp => (
                        <button
                          key={exp}
                          onClick={() => setExperienceFilter(exp)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            experienceFilter === exp 
                              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' 
                              : 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-border)]'
                          }`}
                        >
                          {exp}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--color-muted-foreground)]">Education</label>
                    <div className="flex flex-wrap gap-2">
                      {['All', 'Bachelors', 'Masters', 'PhD'].map(edu => (
                        <button
                          key={edu}
                          onClick={() => setEducationFilter(edu)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            educationFilter === edu 
                              ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' 
                              : 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-border)]'
                          }`}
                        >
                          {edu}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[var(--color-muted-foreground)]">Sort By</label>
                    <select 
                      className="w-full h-10 px-3 rounded-xl border border-[var(--color-border)] text-sm bg-[var(--color-card)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="score_high">Highest Score</option>
                      <option value="score_low">Lowest Score</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredResumes.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 text-[var(--color-muted-foreground)] flex flex-col items-center justify-center space-y-4"
          >
            <div className="p-4 bg-[var(--color-secondary)]/50 rounded-full">
              <FileText size={32} className="text-[var(--color-muted-foreground)]/50" />
            </div>
            <p className="font-medium">No candidates found</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredResumes.map((resume, index) => {
              const isSelected = isSelectionMode && selectedIds.includes(resume.id);
              return (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <motion.div
                  animate={{ 
                    opacity: isSelectionMode && !isSelected ? 0.5 : 1,
                    scale: isSelected ? [1, 1.04, 1] : 1
                  }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`group relative overflow-hidden rounded-2xl border-[var(--color-border)]/50 shadow-sm hover:shadow-md transition-all duration-200 bg-[var(--color-card)] ${
                      isSelected ? 'ring-2 ring-[var(--color-primary)] border-[var(--color-primary)]' : ''
                    }`}
                    onClick={(e) => {
                    if (isSelectionMode) {
                      toggleSelection(resume.id, e as any);
                    }
                  }}
                  onTouchStart={(e) => handleTouchStart(resume.id, e)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchEnd}
                  onMouseDown={(e) => handleTouchStart(resume.id, e)}
                  onMouseUp={handleTouchEnd}
                  onMouseLeave={handleTouchEnd}
                >
                  <Link 
                    to={isSelectionMode ? '#' : `/result/${resume.id}`} 
                    className="block"
                    onClick={(e) => {
                      if (isSelectionMode) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        {isSelectionMode ? (
                          <div className="shrink-0 text-[var(--color-primary)]">
                            {isSelected ? (
                              <CheckSquare size={22} className="text-[var(--color-primary)]" />
                            ) : (
                              <Square size={22} className="text-[var(--color-muted-foreground)]" />
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-[var(--color-primary)]/10 rounded-xl text-[var(--color-primary)] shrink-0">
                            <FileText size={22} strokeWidth={2.5} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[var(--color-foreground)] truncate text-base">
                            {resume.personalInfo.fullName || "Untitled Candidate"}
                          </p>
                          <div className="flex items-center text-xs font-medium text-[var(--color-muted-foreground)] mt-1 gap-3">
                            {resume.experience.length > 0 && (
                              <div className="flex items-center gap-1 truncate">
                                <Briefcase size={12} className="shrink-0" />
                                <span className="truncate">{resume.experience[0].title}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 shrink-0">
                              <Clock size={12} />
                              <span>{new Date(resume.uploadDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <div className="flex flex-col items-end mr-2">
                          <span className="text-xs font-bold text-[var(--color-primary)]">Score</span>
                          <span className="text-sm font-black text-[var(--color-foreground)]">{resume.hrEvaluation?.matchScore || 0}%</span>
                        </div>
                        <ChevronRight size={20} className="text-[var(--color-muted-foreground)]/50" />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
                </motion.div>
              </motion.div>
            )})}
          </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {isSelectionMode && selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-0 right-0 px-5 z-40 flex justify-center"
          >
            <div className="w-full max-w-md bg-[var(--color-card)] border border-[var(--color-border)] shadow-xl shadow-[var(--color-primary)]/10 rounded-2xl p-2 flex gap-2">
              <Button 
                variant="destructive"
                className="flex-1 h-12 rounded-xl font-bold"
                onClick={() => setItemsToDelete(selectedIds)}
              >
                <Trash2 size={18} className="mr-2" />
                Delete ({selectedIds.length})
              </Button>
              {selectedIds.length >= 2 && (
                <Button 
                  className="flex-1 h-12 rounded-xl font-bold bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90"
                  onClick={() => navigate('/compare', { state: { ids: selectedIds } })}
                >
                  <Scale size={18} className="mr-2" />
                  Compare
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={itemsToDelete.length > 0}
        title="Delete Candidates"
        message={`Are you sure you want to delete ${itemsToDelete.length} candidate${itemsToDelete.length > 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={() => {
          itemsToDelete.forEach(id => deleteResume(id));
          setItemsToDelete([]);
          setSelectedIds([]);
          setIsSelectionMode(false);
        }}
        onCancel={() => setItemsToDelete([])}
      />
    </div>
  );
}
