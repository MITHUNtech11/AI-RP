/**
 * Layout Utilities
 * Consistent padding, margins, and layout patterns
 */

import { ViewStyle } from 'react-native';
import { THEME } from './theme';

/**
 * Common container styles for different contexts
 */
export const layoutUtils = {
  // Screen containers
  screenContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  } as ViewStyle,

  // Safe area padding
  screenPadding: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.xl,
  } as ViewStyle,

  // Compact padding (for cards, etc)
  compactPadding: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
  } as ViewStyle,

  // Generous padding (for feature sections)
  generousPadding: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.xxl,
  } as ViewStyle,

  // Common container for content
  contentContainer: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.lg,
  } as ViewStyle,

  // Flex utilities
  row: {
    flexDirection: 'row',
  } as ViewStyle,

  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,

  rowAround: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  } as ViewStyle,

  center: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  flex1: {
    flex: 1,
  } as ViewStyle,

  // Spacing
  gap: (size: keyof typeof THEME.spacing) =>
    ({
      gap: THEME.spacing[size],
    } as ViewStyle),

  // Common section spacing
  sectionSpacing: {
    marginTop: THEME.spacing.xxl,
    marginBottom: THEME.spacing.xl,
  } as ViewStyle,

  divider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: THEME.spacing.lg,
  } as ViewStyle,
};

/**
 * Responsive design helpers
 */
export const responsiveUtils = {
  // For tablet/large screens
  tablet: {
    maxWidth: 768,
    marginHorizontal: 'auto',
  } as ViewStyle,

  // For desktop/large screens
  desktop: {
    maxWidth: 1024,
    marginHorizontal: 'auto',
  } as ViewStyle,
};

/**
 * Shadow/elevation helpers
 */
export const elevationUtils = {
  shadowSmall: THEME.shadows.sm,
  shadowMedium: THEME.shadows.md,
  shadowLarge: THEME.shadows.lg,
  shadowExtraLarge: THEME.shadows.xl,
};

/**
 * Typography scale helper
 */
export const typographyScale = (
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
) => {
  const scales = {
    xs: {
      fontSize: 12,
      lineHeight: 16,
    },
    sm: {
      fontSize: 14,
      lineHeight: 20,
    },
    md: {
      fontSize: 16,
      lineHeight: 24,
    },
    lg: {
      fontSize: 18,
      lineHeight: 28,
    },
    xl: {
      fontSize: 20,
      lineHeight: 32,
    },
  };

  return scales[size];
};
