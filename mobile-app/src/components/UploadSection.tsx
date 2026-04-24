import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { THEME } from '../theme';

interface UploadSectionProps {
  fileName: string;
  loading: boolean;
  fileUri: string | null;
  uploadProgress: number;
  onPickImage: () => void;
  onPickDocument: () => void;
  onUpload: () => void;
  onReset: () => void;
}

export function UploadSection({
  fileName,
  loading,
  fileUri,
  uploadProgress,
  onPickImage,
  onPickDocument,
  onUpload,
  onReset,
}: UploadSectionProps) {
  return (
    <View style={styles.uploadSection}>
      {/* File Status */}
      {fileUri && (
        <View style={[styles.card, styles.fileCard]}>
          <View style={styles.fileCardHeader}>
            <Text style={styles.fileCardTitle}>✅ File Ready</Text>
            <TouchableOpacity onPress={onReset}>
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
          onPress={onPickImage}
          disabled={loading}
        >
          <Text style={styles.uploadButtonIcon}>📷</Text>
          <Text style={styles.uploadButtonText}>Pick Image</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadButton, styles.documentButton]}
          onPress={onPickDocument}
          disabled={loading}
        >
          <Text style={styles.uploadButtonIcon}>📄</Text>
          <Text style={styles.uploadButtonText}>Pick Document</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      {loading && uploadProgress > 0 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
          <Text style={styles.progressText}>{Math.round(uploadProgress)}%</Text>
        </View>
      )}

      {/* Parse Button */}
      <TouchableOpacity
        style={[styles.parseButton, !fileUri && styles.parseButtonDisabled]}
        onPress={onUpload}
        disabled={!fileUri || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
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
        <View style={[styles.infoCard, { borderLeftColor: THEME.colors.primary }]}>
          <Text style={styles.infoCardEmoji}>⚡</Text>
          <Text style={styles.infoCardText}>Fast & Accurate</Text>
        </View>
        <View style={[styles.infoCard, { borderLeftColor: THEME.colors.success }]}>
          <Text style={styles.infoCardEmoji}>🔒</Text>
          <Text style={styles.infoCardText}>Secure Upload</Text>
        </View>
        <View style={[styles.infoCard, { borderLeftColor: THEME.colors.secondary }]}>
          <Text style={styles.infoCardEmoji}>✨</Text>
          <Text style={styles.infoCardText}>Smart Analysis</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  uploadSection: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.sm,
  },
  fileCard: {
    borderColor: THEME.colors.success,
    borderWidth: 2,
  },
  fileCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  fileCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.success,
    fontFamily: 'Poppins-SemiBold',
  },
  fileCardChange: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.primary,
    fontFamily: 'Poppins-SemiBold',
  },
  fileCardName: {
    fontSize: 13,
    color: THEME.colors.text,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  uploadButtonsContainer: {
    flexDirection: 'row',
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.xl,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  imageButton: {
    borderColor: THEME.colors.primary,
    backgroundColor: '#F0F4FF',
  },
  documentButton: {
    borderColor: THEME.colors.secondary,
    backgroundColor: '#FDF2F8',
  },
  uploadButtonIcon: {
    fontSize: 28,
    marginBottom: THEME.spacing.sm,
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.text,
    fontFamily: 'Poppins-SemiBold',
  },
  progressContainer: {
    marginBottom: THEME.spacing.lg,
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.md,
    overflow: 'hidden',
    height: 32,
    justifyContent: 'center',
  },
  progressBar: {
    backgroundColor: THEME.colors.primary,
    height: '100%',
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    color: THEME.colors.text,
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 32,
    fontFamily: 'Poppins-SemiBold',
  },
  parseButton: {
    backgroundColor: THEME.colors.primary,
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.md,
  },
  parseButtonDisabled: {
    opacity: 0.5,
  },
  parseButtonIcon: {
    fontSize: 20,
    marginRight: THEME.spacing.sm,
  },
  parseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
  },
  infoCardsContainer: {
    gap: THEME.spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.background,
    borderLeftWidth: 4,
    paddingLeft: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    paddingRight: THEME.spacing.md,
    borderRadius: THEME.borderRadius.sm,
  },
  infoCardEmoji: {
    fontSize: 20,
    marginRight: THEME.spacing.md,
  },
  infoCardText: {
    flex: 1,
    color: THEME.colors.text,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});
