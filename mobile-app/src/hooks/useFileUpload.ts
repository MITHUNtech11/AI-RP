import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { ResumeData } from '../types/resume';
import { parseResumeViaBackend, BACKEND_URL, BACKEND_API_KEY } from '../services/api';

interface DocumentPickerAsset {
  uri: string;
  name?: string;
  fileName?: string;
  size?: number;
  mimeType?: string;
  [key: string]: any;
}

interface DocumentPickerResult {
  canceled: boolean;
  assets?: DocumentPickerAsset[];
  [key: string]: any;
}

/**
 * Custom hook to handle file upload workflow
 * Manages file picking, uploading, and resume parsing
 */
export function useFileUpload() {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const sanitizeFilename = (name: string): string => {
    return name
      .replace(/[^a-z0-9._-]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  };

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

    if (!res.canceled && res.assets && res.assets.length > 0) {
      const asset = res.assets[0];
      let filename = asset.fileName || asset.uri?.split('/').pop() || 'image.jpg';
      if (!filename.includes('.')) {
        filename += '.jpg';
      }
      filename = sanitizeFilename(filename);
      setFileUri(asset.uri);
      setFileName(filename);
      setError('');
      console.log('Image selected:', filename);
    }
  };

  const pickDocument = async () => {
    try {
      console.log('Opening document picker...');
      const res = (await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: false,
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
      })) as DocumentPickerResult;

      console.log('Document picker response:', res);

      if (!res.canceled) {
        const file = res.assets?.[0];
        if (!file) {
          Alert.alert('Error', 'No file selected');
          setError('No file selected');
          return;
        }

        const uri = file.uri;
        let filename = file.name || file.fileName || (uri?.split('/').pop() || 'document');

        if (!uri) {
          Alert.alert('Error', 'No file URI found');
          setError('No file URI found');
          return;
        }

        console.log('Document selected:', { filename, uri });

        // Ensure filename has proper extension
        if (!filename.includes('.')) {
          if (uri.endsWith('.pdf')) filename += '.pdf';
          else if (uri.endsWith('.docx')) filename += '.docx';
          else if (uri.endsWith('.doc')) filename += '.doc';
          else if (uri.endsWith('.txt')) filename += '.txt';
          else filename += '.pdf';
        }

        filename = sanitizeFilename(filename);

        console.log('Final filename:', filename);
        setFileUri(uri);
        setFileName(filename);
        setError('');

        Alert.alert('File Selected', `Ready to parse: ${filename}`);
      } else {
        console.log('Document picker was cancelled');
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
    setUploadProgress(0);

    console.log('=== UPLOAD START ===');
    console.log('File URI:', fileUri);
    console.log('File Name:', fileName);
    console.log('Backend URL:', BACKEND_URL);

    try {
      let filename = fileName;
      let fileType = 'application/octet-stream';

      // Detect file type from filename or URI
      const uri_lower = fileUri.toLowerCase();
      const name_lower = filename.toLowerCase();

      if (uri_lower.endsWith('.pdf') || name_lower.endsWith('.pdf')) {
        fileType = 'application/pdf';
      } else if (uri_lower.endsWith('.docx') || name_lower.endsWith('.docx')) {
        fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (uri_lower.endsWith('.doc') || name_lower.endsWith('.doc')) {
        fileType = 'application/msword';
      } else if (uri_lower.endsWith('.txt') || name_lower.endsWith('.txt')) {
        fileType = 'text/plain';
      } else if (uri_lower.endsWith('.jpg') || uri_lower.endsWith('.jpeg') || name_lower.endsWith('.jpg') || name_lower.endsWith('.jpeg')) {
        fileType = 'image/jpeg';
      } else if (uri_lower.endsWith('.png') || name_lower.endsWith('.png')) {
        fileType = 'image/png';
      }

      console.log('File Type:', fileType);
      console.log('Final Filename:', filename);

      const form = new FormData();

      // Handle both mobile (Expo) and web (browser) file uploads
      if (fileUri.startsWith('blob:')) {
        console.log('Detected blob URL (web version)');
        const response = await fetch(fileUri);
        const blob = await response.blob();
        form.append('file', blob as any, filename);
        console.log('Blob appended to FormData');
      } else if (fileUri.startsWith('file://')) {
        console.log('Detected file URL (mobile version)');
        try {
          const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });

          console.log('File read successfully, size:', base64.length);

          const blob = await (async () => {
            const res = await fetch(`data:${fileType};base64,${base64}`);
            return res.blob();
          })();

          form.append('file', blob as any, filename);
          console.log('File converted and appended to FormData');
        } catch (fileReadError) {
          console.error('Error reading file:', fileReadError);
          console.log('Falling back to direct URI append');
          form.append('file', {
            uri: fileUri,
            name: filename,
            type: fileType,
          } as any);
        }
      } else {
        console.log('Unknown URI format, attempting direct append');
        form.append('file', {
          uri: fileUri,
          name: filename,
          type: fileType,
        } as any);
      }

      const url = `${BACKEND_URL}/parse`;
      console.log('Sending request to:', url);
      console.log('Form data prepared');

      const resumeWithMetadata = await parseResumeViaBackend(
        fileUri,
        filename,
        fileType,
        (progress) => {
          setUploadProgress(progress);
          console.log('Upload progress:', progress);
        }
      );

      console.log('Resume parsed:', {
        fileName: resumeWithMetadata.original_filename || resumeWithMetadata.fileName,
        fileId: resumeWithMetadata.id,
        name: resumeWithMetadata.personalInfo?.fullName,
        email: resumeWithMetadata.personalInfo?.email,
      });

      setResumeData(resumeWithMetadata);
      Alert.alert('Success', `Resume "${filename}" parsed successfully!`);
    } catch (err: any) {
      console.log('=== ERROR ===');
      console.log('Error Type:', err.name);
      console.log('Error Message:', err.message);
      console.log('Error:', err);

      const errorMessage = err.message || 'An error occurred. Please try again.';
      setError(errorMessage);
      Alert.alert('Parse Error', errorMessage);
    } finally {
      setLoading(false);
      console.log('=== UPLOAD END ===');
    }
  };

  const resetFile = () => {
    setFileUri(null);
    setFileName('');
    setResumeData(null);
    setError('');
    setUploadProgress(0);
  };

  return {
    fileUri,
    fileName,
    loading,
    resumeData,
    error,
    uploadProgress,
    pickImage,
    pickDocument,
    uploadFile,
    resetFile,
  };
}
