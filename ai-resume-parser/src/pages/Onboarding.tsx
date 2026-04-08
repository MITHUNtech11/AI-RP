import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useResume } from '../context/ResumeContext';
import { Scan, FileText, CheckCircle, ArrowRight, Mail, Lock, User, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { login, signup } from '../services/api';

const steps = [
  {
    id: 'step-1',
    icon: Scan,
    title: "AI-Powered Parsing",
    description: "Instantly extract and structure data from candidate resumes using advanced AI models.",
    color: "bg-blue-500/10 text-blue-600",
    iconColor: "text-blue-600"
  },
  {
    id: 'step-2',
    icon: FileText,
    title: "Smart Evaluation",
    description: "Automatically compare candidate profiles against your job requirements for instant matching.",
    color: "bg-purple-500/10 text-purple-600",
    iconColor: "text-purple-600"
  },
  {
    id: 'step-3',
    icon: CheckCircle,
    title: "Seamless Management",
    description: "Keep track of all applicants, compare candidates, and make hiring decisions faster.",
    color: "bg-emerald-500/10 text-emerald-600",
    iconColor: "text-emerald-600"
  }
];

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAuthMode, setIsAuthMode] = useState(false);
  const [authType, setAuthType] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const { completeOnboarding } = useResume();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsAuthMode(true);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);

    try {
      let response;
      
      if (authType === 'signup') {
        response = await signup(email, password, fullName);
      } else {
        response = await login(email, password);
      }

      // Store the JWT token in localStorage
      localStorage.setItem('access_token', response.access_token);
      
      // Mark onboarding as complete
      completeOnboarding();
    } catch (error: any) {
      setAuthError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthMode) {
    return (
      <div className="flex flex-col min-h-screen bg-[var(--color-background)] font-sans">
        <div className="flex-1 flex flex-col justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm mx-auto space-y-8"
          >
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-4">
                <Sparkles size={32} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
                {authType === 'login' ? 'Welcome back' : 'Create an account'}
              </h1>
              <p className="text-[var(--color-muted-foreground)]">
                {authType === 'login' 
                  ? 'Enter your details to access your dashboard' 
                  : 'Sign up to start managing your candidates'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authError && (
                <div className="flex gap-3 p-4 bg-red-500/10 text-red-600 rounded-xl border border-red-500/20">
                  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{authError}</p>
                </div>
              )}

              {authType === 'signup' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" size={18} />
                    <Input 
                      required 
                      placeholder="John Doe" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={isLoading}
                      className="pl-10 h-12 rounded-xl bg-[var(--color-card)] border-[var(--color-border)]" 
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-foreground)]">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" size={18} />
                  <Input 
                    required 
                    type="email" 
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-12 rounded-xl bg-[var(--color-card)] border-[var(--color-border)]" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-foreground)]">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" size={18} />
                  <Input 
                    required 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 h-12 rounded-xl bg-[var(--color-card)] border-[var(--color-border)]" 
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 rounded-xl text-base font-semibold mt-6"
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {authType === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="text-center">
              <button 
                onClick={() => {
                  setAuthType(authType === 'login' ? 'signup' : 'login');
                  setAuthError('');
                }}
                disabled={isLoading}
                className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-50"
              >
                {authType === 'login' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-background)] font-sans overflow-hidden">
      <div className="flex-1 flex flex-col justify-between p-6 max-w-md mx-auto w-full">
        
        <div className="flex justify-end pt-4">
          <button 
            onClick={() => setIsAuthMode(true)}
            className="text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          >
            Skip
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col items-center text-center w-full absolute top-1/2 -translate-y-1/2 left-0"
            >
              <div className="relative mb-12">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className={`absolute inset-0 ${steps[currentStep].color} blur-3xl rounded-full scale-150 opacity-50`} 
                />
                <div className={`relative p-8 rounded-3xl bg-[var(--color-card)] shadow-xl border border-[var(--color-border)]/50 ${steps[currentStep].iconColor}`}>
                  {(() => {
                    const Icon = steps[currentStep].icon;
                    return <Icon size={64} strokeWidth={1.5} />;
                  })()}
                </div>
              </div>
              
              <div className="space-y-4 px-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl font-extrabold tracking-tight text-[var(--color-foreground)]"
                >
                  {steps[currentStep].title}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-base font-medium text-[var(--color-muted-foreground)] leading-relaxed"
                >
                  {steps[currentStep].description}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="space-y-8 pb-8 pt-12 z-10">
          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-500 ease-out ${
                  index === currentStep ? "w-8 bg-[var(--color-primary)]" : "w-2 bg-[var(--color-border)]"
                }`}
              />
            ))}
          </div>

          <Button 
            onClick={handleNext} 
            className="w-full h-14 rounded-2xl text-lg font-semibold shadow-lg shadow-[var(--color-primary)]/20 group relative overflow-hidden" 
            size="lg"
          >
            <span className="relative z-10 flex items-center justify-center">
              {currentStep === steps.length - 1 ? "Get Started" : "Continue"}
              {currentStep < steps.length - 1 && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
