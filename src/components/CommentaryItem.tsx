import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../theme';
import {scale} from '../utils/responsive';
import type {CommentaryEntry} from '../models';

interface CommentaryItemProps {
  entry: CommentaryEntry;
}

export default function CommentaryItem({entry}: CommentaryItemProps) {
  const {colors} = useTheme();

  const typeColors: Record<string, string> = {
    dot: colors.dot,
    single: colors.single,
    runs: colors.runs,
    four: colors.four,
    six: colors.six,
    wicket: colors.wicket,
    extra: colors.extra,
    over_end: colors.textSecondary,
    innings_end: colors.accent,
    match_end: colors.primary,
    milestone: colors.milestone,
  };

  const typeLabels: Record<string, string> = {
    dot: '0',
    single: '1',
    runs: 'R',
    four: '4',
    six: '6',
    wicket: 'W',
    extra: 'E',
    over_end: 'OV',
    innings_end: 'INN',
    match_end: 'END',
    milestone: 'M',
  };

  const dotColor = typeColors[entry.type] || colors.textSecondary;
  const label = typeLabels[entry.type] || '';

  return (
    <View style={[styles.container, {borderBottomColor: colors.divider}]}>
      <View style={[styles.dot, {backgroundColor: dotColor}]}>
        <Text style={styles.dotText}>{label}</Text>
      </View>
      <Text style={[styles.text, {color: colors.text}]}>{entry.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: scale(8),
    borderBottomWidth: 0.5,
    gap: scale(10),
  },
  dot: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(2),
  },
  dotText: {
    color: '#FFFFFF',
    fontSize: scale(11),
    fontWeight: '700',
  },
  text: {
    flex: 1,
    fontSize: scale(14),
    lineHeight: scale(20),
  },
});
