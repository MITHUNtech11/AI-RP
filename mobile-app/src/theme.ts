// Centralized theme with Poppins font and consistent styling
export const THEME = {
  colors: {
    // Brand colors
    primary: '#6366F1', // Indigo
    primaryLight: '#E0E7FF',
    primaryDark: '#4F46E5',
    secondary: '#EC4899', // Pink
    secondaryLight: '#FCE7F3',
    secondaryDark: '#DB2777',
    
    // Semantic colors
    success: '#10B981', // Green
    successLight: '#D1FAE5',
    successDark: '#059669',
    warning: '#F59E0B', // Amber
    warningLight: '#FEF3C7',
    warningDark: '#D97706',
    danger: '#EF4444', // Red
    dangerLight: '#FEE2E2',
    dangerDark: '#DC2626',
    
    // Surfaces
    background: '#F8FAFC',
    backgroundLight: '#FAFBFC',
    backgroundAlt: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceAlt: '#F8FAFC',
    
    // Text
    text: '#1E293B',
    textPrimary: '#1E293B',
    textSecondary: '#475569',
    textTertiary: '#94A3B8',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',
    
    // Borders & separators
    border: '#E2E8F0',
    borderLight: '#E2E8F0',
    borderMedium: '#CBD5E1',
    borderDark: '#94A3B8',
    divider: '#E2E8F0',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    overlayMuted: 'rgba(0, 0, 0, 0.1)',
    
    // Status colors
    info: '#0EA5E9', // Blue
    infoLight: '#E0F2FE',
    disabled: '#CBD5E1',
    disabledText: '#94A3B8',
  },
  typography: {
    fontFamily: 'Poppins',
    fontFamilyBold: 'Poppins-Bold',
    fontFamilySemiBold: 'Poppins-SemiBold',
    fontFamilyMedium: 'Poppins-Medium',
    fontFamilyLight: 'Poppins-Light',
    sizes: {
      xs: 10,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      xxl: 20,
      xxxl: 24,
      h1: 32,
      h2: 28,
      h3: 24,
      h4: 20,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 12,
    xl: 16,
    full: 999,
  },
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    xs: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
      elevation: 1,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 12,
    },
  },
  // Animation durations (in ms)
  animation: {
    xs: 100,
    sm: 150,
    md: 200,
    lg: 300,
    xl: 400,
  },
};

// Color utilities
export const colorUtils = {
  // Get lighter variant of a color (for hover states)
  lighten: (color: string, amount: number) => {
    return color; // Placeholder - in production, use color manipulation lib
  },
  // Get darker variant of a color
  darken: (color: string, amount: number) => {
    return color; // Placeholder
  },
};

// Typography helpers
export const getTypographyStyle = (variant: keyof typeof typographyVariants) => {
  return typographyVariants[variant];
};

const typographyVariants = {
  // Heading styles
  h1: {
    fontSize: THEME.typography.sizes.h1,
    fontWeight: '800' as const,
    fontFamily: THEME.typography.fontFamilyBold,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: THEME.typography.sizes.h2,
    fontWeight: '700' as const,
    fontFamily: THEME.typography.fontFamilyBold,
    lineHeight: 36,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: THEME.typography.sizes.h3,
    fontWeight: '700' as const,
    fontFamily: THEME.typography.fontFamilyBold,
    lineHeight: 32,
  },
  h4: {
    fontSize: THEME.typography.sizes.h4,
    fontWeight: '600' as const,
    fontFamily: THEME.typography.fontFamilySemiBold,
    lineHeight: 28,
  },
  // Body text
  body: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: '400' as const,
    fontFamily: THEME.typography.fontFamily,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: '600' as const,
    fontFamily: THEME.typography.fontFamilySemiBold,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: THEME.typography.sizes.base,
    fontWeight: '500' as const,
    fontFamily: THEME.typography.fontFamilyMedium,
    lineHeight: 24,
  },
  // Label text
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: THEME.typography.fontFamilySemiBold,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '500' as const,
    fontFamily: THEME.typography.fontFamilyMedium,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  // Caption and small text
  caption: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: '400' as const,
    fontFamily: THEME.typography.fontFamily,
    lineHeight: 18,
  },
  captionBold: {
    fontSize: THEME.typography.sizes.sm,
    fontWeight: '600' as const,
    fontFamily: THEME.typography.fontFamilySemiBold,
    lineHeight: 18,
  },
  captionMuted: {
    fontSize: 12,
    fontWeight: '400' as const,
    fontFamily: THEME.typography.fontFamily,
    lineHeight: 16,
    color: THEME.colors.textMuted,
  },
  small: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: '400' as const,
    fontFamily: THEME.typography.fontFamily,
    lineHeight: 14,
  },
  // Button text
  button: {
    fontSize: THEME.typography.sizes.lg,
    fontWeight: '600' as const,
    fontFamily: THEME.typography.fontFamilySemiBold,
    lineHeight: 24,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: THEME.typography.fontFamilySemiBold,
    lineHeight: 20,
  },
  // Mono (for code, technical data)
  mono: {
    fontSize: 12,
    fontWeight: '500' as const,
    fontFamily: 'Courier New',
    lineHeight: 18,
  },
};
