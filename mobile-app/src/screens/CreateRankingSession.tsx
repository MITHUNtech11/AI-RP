import React, { useState } from 'react';
import {
  View,
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
import { validateJobDescription, validateFileType } from '../utils/validation';
import { THEME } from '../theme';
import { ThemedText } from '../components/ThemedText';

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
    // Validate input before making API call
    const errors = validateJobDescription(jdText);
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors[0].message);
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

        // Validate file type
        const fileTypeError = validateFileType(file.name || '', [
          '.pdf',
          '.doc',
          '.docx',
          '.jpg',
          '.jpeg',
          '.png',
        ]);
        if (fileTypeError) {
          Alert.alert('Invalid File Type', fileTypeError);
          return;
        }

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
        <ThemedText variant="h4" style={{ marginBottom: THEME.spacing.md }}>
          Job Description Preview
        </ThemedText>

        {/* Job Title */}
        <View style={styles.previewSection}>
          <ThemedText variant="caption" color={THEME.colors.textMuted} style={{ marginBottom: THEME.spacing.xs }}>
            POSITION
          </ThemedText>
          <ThemedText variant="bodyBold">{parsedJD.job_title}</ThemedText>
        </View>

        {/* Seniority Level */}
        <View style={styles.previewSection}>
          <ThemedText variant="caption" color={THEME.colors.textMuted} style={{ marginBottom: THEME.spacing.xs }}>
            SENIORITY LEVEL
          </ThemedText>
          <ThemedText variant="bodyBold">{parsedJD.seniority_level}</ThemedText>
        </View>

        {/* Required Education */}
        <View style={styles.previewSection}>
          <ThemedText variant="caption" color={THEME.colors.textMuted} style={{ marginBottom: THEME.spacing.xs }}>
            REQUIRED EDUCATION
          </ThemedText>
          <ThemedText variant="bodyBold">{parsedJD.required_education}</ThemedText>
        </View>

        {/* Experience */}
        <View style={styles.previewSection}>
          <ThemedText variant="caption" color={THEME.colors.textMuted} style={{ marginBottom: THEME.spacing.xs }}>
            MINIMUM EXPERIENCE
          </ThemedText>
          <ThemedText variant="bodyBold">{parsedJD.minimum_experience_years} years</ThemedText>
          {parsedJD.preferred_experience_years > 0 && (
            <ThemedText variant="caption" color={THEME.colors.text} style={{ marginTop: THEME.spacing.xs }}>
              Preferred: {parsedJD.preferred_experience_years} years
            </ThemedText>
          )}
        </View>

        {/* Required Skills */}
        <View style={styles.previewSection}>
          <ThemedText variant="caption" color={THEME.colors.textMuted} style={{ marginBottom: THEME.spacing.sm }}>
            REQUIRED SKILLS ({parsedJD.required_skills.length})
          </ThemedText>
          <View style={styles.skillsContainer}>
            {parsedJD.required_skills.map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <ThemedText variant="caption" color={THEME.colors.success}>{skill}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Employment Type */}
        {parsedJD.employment_type && (
          <View style={styles.previewSection}>
            <ThemedText variant="caption" color={THEME.colors.textMuted} style={{ marginBottom: THEME.spacing.xs }}>
              EMPLOYMENT TYPE
            </ThemedText>
            <ThemedText variant="bodyBold">{parsedJD.employment_type}</ThemedText>
          </View>
        )}

        {/* Processing Time */}
        <View style={styles.previewSection}>
          <ThemedText variant="caption" color={THEME.colors.textMuted}>
            Parsed in {(processingTime / 1000).toFixed(2)}s
          </ThemedText>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={handleProceedWithJD}
          disabled={isLoading}
        >
          <ThemedText variant="button" color="#fff">
            Next: Upload Resumes
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedText variant="h2" style={{ marginBottom: THEME.spacing.xs }}>
        Recruitment Ranking
      </ThemedText>
      <ThemedText variant="body" color={THEME.colors.textMuted} style={{ marginBottom: THEME.spacing.lg }}>
        Step 1: Upload Job Description
      </ThemedText>

      {!parsedJD ? (
        <>
          {/* Upload Mode Selector */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, uploadMode === 'text' && styles.modeButtonActive]}
              onPress={() => setUploadMode('text')}
              disabled={isLoading}
            >
              <ThemedText
                variant="body"
                color={uploadMode === 'text' ? '#fff' : THEME.colors.textMuted}
              >
                Paste Text
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, uploadMode === 'file' && styles.modeButtonActive]}
              onPress={() => setUploadMode('file')}
              disabled={isLoading}
            >
              <ThemedText
                variant="body"
                color={uploadMode === 'file' ? '#fff' : THEME.colors.textMuted}
              >
                Upload File
              </ThemedText>
            </TouchableOpacity>
          </View>

          {uploadMode === 'text' ? (
            <>
              {/* Text Input */}
              <TextInput
                style={styles.textInput}
                placeholder="Paste job description here..."
                placeholderTextColor={THEME.colors.textMuted}
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
                  <ThemedText variant="button" color="#fff">
                    Parse Job Description
                  </ThemedText>
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
                  <ThemedText variant="button" color="#fff">
                    📄 Pick PDF, DOCX, or Image
                  </ThemedText>
                )}
              </TouchableOpacity>

              <ThemedText variant="caption" color={THEME.colors.textMuted} align="center" style={{ marginBottom: THEME.spacing.lg }}>
                Supported formats: PDF, DOCX, JPG, PNG
              </ThemedText>
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
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.lg,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  modeButton: {
    flex: 1,
    padding: THEME.spacing.md,
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
  },
  modeButtonActive: {
    backgroundColor: THEME.colors.primary,
  },
  textInput: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    minHeight: 150,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    color: THEME.colors.text,
  },
  parseButton: {
    backgroundColor: THEME.colors.primary,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
    minHeight: 44,
  },
  disabledButton: {
    opacity: 0.6,
  },
  fileButton: {
    backgroundColor: THEME.colors.info,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    minHeight: 44,
  },
  previewContainer: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  previewSection: {
    marginBottom: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  skillTag: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  proceedButton: {
    backgroundColor: THEME.colors.primary,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    marginTop: THEME.spacing.lg,
    minHeight: 44,
  },
});

export default CreateRankingSession;
