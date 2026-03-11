import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Card from './ui/Card';
import Badge from './ui/Badge';
import {useTheme} from '../theme';
import {scale} from '../utils/responsive';
import {formatScore, formatOvers, formatRunRate} from '../utils/formatters';
import type {Innings} from '../models';

interface ScoreCardProps {
  teamName: string;
  innings: Innings;
  isLive?: boolean;
  target?: number;
}

export default function ScoreCard({
  teamName,
  innings,
  isLive,
  target,
}: ScoreCardProps) {
  const {colors} = useTheme();

  const currentBalls = innings.overs.length > 0
    ? innings.overs[innings.overs.length - 1]?.balls?.filter(b => b.isLegal).length || 0
    : 0;

  const totalOvers = innings.completedOvers + (currentBalls > 0 ? currentBalls / 10 : 0);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.teamName, {color: colors.text}]}>{teamName}</Text>
        {isLive && <Badge status="active" label="LIVE" />}
        {innings.status === 'completed' && (
          <Badge status="completed" label="Completed" />
        )}
      </View>
      <Text style={[styles.score, {color: colors.text}]}>
        {formatScore(innings.totalRuns, innings.totalWickets)}
      </Text>
      <Text style={[styles.overs, {color: colors.textSecondary}]}>
        {formatOvers(innings.completedOvers, currentBalls)} overs
        {'  '}|{'  '}RR: {formatRunRate(innings.totalRuns, totalOvers || innings.completedOvers || 0.1)}
      </Text>
      {target && target > 0 && (
        <Text style={[styles.target, {color: colors.accent}]}>
          Target: {target} | Need: {Math.max(0, target - innings.totalRuns)} off{' '}
          {/* remaining calculation simplified */}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: scale(12),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  teamName: {
    fontSize: scale(16),
    fontWeight: '600',
  },
  score: {
    fontSize: scale(36),
    fontWeight: '700',
  },
  overs: {
    fontSize: scale(14),
    marginTop: scale(2),
  },
  target: {
    fontSize: scale(14),
    fontWeight: '600',
    marginTop: scale(4),
  },
});
