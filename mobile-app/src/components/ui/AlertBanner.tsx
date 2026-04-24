import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { THEME } from '../../theme';

interface AlertBannerProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  icon?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
  style?: ViewStyle;
}

export function AlertBanner({
  type,
  title,
  message,
  icon,
  action,
  onDismiss,
  style,
}: AlertBannerProps) {
  const getIconDefault = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      case 'info':
        return 'ⓘ';
      default:
        return '•';
    }
  };

  return (
    <View style={[styles.container, styles[`type_${type}`], style]}>
      <View style={styles.content}>
        <Text style={styles.icon}>{icon || getIconDefault()}</Text>
        <View style={styles.textContent}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>

      <View style={styles.actions}>
        {action && (
          <TouchableOpacity
            onPress={action.onPress}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: THEME.borderRadius.lg,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.sm,
  },

  // Types
  type_success: {
    backgroundColor: THEME.colors.successLight,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.success,
  },
  type_warning: {
    backgroundColor: THEME.colors.warningLight,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.warning,
  },
  type_error: {
    backgroundColor: THEME.colors.dangerLight,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.danger,
  },
  type_info: {
    backgroundColor: THEME.colors.infoLight,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.info,
  },

  // Content
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 18,
    marginRight: THEME.spacing.md,
    marginTop: 2,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: THEME.spacing.xs,
  },
  message: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    fontFamily: 'Poppins',
    lineHeight: 18,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: THEME.spacing.md,
    gap: THEME.spacing.xs,
  },
  actionButton: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.xs,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.primary,
    fontFamily: 'Poppins-SemiBold',
  },
  dismissButton: {
    padding: THEME.spacing.sm,
  },
  dismissIcon: {
    fontSize: 16,
    color: THEME.colors.textSecondary,
  },
});
