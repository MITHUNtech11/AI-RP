import React, { useState, useRef } from 'react';
import { useResume } from '../context/ResumeContext';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, FileText, Clock, ChevronRight, Briefcase, Users, Target, Search, Upload as UploadIcon, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { TopBar } from '../components/layout/TopBar';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { extractTextFromFile } from '../utils/fileParser';

export function Home() {
  const { resumes, jobDescription, setJobDescription } = useResume();
  const recentResumes = resumes.slice(0, 5);
  const [isEditingJd, setIsEditingJd] = useState(false);
  const [tempJd, setTempJd] = useState(jobDescription);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveJd = () => {
    setJobDescription(tempJd);
    setIsEditingJd(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setTempJd(text);
      setIsEditingJd(true);
    } catch (error) {
      console.error("Failed to extract text:", error);
      setAlertMessage("Failed to extract text from the file. Please try another file or paste the text manually.");
      setIsAlertOpen(true);
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="pb-20 bg-[var(--color-background)] min-h-screen">
      <TopBar title="Overview" />
      
      <div className="p-5 space-y-6 max-w-md mx-auto">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">Dashboard</h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Manage your recruitment pipeline</p>
          </div>
          <div className="h-10 w-10 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center text-[var(--color-primary)]">
            <Users size={20} />
          </div>
        </div>

        {/* Quick Action */}
        <Card className="bg-[var(--color-primary)] text-[var(--color-primary-foreground)] border-none shadow-lg shadow-[var(--color-primary)]/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
          <CardContent className="p-6 flex flex-col items-start space-y-4 relative z-10">
            <div className="flex items-center gap-3 w-full">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold leading-tight">New Candidate</h2>
                <p className="text-[var(--color-primary-foreground)]/80 text-xs">AI-powered resume evaluation</p>
              </div>
            </div>
            <Button asChild variant="secondary" className="w-full font-medium text-[var(--color-primary)] bg-white hover:bg-white/90 border-0 shadow-sm rounded-xl h-11">
              <Link to="/upload">
                <Plus size={18} className="mr-2" />
                Scan Resume
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Job Description Section */}
        <Card className="border-[var(--color-border)] shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 bg-[var(--color-secondary)]/30 border-b border-[var(--color-border)]">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-[var(--color-foreground)]">
              <Briefcase size={18} className="text-[var(--color-primary)]" />
              Active Job Description
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
            />
            {isEditingJd ? (
              <div className="space-y-3">
                <textarea
                  className="w-full min-h-[120px] p-3 text-sm border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none resize-y bg-[var(--color-card)]"
                  placeholder="Paste the job description here..."
                  value={tempJd}
                  onChange={(e) => setTempJd(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => {
                    setTempJd(jobDescription);
                    setIsEditingJd(false);
                  }}>Cancel</Button>
                  <Button size="sm" className="rounded-lg shadow-sm" onClick={handleSaveJd}>Save JD</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {jobDescription ? (
                  <div className="text-sm text-[var(--color-secondary-foreground)] bg-[var(--color-secondary)]/50 p-4 rounded-xl line-clamp-3 leading-relaxed border border-[var(--color-border)]/50">
                    {jobDescription}
                  </div>
                ) : (
                  <div className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200/50 dark:border-amber-800/50 flex items-start gap-3">
                    <div className="mt-0.5"><Briefcase size={16} className="text-amber-500" /></div>
                    <p>No Job Description set. Tap to upload a file or draft one to automatically evaluate candidates.</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] h-10 font-medium" onClick={() => setIsEditingJd(true)}>
                    {jobDescription ? "Edit Draft" : "Draft JD"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-secondary)] h-10 font-medium" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                  >
                    {isExtracting ? (
                      <><Loader2 size={16} className="mr-2 animate-spin" /> Reading...</>
                    ) : (
                      <><UploadIcon size={16} className="mr-2" /> Select File</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-semibold text-lg text-[var(--color-foreground)]">Recent Candidates</h3>
            <Link to="/history" className="text-sm font-medium text-[var(--color-primary)] hover:underline flex items-center">
              View All <ChevronRight size={14} className="ml-0.5" />
            </Link>
          </div>

          {recentResumes.length === 0 ? (
            <div className="text-center py-10 bg-[var(--color-card)] border border-dashed border-[var(--color-border)] rounded-2xl">
              <div className="w-12 h-12 bg-[var(--color-secondary)] rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="text-[var(--color-muted-foreground)]" size={20} />
              </div>
              <p className="text-[var(--color-foreground)] font-medium">No candidates yet</p>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Scan a resume to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentResumes.map((resume, index) => (
                <motion.div 
                  key={resume.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to={`/result/${resume.id}`} className="block group">
                    <Card className="border-[var(--color-border)] shadow-sm hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all duration-200 rounded-2xl overflow-hidden bg-[var(--color-card)]">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4 overflow-hidden">
                          <div className="p-2.5 bg-[var(--color-secondary)] group-hover:bg-[var(--color-primary)]/10 transition-colors rounded-xl text-[var(--color-primary)] shrink-0">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--color-foreground)] truncate text-sm">
                              {resume.personalInfo.fullName || "Untitled Candidate"}
                            </p>
                            <div className="flex items-center text-xs text-[var(--color-muted-foreground)] mt-1.5 gap-2">
                              {resume.hrEvaluation ? (
                                <span className={`px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
                                  resume.hrEvaluation.matchScore >= 80 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' :
                                  resume.hrEvaluation.matchScore >= 60 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' :
                                  'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400'
                                }`}>
                                  <Target size={10} />
                                  {resume.hrEvaluation.matchScore}% Match
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md font-medium bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]">
                                  Unscored
                                </span>
                              )}
                              <span className="flex items-center gap-1 opacity-75">
                                <Clock size={10} />
                                {new Date(resume.uploadDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition-colors shrink-0 ml-2" />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isAlertOpen}
        title="Extraction Failed"
        message={alertMessage}
        confirmText="OK"
        isAlert={true}
        onConfirm={() => setIsAlertOpen(false)}
        onCancel={() => setIsAlertOpen(false)}
      />
    </div>
  );
}
