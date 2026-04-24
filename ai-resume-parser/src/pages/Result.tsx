import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { ResumeData } from '../types/resume';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { TopBar } from '../components/layout/TopBar';
import { Save, Download, Trash2, Plus, X, CheckCircle2, XCircle, AlertTriangle, MapPin, Mail, Phone, ExternalLink, Briefcase, GraduationCap, Award, FileText, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { motion } from 'motion/react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

export function Result() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getResume, updateResume, deleteResume } = useResume();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [activeTab, setActiveTab] = useState<'evaluation' | 'personal' | 'experience' | 'skills' | 'notes'>('evaluation');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    if (id) {
      const data = getResume(id);
      if (data) {
        setResume(data);
        setNotes(data.hrNotes || '');
        if (!data.hrEvaluation) {
          setActiveTab('personal');
        }
      }
      else navigate('/');
    }
  }, [id, getResume, navigate]);

  if (!resume) return null;

  const handleSaveNotes = async () => {
    if (!resume) return;
    setIsSavingNotes(true);
    try {
      await updateResume(resume.id, { hrNotes: notes });
      setTimeout(() => setIsSavingNotes(false), 500);
    } catch (error) {
      console.error("Failed to save notes:", error);
      setIsSavingNotes(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(resume.personalInfo.fullName, 20, 20);
    doc.setFontSize(12);
    doc.text(resume.personalInfo.email, 20, 30);
    doc.text(resume.personalInfo.phone, 20, 35);
    
    doc.setFontSize(16);
    doc.text("Experience", 20, 50);
    let y = 60;
    resume.experience.forEach(exp => {
      doc.setFontSize(12);
      doc.text(`${exp.title} at ${exp.company}`, 20, y);
      y += 5;
      doc.setFontSize(10);
      doc.text(`${exp.startDate} - ${exp.endDate}`, 20, y);
      y += 10;
    });

    doc.save(`${resume.personalInfo.fullName.replace(/\s+/g, '_')}_resume.pdf`);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', ring: 'ring-emerald-500' };
    if (score >= 60) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', ring: 'ring-amber-500' };
    return { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', ring: 'ring-rose-500' };
  };

  const getRecommendationIcon = (rec: string) => {
    switch(rec) {
      case 'Strong Hire':
      case 'Hire':
        return <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={20} />;
      case 'Hold':
        return <AlertTriangle className="text-amber-600 dark:text-amber-400" size={20} />;
      case 'Reject':
        return <XCircle className="text-rose-600 dark:text-rose-400" size={20} />;
      default:
        return null;
    }
  };

  const scoreColors = resume.hrEvaluation ? getScoreColor(resume.hrEvaluation.matchScore) : null;

  return (
    <motion.div 
      className="pb-24 min-h-screen bg-[var(--color-background)] font-sans"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
    >
      <TopBar 
        title="Candidate Profile" 
        showBack 
      />

      {/* Profile Header */}
      <div className="bg-[var(--color-card)] border-b border-[var(--color-border)] pt-6 pb-4 px-5">
        <div className="max-w-md mx-auto flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">{resume.personalInfo.fullName || "Unknown Candidate"}</h1>
            <p className="text-[var(--color-muted-foreground)] font-medium mt-1">
              {resume.experience[0]?.title || "Candidate"}
            </p>
            <div className="flex flex-wrap gap-y-2 gap-x-4 mt-3 text-sm text-[var(--color-muted-foreground)]">
              {resume.personalInfo.location && (
                <span className="flex items-center gap-1.5"><MapPin size={14} /> {resume.personalInfo.location}</span>
              )}
              {resume.personalInfo.email && (
                <span className="flex items-center gap-1.5"><Mail size={14} /> {resume.personalInfo.email}</span>
              )}
            </div>
          </div>
          {resume.hrEvaluation && scoreColors && (
            <div className="flex flex-col items-center justify-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4 ${scoreColors.border} ${scoreColors.text} ${scoreColors.bg}`}>
                {resume.hrEvaluation.matchScore}
              </div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-muted-foreground)] mt-1.5">Match</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-10 bg-[var(--color-background)]/80 backdrop-blur-md border-b border-[var(--color-border)] overflow-x-auto no-scrollbar">
        <div className="flex p-2 space-x-1 max-w-md mx-auto min-w-max">
          {resume.hrEvaluation && (
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'evaluation' 
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm' 
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)]'
              }`}
            >
              Evaluation
            </button>
          )}
          {['personal', 'experience', 'skills', 'notes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab 
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm' 
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 max-w-md mx-auto space-y-6">
        {activeTab === 'evaluation' && resume.hrEvaluation && scoreColors && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Visual Match Score Gauge */}
            <Card className="border-[var(--color-border)] shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {/* Background Circle */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-[var(--color-secondary)]"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 - (resume.hrEvaluation.matchScore / 100) * (2 * Math.PI * 40)}`}
                      strokeLinecap="round"
                      className={`${scoreColors.text} transition-all duration-1000 ease-out`}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className={`text-3xl font-black ${scoreColors.text}`}>
                      {resume.hrEvaluation.matchScore}%
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-muted-foreground)]">
                      Match
                    </span>
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-[var(--color-foreground)]">Overall Fit</h3>
              </CardContent>
            </Card>

            {/* Recommendation Banner */}
            <div className={`flex items-start gap-3 p-4 rounded-2xl border ${scoreColors.border} ${scoreColors.bg}`}>
              <div className="mt-0.5 shrink-0">{getRecommendationIcon(resume.hrEvaluation.recommendation)}</div>
              <div>
                <h3 className={`font-bold ${scoreColors.text}`}>Recommendation: {resume.hrEvaluation.recommendation}</h3>
                <p className="text-sm text-[var(--color-secondary-foreground)] mt-1 leading-relaxed">
                  {resume.hrEvaluation.evaluationSummary}
                </p>
              </div>
            </div>

            {/* Skills Analysis */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="border-[var(--color-border)] shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/50 pb-3">
                  <CardTitle className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 size={16} /> Matching Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {resume.hrEvaluation.matchingSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {resume.hrEvaluation.matchingSkills.map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium border border-emerald-200 dark:border-emerald-800/50">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-muted-foreground)]">No matching skills found.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-[var(--color-border)] shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/50 pb-3">
                  <CardTitle className="text-sm font-semibold text-rose-800 dark:text-rose-400 flex items-center gap-2">
                    <XCircle size={16} /> Missing Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {resume.hrEvaluation.missingSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {resume.hrEvaluation.missingSkills.map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-medium border border-rose-200 dark:border-rose-800/50">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--color-muted-foreground)]">No critical skills missing.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'personal' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-[var(--color-border)] shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-[var(--color-border)]">
                <CardTitle className="text-base font-semibold">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">Full Name</label>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">{resume.personalInfo.fullName || 'N/A'}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">Email</label>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">{resume.personalInfo.email || 'N/A'}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">Phone</label>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">{resume.personalInfo.phone || 'N/A'}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">Location</label>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">{resume.personalInfo.location || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--color-border)] shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-[var(--color-border)]">
                <CardTitle className="text-base font-semibold">Professional Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-[var(--color-foreground)] leading-relaxed whitespace-pre-wrap">
                  {resume.summary || 'No summary provided.'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative border-l-2 border-[var(--color-border)] ml-3 space-y-8 pb-4">
              {resume.experience.map((exp, index) => (
                <div key={exp.id || index} className="relative pl-6">
                  {/* Timeline dot */}
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[var(--color-card)] border-2 border-[var(--color-primary)]"></div>
                  
                  <Card className="border-[var(--color-border)] shadow-sm rounded-2xl overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-base text-[var(--color-foreground)]">{exp.title || 'Untitled Role'}</h3>
                      </div>
                      
                      <div className="flex items-center gap-2 text-[var(--color-primary)]">
                        <Briefcase size={14} />
                        <span className="text-sm font-medium">{exp.company || 'Unknown Company'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-secondary)]/50 w-fit px-2 py-1 rounded-md">
                        <span>{exp.startDate || 'N/A'}</span>
                        <span>-</span>
                        <span>{exp.endDate || 'N/A'}</span>
                      </div>
                      
                      <p className="w-full text-sm text-[var(--color-foreground)] leading-relaxed whitespace-pre-wrap">
                        {exp.description || 'No description provided.'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-[var(--color-border)] shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-[var(--color-border)]">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Award size={18} className="text-[var(--color-primary)]" />
                  Technical & Soft Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="flex flex-wrap gap-2.5">
                  {resume.skills.map((skill, index) => (
                    <div key={index} className="flex items-center bg-[var(--color-secondary)] border border-[var(--color-border)] rounded-xl px-3 py-1.5 transition-colors">
                      <span className="text-sm font-medium text-[var(--color-secondary-foreground)]">{skill}</span>
                    </div>
                  ))}
                  {resume.skills.length === 0 && (
                    <p className="text-sm text-[var(--color-muted-foreground)]">No skills listed.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-[var(--color-border)] shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-[var(--color-border)]">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText size={18} className="text-[var(--color-primary)]" />
                  Private HR Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <textarea
                  className="w-full min-h-[200px] p-3 text-sm border border-[var(--color-border)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none resize-y bg-[var(--color-card)]"
                  placeholder="Add private notes about this candidate..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <Button 
                  className="w-full rounded-xl h-11 font-medium shadow-sm"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                >
                  {isSavingNotes ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSavingNotes ? 'Saving...' : 'Save Notes'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="pt-8 space-y-3">
          <Button className="w-full rounded-xl h-12 font-medium shadow-sm" onClick={handleExportPDF}>
            <Download className="mr-2 h-5 w-5" /> Export PDF Report
          </Button>
          <Button variant="outline" className="w-full rounded-xl h-12 font-medium text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-800/50" onClick={() => setIsDeleteModalOpen(true)}>
            <Trash2 className="mr-2 h-5 w-5" /> Delete Candidate
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Candidate"
        message="Are you sure you want to delete this candidate? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => {
          deleteResume(resume.id);
          navigate('/');
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </motion.div>
  );
}
