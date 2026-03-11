import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {RoomStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useRoomStore} from '../../stores/room.store';
import {matchService} from '../../services/match.service';
import {scale} from '../../utils/responsive';
import RoomCard from '../../components/RoomCard';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';
import ScreenHeader from '../../components/ScreenHeader';
import type {Match} from '../../models';

type Props = NativeStackScreenProps<RoomStackParams, 'RoomList'>;

const FILTERS = ['all', 'waiting', 'active', 'completed'] as const;

export default function RoomListScreen({navigation}: Props) {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const {rooms, isLoading, fetchRooms} = useRoomStore();
  const [filter, setFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [matchSummaries, setMatchSummaries] = useState<Record<string, Match>>(
    {},
  );

  const loadRooms = useCallback(() => {
    fetchRooms(filter === 'all' ? {} : {status: filter});
  }, [filter, fetchRooms]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Fetch match data for completed rooms
  useEffect(() => {
    const completedRooms = rooms.filter(
      r => r.status === 'completed' && r.matchId,
    );
    if (completedRooms.length === 0) return;

    // Skip rooms already fetched
    const toFetch = completedRooms.filter(r => !matchSummaries[r.id]);
    if (toFetch.length === 0) return;

    const fetchMatches = async () => {
      const results: Record<string, Match> = {};
      await Promise.allSettled(
        toFetch.map(async room => {
          try {
            const match = await matchService.getMatchByRoom(room.id);
            results[room.id] = match;
          } catch {
            // silently skip rooms where match fetch fails
          }
        }),
      );
      if (Object.keys(results).length > 0) {
        setMatchSummaries(prev => ({...prev, ...results}));
      }
    };

    fetchMatches();
  }, [rooms]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = async () => {
    setRefreshing(true);
    setMatchSummaries({});
    await fetchRooms(filter === 'all' ? {} : {status: filter});
    setRefreshing(false);
  };

  const handleRoomPress = useCallback(
    (item: (typeof rooms)[0]) => {
      if (item.status === 'completed' && item.matchId) {
        navigation.navigate('CricbuzzScorecard', {
          matchId: item.matchId,
          roomId: item.id,
        });
      } else {
        navigation.navigate('RoomDetail', {roomId: item.id});
      }
    },
    [navigation],
  );

  const filterLabels: Record<string, string> = {
    all: t('room.all'),
    waiting: t('room.waiting'),
    active: t('room.active'),
    completed: t('room.completed'),
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScreenHeader title={t('room.rooms')} showBack={false} />
      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  filter === f ? colors.primary : colors.surface,
                borderColor: filter === f ? colors.primary : colors.border,
              },
            ]}>
            <Text
              style={{
                color: filter === f ? colors.textInverse : colors.text,
                fontSize: scale(13),
                fontWeight: '500',
              }}>
              {filterLabels[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && rooms.length === 0 ? (
        <Loader />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <RoomCard
              room={item}
              matchSummary={matchSummaries[item.id] || null}
              onPress={() => handleRoomPress(item)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <EmptyState icon="grid" message={t('common.noData')} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
    gap: scale(8),
  },
  filterChip: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(6),
    borderRadius: scale(16),
    borderWidth: 1,
  },
  list: {
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
  },
});
