import React from 'react';
import { User, Settings as SettingsIcon } from 'lucide-react';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

export function Profile() {
  const navigate = useNavigate();

  return (
    <div className="pb-20 min-h-screen bg-[var(--color-background)] font-sans">
      <TopBar 
        title="Profile" 
        actions={
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="hover:bg-[var(--color-secondary)] rounded-full">
            <SettingsIcon size={20} className="text-[var(--color-foreground)]" />
          </Button>
        }
      />
      
      <div className="p-5 max-w-md mx-auto space-y-6">
        {/* Profile Section */}
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-[var(--color-primary)]/10 border-4 border-[var(--color-background)] shadow-sm flex items-center justify-center text-[var(--color-primary)] overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=e0e7ff" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <button className="absolute bottom-1 right-1 w-10 h-10 bg-[var(--color-card)] rounded-full border border-[var(--color-border)] shadow-sm flex items-center justify-center text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors">
              <User size={18} />
            </button>
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-[var(--color-foreground)]">Alex Morgan</h2>
            <p className="text-base font-medium text-[var(--color-muted-foreground)]">Senior HR Manager</p>
            <p className="text-sm text-[var(--color-muted-foreground)]/80">alex.morgan@company.com</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)]/50 shadow-sm text-center">
            <p className="text-3xl font-bold text-[var(--color-primary)]">142</p>
            <p className="text-xs font-medium text-[var(--color-muted-foreground)] mt-1">Resumes Scanned</p>
          </div>
          <div className="bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-border)]/50 shadow-sm text-center">
            <p className="text-3xl font-bold text-[var(--color-primary)]">28</p>
            <p className="text-xs font-medium text-[var(--color-muted-foreground)] mt-1">Shortlisted</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-bold text-[var(--color-foreground)]">Recent Activity</h3>
          <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]/50 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)]/50 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">Evaluated John Doe</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">Frontend Developer role</p>
              </div>
              <span className="text-xs font-medium text-[var(--color-muted-foreground)]">2h ago</span>
            </div>
            <div className="p-4 border-b border-[var(--color-border)]/50 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">Updated Job Description</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">Senior React Engineer</p>
              </div>
              <span className="text-xs font-medium text-[var(--color-muted-foreground)]">1d ago</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">Evaluated Jane Smith</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">Backend Developer role</p>
              </div>
              <span className="text-xs font-medium text-[var(--color-muted-foreground)]">2d ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
