import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { uploadAndParseResume } from '../services/api';
import AuthHandler from '../services/authHandler';
import { Loader2, AlertCircle, RefreshCw, FileSearch } from 'lucide-react';
import { Button } from '../components/ui/button';
import { TopBar } from '../components/layout/TopBar';
import { motion } from 'motion/react';

export function Processing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addResume } = useResume();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Initializing...');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(1);
  const processingStartedRef = useRef(false);

  const files = location.state?.files as {name: string, size: number, dataUrl: string}[] | undefined;

  useEffect(() => {
    // Prevent duplicate processing in React Strict Mode
    if (processingStartedRef.current) {
      return;
    }

    if (!files || files.length === 0) {
      navigate('/upload');
      return;
    }

    processingStartedRef.current = true;
    setTotalFiles(files.length);

    const processFiles = async () => {
      try {
        // Get JWT token from localStorage
        let token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error("Not authenticated. Please login first.");
        }

        let lastParsedId = null;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Convert dataUrl to File object
          const blobPromise = fetch(file.dataUrl).then(res => res.blob());
          const blob = await blobPromise;
          const fileObj = new File([blob], file.name, { type: blob.type });
          
          setStatus(`Uploading and parsing ${file.name} (${i + 1}/${files.length})...`);
          
          try {
            // Call backend API to parse resume
            const parsedData = await uploadAndParseResume(fileObj, token);
            parsedData.fileName = file.name || "Scanned Resume";
            
            await addResume(parsedData);
            lastParsedId = parsedData.id;
            
            setProcessedCount(i + 1);
          } catch (fileError: any) {
            const errorMsg = fileError.message || String(fileError);
            
            // Check if it's an authentication error
            if (errorMsg.includes('Unauthorized') || errorMsg.includes('Invalid or expired token')) {
              // Try to refresh token once
              const newToken = await AuthHandler.refreshAccessToken();
              if (newToken) {
                token = newToken;
                try {
                  // Retry with new token
                  const parsedData = await uploadAndParseResume(fileObj, token);
                  parsedData.fileName = file.name || "Scanned Resume";
                  await addResume(parsedData);
                  lastParsedId = parsedData.id;
                  setProcessedCount(i + 1);
                } catch (retryError: any) {
                  console.error(`Error processing ${file.name} after token refresh:`, retryError);
                  setError('Your session has expired. Please login again.');
                  return;
                }
              } else {
                // Refresh failed, token will redirect to login automatically
                return;
              }
            } else {
              // Other error, continue with next file
              console.error(`Error processing ${file.name}:`, fileError);
              setStatus(`Skipped ${file.name} due to error. Continuing...`);
            }
          }
        }

        setStatus('Finalizing...');
        
        if (files.length === 1 && lastParsedId) {
          navigate(`/result/${lastParsedId}`);
        } else {
          navigate('/history');
        }
      } catch (err: any) {
        console.error(err);
        const errorMsg = err.message || "Failed to parse resume(s)";
        
        // Check for auth errors and redirect
        if (errorMsg.includes('Not authenticated') || errorMsg.includes('login')) {
          AuthHandler.redirectToLogin(errorMsg);
        } else {
          setError(errorMsg);
        }
      }
    };

    processFiles();
  }, [files, navigate, addResume]);

  if (error) {
    return (
      <motion.div 
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6 bg-[var(--color-background)] font-sans"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-6 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] rounded-full border-8 border-[var(--color-destructive)]/20"
        >
          <AlertCircle size={48} strokeWidth={1.5} />
        </motion.div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">Processing Failed</h2>
          <p className="text-[var(--color-muted-foreground)] font-medium">{error}</p>
        </div>
        <div className="flex gap-3 pt-4 w-full max-w-xs">
          <Button variant="outline" className="flex-1 rounded-xl h-12 font-semibold" onClick={() => navigate('/upload')}>Cancel</Button>
          <Button className="flex-1 rounded-xl h-12 font-semibold bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary)]/90" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </motion.div>
    );
  }

  const progressPercentage = totalFiles > 0 ? (processedCount / totalFiles) * 100 : 0;

  return (
    <motion.div 
      className="min-h-screen bg-[var(--color-background)] font-sans"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
    >
      <TopBar title="Processing" />
      <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] space-y-10 p-6 text-center">
        <div className="relative">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-[var(--color-primary)]/20 rounded-full blur-xl" 
          />
          <div className="relative p-8 bg-[var(--color-card)] shadow-sm border border-[var(--color-border)]/50 text-[var(--color-primary)] rounded-3xl">
            <FileSearch size={48} className="animate-pulse" strokeWidth={1.5} />
            <Loader2 size={24} className="animate-spin absolute bottom-4 right-4 text-[var(--color-primary)]" />
          </div>
        </div>
        
        <div className="space-y-3 max-w-sm">
          <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">
            {totalFiles > 1 ? `Analyzing Resumes (${processedCount}/${totalFiles})` : 'Analyzing Resume'}
          </h2>
          <p className="text-sm font-medium text-[var(--color-muted-foreground)] h-10 flex items-center justify-center">{status}</p>
        </div>

        <div className="w-full max-w-xs bg-[var(--color-secondary)]/50 h-2.5 rounded-full overflow-hidden border border-[var(--color-border)]/50">
          <motion.div 
            className="h-full bg-[var(--color-primary)] rounded-full" 
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
