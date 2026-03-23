import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, Image as ImageIcon, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { TopBar } from '../components/layout/TopBar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function Upload() {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file) {
      setIsReading(true);
      setUploadProgress(0);

      // Navigate to processing with the file object
      navigate('/processing', { state: { file: file, fileName: file.name } });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    if (isReading) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isReading) return;
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="pb-20 min-h-screen bg-[var(--color-background)]">
      <TopBar title="Upload Resume" showBack />

      <div className="p-4 max-w-md mx-auto space-y-6 relative">
        <div 
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-colors min-h-[300px] flex flex-col items-center justify-center space-y-4 relative overflow-hidden",
            dragActive ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--color-border)] hover:border-[var(--color-primary)]",
            isReading ? "pointer-events-none" : "cursor-pointer"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isReading && inputRef.current?.click()}
        >
          <AnimatePresence mode="wait">
            {isReading ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[var(--color-card)] z-20 flex flex-col items-center justify-center p-8"
              >
                <div className="relative w-20 h-20 mb-6">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke="var(--color-secondary)" 
                      strokeWidth="8" 
                    />
                    <motion.circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke="var(--color-primary)" 
                      strokeWidth="8"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: uploadProgress / 100 }}
                      transition={{ duration: 0.2 }}
                      style={{ rotate: -90, transformOrigin: "center" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[var(--color-primary)]">
                    {uploadProgress === 100 ? (
                      <CheckCircle2 size={32} className="animate-in zoom-in duration-300" />
                    ) : (
                      <span className="text-sm font-bold">{uploadProgress}%</span>
                    )}
                  </div>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-2"
                >
                  <h3 className="font-semibold text-lg">
                    {uploadProgress === 100 ? "Upload Complete" : "Uploading..."}
                  </h3>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {uploadProgress === 100 ? "Preparing to analyze..." : "Please wait while we process your file"}
                  </p>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center space-y-4 w-full"
              >
                <div className="p-4 bg-[var(--color-secondary)] rounded-full text-[var(--color-primary)]">
                  <UploadIcon size={32} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Upload Resume</h3>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Drag & drop or tap to browse
                  </p>
                </div>
                
                <div className="flex gap-2 text-xs text-[var(--color-muted-foreground)]">
                  <span className="bg-[var(--color-secondary)] px-2 py-1 rounded">PDF</span>
                  <span className="bg-[var(--color-secondary)] px-2 py-1 rounded">JPG</span>
                  <span className="bg-[var(--color-secondary)] px-2 py-1 rounded">PNG</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            onChange={handleChange}
            disabled={isReading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-24 flex flex-col gap-2" 
            onClick={() => inputRef.current?.click()}
            disabled={isReading}
          >
            <ImageIcon size={24} />
            <span>Gallery</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col gap-2" 
            onClick={() => inputRef.current?.click()}
            disabled={isReading}
          >
            <FileText size={24} />
            <span>Files</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
