import React from 'react';
import {View, Text, StyleSheet, Linking} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import FeatherIcon from '@react-native-vector-icons/feather';
import {useTheme} from '../theme';
import {useConfigStore} from '../stores/config.store';
import {scale} from '../utils/responsive';
import Button from '../components/ui/Button';

export default function ForceUpdateScreen() {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const forceUpdate = useConfigStore(s => s.config.content.forceUpdate);

  const handleUpdate = () => {
    if (forceUpdate.updateUrl) {
      Linking.openURL(forceUpdate.updateUrl).catch(() => {});
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}>
      <FeatherIcon
        name="download-cloud"
        size={scale(64)}
        color={colors.primary}
      />
      <Text style={[styles.title, {color: colors.text}]}>Update Required</Text>
      <Text style={[styles.message, {color: colors.textSecondary}]}>
        {forceUpdate.message ||
          'A new version is available. Please update to continue.'}
      </Text>
      {forceUpdate.updateUrl ? (
        <Button
          title="Update Now"
          onPress={handleUpdate}
          style={styles.updateBtn}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(32),
  },
  title: {
    fontSize: scale(24),
    fontWeight: '700',
    marginTop: scale(24),
    textAlign: 'center',
  },
  message: {
    fontSize: scale(15),
    marginTop: scale(12),
    textAlign: 'center',
    lineHeight: scale(22),
  },
  updateBtn: {
    marginTop: scale(32),
    width: scale(160),
  },
});
