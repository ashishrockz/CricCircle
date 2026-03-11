import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import {useTheme} from '../../theme';
import {scale} from '../../utils/responsive';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const {colors, borderRadius} = useTheme();

  const variants: Record<Variant, {bg: string; text: string; border: string}> =
    {
      primary: {bg: colors.primary, text: colors.textInverse, border: colors.primary},
      secondary: {bg: 'transparent', text: colors.primary, border: colors.primary},
      danger: {bg: colors.error, text: colors.textInverse, border: colors.error},
      ghost: {bg: 'transparent', text: colors.text, border: 'transparent'},
    };

  const v = variants[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderRadius: borderRadius.md,
          opacity: isDisabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        variant === 'secondary' && styles.outlined,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text style={[styles.text, {color: v.text}, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: scale(48),
  },
  fullWidth: {
    width: '100%',
  },
  outlined: {
    borderWidth: 1.5,
  },
  text: {
    fontSize: scale(16),
    fontWeight: '600',
  },
});
