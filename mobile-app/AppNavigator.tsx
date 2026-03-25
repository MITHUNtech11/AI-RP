import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ResumeParser from './App';
import CreateRankingSession from './src/screens/CreateRankingSession';
import BatchResumeUpload from './src/screens/BatchResumeUpload';
import RankingsResult from './src/screens/RankingsResult';
import { JobDescription, RankingSession } from './src/types/resume';

type Screen = 'home' | 'ranking_jd' | 'ranking_resumes' | 'ranking_results';

export default function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [currentJD, setCurrentJD] = useState<JobDescription | null>(null);
  const [currentSession, setCurrentSession] = useState<RankingSession | null>(null);

  const handleJDParsed = (jd: JobDescription) => {
    setCurrentJD(jd);
    setCurrentScreen('ranking_resumes');
  };

  const handleRankingComplete = (session: RankingSession) => {
    setCurrentSession(session);
    setCurrentScreen('ranking_results');
  };

  const handleNewSession = () => {
    setCurrentJD(null);
    setCurrentSession(null);
    setCurrentScreen('home');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleBackToJD = () => {
    setCurrentScreen('ranking_jd');
  };

  // Navigation bar
  const renderNavigation = () => {
    return (
      <View style={styles.navBar}>
        {currentScreen !== 'home' && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleBackToHome}
          >
            <Text style={styles.navButtonText}>← Back to Home</Text>
          </TouchableOpacity>
        )}

        {currentScreen === 'home' && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonActive]}
            onPress={() => setCurrentScreen('ranking_jd')}
          >
            <Text style={styles.navButtonText}>🎯 Start Ranking</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar />

      {/* Current Screen */}
      {currentScreen === 'home' && <ResumeParser />}

      {currentScreen === 'ranking_jd' && (
        <CreateRankingSession onJDParsed={handleJDParsed} />
      )}

      {currentScreen === 'ranking_resumes' && currentJD && (
        <BatchResumeUpload
          jd={currentJD}
          onRankingComplete={handleRankingComplete}
          onBack={handleBackToJD}
        />
      )}

      {currentScreen === 'ranking_results' && currentSession && (
        <RankingsResult session={currentSession} onNewSession={handleNewSession} />
      )}

      {/* Navigation */}
      {renderNavigation()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  navButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
