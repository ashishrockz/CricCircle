import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../theme';
import {scale} from '../utils/responsive';
import {formatStrikeRate} from '../utils/formatters';

interface BattingCardProps {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isStriker?: boolean;
  isOut?: boolean;
  dismissal?: string;
}

export default function BattingCard({
  name,
  runs,
  balls,
  fours,
  sixes,
  isStriker,
  isOut,
  dismissal,
}: BattingCardProps) {
  const {colors} = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          borderBottomColor: colors.divider,
          backgroundColor: isStriker ? colors.primary + '10' : 'transparent',
        },
      ]}>
      <View style={styles.nameCol}>
        <Text
          style={[
            styles.name,
            {color: colors.text},
            isStriker && {fontWeight: '700'},
          ]}
          numberOfLines={1}>
          {name}
          {isStriker ? ' *' : ''}
        </Text>
        {dismissal && (
          <Text
            style={[styles.dismissal, {color: colors.textSecondary}]}
            numberOfLines={1}>
            {dismissal}
          </Text>
        )}
      </View>
      <Text style={[styles.stat, {color: colors.text, fontWeight: '700'}]}>
        {runs}
      </Text>
      <Text style={[styles.stat, {color: colors.textSecondary}]}>{balls}</Text>
      <Text style={[styles.stat, {color: colors.four}]}>{fours}</Text>
      <Text style={[styles.stat, {color: colors.six}]}>{sixes}</Text>
      <Text style={[styles.stat, {color: colors.textSecondary}]}>
        {formatStrikeRate(runs, balls)}
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
  nameCol: {
    flex: 2,
  },
  name: {
    fontSize: scale(14),
  },
  dismissal: {
    fontSize: scale(11),
    marginTop: scale(2),
  },
  stat: {
    flex: 0.7,
    fontSize: scale(14),
    textAlign: 'center',
  },
});
