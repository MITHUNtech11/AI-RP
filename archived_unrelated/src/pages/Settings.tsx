import React from 'react';
import { useResume } from '../context/ResumeContext';
import { Key, Trash2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { TopBar } from '../components/layout/TopBar';

export function Settings() {
  const { apiKey, setApiKey } = useResume();

  const handleClearData = () => {
    if (confirm('Are you sure? This will delete all your saved resumes locally.')) {
      indexedDB.deleteDatabase('resume-parser-db');
      window.location.reload();
    }
  };

  return (
    <div className="pb-20 min-h-screen bg-[var(--color-background)]">
      <TopBar title="Settings" />
      
      <div className="p-4 max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">API Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-medium">
                <Key size={16} />
                <label>Gemini API Key</label>
              </div>
              <Input 
                type="password" 
                placeholder="Enter your Gemini API Key" 
                value={apiKey || ''}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Leave empty to use the default system key (if available).
                Your key is stored locally in your browser.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 text-[var(--color-muted-foreground)] text-sm">
              <Shield size={16} />
              <p>All processing happens locally or via direct API calls to Google. No data is sent to our servers.</p>
            </div>
            
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={handleClearData}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Clear All Data
            </Button>
          </CardContent>
        </Card>
        
        <div className="text-center text-xs text-[var(--color-muted-foreground)] pt-4">
          <p>AI Resume Parser v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
