import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import FeatherIcon from '@react-native-vector-icons/feather';
import {useTheme} from '../../theme';
import {scale} from '../../utils/responsive';

interface EmptyStateProps {
  icon?: string;
  message: string;
  submessage?: string;
}

export default function EmptyState({
  icon = 'inbox',
  message,
  submessage,
}: EmptyStateProps) {
  const {colors} = useTheme();

  return (
    <View style={styles.container}>
      <FeatherIcon
        name={icon as any}
        size={scale(48)}
        color={colors.textSecondary}
      />
      <Text style={[styles.message, {color: colors.text}]}>{message}</Text>
      {submessage && (
        <Text style={[styles.submessage, {color: colors.textSecondary}]}>
          {submessage}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(48),
  },
  message: {
    fontSize: scale(16),
    fontWeight: '600',
    marginTop: scale(16),
    textAlign: 'center',
  },
  submessage: {
    fontSize: scale(14),
    marginTop: scale(8),
    textAlign: 'center',
  },
});
