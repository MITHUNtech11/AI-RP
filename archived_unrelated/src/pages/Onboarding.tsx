import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
import { useResume } from '../context/ResumeContext';
import { Scan, FileText, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Scan,
    title: "Scan & Parse",
    description: "Instantly extract data from your resume using AI."
  },
  {
    icon: FileText,
    title: "Review & Edit",
    description: "Verify extracted details and make quick edits."
  },
  {
    icon: CheckCircle,
    title: "Export & Share",
    description: "Save as JSON or PDF and share with recruiters."
  }
];

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const { completeOnboarding } = useResume();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[var(--color-background)]">
      <div className="w-full max-w-md space-y-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col items-center space-y-6"
          >
            <div className="p-6 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              {(() => {
                const Icon = steps[currentStep].icon;
                return <Icon size={48} />;
              })()}
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">{steps[currentStep].title}</h1>
              <p className="text-[var(--color-muted-foreground)]">{steps[currentStep].description}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep ? "w-8 bg-[var(--color-primary)]" : "w-2 bg-[var(--color-input)]"
              }`}
            />
          ))}
        </div>

        <Button onClick={handleNext} className="w-full" size="lg">
          {currentStep === steps.length - 1 ? "Get Started" : "Next"}
        </Button>
      </div>
    </div>
  );
}
