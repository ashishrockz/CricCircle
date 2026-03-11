import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useTranslation} from 'react-i18next';
import {authService} from '../../services/auth.service';
import {useAuthStore} from '../../stores/auth.store';
import {storage, STORAGE_KEYS} from '../../utils/storage';
import {scale} from '../../utils/responsive';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

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

  const {colors} = useTheme();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const login = useAuthStore(s => s.login);
  const setUser = useAuthStore(s => s.setUser);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{name?: string; username?: string}>({});
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim()) {
      errs.name = t('auth.nameRequired');
    }
    if (!username.trim()) {
      errs.username = t('auth.usernameRequired');
    } else if (username.trim().length < 3) {
      errs.username = t('auth.usernameTooShort');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
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
      const updated = await authService.updateProfile({
        name: name.trim(),
        username: username.trim(),
      });
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
            onChangeText={setUsername}
            error={errors.username}
            placeholder={t('auth.usernamePlaceholder')}
            autoCapitalize="none"
          />

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
  apiError: {
    fontSize: scale(13),
    textAlign: 'center',
    marginTop: scale(8),
  },
  continueBtn: {
    marginTop: scale(16),
  },
});
