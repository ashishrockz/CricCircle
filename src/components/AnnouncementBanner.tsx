import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import FeatherIcon from '@react-native-vector-icons/feather';
import {useTheme} from '../theme';
import {useConfigStore} from '../stores/config.store';
import {scale} from '../utils/responsive';

const TYPE_COLORS: Record<string, {bg: string; icon: string}> = {
  info: {bg: '#E3F2FD', icon: '#1976D2'},
  warning: {bg: '#FFF3E0', icon: '#F57C00'},
  critical: {bg: '#FFEBEE', icon: '#D32F2F'},
};

const TYPE_ICONS: Record<string, React.ComponentProps<typeof FeatherIcon>['name']> = {
  info: 'info',
  warning: 'alert-triangle',
  critical: 'alert-octagon',
};

export default function AnnouncementBanner() {
  const {colors} = useTheme();
  const announcement = useConfigStore(s => s.config.content.announcement);
  const [dismissed, setDismissed] = useState(false);

  if (!announcement.enabled || dismissed) {
    return null;
  }

  const typeStyle = TYPE_COLORS[announcement.type] || TYPE_COLORS.info;
  const iconName = TYPE_ICONS[announcement.type] || 'info';

  return (
    <View style={[styles.container, {backgroundColor: typeStyle.bg}]}>
      <FeatherIcon name={iconName} size={scale(18)} color={typeStyle.icon} />
      <View style={styles.textContainer}>
        {announcement.title ? (
          <Text style={[styles.title, {color: colors.text}]}>
            {announcement.title}
          </Text>
        ) : null}
        <Text style={[styles.message, {color: colors.textSecondary}]}>
          {announcement.message}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => setDismissed(true)}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <FeatherIcon name="x" size={scale(16)} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: scale(12),
    borderRadius: scale(8),
    marginBottom: scale(12),
    gap: scale(10),
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: scale(14),
    fontWeight: '600',
    marginBottom: scale(2),
  },
  message: {
    fontSize: scale(13),
    lineHeight: scale(18),
  },
});
