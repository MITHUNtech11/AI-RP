import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { ResumeData, JobDescription, RankingSession } from '../types/resume';
import { parseResumeViaBackend, rankCandidatesViaBackend } from '../services/api';
import { THEME } from '../theme';
import { ThemedText } from '../components/ThemedText';
import { IconPresets } from '../components/FeatherIcon';

interface BatchResumeUploadProps {
  jd: JobDescription;
  onRankingComplete: (session: RankingSession) => void;
  onBack: () => void;
}

const BatchResumeUpload: React.FC<BatchResumeUploadProps> = ({
  jd,
  onRankingComplete,
  onBack,
}) => {
  const [selectedResumes, setSelectedResumes] = useState<ResumeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentlyParsing, setCurrentlyParsing] = useState<number | null>(null);

  const handleAddResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/*',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        setCurrentlyParsing(selectedResumes.length);
        setIsLoading(true);

        try {
          const resume = await parseResumeViaBackend(
            file.uri,
            file.name,
            file.mimeType
          );

          setSelectedResumes([...selectedResumes, resume]);
          Alert.alert('Success', `${file.name} added to queue`);
        } catch (error) {
          Alert.alert(
            'Error',
            error instanceof Error ? error.message : 'Failed to parse resume'
          );
        } finally {
          setIsLoading(false);
          setCurrentlyParsing(null);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick resume file');
    }
  };

  const handleRemoveResume = (index: number) => {
    Alert.alert(
      'Remove Resume',
      'Are you sure you want to remove this resume?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Remove',
          onPress: () => {
            setSelectedResumes(selectedResumes.filter((_, i) => i !== index));
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleAnalyzeResumes = async () => {
    if (selectedResumes.length === 0) {
      Alert.alert('Error', 'Please add at least one resume');
      return;
    }

    setIsLoading(true);
    try {
      const startTime = Date.now();
      
      // Call ranking endpoint
      const result = await rankCandidatesViaBackend(jd, selectedResumes);
      
      const endTime = Date.now();

      // Create ranking session
      const session: RankingSession = {
        id: Math.random().toString(36).substr(2, 9),
        jd,
        resumes: selectedResumes,
        rankings: result.results,
        createdAt: new Date().toISOString(),
        processingTime: endTime - startTime,
      };

      onRankingComplete(session);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to rank candidates'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderResumeItem = ({ item, index }: { item: ResumeData; index: number }) => (
    <View style={styles.resumeItem}>
      <View style={styles.resumeInfo}>
        <ThemedText variant="bodyBold" numberOfLines={1}>
          {item.personalInfo?.fullName || item.fileName || 'Unknown'}
        </ThemedText>
        <ThemedText variant="caption" color={THEME.colors.textMuted}>
          {item.fileName}
        </ThemedText>
        {item.personalInfo?.email && (
          <ThemedText variant="caption" color={THEME.colors.textLight}>
            {item.personalInfo.email}
          </ThemedText>
        )}
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveResume(index)}
      >
        <ThemedText color={THEME.colors.danger} weight="700">
          ✕
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} disabled={isLoading}>
            <ThemedText variant="bodyBold" color={THEME.colors.primary}>← Back</ThemedText>
          </TouchableOpacity>
          <ThemedText variant="h3" align="center" style={{ flex: 1 }}>Upload Resumes</ThemedText>
          <View style={{ width: 30 }} />
        </View>

        <ThemedText variant="body" color={THEME.colors.textMuted} style={styles.subtitle}>
          Step 2: Select Candidate Resumes
        </ThemedText>

        {/* JD Summary */}
        <View style={styles.jdSummary}>
          <ThemedText variant="h4" color={THEME.colors.primary} style={{ marginBottom: THEME.spacing.sm }}>
            {jd.job_title}
          </ThemedText>
          <ThemedText variant="body" color={THEME.colors.text} style={{ marginBottom: 4 }}>
            📌 {jd.seniority_level} • {jd.minimum_experience_years}+ years
          </ThemedText>
          <ThemedText variant="body" color={THEME.colors.text}>
            🎯 {jd.required_skills.length} required skills
          </ThemedText>
        </View>

        {/* Add Resume Button */}
        <TouchableOpacity
          style={[styles.addButton, isLoading && styles.disabledButton]}
          onPress={handleAddResume}
          disabled={isLoading}
        >
          {currentlyParsing !== null ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText variant="button" color="#fff">+ Add Resume</ThemedText>
          )}
        </TouchableOpacity>

        {currentlyParsing !== null && (
          <ThemedText variant="caption" color={THEME.colors.textMuted} align="center">
            Parsing resume {(currentlyParsing || 0) + 1}...
          </ThemedText>
        )}

        {/* Selected Resumes List */}
        {selectedResumes.length > 0 && (
          <View style={styles.resumesSection}>
            <ThemedText variant="bodyBold" style={{ marginBottom: THEME.spacing.md }}>
              Selected Resumes ({selectedResumes.length})
            </ThemedText>

            <FlatList
              scrollEnabled={false}
              data={selectedResumes}
              renderItem={renderResumeItem}
              keyExtractor={(_, index) => index.toString()}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        )}

        {selectedResumes.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <ThemedText variant="h4" color={THEME.colors.border} style={{ marginBottom: THEME.spacing.md }}>
              📄 No resumes selected
            </ThemedText>
            <ThemedText variant="body" color={THEME.colors.textMuted} align="center">
              Add at least one resume to compare
            </ThemedText>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Analyze Button (Fixed at Bottom) */}
      <View style={styles.analyzeButtonContainer}>
        <TouchableOpacity
          style={[styles.analyzeButton, (isLoading || selectedResumes.length === 0) && styles.disabledButton]}
          onPress={handleAnalyzeResumes}
          disabled={isLoading || selectedResumes.length === 0}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText variant="button" color="#fff">
              Analyze {selectedResumes.length} Candidate{selectedResumes.length !== 1 ? 's' : ''}
            </ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContainer: {
    flex: 1,
    padding: THEME.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    borderBottomColor: THEME.colors.border,
    borderBottomWidth: 1,
  },
  subtitle: {
    marginBottom: THEME.spacing.lg,
  },
  jdSummary: {
    backgroundColor: THEME.colors.card,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.lg,
  },
  addButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.md,
    minHeight: 44,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resumesSection: {
    marginTop: THEME.spacing.lg,
  },
  resumeItem: {
    paddingVertical: THEME.spacing.md,
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
    borderRadius: 4,
    marginLeft: 12,
  },
  separator: {
    height: 1,
    backgroundColor: THEME.colors.border,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.xxxl,
  },
  analyzeButtonContainer: {
    padding: THEME.spacing.lg,
    paddingBottom: THEME.spacing.lg + 10,
    backgroundColor: THEME.colors.background,
    borderTopColor: THEME.colors.border,
    borderTopWidth: 1,
  },
  analyzeButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});

export default BatchResumeUpload;
