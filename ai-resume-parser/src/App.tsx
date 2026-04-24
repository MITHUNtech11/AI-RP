/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { ResumeProvider, useResume } from './context/ResumeContext';
import { ThemeProvider } from './context/ThemeContext';
import { BottomNav } from './components/layout/BottomNav';

const Onboarding = lazy(() => import('./pages/Onboarding').then((m) => ({ default: m.Onboarding })));
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Upload = lazy(() => import('./pages/Upload').then((m) => ({ default: m.Upload })));
const Processing = lazy(() => import('./pages/Processing').then((m) => ({ default: m.Processing })));
const Result = lazy(() => import('./pages/Result').then((m) => ({ default: m.Result })));
const History = lazy(() => import('./pages/History').then((m) => ({ default: m.History })));
const Compare = lazy(() => import('./pages/Compare').then((m) => ({ default: m.Compare })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));

function RouteLoader() {
  return (
    <div className="min-h-screen pb-16 bg-[var(--color-background)] text-[var(--color-foreground)] flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
    </div>
  );
}

function AppContent() {
  const { isOnboardingComplete } = useResume();
  const location = useLocation();

  if (!isOnboardingComplete) {
    return (
      <Suspense fallback={<RouteLoader />}>
        <Onboarding />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] pb-16 font-sans">
      <AnimatePresence mode="wait">
        <Suspense fallback={<RouteLoader />}>
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
        </Suspense>
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

