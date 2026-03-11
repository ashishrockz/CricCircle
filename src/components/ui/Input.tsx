import React, {useState} from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import FeatherIcon from '@react-native-vector-icons/feather';
import {useTheme} from '../../theme';
import {scale} from '../../utils/responsive';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureToggle?: boolean;
}

export default function Input({
  label,
  error,
  secureToggle,
  secureTextEntry,
  style,
  ...props
}: InputProps) {
  const {colors, borderRadius} = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, {color: colors.textSecondary}]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: error ? colors.error : colors.border,
            backgroundColor: colors.surface,
            borderRadius: borderRadius.md,
          },
        ]}>
        <TextInput
          style={[
            styles.input,
            {color: colors.text},
            style,
          ]}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={secureToggle ? !showPassword : secureTextEntry}
          {...props}
        />
        {secureToggle && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <FeatherIcon
              name={showPassword ? 'eye-off' : 'eye'}
              size={scale(20)}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.error, {color: colors.error}]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: scale(16),
  },
  label: {
    fontSize: scale(14),
    fontWeight: '500',
    marginBottom: scale(6),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: scale(14),
  },
  input: {
    flex: 1,
    fontSize: scale(16),
    paddingVertical: scale(12),
  },
  error: {
    fontSize: scale(12),
    marginTop: scale(4),
  },
});
