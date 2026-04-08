import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, Image as ImageIcon, FileText, CheckCircle2, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { TopBar } from '../components/layout/TopBar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function Upload() {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<{name: string, size: number, dataUrl: string}[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFiles = (files: FileList | File[]) => {
    const newFiles = Array.from(files);
    if (newFiles.length === 0) return;

    let loadedCount = 0;
    const filesData: {name: string, size: number, dataUrl: string}[] = [];

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        filesData.push({
          name: file.name,
          size: file.size,
          dataUrl: reader.result as string
        });
        loadedCount++;
        if (loadedCount === newFiles.length) {
          setSelectedFiles(prev => [...prev, ...filesData]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const startProcessing = () => {
    if (selectedFiles.length === 0) return;
    setIsReading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    setTimeout(() => {
      setUploadProgress(100);
      clearInterval(interval);
      
      // Delay to show 100% completion
      setTimeout(() => {
        navigate('/processing', { state: { files: selectedFiles } });
      }, 800);
    }, 1000);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="pb-20 min-h-screen bg-[var(--color-background)] font-sans">
      <TopBar title="Upload Resume(s)" showBack />

      <div className="p-5 max-w-md mx-auto space-y-6 relative">
        <div 
          className={cn(
            "border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200 min-h-[240px] flex flex-col items-center justify-center space-y-4 relative overflow-hidden bg-[var(--color-card)] shadow-sm",
            dragActive ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 scale-[1.02]" : "border-[var(--color-border)] hover:border-[var(--color-primary)]/50",
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 bg-[var(--color-card)] z-20 flex flex-col items-center justify-center p-6"
              >
                <div className="w-full max-w-sm bg-[var(--color-secondary)]/50 rounded-2xl p-5 shadow-sm border border-[var(--color-border)]">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="p-3 bg-[var(--color-card)] rounded-xl text-[var(--color-primary)] shadow-sm border border-[var(--color-border)]/50">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-[var(--color-foreground)] truncate">
                        Processing {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs font-medium text-[var(--color-muted-foreground)] mt-1">
                        {uploadProgress === 100 ? "Complete" : "Uploading..."}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {uploadProgress === 100 ? (
                        <CheckCircle2 size={20} className="text-emerald-500 animate-in zoom-in" />
                      ) : (
                        <span className="text-xs font-bold text-[var(--color-primary)]">{uploadProgress}%</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full h-2.5 bg-[var(--color-card)] rounded-full overflow-hidden border border-[var(--color-border)]/50">
                    <motion.div 
                      className={cn(
                        "h-full rounded-full",
                        uploadProgress === 100 ? "bg-emerald-500" : "bg-[var(--color-primary)]"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 text-sm font-medium text-[var(--color-muted-foreground)] animate-pulse"
                >
                  {uploadProgress === 100 ? "Preparing to analyze..." : "Reading documents securely..."}
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center space-y-5 w-full"
              >
                <div className="p-5 bg-[var(--color-secondary)] rounded-2xl text-[var(--color-primary)] shadow-sm">
                  <UploadIcon size={32} />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="font-bold text-lg text-[var(--color-foreground)]">Upload Resumes</h3>
                  <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
                    Tap to select files (multiple allowed)
                  </p>
                </div>
                
                <div className="flex gap-2 text-xs font-semibold text-[var(--color-muted-foreground)] mt-2">
                  <span className="bg-[var(--color-secondary)] px-2.5 py-1 rounded-lg border border-[var(--color-border)]/50">PDF</span>
                  <span className="bg-[var(--color-secondary)] px-2.5 py-1 rounded-lg border border-[var(--color-border)]/50">JPG</span>
                  <span className="bg-[var(--color-secondary)] px-2.5 py-1 rounded-lg border border-[var(--color-border)]/50">PNG</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf"
            multiple
            onChange={handleChange}
            disabled={isReading}
          />
        </div>

        {selectedFiles.length > 0 && !isReading && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
            <h4 className="text-sm font-semibold text-[var(--color-foreground)]">Selected Files ({selectedFiles.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText size={18} className="text-[var(--color-primary)] flex-shrink-0" />
                    <div className="truncate">
                      <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{file.name}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                    className="p-1.5 text-[var(--color-muted-foreground)] hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <Button 
              className="w-full h-12 rounded-xl font-semibold shadow-sm mt-4" 
              onClick={startProcessing}
            >
              Process {selectedFiles.length} Resume{selectedFiles.length !== 1 ? 's' : ''}
            </Button>
          </div>
        )}

        {!isReading && selectedFiles.length === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 rounded-2xl border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-secondary)] hover:border-[var(--color-primary)]/30 transition-all shadow-sm" 
              onClick={() => inputRef.current?.click()}
              disabled={isReading}
            >
              <ImageIcon size={24} className="text-[var(--color-primary)]" />
              <span className="font-medium">Gallery</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 rounded-2xl border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-secondary)] hover:border-[var(--color-primary)]/30 transition-all shadow-sm" 
              onClick={() => inputRef.current?.click()}
              disabled={isReading}
            >
              <FileText size={24} className="text-[var(--color-primary)]" />
              <span className="font-medium">Files</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
