import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useTranslation} from 'react-i18next';
import {authService} from '../../services/auth.service';
import {useAuthStore} from '../../stores/auth.store';
import {useConfigStore} from '../../stores/config.store';
import {scale} from '../../utils/responsive';
import Button from '../../components/ui/Button';

type Props = NativeStackScreenProps<AuthStackParams, 'OtpVerify'>;

export default function OtpVerifyScreen({navigation, route}: Props) {
  const {identifier, method} = route.params;
  const {colors} = useTheme();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const login = useAuthStore(s => s.login);
  const {otpLength, otpResendSeconds} = useConfigStore(s => s.config.settings);

  const OTP_LENGTH = otpLength;
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(otpResendSeconds);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Please enter the complete OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await authService.verifyOtp(identifier, code);
      // If user hasn't set up their profile yet, redirect to setup
      if (!result.user.name || !result.user.username) {
        navigation.replace('ProfileSetup', {
          token: result.token,
          user: result.user,
        });
        return;
      }
      await login(result.token, result.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await authService.sendOtp(identifier);
      setCountdown(otpResendSeconds);
    } catch {}
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={[styles.title, {color: colors.text}]}>
          {t('auth.verifyTitle')}
        </Text>
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          {t('auth.verifySubtitle')} {identifier}
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                {
                  borderColor: digit ? colors.primary : colors.border,
                  color: colors.text,
                  backgroundColor: colors.surface,
                },
              ]}
              value={digit}
              onChangeText={text => handleChange(text, index)}
              onKeyPress={({nativeEvent}) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? (
          <Text style={[styles.error, {color: colors.error}]}>{error}</Text>
        ) : null}

        <Button
          title={t('auth.verify')}
          onPress={handleVerify}
          loading={loading}
          style={styles.verifyBtn}
        />

        <TouchableOpacity
          onPress={handleResend}
          disabled={countdown > 0}
          style={styles.resendRow}>
          <Text
            style={[
              styles.resendText,
              {color: countdown > 0 ? colors.textSecondary : colors.primary},
            ]}>
            {countdown > 0
              ? t('auth.resendIn', {seconds: countdown})
              : t('auth.resendOtp')}
          </Text>
        </TouchableOpacity>
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
    fontSize: scale(24),
    fontWeight: '700',
    marginBottom: scale(8),
  },
  subtitle: {
    fontSize: scale(15),
    marginBottom: scale(32),
    lineHeight: scale(22),
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: scale(8),
    marginBottom: scale(16),
  },
  otpInput: {
    flex: 1,
    height: scale(52),
    borderWidth: 1.5,
    borderRadius: scale(10),
    textAlign: 'center',
    fontSize: scale(22),
    fontWeight: '700',
  },
  error: {
    fontSize: scale(13),
    marginBottom: scale(12),
    textAlign: 'center',
  },
  verifyBtn: {
    marginTop: scale(8),
  },
  resendRow: {
    alignItems: 'center',
    marginTop: scale(20),
  },
  resendText: {
    fontSize: scale(14),
    fontWeight: '500',
  },
});
