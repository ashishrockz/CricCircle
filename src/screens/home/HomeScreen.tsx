import React, {useEffect, useState, useCallback, useRef, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {HomeStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useAuthStore} from '../../stores/auth.store';
import {useSportTypeStore} from '../../stores/sportType.store';
import {roomService} from '../../services/room.service';
import {matchService} from '../../services/match.service';
import {scale} from '../../utils/responsive';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import RoomCard from '../../components/RoomCard';
import EmptyState from '../../components/ui/EmptyState';
import AnnouncementBanner from '../../components/AnnouncementBanner';
import type {Room, Match} from '../../models';

type Nav = NativeStackNavigationProp<HomeStackParams>;

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = scale(16);
const CARD_WIDTH = SCREEN_WIDTH - CARD_PADDING * 2;

export default function HomeScreen() {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore(s => s.user);
  const sportType = useSportTypeStore(s => s.sportType);

  const [activeRooms, setActiveRooms] = useState<Room[]>([]);
  const [completedRooms, setCompletedRooms] = useState<Room[]>([]);
  const [matchSummaries, setMatchSummaries] = useState<Record<string, Match>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const allRooms = useMemo(() => {
    return [...activeRooms, ...completedRooms];
  }, [activeRooms, completedRooms]);

  const loadData = useCallback(async () => {
    try {
      const [activeResult, completedResult] = await Promise.all([
        roomService.listRooms({status: 'active', limit: 5}),
        roomService.listRooms({status: 'completed', limit: 5}),
      ]);
      setActiveRooms(activeResult.rooms);
      setCompletedRooms(completedResult.rooms);

      // Fetch match data for completed rooms
      const completed = completedResult.rooms.filter(r => r.matchId);
      if (completed.length > 0) {
        const results: Record<string, Match> = {};
        await Promise.allSettled(
          completed.map(async room => {
            try {
              const match = await matchService.getMatchByRoom(room.id);
              results[room.id] = match;
            } catch {}
          }),
        );
        setMatchSummaries(results);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const navigateToRoom = useCallback(
    (room: Room) => {
      const parent = navigation.getParent();
      if (room.status === 'completed' && room.matchId) {
        parent?.navigate('RoomsTab', {
          screen: 'CricbuzzScorecard',
          params: {matchId: room.matchId, roomId: room.id},
        });
      } else {
        parent?.navigate('RoomsTab', {
          screen: 'RoomDetail',
          params: {roomId: room.id},
        });
      }
    },
    [navigation],
  );

  const onScroll = useCallback((e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / CARD_WIDTH);
    setActiveIndex(idx);
  }, []);

  const renderRoomItem = useCallback(
    ({item}: {item: Room}) => (
      <View style={styles.carouselItem}>
        <RoomCard
          room={item}
          matchSummary={matchSummaries[item.id] || null}
          onPress={() => navigateToRoom(item)}
        />
      </View>
    ),
    [matchSummaries, navigateToRoom],
  );

  return (
    <View
      style={[styles.container, {backgroundColor: colors.background, paddingTop: insets.top}]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <AnnouncementBanner />
        <Card style={styles.welcomeCard} elevation={2}>
          <Text style={[styles.welcome, {color: colors.text}]}>
            {t('home.welcome', {name: user?.name || 'Player'})}
          </Text>
          {sportType && (
            <Text style={[styles.sportInfo, {color: colors.textSecondary}]}>
              {sportType.name} | {sportType.config.teamSize} per side |{' '}
              {sportType.config.oversPerInnings} overs
            </Text>
          )}
        </Card>

        <View style={styles.actions}>
          <Button
            title={t('home.createMatch')}
            onPress={() => navigation.navigate('CreateRoom')}
          />
        </View>

        {/* Matches Carousel */}
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t('home.matches')}
        </Text>

        {allRooms.length > 0 ? (
          <>
            <FlatList
              data={allRooms}
              keyExtractor={item => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH}
              decelerationRate="fast"
              onScroll={onScroll}
              scrollEventThrottle={16}
              renderItem={renderRoomItem}
              contentContainerStyle={styles.carouselContent}
            />
            {/* Pagination dots */}
            {allRooms.length > 1 && (
              <View style={styles.dotsRow}>
                {allRooms.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          i === activeIndex ? colors.primary : colors.border,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <EmptyState icon="grid" message={t('home.noMatches')} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: CARD_PADDING,
  },
  welcomeCard: {
    marginBottom: scale(20),
  },
  welcome: {
    fontSize: scale(22),
    fontWeight: '700',
  },
  sportInfo: {
    fontSize: scale(14),
    marginTop: scale(4),
  },
  actions: {
    marginBottom: scale(24),
  },
  sectionTitle: {
    fontSize: scale(18),
    fontWeight: '600',
    marginBottom: scale(12),
  },
  carouselContent: {
    // no extra padding — items handle their own width
  },
  carouselItem: {
    width: CARD_WIDTH,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: scale(8),
    gap: scale(6),
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
});
