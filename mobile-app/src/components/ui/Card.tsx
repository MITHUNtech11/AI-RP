import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { THEME } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outline' | 'soft' | 'interactive';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  onPress?: () => void;
  testID?: string;
}

export function Card({
  children,
  style,
  variant = 'default',
  padding = 'md',
  onPress,
  testID,
}: CardProps) {
  const cardStyles: ViewStyle = {
    ...styles.card,
    ...styles[`variant_${variant}`],
    ...styles[`padding_${padding}`],
    ...style,
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={cardStyles}
      testID={testID}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
  },
  
  // Variants
  variant_default: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderWidth: 1,
  },
  variant_elevated: {
    backgroundColor: THEME.colors.surface,
    ...THEME.shadows.md,
  },
  variant_outline: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.borderMedium,
    borderWidth: 1.5,
  },
  variant_soft: {
    backgroundColor: THEME.colors.surfaceAlt,
    borderWidth: 0,
  },
  variant_interactive: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    ...THEME.shadows.sm,
  },

  // Padding variants
  padding_sm: {
    padding: THEME.spacing.md,
  },
  padding_md: {
    padding: THEME.spacing.lg,
  },
  padding_lg: {
    padding: THEME.spacing.xl,
  },
  padding_xl: {
    padding: THEME.spacing.xxl,
  },
});
});
