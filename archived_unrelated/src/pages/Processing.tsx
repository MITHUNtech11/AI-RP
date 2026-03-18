import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { parseResumeWithGemini } from '../services/gemini';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { TopBar } from '../components/layout/TopBar';

export function Processing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addResume, apiKey } = useResume();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Initializing...');

  const fileData = location.state?.fileData;
  const fileName = location.state?.fileName;

  useEffect(() => {
    if (!fileData) {
      navigate('/upload');
      return;
    }

    const processFile = async () => {
      try {
        setStatus('Analyzing document structure...');
        // Extract mime type and base64 data
        const matches = fileData.match(/^data:(.+);base64,(.+)$/);
        if (!matches) throw new Error("Invalid file data");
        
        const mimeType = matches[1];
        const base64 = matches[2];
        
        // Use environment key or user provided key
        const key = apiKey || process.env.GEMINI_API_KEY;
        
        if (!key) {
          throw new Error("API Key missing. Please add it in Settings.");
        }

        setStatus('Extracting information with Gemini AI...');
        const parsedData = await parseResumeWithGemini(base64, key, mimeType);
        
        setStatus('Finalizing...');
        parsedData.fileName = fileName || "Scanned Resume";
        
        await addResume(parsedData);
        navigate(`/result/${parsedData.id}`);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to parse resume");
      }
    };

    processFile();
  }, [fileData, fileName, navigate, addResume, apiKey]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-4 bg-red-100 text-red-600 rounded-full">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-xl font-bold">Processing Failed</h2>
        <p className="text-[var(--color-muted-foreground)]">{error}</p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => navigate('/upload')}>Cancel</Button>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <TopBar title="Processing" />
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-8 p-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-[var(--color-primary)]/20 rounded-full animate-ping" />
          <div className="relative p-6 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full">
            <Loader2 size={48} className="animate-spin" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Scanning Resume</h2>
          <p className="text-[var(--color-muted-foreground)]">{status}</p>
        </div>

        <div className="w-full max-w-xs bg-[var(--color-secondary)] h-2 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-primary)] animate-progress origin-left" style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  );
}
