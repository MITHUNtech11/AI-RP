import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { JobDescription } from '../types/resume';
import { parseJobDescriptionViaBackend } from '../services/api';

interface CreateRankingSessionProps {
  onJDParsed: (jd: JobDescription) => void;
}

const CreateRankingSession: React.FC<CreateRankingSessionProps> = ({ onJDParsed }) => {
  const [jdText, setJdText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedJD, setParsedJD] = useState<JobDescription | null>(null);
  const [uploadMode, setUploadMode] = useState<'text' | 'file'>('text');
  const [processingTime, setProcessingTime] = useState(0);

  const handleParseJDFromText = async () => {
    if (!jdText.trim()) {
      Alert.alert('Error', 'Please enter a job description');
      return;
    }

    setIsLoading(true);
    try {
      const startTime = Date.now();
      const result = await parseJobDescriptionViaBackend(jdText, true);
      const endTime = Date.now();
      setProcessingTime(endTime - startTime);

      setParsedJD(result);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to parse job description'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickJDFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];

        setIsLoading(true);
        try {
          const startTime = Date.now();
          
          // Read file and pass to backend
          let fileUri = file.uri;
          
          // For mobile, may need to copy file to accessible location
          if (Platform.OS !== 'web') {
            const base64Content = await FileSystem.readAsStringAsync(file.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            // Create a temporary file that we can reference
            fileUri = file.uri;
          }

          const result = await parseJobDescriptionViaBackend(
            fileUri,
            false,
            file.name,
            file.mimeType
          );
          const endTime = Date.now();
          setProcessingTime(endTime - startTime);

          setParsedJD(result);
        } catch (error) {
          Alert.alert(
            'Error',
            error instanceof Error ? error.message : 'Failed to parse job description file'
          );
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleProceedWithJD = () => {
    if (parsedJD) {
      onJDParsed(parsedJD);
    }
  };

  const renderJDPreview = () => {
    if (!parsedJD) return null;

    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Job Description Preview</Text>

        {/* Job Title */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionLabel}>Position</Text>
          <Text style={styles.sectionValue}>{parsedJD.job_title}</Text>
        </View>

        {/* Seniority Level */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionLabel}>Seniority Level</Text>
          <Text style={styles.sectionValue}>{parsedJD.seniority_level}</Text>
        </View>

        {/* Required Education */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionLabel}>Required Education</Text>
          <Text style={styles.sectionValue}>{parsedJD.required_education}</Text>
        </View>

        {/* Experience */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionLabel}>Minimum Experience</Text>
          <Text style={styles.sectionValue}>{parsedJD.minimum_experience_years} years</Text>
          {parsedJD.preferred_experience_years > 0 && (
            <Text style={styles.sectionNote}>
              Preferred: {parsedJD.preferred_experience_years} years
            </Text>
          )}
        </View>

        {/* Required Skills */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionLabel}>Required Skills ({parsedJD.required_skills.length})</Text>
          <View style={styles.skillsContainer}>
            {parsedJD.required_skills.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Employment Type */}
        {parsedJD.employment_type && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionLabel}>Employment Type</Text>
            <Text style={styles.sectionValue}>{parsedJD.employment_type}</Text>
          </View>
        )}

        {/* Processing Time */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionNote}>Parsed in {(processingTime / 1000).toFixed(2)}s</Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={handleProceedWithJD}
          disabled={isLoading}
        >
          <Text style={styles.proceedButtonText}>Next: Upload Resumes</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Recruitment Ranking</Text>
      <Text style={styles.subtitle}>Step 1: Upload Job Description</Text>

      {!parsedJD ? (
        <>
          {/* Upload Mode Selector */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, uploadMode === 'text' && styles.modeButtonActive]}
              onPress={() => setUploadMode('text')}
              disabled={isLoading}
            >
              <Text style={[styles.modeButtonText, uploadMode === 'text' && styles.modeButtonTextActive]}>
                Paste Text
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, uploadMode === 'file' && styles.modeButtonActive]}
              onPress={() => setUploadMode('file')}
              disabled={isLoading}
            >
              <Text style={[styles.modeButtonText, uploadMode === 'file' && styles.modeButtonTextActive]}>
                Upload File
              </Text>
            </TouchableOpacity>
          </View>

          {uploadMode === 'text' ? (
            <>
              {/* Text Input */}
              <TextInput
                style={styles.textInput}
                placeholder="Paste job description here..."
                placeholderTextColor="#999"
                multiline
                value={jdText}
                onChangeText={setJdText}
                editable={!isLoading}
              />

              {/* Parse Button */}
              <TouchableOpacity
                style={[styles.parseButton, isLoading && styles.disabledButton]}
                onPress={handleParseJDFromText}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.parseButtonText}>Parse Job Description</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* File Upload Button */}
              <TouchableOpacity
                style={[styles.fileButton, isLoading && styles.disabledButton]}
                onPress={handlePickJDFile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.fileButtonText}>📄 Pick PDF, DOCX, or Image</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.fileHint}>
                Supported formats: PDF, DOCX, JPG, PNG
              </Text>
            </>
          )}
        </>
      ) : null}

      {/* Preview */}
      {renderJDPreview()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  modeButtonActive: {
    backgroundColor: '#4CAF50',
  },
  modeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
    fontSize: 14,
  },
  parseButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  parseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  fileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  previewSection: {
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  sectionNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  skillTag: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  skillText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },
  proceedButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateRankingSession;
