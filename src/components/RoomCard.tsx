import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import FeatherIcon from '@react-native-vector-icons/feather';
import Card from './ui/Card';
import Badge from './ui/Badge';
import {useTheme} from '../theme';
import {scale} from '../utils/responsive';
import {timeAgo, formatScore, formatOvers, getResultText} from '../utils/formatters';
import type {Room, Match} from '../models';

interface RoomCardProps {
  room: Room;
  matchSummary?: Match | null;
  onPress: () => void;
}

export default function RoomCard({room, matchSummary, onPress}: RoomCardProps) {
  const {colors} = useTheme();

  const showScores = room.status === 'completed' && matchSummary;
  const inningsA = matchSummary?.innings.find(i => i.battingTeam === 'A');
  const inningsB = matchSummary?.innings.find(i => i.battingTeam === 'B');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={[styles.name, {color: colors.text}]} numberOfLines={1}>
            {room.name}
          </Text>
          <Badge status={room.status} />
        </View>

        {showScores ? (
          <>
            {/* Score rows for completed match */}
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreTeam, {color: colors.text}]} numberOfLines={1}>
                {room.teamAName}
              </Text>
              <Text style={[styles.scoreValue, {color: colors.text}]}>
                {inningsA
                  ? `${formatScore(inningsA.totalRuns, inningsA.totalWickets)} (${formatOvers(inningsA.completedOvers)})`
                  : '-'}
              </Text>
            </View>
            <View style={[styles.scoreRow, {marginBottom: scale(4)}]}>
              <Text style={[styles.scoreTeam, {color: colors.text}]} numberOfLines={1}>
                {room.teamBName}
              </Text>
              <Text style={[styles.scoreValue, {color: colors.text}]}>
                {inningsB
                  ? `${formatScore(inningsB.totalRuns, inningsB.totalWickets)} (${formatOvers(inningsB.completedOvers)})`
                  : '-'}
              </Text>
            </View>
            {(() => {
              const resultStr = matchSummary
                ? getResultText(matchSummary.result, room.teamAName, room.teamBName)
                : null;
              return resultStr ? (
                <Text
                  style={[styles.resultText, {color: colors.primary}]}
                  numberOfLines={1}>
                  {resultStr}
                </Text>
              ) : null;
            })()}
          </>
        ) : (
          <>
            <Text
              style={[styles.matchup, {color: colors.primary}]}
              numberOfLines={1}>
              {room.teamAName} vs {room.teamBName}
            </Text>
            <View style={styles.meta}>
              <View style={styles.metaItem}>
                <FeatherIcon
                  name="users"
                  size={scale(14)}
                  color={colors.textSecondary}
                />
                <Text style={[styles.metaText, {color: colors.textSecondary}]}>
                  {room.players.length}/{room.maxPlayers}
                </Text>
              </View>
              <Text style={[styles.metaText, {color: colors.textSecondary}]}>
                {timeAgo(room.createdAt)}
              </Text>
            </View>
          </>
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
    marginBottom: scale(8),
  },
  name: {
    fontSize: scale(16),
    fontWeight: '600',
    flex: 1,
    marginRight: scale(8),
  },
  matchup: {
    fontSize: scale(13),
    fontWeight: '500',
    marginBottom: scale(6),
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  metaText: {
    fontSize: scale(13),
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(2),
  },
  scoreTeam: {
    fontSize: scale(13),
    fontWeight: '500',
    flex: 1,
  },
  scoreValue: {
    fontSize: scale(13),
    fontWeight: '700',
  },
  resultText: {
    fontSize: scale(12),
    fontWeight: '500',
    marginTop: scale(4),
  },
});
