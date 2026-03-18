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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>AI Resume Parser (Mobile)</Text>

      <Text style={styles.label}>Backend URL</Text>
      <TextInput style={styles.input} value={apiBase} onChangeText={setApiBase} placeholder="http://localhost:8000" />

      <Text style={styles.label}>API Key (optional)</Text>
      <TextInput style={styles.input} value={apiKey} onChangeText={setApiKey} placeholder="X-API-Key" />

      <View style={styles.row}>
        <View style={styles.buttonContainer}>
          <Button title="Pick Image" onPress={pickImage} />
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Pick Document" onPress={pickDocument} />
        </View>
      </View>

      <Text style={styles.meta}>Selected: {fileName || 'None'}</Text>

      <View style={styles.uploadButtonContainer}>
        <Button title={loading ? 'Uploading...' : 'Upload & Parse'} onPress={uploadFile} disabled={loading} />
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 12 }} />}

      <Text style={styles.resultTitle}>Result</Text>
      <Text style={styles.result}>{result || 'No result yet'}</Text>

      <StatusBar style="auto" />
    </ScrollView>
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
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  label: { marginTop: 8, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6, marginTop: 6, marginBottom: 8 },
  row: { flexDirection: 'row', marginTop: 12, alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  spacer: { width: 12 },
  buttonContainer: { flex: 1 },
  uploadButtonContainer: { marginTop: 12, marginBottom: 12 },
  meta: { marginTop: 8, color: '#666' },
  resultTitle: { marginTop: 20, fontWeight: '700' },
  result: { marginTop: 8, fontFamily: 'monospace', padding: 10, backgroundColor: '#f5f5f5', borderRadius: 4 }
});
