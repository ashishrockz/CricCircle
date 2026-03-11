import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../theme';
import {scale} from '../../utils/responsive';

interface BadgeProps {
  status: string;
  label?: string;
}

export default function Badge({status, label}: BadgeProps) {
  const {colors} = useTheme();

  const statusColors: Record<string, {bg: string; text: string}> = {
    active: {bg: colors.statusActive + '20', text: colors.statusActive},
    waiting: {bg: colors.statusWaiting + '20', text: colors.statusWaiting},
    completed: {bg: colors.statusCompleted + '20', text: colors.statusCompleted},
    abandoned: {bg: colors.statusAbandoned + '20', text: colors.statusAbandoned},
    toss_pending: {bg: colors.statusTossPending + '20', text: colors.statusTossPending},
    innings_break: {bg: colors.statusInningsBreak + '20', text: colors.statusInningsBreak},
    not_started: {bg: colors.statusWaiting + '20', text: colors.statusWaiting},
    banned: {bg: colors.error + '20', text: colors.error},
    inactive: {bg: colors.warning + '20', text: colors.warning},
    pending: {bg: colors.info + '20', text: colors.info},
  };

  const color = statusColors[status] || {
    bg: colors.textSecondary + '20',
    text: colors.textSecondary,
  };

  const displayLabel =
    label || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <View style={[styles.badge, {backgroundColor: color.bg}]}>
      <Text style={[styles.text, {color: color.text}]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: scale(12),
    fontWeight: '600',
  },
});
