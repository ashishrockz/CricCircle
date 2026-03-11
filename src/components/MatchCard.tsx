import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Card from './ui/Card';
import Badge from './ui/Badge';
import {useTheme} from '../theme';
import {scale} from '../utils/responsive';
import {formatScore, timeAgo} from '../utils/formatters';
import type {Match} from '../models';

interface MatchCardProps {
  match: Match;
  onPress: () => void;
}

export default function MatchCard({match, onPress}: MatchCardProps) {
  const {colors} = useTheme();

  const innings1 = match.innings[0];
  const innings2 = match.innings[1];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Badge status={match.status} />
          <Text style={[styles.time, {color: colors.textSecondary}]}>
            {timeAgo(match.createdAt)}
          </Text>
        </View>

        <View style={styles.teams}>
          <View style={styles.team}>
            <Text style={[styles.teamName, {color: colors.text}]}>
              {match.teamA.name || 'Team A'}
            </Text>
            {innings1 && (
              <Text style={[styles.teamScore, {color: colors.text}]}>
                {formatScore(innings1.totalRuns, innings1.totalWickets)}
              </Text>
            )}
          </View>
          <Text style={[styles.vs, {color: colors.textSecondary}]}>vs</Text>
          <View style={[styles.team, styles.teamRight]}>
            <Text style={[styles.teamName, {color: colors.text}]}>
              {match.teamB.name || 'Team B'}
            </Text>
            {innings2 && (
              <Text style={[styles.teamScore, {color: colors.text}]}>
                {formatScore(innings2.totalRuns, innings2.totalWickets)}
              </Text>
            )}
          </View>
        </View>

        {match.result?.description && (
          <Text
            style={[styles.result, {color: colors.primary}]}
            numberOfLines={1}>
            {match.result.description}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: scale(10),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(10),
  },
  teams: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  team: {
    flex: 1,
  },
  teamRight: {
    alignItems: 'flex-end',
  },
  teamName: {
    fontSize: scale(15),
    fontWeight: '600',
  },
  teamScore: {
    fontSize: scale(20),
    fontWeight: '700',
    marginTop: scale(2),
  },
  vs: {
    fontSize: scale(12),
    marginHorizontal: scale(12),
  },
  result: {
    fontSize: scale(13),
    fontWeight: '500',
    marginTop: scale(8),
  },
  time: {
    fontSize: scale(12),
  },
});
