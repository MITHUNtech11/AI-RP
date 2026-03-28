import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { THEME } from '../../theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'highlight' | 'minimal';
  onPress?: () => void;
  style?: ViewStyle;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  variant = 'default',
  onPress,
  style,
}: StatCardProps) {
  const cardContent = (
    <View
      style={[styles.card, styles[`variant_${variant}`], style]}
    >
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.value}>{value}</Text>
        {trend && (
          <View style={[styles.trend, trend.isPositive && styles.trendPositive]}>
            <Text style={styles.trendIcon}>
              {trend.isPositive ? '↑' : '↓'}
            </Text>
            <Text style={styles.trendText}>{trend.value}%</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
  },

  // Variants
  variant_default: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  variant_highlight: {
    backgroundColor: THEME.colors.primaryLight,
    borderWidth: 0,
    ...THEME.shadows.md,
  },
  variant_minimal: {
    backgroundColor: THEME.colors.surfaceAlt,
    borderWidth: 0,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  icon: {
    fontSize: 20,
    marginRight: THEME.spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.colors.textSecondary,
    fontFamily: 'Poppins-Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Body
  body: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    fontFamily: 'Poppins-Bold',
  },

  // Trend
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.dangerLight,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.full,
  },
  trendPositive: {
    backgroundColor: THEME.colors.successLight,
  },
  trendIcon: {
    fontSize: 14,
    marginRight: THEME.spacing.xs,
    color: THEME.colors.danger,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.colors.danger,
    fontFamily: 'Poppins-SemiBold',
  },
});
