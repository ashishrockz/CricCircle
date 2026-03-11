import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Avatar from './ui/Avatar';
import {useTheme} from '../theme';
import {scale} from '../utils/responsive';
import type {LeaderboardEntry} from '../models';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  isCurrentUser?: boolean;
}

export default function LeaderboardRow({
  entry,
  isCurrentUser,
}: LeaderboardRowProps) {
  const {colors} = useTheme();

  const rankColors: Record<number, string> = {
    1: '#FFD700',
    2: '#C0C0C0',
    3: '#CD7F32',
  };

  return (
    <View
      style={[
        styles.container,
        {borderBottomColor: colors.divider},
        isCurrentUser && {backgroundColor: colors.primary + '10'},
      ]}>
      <View
        style={[
          styles.rank,
          {
            backgroundColor:
              rankColors[entry.rank] || colors.textSecondary + '20',
          },
        ]}>
        <Text
          style={[
            styles.rankText,
            {color: entry.rank <= 3 ? '#000' : colors.text},
          ]}>
          {entry.rank}
        </Text>
      </View>
      <Avatar name={entry.name} uri={entry.avatar} size={36} />
      <Text
        style={[styles.name, {color: colors.text}]}
        numberOfLines={1}>
        {entry.name}
      </Text>
      <Text style={[styles.value, {color: colors.primary}]}>
        {entry.value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(12),
    borderBottomWidth: 0.5,
    gap: scale(10),
  },
  rank: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: scale(13),
    fontWeight: '700',
  },
  name: {
    flex: 1,
    fontSize: scale(15),
    fontWeight: '500',
  },
  value: {
    fontSize: scale(18),
    fontWeight: '700',
  },
});
