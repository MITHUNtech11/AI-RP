import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { THEME } from '../../theme';

interface ButtonProps {
  onPress: () => void;
  title: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  onPress,
  title,
  icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const buttonStyles: ViewStyle = {
    ...styles.button,
    ...styles[`button_${variant}`],
    ...styles[`button_${size}`],
    ...(fullWidth && styles.fullWidth),
    ...(isDisabled && styles.buttonDisabled),
    ...style,
  };

  const textStyles: TextStyle = {
    ...styles.text,
    ...styles[`text_${variant}`],
    ...styles[`text_${size}`],
    ...(isDisabled && styles.textDisabled),
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={buttonStyles}
      testID={testID}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'outline' || variant === 'ghost'
              ? THEME.colors.primary
              : '#FFFFFF'
          }
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={textStyles}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Base button styles
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.borderRadius.lg,
    paddingHorizontal: THEME.spacing.lg,
    ...THEME.shadows.md,
  },
  
  // Content layout
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: THEME.spacing.sm,
  },

  // Variants
  button_primary: {
    backgroundColor: THEME.colors.primary,
  },
  button_secondary: {
    backgroundColor: THEME.colors.secondary,
  },
  button_success: {
    backgroundColor: THEME.colors.success,
  },
  button_danger: {
    backgroundColor: THEME.colors.danger,
  },
  button_outline: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.primary,
    ...THEME.shadows.xs,
  },
  button_ghost: {
    backgroundColor: 'transparent',
    ...THEME.shadows.none,
  },

  // Sizes
  button_sm: {
    minHeight: 32,
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
  },
  button_md: {
    minHeight: 44,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
  },
  button_lg: {
    minHeight: 52,
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.xl,
  },

  // Full width
  fullWidth: {
    width: '100%',
  },

  // Disabled state
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: THEME.colors.disabled,
  },

  // Text styles
  text: {
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  text_primary: {
    color: THEME.colors.textInverse,
  },
  text_secondary: {
    color: THEME.colors.textInverse,
  },
  text_success: {
    color: THEME.colors.textInverse,
  },
  text_danger: {
    color: THEME.colors.textInverse,
  },
  text_outline: {
    color: THEME.colors.primary,
  },
  text_ghost: {
    color: THEME.colors.primary,
  },
  text_sm: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  text_md: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  text_lg: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Poppins-SemiBold',
  },
  textDisabled: {
    color: THEME.colors.disabledText,
  },
});
