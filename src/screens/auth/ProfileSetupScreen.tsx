import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import FeatherIcon from '@react-native-vector-icons/feather';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useTranslation} from 'react-i18next';
import {authService} from '../../services/auth.service';
import {useAuthStore} from '../../stores/auth.store';
import {useConfigStore} from '../../stores/config.store';
import {storage, STORAGE_KEYS} from '../../utils/storage';
import {scale} from '../../utils/responsive';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import CountryCodePicker from '../../components/CountryCodePicker';
import {DEFAULT_COUNTRY, type Country} from '../../utils/countries';

type Props =
  | NativeStackScreenProps<AuthStackParams, 'ProfileSetup'>
  | {route?: undefined; navigation?: undefined};

export default function ProfileSetupScreen(props: Props) {
  const routeToken = props.route?.params?.token;
  const routeUser = props.route?.params?.user;

  // When used standalone (from RootNavigator), read from auth store
  const storeToken = useAuthStore(s => s.token);
  const storeUser = useAuthStore(s => s.user);

  const token = routeToken || storeToken!;
  const user = routeUser || storeUser!;

  const hasPhone = !!user?.phone;
  const hasEmail = !!user?.email;

  const {colors} = useTheme();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const login = useAuthStore(s => s.login);
  const setUser = useAuthStore(s => s.setUser);
  const config = useConfigStore(s => s.config);

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [email, setEmail] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(!!user?.termsAcceptedAt);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) {
      errs.name = t('auth.nameRequired');
    }
    if (!username.trim()) {
      errs.username = t('auth.usernameRequired');
    } else if (username.trim().length < 3) {
      errs.username = t('auth.usernameTooShort');
    } else if (!/^[a-z0-9_]+$/.test(username.trim())) {
      errs.username = 'Only lowercase letters, numbers, and underscores';
    }
    if (!hasPhone) {
      if (!phone.trim()) {
        errs.phone = 'Phone number is required';
      } else if (phone.trim().length !== 10) {
        errs.phone = 'Enter a valid 10-digit phone number';
      }
    }
    if (!hasEmail) {
      if (!email.trim()) {
        errs.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errs.email = 'Enter a valid email address';
      }
    }
    if (!termsAccepted) {
      errs.terms = 'You must accept the Terms & Conditions';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text.replace(/[^0-9]/g, '').slice(0, 10));
  };

  const handleContinue = async () => {
    if (!validate()) {
      return;
    }
    setApiError('');
    setLoading(true);
    try {
      // Ensure token is in storage so the API interceptor can authenticate
      await storage.set(STORAGE_KEYS.TOKEN, token);

      const updates: Record<string, string> = {
        name: name.trim(),
        username: username.trim(),
      };
      if (!hasPhone) {
        updates.phone = `${country.dialCode}${phone.trim()}`;
      }
      if (!hasEmail) {
        updates.email = email.trim().toLowerCase();
      }
      if (!user?.termsAcceptedAt) {
        updates.termsAcceptedAt = new Date().toISOString();
      }

      const updated = await authService.updateProfile(updates);
      if (routeToken) {
        // Coming from OtpVerify flow — call login to complete authentication
        await login(token, {...user, ...updated});
      } else {
        // Already authenticated (standalone) — just update the user
        setUser({...user, ...updated});
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const termsUrl = config?.content?.termsUrl || 'https://example.com/terms';
  const privacyUrl = config?.content?.privacyUrl || 'https://example.com/privacy';

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, {color: colors.text}]}>
          {t('auth.setupTitle')}
        </Text>
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          {t('auth.setupSubtitle')}
        </Text>

        <View style={styles.form}>
          <Input
            label={t('profile.name')}
            value={name}
            onChangeText={setName}
            error={errors.name}
            placeholder={t('auth.namePlaceholder')}
          />
          <Input
            label={t('profile.username')}
            value={username}
            onChangeText={handleUsernameChange}
            error={errors.username}
            placeholder={t('auth.usernamePlaceholder')}
            autoCapitalize="none"
          />

          {/* Phone field — shown when user logged in with email */}
          {!hasPhone && (
            <View>
              <Text style={[styles.label, {color: colors.text}]}>
                Phone Number
              </Text>
              <View style={styles.phoneRow}>
                <CountryCodePicker
                  selected={country}
                  onSelect={setCountry}
                />
                <View style={styles.phoneInputWrap}>
                  <Input
                    value={phone}
                    onChangeText={handlePhoneChange}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    maxLength={10}
                    error={errors.phone}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Email field — shown when user logged in with phone */}
          {!hasEmail && (
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}

          {/* Terms & Conditions */}
          {!user?.termsAcceptedAt && (
            <View style={styles.termsRow}>
              <TouchableOpacity
                onPress={() => setTermsAccepted(!termsAccepted)}
                style={[
                  styles.checkbox,
                  {
                    borderColor: errors.terms ? colors.error : colors.border,
                    backgroundColor: termsAccepted
                      ? colors.primary
                      : 'transparent',
                  },
                ]}>
                {termsAccepted && (
                  <FeatherIcon
                    name="check"
                    size={scale(14)}
                    color="#fff"
                  />
                )}
              </TouchableOpacity>
              <Text style={[styles.termsText, {color: colors.textSecondary}]}>
                I agree to the{' '}
                <Text
                  style={{color: colors.primary}}
                  onPress={() => Linking.openURL(termsUrl)}>
                  Terms & Conditions
                </Text>
                {' and '}
                <Text
                  style={{color: colors.primary}}
                  onPress={() => Linking.openURL(privacyUrl)}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
          )}
          {errors.terms ? (
            <Text style={[styles.fieldError, {color: colors.error}]}>
              {errors.terms}
            </Text>
          ) : null}

          {apiError ? (
            <Text style={[styles.apiError, {color: colors.error}]}>
              {apiError}
            </Text>
          ) : null}

          <Button
            title={t('auth.continue')}
            onPress={handleContinue}
            loading={loading}
            style={styles.continueBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
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
  form: {
    gap: scale(4),
  },
  label: {
    fontSize: scale(13),
    fontWeight: '500',
    marginBottom: scale(6),
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInputWrap: {
    flex: 1,
    marginBottom: -scale(16),
  },
  fieldError: {
    fontSize: scale(12),
    marginTop: scale(4),
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(10),
    marginTop: scale(12),
  },
  checkbox: {
    width: scale(22),
    height: scale(22),
    borderWidth: 2,
    borderRadius: scale(4),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(2),
  },
  termsText: {
    flex: 1,
    fontSize: scale(13),
    lineHeight: scale(20),
  },
  apiError: {
    fontSize: scale(13),
    textAlign: 'center',
    marginTop: scale(8),
  },
  continueBtn: {
    marginTop: scale(16),
  },
});
