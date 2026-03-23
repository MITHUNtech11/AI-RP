import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const { width } = Dimensions.get('window');

// IMPORTANT: Backend must be running with: python main.py
// Development mode - using localhost
const BACKEND_URL = 'http://127.0.0.1:8000';

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

interface ResumeData {
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills?: string[];
  employment?: Array<{ company_name?: string; designation?: string }>;
  qualifications?: Array<{ qualification?: string; college_or_school?: string }>;
  languages?: Array<{ language?: string }>;
  address?: { city?: string; state?: string; country?: string };
  [key: string]: any;
}


function AppInner() {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>('overview');

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow media library access to continue.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (!res.cancelled && res.assets) {
      const asset = res.assets[0];
      // Extract filename or use a default with extension
      let filename = asset.filename || asset.uri?.split('/').pop() || 'image.jpg';
      // Ensure filename has an extension
      if (!filename.includes('.')) {
        filename += '.jpg';
      }
      setFileUri(asset.uri);
      setFileName(filename);
      setError('');
    }
  };

  const pickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: false,
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      });

      if (res.type === 'success') {
        let filename = res.name || 'document';
        const uri = res.uri;
        
        // Ensure filename has proper extension
        if (!filename.includes('.')) {
          if (uri.endsWith('.pdf')) filename += '.pdf';
          else if (uri.endsWith('.docx')) filename += '.docx';
          else if (uri.endsWith('.doc')) filename += '.doc';
          else if (uri.endsWith('.txt')) filename += '.txt';
          else filename += '.pdf'; // default
        }
        
        console.log('Document selected:', { filename, uri });
        setFileUri(uri);
        setFileName(filename);
        setError('');
      } else if (res.type === 'cancel') {
        console.log('Document picker cancelled');
      }
    } catch (err: any) {
      console.error('Document picker error:', err);
      Alert.alert('Error', 'Failed to pick document: ' + (err.message || 'Unknown error'));
      setError('Failed to pick document');
    }
  };

  const uploadFile = async () => {
    if (!fileUri) {
      Alert.alert('No File Selected', 'Please select a resume file first.');
      return;
    }

    setLoading(true);
    setError('');
    setResumeData(null);

    console.log('=== UPLOAD START ===');
    console.log('File URI:', fileUri);
    console.log('File Name:', fileName);
    console.log('Backend URL:', BACKEND_URL);

    try {
      const form = new FormData();
      
      let filename = fileName;
      let fileType = 'application/octet-stream';

      // Detect file type from filename or URI
      const uri_lower = fileUri.toLowerCase();
      const name_lower = filename.toLowerCase();

      if (uri_lower.endsWith('.pdf') || name_lower.endsWith('.pdf')) {
        fileType = 'application/pdf';
        filename = name_lower.endsWith('.pdf') ? filename : filename + '.pdf';
      } else if (uri_lower.endsWith('.docx') || name_lower.endsWith('.docx')) {
        fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = name_lower.endsWith('.docx') ? filename : filename + '.docx';
      } else if (uri_lower.endsWith('.doc') || name_lower.endsWith('.doc')) {
        fileType = 'application/msword';
        filename = name_lower.endsWith('.doc') ? filename : filename + '.doc';
      } else if (uri_lower.endsWith('.txt') || name_lower.endsWith('.txt')) {
        fileType = 'text/plain';
        filename = name_lower.endsWith('.txt') ? filename : filename + '.txt';
      } else if (uri_lower.endsWith('.jpg') || uri_lower.endsWith('.jpeg') || name_lower.endsWith('.jpg') || name_lower.endsWith('.jpeg')) {
        fileType = 'image/jpeg';
        filename = (name_lower.endsWith('.jpg') || name_lower.endsWith('.jpeg')) ? filename : filename + '.jpg';
      } else if (uri_lower.endsWith('.png') || name_lower.endsWith('.png')) {
        fileType = 'image/png';
        filename = name_lower.endsWith('.png') ? filename : filename + '.png';
      } else {
        // Default detection by content
        if (!filename.includes('.')) {
          filename += '.jpg'; // default to jpg
        }
      }

      console.log('File Type:', fileType);
      console.log('Final Filename:', filename);

      // Handle both mobile (Expo) and web (browser) file uploads
      if (fileUri.startsWith('blob:')) {
        // Web/Browser: blob URL - fetch and convert to File
        console.log('Detected blob URL (web version)');
        const response = await fetch(fileUri);
        const blob = await response.blob();
        form.append('file', blob, filename);
        console.log('Blob appended to FormData');
      } else {
        // Mobile/Expo: file:// URL - use direct append
        console.log('Detected file URL (mobile version)');
        // @ts-ignore
        form.append('file', {
          uri: fileUri,
          name: filename,
          type: fileType,
        });
        console.log('File appended to FormData');
      }

      const url = `${BACKEND_URL}/parse`;
      console.log('Sending request to:', url);
      console.log('Form data prepared');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key': 'dev-key-12345', // Add API key header
        },
        body: form,
      });

      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error Response:', errorData);
        throw new Error(errorData.detail?.[0]?.msg || errorData.detail?.message || errorData.detail || `Error: ${response.status}`);
      }

      const json = await response.json();
      console.log('Success Response:', json);

      if (json.status === 'success' && json.data) {
        setResumeData(json.data);
        setSelectedTab('overview');
        Alert.alert('Success', 'Resume parsed successfully!');
      } else {
        throw new Error(json.detail?.message || 'Failed to parse resume');
      }
    } catch (err: any) {
      console.log('=== ERROR ===');
      console.log('Error Type:', err.name);
      console.log('Error Message:', err.message);
      console.log('Error:', err);
      
      setError(err.message || 'An error occurred. Please try again.');
      Alert.alert('Parse Error', err.message || 'Network error - check console logs');
    } finally {
      setLoading(false);
      console.log('=== UPLOAD END ===');
    }
  };

  const handleNewFile = () => {
    setFileUri(null);
    setFileName('');
    setResumeData(null);
    setError('');
    setSelectedTab('overview');
  };

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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

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
        {!resumeData ? (
          // Upload Section
          <View style={styles.uploadSection}>
            {/* File Status */}
            {fileUri && (
              <View style={[styles.card, styles.fileCard]}>
                <View style={styles.fileCardHeader}>
                  <Text style={styles.fileCardTitle}>✅ File Ready</Text>
                  <TouchableOpacity onPress={handleNewFile}>
                    <Text style={styles.fileCardChange}>Change</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.fileCardName}>{fileName}</Text>
              </View>
            )}

            {/* Upload Buttons */}
            <View style={styles.uploadButtonsContainer}>
              <TouchableOpacity
                style={[styles.uploadButton, styles.imageButton]}
                onPress={pickImage}
              >
                <Text style={styles.uploadButtonIcon}>📷</Text>
                <Text style={styles.uploadButtonText}>Pick Image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadButton, styles.documentButton]}
                onPress={pickDocument}
              >
                <Text style={styles.uploadButtonIcon}>📄</Text>
                <Text style={styles.uploadButtonText}>Pick Document</Text>
              </TouchableOpacity>
            </View>

            {/* Parse Button */}
            <TouchableOpacity
              style={[styles.parseButton, !fileUri && styles.parseButtonDisabled]}
              onPress={uploadFile}
              disabled={!fileUri || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.parseButtonIcon}>🚀</Text>
                  <Text style={styles.parseButtonText}>
                    {loading ? 'Processing...' : 'Parse Resume'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Info Cards */}
            <View style={styles.infoCardsContainer}>
              <View style={[styles.infoCard, { borderLeftColor: COLORS.primary }]}>
                <Text style={styles.infoCardEmoji}>⚡</Text>
                <Text style={styles.infoCardText}>Fast & Accurate</Text>
              </View>
              <View style={[styles.infoCard, { borderLeftColor: COLORS.success }]}>
                <Text style={styles.infoCardEmoji}>🔒</Text>
                <Text style={styles.infoCardText}>Secure Upload</Text>
              </View>
              <View style={[styles.infoCard, { borderLeftColor: COLORS.secondary }]}>
                <Text style={styles.infoCardEmoji}>✨</Text>
                <Text style={styles.infoCardText}>Smart Analysis</Text>
              </View>
            </View>
          </View>
        ) : (
          // Results Section
          <View style={styles.resultsSection}>
            {/* Tab Navigation */}
            <View style={styles.tabsContainer}>
              {['overview', 'skills', 'education', 'experience'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    selectedTab === tab && styles.tabActive,
                  ]}
                  onPress={() => setSelectedTab(tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selectedTab === tab && styles.tabTextActive,
                    ]}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Content */}
            {selectedTab === 'overview' && (
              <View style={styles.tabContent}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {(resumeData.first_name?.[0] || 'U').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={styles.profileName}>
                      {resumeData.name || `${resumeData.first_name} ${resumeData.last_name}`}
                    </Text>
                    {resumeData.email && (
                      <Text style={styles.profileDetail}>📧 {resumeData.email}</Text>
                    )}
                    {resumeData.phone && (
                      <Text style={styles.profileDetail}>📱 {resumeData.phone}</Text>
                    )}
                  </View>
                </View>

                {/* Summary */}
                {resumeData.summary && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Professional Summary</Text>
                    <Text style={styles.cardText}>{resumeData.summary}</Text>
                  </View>
                )}

                {/* Address */}
                {resumeData.address && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Location</Text>
                    <Text style={styles.cardText}>
                      {[
                        resumeData.address.street_address,
                        resumeData.address.city || resumeData.address.district,
                        resumeData.address.state,
                        resumeData.address.country,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {selectedTab === 'skills' && (
              <View style={styles.tabContent}>
                {resumeData.skills && resumeData.skills.length > 0 ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Skills</Text>
                    <View style={styles.skillsGrid}>
                      {resumeData.skills.map((skill: string, idx: number) => (
                        <View key={idx} style={styles.skillTag}>
                          <Text style={styles.skillTagText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No skills found</Text>
                  </View>
                )}

                {resumeData.languages && resumeData.languages.length > 0 && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Languages</Text>
                    {resumeData.languages.map((lang: any, idx: number) => (
                      <View key={idx} style={styles.languageItem}>
                        <Text style={styles.languageName}>{lang.language}</Text>
                        <View style={styles.languageProfs}>
                          {lang.can_read && (
                            <Text style={styles.languageProf}>📖 Read</Text>
                          )}
                          {lang.can_speak && (
                            <Text style={styles.languageProf}>🎤 Speak</Text>
                          )}
                          {lang.can_write && (
                            <Text style={styles.languageProf}>✍️ Write</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {selectedTab === 'education' && (
              <View style={styles.tabContent}>
                {resumeData.qualifications && resumeData.qualifications.length > 0 ? (
                  resumeData.qualifications.map((qual: any, idx: number) => (
                    <View key={idx} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View>
                          <Text style={styles.cardSubtitle}>{qual.qualification}</Text>
                          {qual.specialization && (
                            <Text style={styles.cardMeta}>{qual.specialization}</Text>
                          )}
                        </View>
                        {qual.year_of_completion && (
                          <Text style={styles.cardYear}>{qual.year_of_completion}</Text>
                        )}
                      </View>
                      <Text style={styles.cardText}>{qual.college_or_school}</Text>
                      {qual.percentage && (
                        <Text style={styles.cardMeta}>📊 {qual.percentage}</Text>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No education details found</Text>
                  </View>
                )}
              </View>
            )}

            {selectedTab === 'experience' && (
              <View style={styles.tabContent}>
                {resumeData.employment && resumeData.employment.length > 0 ? (
                  resumeData.employment.map((job: any, idx: number) => (
                    <View key={idx} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View>
                          <Text style={styles.cardSubtitle}>{job.designation}</Text>
                          <Text style={styles.cardMeta}>{job.company_name}</Text>
                        </View>
                        {job.startDate && (
                          <Text style={styles.cardYear}>
                            {job.startDate}
                            {job.endDate ? ` - ${job.endDate}` : ' - Present'}
                          </Text>
                        )}
                      </View>
                      {job.job_profile && (
                        <Text style={styles.cardText}>{job.job_profile}</Text>
                      )}
                      {job.employment_type && (
                        <Text style={styles.cardMeta}>💼 {job.employment_type}</Text>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No work experience found</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Button at Bottom */}
      {resumeData && (
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={styles.newParseButton}
            onPress={handleNewFile}
          >
            <Text style={styles.newParseButtonText}>📄 Parse Another Resume</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function App() {
  return <AppInner />;
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
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E0E7FF',
    opacity: 0.9,
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
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },

  // Upload Section
  uploadSection: {
    paddingBottom: 40,
  },

  fileCard: {
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    backgroundColor: '#F0FDF4',
  },
  fileCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  fileCardChange: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  fileCardName: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },

  uploadButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  uploadButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageButton: {
    backgroundColor: '#FEF3C7',
  },
  documentButton: {
    backgroundColor: '#DBEAFE',
  },
  uploadButtonIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },

  parseButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  parseButtonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0.1,
  },
  parseButtonIcon: {
    fontSize: 18,
  },
  parseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  infoCardsContainer: {
    gap: 10,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderLeftWidth: 4,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoCardEmoji: {
    fontSize: 20,
  },
  infoCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Results Section
  resultsSection: {
    paddingBottom: 40,
  },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  tabTextActive: {
    color: '#fff',
  },

  tabContent: {
    gap: 12,
  },

  // Profile Header
  profileHeader: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  profileDetail: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  cardText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
    marginVertical: 4,
  },
  cardYear: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Skills
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  // Languages
  languageItem: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  languageProfs: {
    flexDirection: 'row',
    gap: 8,
  },
  languageProf: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  // Empty State
  emptyState: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '600',
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
  },
});
