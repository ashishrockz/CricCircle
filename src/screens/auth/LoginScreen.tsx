import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useTranslation} from 'react-i18next';
import {authService} from '../../services/auth.service';
import {scale} from '../../utils/responsive';
import Button from '../../components/ui/Button';

type Props = NativeStackScreenProps<AuthStackParams, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const {colors, borderRadius} = useTheme();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t('auth.enterIdentifier'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.sendOtp(trimmed);
      navigation.navigate('OtpVerify', {identifier: trimmed, method: 'email'});
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.otpFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={[styles.title, {color: colors.text}]}>
          {t('auth.loginTitle')}
        </Text>
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          {t('auth.loginSubtitle')}
        </Text>

        <View style={styles.form}>
          <View>
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
                style={[styles.input, {color: colors.text}]}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            {error ? (
              <Text style={[styles.error, {color: colors.error}]}>{error}</Text>
            ) : null}
          </View>
          <Button
            title={t('auth.sendOtp')}
            onPress={handleSendOtp}
            loading={loading}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: scale(24),
  },
  title: {
    fontSize: scale(28),
    fontWeight: '700',
    marginBottom: scale(8),
  },
  subtitle: {
    fontSize: scale(16),
    marginBottom: scale(40),
    lineHeight: scale(24),
  },
  form: {
    gap: scale(8),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: scale(14),
    marginBottom: scale(16),
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
