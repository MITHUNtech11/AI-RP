/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { ResumeProvider, useResume } from './context/ResumeContext';
import { ThemeProvider } from './context/ThemeContext';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Upload } from './pages/Upload';
import { Processing } from './pages/Processing';
import { Result } from './pages/Result';
import { History } from './pages/History';
import { Compare } from './pages/Compare';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { BottomNav } from './components/layout/BottomNav';

function AppContent() {
  const { isOnboardingComplete } = useResume();
  const location = useLocation();

  if (!isOnboardingComplete) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] pb-16 font-sans">
      <AnimatePresence mode="wait">
        <Routes key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/processing" element={<Processing />} />
          <Route path="/result/:id" element={<Result />} />
          <Route path="/history" element={<History />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <ResumeProvider>
        <Router>
          <AppContent />
        </Router>
      </ResumeProvider>
    </ThemeProvider>
  );
}

