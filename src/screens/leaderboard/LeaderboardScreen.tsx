import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import FeatherIcon from '@react-native-vector-icons/feather';
import {useTheme} from '../../theme';
import {useAuthStore} from '../../stores/auth.store';
import {leaderboardService} from '../../services/leaderboard.service';
import {scale} from '../../utils/responsive';
import LeaderboardRow from '../../components/LeaderboardRow';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';
import ScreenHeader from '../../components/ScreenHeader';
import type {LeaderboardEntry} from '../../models';

type TabKey = 'batting' | 'bowling' | 'wins' | 'matches';
type Period = 'weekly' | 'monthly' | 'alltime';
type Scope = 'all' | 'friends';
type MatchType = 'all' | 'local' | 'tournament';

const TAB_FETCHER: Record<
  TabKey,
  (params: {period?: Period; limit?: number; scope?: Scope; matchType?: MatchType}) => Promise<LeaderboardEntry[]>
> = {
  batting: leaderboardService.getCricketBatting,
  bowling: leaderboardService.getCricketBowling,
  wins: leaderboardService.getWins,
  matches: leaderboardService.getMostMatches,
};

export default function LeaderboardScreen() {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const currentUser = useAuthStore(s => s.user);

  const [activeTab, setActiveTab] = useState<TabKey>('batting');
  const [period, setPeriod] = useState<Period>('alltime');
  const [scope, setScope] = useState<Scope>('all');
  const [matchType, setMatchType] = useState<MatchType>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await TAB_FETCHER[activeTab]({period, limit: 50, scope, matchType});
      setEntries(data);
    } catch {
      setEntries([]);
    }
  }, [activeTab, period, scope, matchType]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const tabs: {key: TabKey; label: string; icon: string}[] = [
    {key: 'batting', label: t('leaderboard.batting'), icon: 'trending-up'},
    {key: 'bowling', label: t('leaderboard.bowling'), icon: 'target'},
    {key: 'wins', label: t('leaderboard.wins'), icon: 'award'},
    {key: 'matches', label: t('leaderboard.mostMatches'), icon: 'hash'},
  ];

  const periods: {key: Period; label: string}[] = [
    {key: 'weekly', label: t('leaderboard.weekly')},
    {key: 'monthly', label: t('leaderboard.monthly')},
    {key: 'alltime', label: t('leaderboard.allTime')},
  ];

  const scopes: {key: Scope; label: string; icon: string}[] = [
    {key: 'all', label: 'All Users', icon: 'users'},
    {key: 'friends', label: 'Friends', icon: 'heart'},
  ];

  const matchTypes: {key: MatchType; label: string}[] = [
    {key: 'all', label: 'All'},
    {key: 'local', label: t('profile.local')},
    {key: 'tournament', label: t('profile.tournament')},
  ];

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScreenHeader title={t('leaderboard.title')} />
      {/* Category Tabs */}
      <View style={styles.tabRow}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === tab.key ? colors.primary : colors.surface,
                borderColor:
                  activeTab === tab.key ? colors.primary : colors.border,
              },
            ]}>
            <FeatherIcon
              name={tab.icon as any}
              size={scale(13)}
              color={activeTab === tab.key ? '#FFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                {color: activeTab === tab.key ? '#FFF' : colors.textSecondary},
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scope Toggle (All Users / Friends) */}
      <View style={styles.scopeRow}>
        {scopes.map(s => (
          <TouchableOpacity
            key={s.key}
            onPress={() => setScope(s.key)}
            style={[
              styles.scopeBtn,
              {
                backgroundColor: scope === s.key ? colors.primary : 'transparent',
                borderColor: scope === s.key ? colors.primary : colors.border,
              },
            ]}>
            <FeatherIcon
              name={s.icon as any}
              size={scale(14)}
              color={scope === s.key ? '#FFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.scopeText,
                {color: scope === s.key ? '#FFF' : colors.textSecondary},
              ]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filter Row: Period + Match Type */}
      <View style={styles.filterRow}>
        {/* Period chips */}
        <View style={styles.filterGroup}>
          {periods.map(p => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={[
                styles.filterChip,
                {
                  borderColor:
                    period === p.key ? colors.primary : colors.border,
                  backgroundColor:
                    period === p.key ? colors.primary + '15' : 'transparent',
                },
              ]}>
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color:
                      period === p.key ? colors.primary : colors.textSecondary,
                  },
                ]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider dot */}
        <View style={[styles.filterDot, {backgroundColor: colors.border}]} />

        {/* Match type chips */}
        <View style={styles.filterGroup}>
          {matchTypes.map(mt => (
            <TouchableOpacity
              key={mt.key}
              onPress={() => setMatchType(mt.key)}
              style={[
                styles.filterChip,
                {
                  borderColor:
                    matchType === mt.key ? colors.primary : colors.border,
                  backgroundColor:
                    matchType === mt.key ? colors.primary + '15' : 'transparent',
                },
              ]}>
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color:
                      matchType === mt.key ? colors.primary : colors.textSecondary,
                  },
                ]}>
                {mt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Leaderboard List */}
      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item, i) => `${item.userId}-${i}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({item}) => (
            <LeaderboardRow
              entry={item}
              isCurrentUser={item.userId === currentUser?.id}
            />
          )}
          ListEmptyComponent={
            <EmptyState icon="award" message={t('common.noData')} />
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  tabRow: {
    paddingTop: scale(12),
    flexDirection: 'row',
    paddingHorizontal: scale(12),
    gap: scale(6),
    marginBottom: scale(12),
  },
  tab: {
    flex: 1,
    paddingVertical: scale(8),
    borderRadius: scale(8),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: scale(4),
    borderWidth: 1,
  },
  tabText: {fontSize: scale(11), fontWeight: '600'},

  // Scope
  scopeRow: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    gap: scale(8),
    marginBottom: scale(10),
  },
  scopeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    paddingVertical: scale(9),
    borderRadius: scale(10),
    borderWidth: 1,
  },
  scopeText: {
    fontSize: scale(13),
    fontWeight: '600',
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: scale(12),
    alignItems: 'center',
    marginBottom: scale(8),
    flexWrap: 'wrap',
    gap: scale(6),
  },
  filterGroup: {
    flexDirection: 'row',
    gap: scale(6),
  },
  filterDot: {
    width: scale(4),
    height: scale(4),
    borderRadius: scale(2),
  },
  filterChip: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(5),
    borderRadius: scale(14),
    borderWidth: 1,
  },
  filterChipText: {fontSize: scale(11), fontWeight: '500'},

  list: {flexGrow: 1},
});
