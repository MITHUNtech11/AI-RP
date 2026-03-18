import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const DEFAULT_API = 'http://10.0.2.2:8000'; // emulator host; change to your backend URL

// Simple error boundary so runtime errors are shown in-app instead of white screen
class ErrorBoundary extends React.Component<{}, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // You could log this to your backend
    // console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Unexpected error</Text>
          <Text>{String(this.state.error)}</Text>
          <Text style={{ marginTop: 12, color: '#666' }}>Reload the app or check the Metro/console logs for details.</Text>
        </View>
      );
    }

    return this.props.children as any;
  }
}

function AppInner() {
  const [apiBase, setApiBase] = useState<string>(DEFAULT_API);
  const [apiKey, setApiKey] = useState<string>('');
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Media library access is required to pick an image.');
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (!res.cancelled) {
      setFileUri(res.assets?.[0].uri || '');
      setFileName(res.assets?.[0].uri?.split('/').pop() || 'image.jpg');
      setFileType('image/jpeg');
    }
  };

  const pickDocument = async () => {
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });
    if (res.type === 'success') {
      setFileUri(res.uri);
      setFileName(res.name || 'file');
      setFileType(res.mimeType || 'application/octet-stream');
    }
  };

  const uploadFile = async () => {
    if (!fileUri) {
      Alert.alert('No file', 'Please pick an image or document first.');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const form = new FormData();
      // In Expo, form file: { uri, name, type }
      // @ts-ignore
      form.append('file', { uri: fileUri, name: fileName, type: fileType });

      const headers: any = {};
      if (apiKey) headers['X-API-Key'] = apiKey;

      const res = await fetch(`${apiBase.replace(/\/$/, '')}/parse_resume`, {
        method: 'POST',
        body: form,
        headers
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API ${res.status}: ${txt}`);
      }

      const json = await res.json();
      setResult(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setResult(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    // quick startup log to help debugging
    // Metro/console logs are visible when running `npx expo start` and opening device debugger
    console.log('AppInner mounted — apiBase=', apiBase);
  }, []);

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📄 Resume Parser</Text>
        <Text style={styles.headerSubtitle}>Extract structured data from resumes</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={true}>
        {/* Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Backend URL</Text>
            <TextInput 
              style={styles.input} 
              value={apiBase} 
              onChangeText={setApiBase} 
              placeholder="http://localhost:8000"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>API Key (optional)</Text>
            <TextInput 
              style={styles.input} 
              value={apiKey} 
              onChangeText={setApiKey} 
              placeholder="X-API-Key"
              placeholderTextColor="#999"
              secureTextEntry
            />
          </View>
        </View>

        {/* File Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select File</Text>
          
          <View style={styles.buttonRow}>
            <View style={styles.buttonContainer}>
              <Button title="📷 Pick Image" onPress={pickImage} color="#0066cc" />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="📄 Pick Document" onPress={pickDocument} color="#0066cc" />
            </View>
          </View>

          <View style={styles.selectedFileBox}>
            <Text style={styles.selectedFileLabel}>Selected File:</Text>
            <Text style={styles.selectedFileName}>{fileName || 'None selected'}</Text>
          </View>
        </View>

        {/* Upload Section */}
        <View style={styles.section}>
          <View style={styles.uploadButtonContainer}>
            <Button 
              title={loading ? '⏳ Processing...' : '🚀 Upload & Parse'} 
              onPress={uploadFile} 
              disabled={loading}
              color={loading ? '#999' : '#ff6600'}
            />
          </View>
          {loading && <ActivityIndicator size="large" color="#0066cc" style={{ marginTop: 16 }} />}
        </View>

        {/* Results Section */}
        {result && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parse Results</Text>
            <View style={styles.resultBox}>
              <ScrollView nestedScrollEnabled={true}>
                <Text style={styles.resultText}>{result}</Text>
              </ScrollView>
            </View>
          </View>
        )}
      </ScrollView>

      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  // Main Container Layout
  mainContainer: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },

  // Header
  header: { 
    backgroundColor: '#0066cc', 
    paddingTop: 40, 
    paddingBottom: 32, 
    paddingHorizontal: 20
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#fff',
    marginBottom: 8
  },
  headerSubtitle: { 
    fontSize: 14, 
    color: '#e0e8ff',
    lineHeight: 20
  },

  // Content Scroll Area
  content: { 
    flex: 1 
  },
  contentContainer: { 
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 40
  },

  // Section Styling
  section: { 
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12
  },

  // Form Elements
  formGroup: { 
    marginBottom: 16 
  },
  label: { 
    fontSize: 13, 
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: '#1a1a1a',
    height: 44
  },

  // Button Layouts
  buttonRow: { 
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  buttonContainer: { 
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8
  },

  // Selected File Display
  selectedFileBox: {
    backgroundColor: '#f0f8ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
    padding: 12,
    borderRadius: 6,
    marginTop: 4
  },
  selectedFileLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0066cc',
    marginTop: 4
  },

  // Upload Button
  uploadButtonContainer: { 
    overflow: 'hidden',
    borderRadius: 8,
    marginBottom: 12
  },

  // Results
  resultBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    maxHeight: 400,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  resultText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#1a1a1a',
    lineHeight: 16
  }
});
