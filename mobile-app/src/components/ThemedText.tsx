/**
 * ThemedText Component
 * Ensures all text uses Poppins font and consistent typography
 */
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { THEME, getTypographyStyle } from '../theme';

interface ThemedTextProps extends TextProps {
  variant?:
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'body'
    | 'bodyBold'
    | 'caption'
    | 'captionBold'
    | 'small'
    | 'button';
  color?: string;
  weight?: '400' | '500' | '600' | '700' | '800';
  align?: 'left' | 'center' | 'right';
}

/**
 * ThemedText - Text component with Poppins font and theme-aware styling
 */
export const ThemedText: React.FC<ThemedTextProps> = ({
  variant = 'body',
  color = THEME.colors.text,
  weight,
  align = 'left',
  style,
  children,
  ...props
}) => {
  const baseStyle = getTypographyStyle(variant);

  const fontWeightMap: Record<string, any> = {
    '400': { fontFamily: THEME.typography.fontFamily },
    '500': { fontFamily: THEME.typography.fontFamilyMedium },
    '600': { fontFamily: THEME.typography.fontFamilySemiBold },
    '700': { fontFamily: THEME.typography.fontFamilyBold },
    '800': { fontFamily: THEME.typography.fontFamilyBold },
  };

  const weightStyle = weight ? fontWeightMap[weight] : {};

  return (
    <Text
      {...props}
      style={[
        styles.default,
        baseStyle,
        {
          color,
          textAlign: align,
          ...weightStyle,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  default: {
    fontFamily: THEME.typography.fontFamily,
  },
});
