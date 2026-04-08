import React from 'react';
import { useResume } from '../context/ResumeContext';
import { useTheme } from '../context/ThemeContext';
import { Key, Trash2, Shield, Info, Moon, Sun, Monitor, Bell, Globe, User, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { TopBar } from '../components/layout/TopBar';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useState } from 'react';

export function Settings() {
  const { apiKey, setApiKey, logout } = useResume();
  const { theme, setTheme } = useTheme();
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleClearData = () => {
    indexedDB.deleteDatabase('resume-parser-db');
    window.location.reload();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="pb-20 min-h-screen bg-[var(--color-background)] font-sans">
      <TopBar title="Settings" showBack />
      
      <div className="p-5 max-w-md mx-auto space-y-6">
        {/* Account */}
        <Card className="rounded-3xl border-[var(--color-border)]/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-[var(--color-secondary)]/30 pb-4 border-b border-[var(--color-border)]/50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <User size={20} className="text-[var(--color-primary)]" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-lg">
                HR
              </div>
              <div>
                <p className="font-semibold text-[var(--color-foreground)]">HR Professional</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">hr@example.com</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full rounded-xl h-12 font-semibold border-[var(--color-border)]/50" 
              onClick={() => setIsLogoutModalOpen(true)}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card className="rounded-3xl border-[var(--color-border)]/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-[var(--color-secondary)]/30 pb-4 border-b border-[var(--color-border)]/50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Monitor size={20} className="text-[var(--color-primary)]" />
              App Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-[var(--color-foreground)]">Appearance</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]' : 'border-[var(--color-border)]/50 text-[var(--color-muted-foreground)] hover:border-[var(--color-border)]'}`}
                >
                  <Sun size={20} className="mb-2" />
                  <span className="text-xs font-medium">Light</span>
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]' : 'border-[var(--color-border)]/50 text-[var(--color-muted-foreground)] hover:border-[var(--color-border)]'}`}
                >
                  <Moon size={20} className="mb-2" />
                  <span className="text-xs font-medium">Dark</span>
                </button>
                <button 
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]' : 'border-[var(--color-border)]/50 text-[var(--color-muted-foreground)] hover:border-[var(--color-border)]'}`}
                >
                  <Monitor size={20} className="mb-2" />
                  <span className="text-xs font-medium">System</span>
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--color-secondary)] rounded-lg text-[var(--color-muted-foreground)]">
                    <Bell size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-foreground)]">Notifications</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">Email & Push alerts</p>
                  </div>
                </div>
                <div className="w-11 h-6 bg-[var(--color-primary)] rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-[var(--color-card)] rounded-full"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--color-secondary)] rounded-lg text-[var(--color-muted-foreground)]">
                    <Globe size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-foreground)]">Language</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">English (US)</p>
                  </div>
                </div>
                <button className="text-xs font-medium text-[var(--color-primary)]">Change</button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[var(--color-border)]/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-[var(--color-secondary)]/30 pb-4 border-b border-[var(--color-border)]/50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Key size={20} className="text-[var(--color-primary)]" />
              API Configuration
            </CardTitle>
            <CardDescription className="font-medium">Manage your Gemini API key for parsing.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-[var(--color-foreground)]">Gemini API Key</label>
              <Input 
                type="password" 
                placeholder="Enter your Gemini API Key" 
                value={apiKey || ''}
                onChange={(e) => setApiKey(e.target.value)}
                className="rounded-xl h-12 bg-[var(--color-secondary)]/50 border-[var(--color-border)]/50 focus-visible:ring-[var(--color-primary)]"
              />
              <div className="flex gap-2 items-start text-xs font-medium text-[var(--color-muted-foreground)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] p-3 rounded-xl border border-[var(--color-primary)]/20">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p>
                  Leave empty to use the default system key (if available).
                  Your key is stored securely in your browser's local storage.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-[var(--color-border)]/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-[var(--color-secondary)]/30 pb-4 border-b border-[var(--color-border)]/50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Shield size={20} className="text-[var(--color-primary)]" />
              Data & Privacy
            </CardTitle>
            <CardDescription className="font-medium">Manage your local data and privacy settings.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="flex gap-3 items-start text-[var(--color-muted-foreground)] text-sm font-medium bg-[var(--color-secondary)]/30 p-4 rounded-2xl border border-[var(--color-border)]/50">
              <Shield size={20} className="shrink-0 text-[var(--color-primary)] mt-0.5" />
              <p>All processing happens locally or via direct API calls to Google. No data is sent to our servers.</p>
            </div>
            
            <Button 
              variant="destructive" 
              className="w-full rounded-xl h-12 font-semibold bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/20 hover:text-[var(--color-destructive)] border border-[var(--color-destructive)]/20 shadow-none" 
              onClick={() => setIsClearModalOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Clear All Local Data
            </Button>
          </CardContent>
        </Card>
        
        <div className="text-center text-xs font-medium text-[var(--color-muted-foreground)] pt-6 pb-4">
          <p>AI Resume Parser v1.0.0</p>
          <p className="mt-1 opacity-70">Designed for HR Professionals</p>
        </div>
      </div>

      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Clear All Data"
        message="Are you sure? This will delete all your saved resumes locally. This action cannot be undone."
        confirmText="Clear Data"
        onConfirm={handleClearData}
        onCancel={() => setIsClearModalOpen(false)}
      />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Sign Out"
        message="Are you sure you want to sign out? You will be returned to the login screen."
        confirmText="Sign Out"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
}
