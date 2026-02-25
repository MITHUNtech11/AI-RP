import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { ResumeData } from '../types/resume';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { TopBar } from '../components/layout/TopBar';
import { Save, Share2, Download, Trash2, Plus, X } from 'lucide-react';
import jsPDF from 'jspdf';

export function Result() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getResume, updateResume, deleteResume } = useResume();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'skills'>('personal');

  useEffect(() => {
    if (id) {
      const data = getResume(id);
      if (data) setResume(data);
      else navigate('/');
    }
  }, [id, getResume, navigate]);

  if (!resume) return null;

  const handleSave = () => {
    if (resume) {
      updateResume(resume.id, resume);
      alert('Saved successfully!');
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

    doc.save(`${resume.personalInfo.fullName}_resume.pdf`);
  };

  const updateField = (section: keyof ResumeData, value: any) => {
    setResume(prev => prev ? ({ ...prev, [section]: value }) : null);
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setResume(prev => prev ? ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }) : null);
  };

  return (
    <div className="pb-24 min-h-screen bg-[var(--color-background)]">
      <TopBar 
        title="Edit Resume" 
        showBack 
        actions={
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Save size={20} />
          </Button>
        }
      />

      <div className="sticky top-14 z-10 bg-[var(--color-background)] border-b border-[var(--color-border)] overflow-x-auto no-scrollbar">
        <div className="flex p-2 space-x-2 min-w-max">
          {['personal', 'experience', 'skills'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab 
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' 
                  : 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {activeTab === 'personal' && (
          <Card>
            <CardHeader>
              <CardTitle>Personal Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input 
                  value={resume.personalInfo.fullName} 
                  onChange={(e) => updatePersonalInfo('fullName', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input 
                  value={resume.personalInfo.email} 
                  onChange={(e) => updatePersonalInfo('email', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input 
                  value={resume.personalInfo.phone} 
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input 
                  value={resume.personalInfo.location} 
                  onChange={(e) => updatePersonalInfo('location', e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Summary</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-[var(--color-muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50"
                  value={resume.summary} 
                  onChange={(e) => updateField('summary', e.target.value)} 
                />
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'experience' && (
          <div className="space-y-4">
            {resume.experience.map((exp, index) => (
              <Card key={exp.id || index}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <Input 
                      className="font-bold text-lg border-none px-0 h-auto focus-visible:ring-0" 
                      value={exp.title} 
                      onChange={(e) => {
                        const newExp = [...resume.experience];
                        newExp[index].title = e.target.value;
                        updateField('experience', newExp);
                      }}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 h-6 w-6"
                      onClick={() => {
                        const newExp = resume.experience.filter((_, i) => i !== index);
                        updateField('experience', newExp);
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                  <Input 
                    className="text-sm text-[var(--color-muted-foreground)] border-none px-0 h-auto focus-visible:ring-0" 
                    value={exp.company}
                    onChange={(e) => {
                      const newExp = [...resume.experience];
                      newExp[index].company = e.target.value;
                      updateField('experience', newExp);
                    }}
                  />
                  <div className="flex gap-2">
                    <Input 
                      className="text-xs w-24" 
                      value={exp.startDate}
                      onChange={(e) => {
                        const newExp = [...resume.experience];
                        newExp[index].startDate = e.target.value;
                        updateField('experience', newExp);
                      }}
                    />
                    <span className="text-[var(--color-muted-foreground)]">-</span>
                    <Input 
                      className="text-xs w-24" 
                      value={exp.endDate}
                      onChange={(e) => {
                        const newExp = [...resume.experience];
                        newExp[index].endDate = e.target.value;
                        updateField('experience', newExp);
                      }}
                    />
                  </div>
                  <textarea 
                    className="w-full text-sm bg-transparent border rounded p-2 min-h-[60px]"
                    value={exp.description}
                    onChange={(e) => {
                      const newExp = [...resume.experience];
                      newExp[index].description = e.target.value;
                      updateField('experience', newExp);
                    }}
                  />
                </CardContent>
              </Card>
            ))}
            <Button 
              variant="outline" 
              className="w-full border-dashed"
              onClick={() => {
                updateField('experience', [...resume.experience, {
                  id: crypto.randomUUID(),
                  title: "Job Title",
                  company: "Company",
                  startDate: "",
                  endDate: "",
                  description: ""
                }]);
              }}
            >
              <Plus size={16} className="mr-2" /> Add Experience
            </Button>
          </div>
        )}

        {activeTab === 'skills' && (
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, index) => (
                  <div key={index} className="flex items-center bg-[var(--color-secondary)] rounded-full px-3 py-1">
                    <span className="text-sm">{skill}</span>
                    <button 
                      className="ml-2 text-[var(--color-muted-foreground)] hover:text-red-500"
                      onClick={() => {
                        const newSkills = resume.skills.filter((_, i) => i !== index);
                        updateField('skills', newSkills);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center">
                  <Input 
                    placeholder="Add skill..." 
                    className="h-8 w-32 text-sm rounded-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          updateField('skills', [...resume.skills, val]);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="pt-6 space-y-3">
          <Button className="w-full" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" className="w-full text-red-500 hover:text-red-600" onClick={() => {
            if (confirm('Are you sure you want to delete this resume?')) {
              deleteResume(resume.id);
              navigate('/');
            }
          }}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete Resume
          </Button>
        </div>
      </div>
    </div>
  );
}
