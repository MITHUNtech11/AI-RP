import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { THEME } from '../../theme';

interface BadgeProps {
  label: string;
  icon?: string;
  variant?: 'success' | 'warning' | 'danger' | 'primary' | 'secondary' | 'info';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  testID?: string;
}

export function Badge({
  label,
  icon,
  variant = 'primary',
  size = 'md',
  style,
  testID,
}: BadgeProps) {
  const badgeStyles: ViewStyle = {
    ...styles.badge,
    ...styles[`variant_${variant}`],
    ...styles[`size_${size}`],
    ...style,
  };

  const textStyles: TextStyle = {
    ...styles.text,
    ...styles[`textSize_${size}`],
    ...styles[`textVariant_${variant}`],
  };

  return (
    <View style={badgeStyles} testID={testID}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={textStyles}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    borderRadius: THEME.borderRadius.full,
    gap: THEME.spacing.xs,
  },
  
  // Variants - filled
  variant_success: {
    backgroundColor: THEME.colors.successLight,
  },
  variant_warning: {
    backgroundColor: THEME.colors.warningLight,
  },
  variant_danger: {
    backgroundColor: THEME.colors.dangerLight,
  },
  variant_primary: {
    backgroundColor: THEME.colors.primaryLight,
  },
  variant_secondary: {
    backgroundColor: THEME.colors.secondaryLight,
  },
  variant_info: {
    backgroundColor: THEME.colors.infoLight,
  },
  
  // Sizes
  size_sm: {
    paddingVertical: 4,
    paddingHorizontal: THEME.spacing.sm,
  },
  size_md: {
    paddingVertical: 6,
    paddingHorizontal: THEME.spacing.md,
  },
  size_lg: {
    paddingVertical: 8,
    paddingHorizontal: THEME.spacing.lg,
  },
  
  // Text
  text: {
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  textSize_sm: {
    fontSize: 10,
  },
  textSize_md: {
    fontSize: 12,
  },
  textSize_lg: {
    fontSize: 14,
  },
  textVariant_success: {
    color: THEME.colors.successDark,
  },
  textVariant_warning: {
    color: THEME.colors.warningDark,
  },
  textVariant_danger: {
    color: THEME.colors.dangerDark,
  },
  textVariant_primary: {
    color: THEME.colors.primaryDark,
  },
  textVariant_secondary: {
    color: THEME.colors.secondaryDark,
  },
  textVariant_info: {
    color: '#0369A1',
  },
  
  // Icon
  icon: {
    fontSize: 12,
  },
});
  size_sm: {
    paddingVertical: THEME.spacing.xs,
    paddingHorizontal: THEME.spacing.sm,
  },
  size_md: {
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
  },
  text: {
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  textSize_sm: {
    fontSize: 10,
    color: THEME.colors.text,
    fontFamily: 'Poppins',
  },
  textSize_md: {
    fontSize: 12,
    color: THEME.colors.text,
    fontFamily: 'Poppins',
  },
});
