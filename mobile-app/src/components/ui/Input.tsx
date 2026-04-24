import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { THEME } from '../../theme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  editable?: boolean;
  variant?: 'default' | 'filled' | 'outline';
  style?: ViewStyle;
  testID?: string;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  hint,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  editable = true,
  variant = 'default',
  style,
  testID,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const inputStyles: TextStyle = {
    ...styles.input,
    ...styles[`variant_${variant}`],
    ...(isFocused && styles.inputFocused),
    ...(multiline && styles.inputMultiline),
    ...(error && styles.inputError),
    ...(editable === false && styles.inputDisabled),
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={inputStyles}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={THEME.colors.textMuted}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        editable={editable}
        testID={testID}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {error && <Text style={styles.errorText}>⚠ {error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
      {maxLength && (
        <Text style={styles.charCount}>
          {value.length} / {maxLength}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.sm,
    fontFamily: 'Poppins-SemiBold',
  },
  
  // Base input
  input: {
    borderRadius: THEME.borderRadius.lg,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    fontSize: 14,
    color: THEME.colors.text,
    fontFamily: 'Poppins',
    lineHeight: 20,
  },
  
  // Variants
  variant_default: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  variant_filled: {
    backgroundColor: THEME.colors.surfaceAlt,
    borderWidth: 0,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: THEME.colors.borderMedium,
  },
  
  // Focus state
  inputFocused: {
    borderColor: THEME.colors.primary,
    ...THEME.shadows.sm,
  },
  
  // Multiline
  inputMultiline: {
    paddingVertical: THEME.spacing.md,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  
  // Error state
  inputError: {
    borderColor: THEME.colors.danger,
    backgroundColor: THEME.colors.dangerLight,
  },
  
  // Disabled state
  inputDisabled: {
    backgroundColor: THEME.colors.disabled,
    color: THEME.colors.disabledText,
  },
  
  // Help text
  errorText: {
    color: THEME.colors.danger,
    fontSize: 12,
    marginTop: THEME.spacing.xs,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  hintText: {
    color: THEME.colors.textTertiary,
    fontSize: 12,
    marginTop: THEME.spacing.xs,
    fontFamily: 'Poppins',
  },
  charCount: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    marginTop: THEME.spacing.xs,
    textAlign: 'right',
    fontFamily: 'Poppins',
  },
});
