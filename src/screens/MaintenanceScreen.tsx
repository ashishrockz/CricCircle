import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import FeatherIcon from '@react-native-vector-icons/feather';
import {useTheme} from '../theme';
import {useConfigStore} from '../stores/config.store';
import {scale} from '../utils/responsive';
import Button from '../components/ui/Button';

export default function MaintenanceScreen() {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const maintenance = useConfigStore(s => s.config.maintenance);
  const refreshConfig = useConfigStore(s => s.refreshConfig);

  const [loading, setLoading] = React.useState(false);

  const handleRetry = async () => {
    setLoading(true);
    await refreshConfig();
    setLoading(false);
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
      <FeatherIcon name="tool" size={scale(64)} color={colors.warning} />
      <Text style={[styles.title, {color: colors.text}]}>
        {maintenance.title || 'Under Maintenance'}
      </Text>
      <Text style={[styles.message, {color: colors.textSecondary}]}>
        {maintenance.message ||
          'We are performing scheduled maintenance. Please try again later.'}
      </Text>
      {maintenance.estimatedEndTime && (
        <Text style={[styles.estimate, {color: colors.textSecondary}]}>
          Estimated return:{' '}
          {new Date(maintenance.estimatedEndTime).toLocaleString()}
        </Text>
      )}
      <Button
        title="Retry"
        onPress={handleRetry}
        loading={loading}
        style={styles.retryBtn}
      />
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
  estimate: {
    fontSize: scale(13),
    marginTop: scale(16),
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: scale(32),
    width: scale(140),
  },
});
