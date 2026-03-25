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
        <Text style={styles.resumeName} numberOfLines={1}>
          {item.personalInfo?.fullName || item.fileName || 'Unknown'}
        </Text>
        <Text style={styles.resumeFile}>{item.fileName}</Text>
        {item.personalInfo?.email && (
          <Text style={styles.resumeEmail}>{item.personalInfo.email}</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveResume(index)}
      >
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} disabled={isLoading}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Upload Resumes</Text>
          <View style={{ width: 30 }} />
        </View>

        <Text style={styles.subtitle}>Step 2: Select Candidate Resumes</Text>

        {/* JD Summary */}
        <View style={styles.jdSummary}>
          <Text style={styles.jdTitle}>{jd.job_title}</Text>
          <Text style={styles.jdDetail}>
            📌 {jd.seniority_level} • {jd.minimum_experience_years}+ years
          </Text>
          <Text style={styles.jdDetail}>
            🎯 {jd.required_skills.length} required skills
          </Text>
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
            <Text style={styles.addButtonText}>+ Add Resume</Text>
          )}
        </TouchableOpacity>

        {currentlyParsing !== null && (
          <Text style={styles.parsingText}>
            Parsing resume {(currentlyParsing || 0) + 1}...
          </Text>
        )}

        {/* Selected Resumes List */}
        {selectedResumes.length > 0 && (
          <View style={styles.resumesSection}>
            <Text style={styles.resumesTitle}>
              Selected Resumes ({selectedResumes.length})
            </Text>

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
            <Text style={styles.emptyStateText}>📄 No resumes selected</Text>
            <Text style={styles.emptyStateSubtext}>
              Add at least one resume to compare
            </Text>
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
            <Text style={styles.analyzeButtonText}>
              Analyze {selectedResumes.length} Candidate{selectedResumes.length !== 1 ? 's' : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  jdSummary: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  jdTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  jdDetail: {
    fontSize: 13,
    color: '#1565c0',
    marginBottom: 4,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  parsingText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  resumesSection: {
    marginTop: 16,
  },
  resumesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  resumeItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  resumeInfo: {
    flex: 1,
  },
  resumeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resumeFile: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  resumeEmail: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ffebee',
    borderRadius: 4,
    marginLeft: 12,
  },
  removeButtonText: {
    fontSize: 18,
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  separator: {
    height: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 20,
    color: '#ccc',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  analyzeButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  analyzeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BatchResumeUpload;
