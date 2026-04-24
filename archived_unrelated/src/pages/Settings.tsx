import React, { useState, useEffect } from 'react';
import { useResume } from '../context/ResumeContext';
import { Server, Trash2, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { TopBar } from '../components/layout/TopBar';
import { getBackendUrl, testBackendConnection } from '../services/api';

export function Settings() {
  const { setApiKey } = useResume();
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [backendUrl, setBackendUrl] = useState(getBackendUrl());

  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testBackendConnection();
      setBackendConnected(isConnected);
    };
    checkConnection();
  }, []);

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
            <CardTitle className="text-lg">Backend Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-[var(--color-secondary)] rounded-lg">
                {backendConnected === null ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse mt-1" />
                    <span className="text-sm">Checking connection...</span>
                  </div>
                ) : backendConnected ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">Backend Connected</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{backendUrl}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">Backend Unreachable</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">Make sure the backend server is running</p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-[var(--color-muted-foreground)] flex items-start space-x-2">
                <Server size={14} className="mt-0.5 flex-shrink-0" />
                <span>All resume processing is handled by your backend server</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data & Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-2 text-[var(--color-muted-foreground)] text-sm">
              <Shield size={16} className="mt-0.5 flex-shrink-0" />
              <p>Resumes are uploaded to your backend for processing. Local copies are stored in your browser.</p>
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
          <p>AI Resume Parser v2.0.0 (Backend Mode)</p>
        </div>
      </div>
    </div>
  );
}
