import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal,
  ViewStyle,
  Animated,
} from 'react-native';
import { THEME } from '../../theme';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  subMessage?: string;
  progress?: number;
  size?: 'small' | 'large';
  dismissible?: boolean;
  onBackdropPress?: () => void;
  testID?: string;
}

export function LoadingOverlay({
  visible,
  message,
  subMessage,
  progress,
  size = 'large',
  dismissible = false,
  onBackdropPress,
  testID,
}: LoadingOverlayProps) {
  const handleBackdropPress = () => {
    if (dismissible && onBackdropPress) {
      onBackdropPress();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onBackdropPress}
      testID={testID}
    >
      <View
        style={[styles.backdrop, { opacity: dismissible ? 1 : 0.5 }]}
        onTouchEnd={dismissible ? handleBackdropPress : undefined}
      >
        <View style={styles.container}>
          <View style={styles.loaderWrapper}>
            <ActivityIndicator
              size={size}
              color={THEME.colors.primary}
            />
          </View>
          
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}
          
          {subMessage && (
            <Text style={styles.subMessage}>{subMessage}</Text>
          )}
          
          {progress !== undefined && progress > 0 && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${Math.min(progress * 100, 100)}%` },
                ]}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: THEME.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.xxl,
    alignItems: 'center',
    minWidth: 140,
    ...THEME.shadows.xl,
  },
  loaderWrapper: {
    marginBottom: THEME.spacing.lg,
  },
  message: {
    marginTop: THEME.spacing.md,
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  subMessage: {
    marginTop: THEME.spacing.sm,
    color: THEME.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  progressContainer: {
    marginTop: THEME.spacing.lg,
    width: 120,
    height: 4,
    backgroundColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.borderRadius.full,
  },
});
