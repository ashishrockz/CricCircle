import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../theme';
import {scale} from '../utils/responsive';
import {formatEconomy} from '../utils/formatters';

interface BowlingCardProps {
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  isCurrent?: boolean;
}

export default function BowlingCard({
  name,
  overs,
  maidens,
  runs,
  wickets,
  isCurrent,
}: BowlingCardProps) {
  const {colors} = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: colors.divider,
          backgroundColor: isCurrent ? colors.primary + '10' : 'transparent',
        },
      ]}>
      <Text
        style={[
          styles.name,
          {color: colors.text},
          isCurrent && {fontWeight: '700'},
        ]}
        numberOfLines={1}>
        {name}
        {isCurrent ? ' *' : ''}
      </Text>
      <Text style={[styles.stat, {color: colors.textSecondary}]}>{overs}</Text>
      <Text style={[styles.stat, {color: colors.textSecondary}]}>
        {maidens}
      </Text>
      <Text style={[styles.stat, {color: colors.text}]}>{runs}</Text>
      <Text style={[styles.stat, {color: colors.wicket, fontWeight: '700'}]}>
        {wickets}
      </Text>
      <Text style={[styles.stat, {color: colors.textSecondary}]}>
        {formatEconomy(runs, overs)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(8),
    paddingHorizontal: scale(12),
    borderBottomWidth: 0.5,
  },
  name: {
    flex: 2,
    fontSize: scale(14),
  },
  stat: {
    flex: 0.7,
    fontSize: scale(14),
    textAlign: 'center',
  },
});
