import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { BACKEND_URL } from './src/services/api';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ResumeProvider } from './src/context/ResumeContext';
import { useFileUpload } from './src/hooks/useFileUpload';
import { UploadSection } from './src/components/UploadSection';
import { ResumeDisplay } from './src/components/ResumeDisplay';
import { initializeHttpClient } from './src/services/httpConfig';
import { THEME } from './src/theme';

// Beautiful color scheme
const COLORS = {
  primary: '#6366F1', // Indigo
  secondary: '#EC4899', // Pink
  success: '#10B981', // Green
  warning: '#F59E0B', // Amber
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#1E293B',
  textLight: '#64748B',
  border: '#E2E8F0',
};

function AppInner() {
  const [error, setError] = useState<string>('');
  const {
    fileUri,
    fileName,
    loading,
    resumeData,
    uploadProgress,
    pickImage,
    pickDocument,
    uploadFile,
    resetFile,
  } = useFileUpload();

  // Initialize HTTP client with interceptors and retry policies
  useEffect(() => {
    initializeHttpClient({
      apiKey: process.env.REACT_APP_BACKEND_API_KEY,
      verbose: __DEV__, // Enable verbose logging in dev mode
      enableLogging: true,
      enableErrorRecovery: true,
      enablePerformanceMonitoring: true,
      enableStatusValidation: true,
    });
  }, []);

  const testBackendConnection = async () => {
    console.log('=== TESTING BACKEND CONNECTION ===');
    try {
      const url = `${BACKEND_URL}/docs`;
      console.log('Attempting to reach:', url);
      
      const response = await fetch(url);
      console.log('Response Status:', response.status);
      console.log('Backend is REACHABLE ✓');
      Alert.alert('Success', 'Backend is reachable!');
    } catch (err: any) {
      console.log('Connection failed:', err.message);
      Alert.alert('Connection Failed', err.message || 'Cannot reach backend');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>📄</Text>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Resume Parser</Text>
            <Text style={styles.headerSubtitle}>
              {resumeData ? 'Parsing Complete!' : 'Upload & Extract Data'}
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.testButton}
          onPress={testBackendConnection}
        >
          <Text style={styles.testButtonText}>🔌 Test Connection</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {error}</Text>
            <TouchableOpacity
              style={styles.errorDismissButton}
              onPress={() => setError('')}
            >
              <Text style={styles.errorDismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!resumeData ? (
          <UploadSection
            fileName={fileName}
            loading={loading}
            fileUri={fileUri}
            uploadProgress={uploadProgress}
            onPickImage={pickImage}
            onPickDocument={pickDocument}
            onUpload={uploadFile}
            onReset={resetFile}
          />
        ) : (
          <ResumeDisplay resumeData={resumeData} onNewResume={resetFile} />
        )}
      </ScrollView>

      {/* Action Button at Bottom */}
      {resumeData && (
        <View style={styles.bottomAction}>
          <TouchableOpacity style={styles.newParseButton} onPress={resetFile}>
            <Text style={styles.newParseButtonText}>📄 Parse Another Resume</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ResumeProvider>
        <AppInner />
      </ResumeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    fontFamily: THEME.typography.fontFamilyBold,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E0E7FF',
    opacity: 0.9,
    fontFamily: THEME.typography.fontFamily,
  },

  testButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 12,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    fontFamily: THEME.typography.fontFamilySemiBold,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  // Error State
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 12,
    fontFamily: THEME.typography.fontFamilySemiBold,
  },
  errorDismissButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  errorDismissText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    fontFamily: THEME.typography.fontFamilySemiBold,
  },

  // Bottom Action
  bottomAction: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  newParseButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  newParseButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    fontFamily: THEME.typography.fontFamilyBold,
  },
});
