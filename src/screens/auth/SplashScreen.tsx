import React, {useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {AuthStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useAuthStore} from '../../stores/auth.store';
import {useSportTypeStore} from '../../stores/sportType.store';
import {useAppStore} from '../../stores/app.store';
import {useConfigStore} from '../../stores/config.store';
import {authService} from '../../services/auth.service';
import {scale} from '../../utils/responsive';
import Button from '../../components/ui/Button';
import SponsorBanner from '../../components/SponsorBanner';

type Props = NativeStackScreenProps<AuthStackParams, 'Splash'>;

export default function SplashScreen({navigation}: Props) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const loadFromStorage = useAuthStore(s => s.loadFromStorage);
  const login = useAuthStore(s => s.login);
  const fetchBySlug = useSportTypeStore(s => s.fetchBySlug);
  const sportTypeError = useSportTypeStore(s => s.error);
  const isLoaded = useSportTypeStore(s => s.isLoaded);
  const loadPreferences = useAppStore(s => s.loadPreferences);
  const fetchConfig = useConfigStore(s => s.fetchConfig);
  const branding = useConfigStore(s => s.config.branding);

  const bootstrap = async () => {
    await fetchConfig();
    await loadPreferences();
    await fetchBySlug();

    const hasToken = await loadFromStorage();
    if (hasToken) {
      try {
        const user = await authService.getProfile();
        const token = useAuthStore.getState().token!;
        await login(token, user);
      } catch {
        navigation.replace('Login');
      }
    } else {
      navigation.replace('Login');
    }
  };

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.container, {backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom}]}>
      <Text style={[styles.logo, {color: colors.primary}]}>
        {branding.appName || 'CricCircle'}
      </Text>
      {(branding.tagline || 'Your Cricket Companion') ? (
        <Text style={[styles.tagline, {color: colors.textSecondary}]}>
          {branding.tagline || 'Your Cricket Companion'}
        </Text>
      ) : null}
      {sportTypeError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, {color: colors.error}]}>
            {sportTypeError}
          </Text>
          <Button title="Retry" onPress={bootstrap} style={styles.retryBtn} />
        </View>
      ) : (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      )}
      <SponsorBanner placement="splash" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: scale(40),
    fontWeight: '700',
  },
  tagline: {
    fontSize: scale(16),
    marginTop: scale(8),
  },
  loader: {
    marginTop: scale(40),
  },
  errorContainer: {
    marginTop: scale(32),
    alignItems: 'center',
    paddingHorizontal: scale(32),
  },
  errorText: {
    fontSize: scale(14),
    textAlign: 'center',
    marginBottom: scale(16),
  },
  retryBtn: {
    width: scale(120),
  },
});
