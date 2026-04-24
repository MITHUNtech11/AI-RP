/**
 * Feather Icon wrapper component for consistent icon usage
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import * as featherIcons from 'feather-icons';
import type { IconProps } from 'feather-icons';
import { THEME } from '../theme';

interface FeatherIconProps {
  name: keyof typeof featherIcons.icons;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: any;
}

/**
 * Feather Icon Component
 * Usage: <FeatherIcon name="upload" size={24} color={THEME.colors.primary} />
 */
export const FeatherIcon: React.FC<FeatherIconProps> = ({
  name,
  size = 24,
  color = THEME.colors.text,
  strokeWidth = 2,
  style,
}) => {
  const iconData = featherIcons.icons[name];

  if (!iconData) {
    console.warn(`Icon "${name}" not found in Feather Icons`);
    return null;
  }

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${size}"
      height="${size}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${color}"
      stroke-width="${strokeWidth}"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      ${iconData.contents}
    </svg>
  `;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* For React Native, use SVG element directly */}
      {/* This requires SvgUri or similar - alternative is to use SVG library */}
    </View>
  );
};

/**
 * Simple icon renderer using SVG strings
 * For use in web/Expo web
 */
export const renderFeatherIcon = (
  name: keyof typeof featherIcons.icons,
  size: number = 24,
  color: string = THEME.colors.text,
  strokeWidth: number = 2
): string | null => {
  const iconData = featherIcons.icons[name];

  if (!iconData) {
    console.warn(`Icon "${name}" not found in Feather Icons`);
    return null;
  }

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${size}"
      height="${size}"
      viewBox="0 0 24 24"
      fill="none"
      stroke="${color}"
      stroke-width="${strokeWidth}"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      ${iconData.contents}
    </svg>
  `;
};

/**
 * Common icon presets for quick usage
 */
export const IconPresets = {
  upload: (size?: number) => ({ name: 'upload' as const, size: size || 20 }),
  download: (size?: number) => ({ name: 'download' as const, size: size || 20 }),
  file: (size?: number) => ({ name: 'file' as const, size: size || 20 }),
  plus: (size?: number) => ({ name: 'plus' as const, size: size || 20 }),
  check: (size?: number) => ({ name: 'check' as const, size: size || 20 }),
  x: (size?: number) => ({ name: 'x' as const, size: size || 20 }),
  trash2: (size?: number) => ({ name: 'trash-2' as const, size: size || 20 }),
  edit: (size?: number) => ({ name: 'edit' as const, size: size || 20 }),
  eye: (size?: number) => ({ name: 'eye' as const, size: size || 20 }),
  chevronRight: (size?: number) => ({ name: 'chevron-right' as const, size: size || 20 }),
  chevronDown: (size?: number) => ({ name: 'chevron-down' as const, size: size || 20 }),
  menu: (size?: number) => ({ name: 'menu' as const, size: size || 20 }),
  alertCircle: (size?: number) => ({ name: 'alert-circle' as const, size: size || 20 }),
  checkCircle: (size?: number) => ({ name: 'check-circle' as const, size: size || 20 }),
  lock: (size?: number) => ({ name: 'lock' as const, size: size || 20 }),
  home: (size?: number) => ({ name: 'home' as const, size: size || 20 }),
  settings: (size?: number) => ({ name: 'settings' as const, size: size || 20 }),
  info: (size?: number) => ({ name: 'info' as const, size: size || 20 }),
  loader: (size?: number) => ({ name: 'loader' as const, size: size || 20 }),
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
