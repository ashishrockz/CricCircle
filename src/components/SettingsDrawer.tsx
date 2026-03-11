import React, {useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import FeatherIcon from '@react-native-vector-icons/feather';
import {useTheme} from '../theme';
import {useAppStore} from '../stores/app.store';
import {scale} from '../utils/responsive';
import {useTranslation} from 'react-i18next';
import Dropdown from './ui/Dropdown';
import type {DropdownOption} from './ui/Dropdown';

const LANGUAGE_OPTIONS: DropdownOption[] = [
  {label: 'English', value: 'en', icon: '🇺🇸'},
  {label: 'हिन्दी', value: 'hi', icon: '🇮🇳'},
  {label: 'ಕನ್ನಡ', value: 'kn', icon: '🇮🇳'},
];

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

interface SettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function SettingsDrawer({
  visible,
  onClose,
  onLogout,
}: SettingsDrawerProps) {
  const {colors} = useTheme();
  const {t, i18n} = useTranslation();
  const insets = useSafeAreaInsets();
  const {theme, toggleTheme, locale, setLocale} = useAppStore();

  const handleLanguageChange = useCallback(
    (lang: string) => {
      i18n.changeLanguage(lang);
      setLocale(lang);
    },
    [i18n, setLocale],
  );

  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, overlayAnim]);

  const themeIcon = theme === 'dark' ? 'moon' : theme === 'light' ? 'sun' : 'smartphone';
  const themeLabel =
    theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System';

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            {opacity: overlayAnim},
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: colors.surface,
            width: DRAWER_WIDTH,
            transform: [{translateX: slideAnim}],
            paddingTop: insets.top + scale(16),
            paddingBottom: insets.bottom + scale(16),
            borderLeftColor: colors.border,
          },
        ]}>
        {/* Header */}
        <View style={styles.drawerHeader}>
          <Text style={[styles.drawerTitle, {color: colors.text}]}>
            {t('profile.settings')}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <FeatherIcon name="x" size={scale(22)} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Settings Items */}
        <View style={styles.drawerContent}>
          {/* Theme */}
          <TouchableOpacity
            style={[styles.drawerItem, {borderBottomColor: colors.divider}]}
            onPress={toggleTheme}
            activeOpacity={0.6}>
            <View style={[styles.drawerItemIcon, {backgroundColor: colors.primary + '15'}]}>
              <FeatherIcon name={themeIcon} size={scale(18)} color={colors.primary} />
            </View>
            <View style={styles.drawerItemContent}>
              <Text style={[styles.drawerItemLabel, {color: colors.text}]}>
                {t('profile.theme')}
              </Text>
              <Text style={[styles.drawerItemValue, {color: colors.textSecondary}]}>
                {themeLabel}
              </Text>
            </View>
            <View style={[styles.themeBadge, {backgroundColor: colors.primary + '15'}]}>
              <Text style={[styles.themeBadgeText, {color: colors.primary}]}>
                {themeLabel}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Language */}
          <View style={[styles.drawerItem, {borderBottomColor: colors.divider}]}>
            <View style={[styles.drawerItemIcon, {backgroundColor: colors.info + '15'}]}>
              <FeatherIcon name="globe" size={scale(18)} color={colors.info} />
            </View>
            <View style={styles.drawerItemContent}>
              <Text style={[styles.drawerItemLabel, {color: colors.text}]}>
                {t('profile.language')}
              </Text>
              <View style={styles.languageDropdown}>
                <Dropdown
                  options={LANGUAGE_OPTIONS}
                  value={locale}
                  onSelect={handleLanguageChange}
                  placeholder="Select language"
                />
              </View>
            </View>
          </View>

          {/* About / Version */}
          <TouchableOpacity
            style={[styles.drawerItem, {borderBottomColor: colors.divider}]}
            activeOpacity={0.6}>
            <View style={[styles.drawerItemIcon, {backgroundColor: colors.textSecondary + '15'}]}>
              <FeatherIcon name="info" size={scale(18)} color={colors.textSecondary} />
            </View>
            <View style={styles.drawerItemContent}>
              <Text style={[styles.drawerItemLabel, {color: colors.text}]}>
                About
              </Text>
              <Text style={[styles.drawerItemValue, {color: colors.textSecondary}]}>
                v1.0.0
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout at bottom */}
        <View style={styles.drawerFooter}>
          <TouchableOpacity
            style={[styles.logoutBtn, {backgroundColor: colors.error + '10', borderColor: colors.error + '30'}]}
            onPress={onLogout}
            activeOpacity={0.7}>
            <FeatherIcon name="log-out" size={scale(18)} color={colors.error} />
            <Text style={[styles.logoutText, {color: colors.error}]}>
              {t('profile.logout')}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    borderLeftWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: -3, height: 0},
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(20),
    marginBottom: scale(24),
  },
  drawerTitle: {
    fontSize: scale(20),
    fontWeight: '700',
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: scale(16),
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(14),
    borderBottomWidth: 0.5,
    gap: scale(12),
  },
  drawerItemIcon: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerItemContent: {
    flex: 1,
  },
  drawerItemLabel: {
    fontSize: scale(15),
    fontWeight: '600',
  },
  drawerItemValue: {
    fontSize: scale(12),
    marginTop: scale(1),
  },
  languageDropdown: {
    marginTop: scale(6),
  },
  themeBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(12),
  },
  themeBadgeText: {
    fontSize: scale(12),
    fontWeight: '600',
  },
  drawerFooter: {
    paddingHorizontal: scale(16),
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(13),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: scale(8),
  },
  logoutText: {
    fontSize: scale(15),
    fontWeight: '600',
  },
});
