import React, {useState} from 'react';
import {
  View,
  Text,
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
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import AppModal from '../../components/ui/AppModal';

type Props = NativeStackScreenProps<AuthStackParams, 'Login'>;

export default function LoginScreen({navigation}: Props) {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const isEmail = identifier.includes('@');
  const method: 'phone' | 'email' = isEmail ? 'email' : 'phone';

  const handleSendOtp = async () => {
    if (!identifier.trim()) {
      setError('Please enter your phone number or email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await authService.sendOtp(identifier.trim());
      if (result.otp) {
        setDevOtp(result.otp);
      } else {
        navigation.navigate('OtpVerify', {identifier: identifier.trim(), method});
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
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
          <Input
            placeholder={t('auth.phonePlaceholder')}
            value={identifier}
            onChangeText={setIdentifier}
            keyboardType={isEmail ? 'email-address' : 'phone-pad'}
            autoCapitalize="none"
            error={error}
          />
          <Button
            title={t('auth.sendOtp')}
            onPress={handleSendOtp}
            loading={loading}
          />
        </View>
      </View>
      <AppModal
        visible={!!devOtp}
        title="Dev OTP"
        message={`Your OTP is: ${devOtp}`}
        onClose={() => {
          setDevOtp('');
          navigation.navigate('OtpVerify', {identifier: identifier.trim(), method});
        }}
      />
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
});
