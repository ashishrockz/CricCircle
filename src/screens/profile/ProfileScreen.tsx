import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import FeatherIcon from '@react-native-vector-icons/feather';
import type {ProfileStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useAuthStore} from '../../stores/auth.store';
import {authService} from '../../services/auth.service';
import client from '../../api/client';
import {ENDPOINTS} from '../../api/endpoints';
import {scale} from '../../utils/responsive';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AppModal from '../../components/ui/AppModal';
import SettingsDrawer from '../../components/SettingsDrawer';

type Props = NativeStackScreenProps<ProfileStackParams, 'ProfileMain'>;
type StatsTab = 'all' | 'local' | 'tournament';

interface CricketTypeStats {
  matches: number;
  wins: number;
  losses: number;
  batting: {
    runs: number;
    ballsFaced: number;
    innings: number;
    fours: number;
    sixes: number;
    highestScore: number;
    average: number;
    strikeRate: number;
  };
  bowling: {
    wickets: number;
    runsConceded: number;
    ballsBowled: number;
    overs: string;
    economy: number;
    bestBowling: string;
  };
}

interface PlayerStats {
  all: CricketTypeStats;
  local: CricketTypeStats;
  tournament: CricketTypeStats;
}

export default function ProfileScreen({navigation}: Props) {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const setUser = useAuthStore(s => s.setUser);

  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [activeTab, setActiveTab] = useState<StatsTab>('all');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;

      // Refresh user profile (includes friendsCount)
      authService
        .getProfile()
        .then(updated => setUser(updated))
        .catch(() => {});

      // Fetch match stats
      client
        .get(ENDPOINTS.USER.STATS(user.id))
        .then(res => {
          if (res.data?.cricket) {
            setPlayerStats(res.data.cricket);
          }
        })
        .catch(err => {
          console.warn('[ProfileScreen] Failed to fetch stats:', err.message);
        });
    }, [user?.id, setUser]),
  );

  const handleLogout = useCallback(() => {
    setSettingsOpen(false);
    setTimeout(() => setShowLogoutModal(true), 300);
  }, []);

  const allStats = playerStats?.all;
  const stats = playerStats?.[activeTab];
  const batting = stats?.batting;
  const bowling = stats?.bowling;
  const hasStats = stats && stats.matches > 0;

  const winRate =
    allStats && allStats.matches > 0
      ? ((allStats.wins / allStats.matches) * 100).toFixed(0)
      : '0';

  const statTabs: {key: StatsTab; label: string; icon: string}[] = [
    {key: 'all', label: 'All', icon: 'bar-chart-2'},
    {key: 'local', label: t('profile.local'), icon: 'map-pin'},
    {key: 'tournament', label: t('profile.tournament'), icon: 'award'},
  ];

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView
        style={{paddingTop: insets.top}}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {/* Header with icons */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.headerIconBtn,
              {backgroundColor: colors.primary + '12'},
            ]}
            onPress={() => navigation.navigate('Leaderboard')}
            activeOpacity={0.7}>
            <FeatherIcon
              name="award"
              size={scale(20)}
              color={colors.primary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.text}]}>
            {t('profile.title')}
          </Text>
          <TouchableOpacity
            style={[
              styles.headerIconBtn,
              {backgroundColor: colors.textSecondary + '12'},
            ]}
            onPress={() => setSettingsOpen(true)}
            activeOpacity={0.7}>
            <FeatherIcon
              name="settings"
              size={scale(20)}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Instagram-style header: Avatar + counters */}
        <View style={styles.headerRow}>
          <Avatar name={user?.name || ''} uri={user?.avatar} size={86} />
          <View style={styles.countersRow}>
            <View style={styles.counterItem}>
              <Text style={[styles.counterValue, {color: colors.text}]}>
                {allStats?.matches || 0}
              </Text>
              <Text
                style={[styles.counterLabel, {color: colors.textSecondary}]}>
                Matches
              </Text>
            </View>
            <View style={styles.counterItem}>
              <Text style={[styles.counterValue, {color: colors.text}]}>
                {allStats?.wins || 0}
              </Text>
              <Text
                style={[styles.counterLabel, {color: colors.textSecondary}]}>
                Wins
              </Text>
            </View>
            <View style={styles.counterItem}>
              <Text style={[styles.counterValue, {color: colors.text}]}>
                {user?.friendsCount || 0}
              </Text>
              <Text
                style={[styles.counterLabel, {color: colors.textSecondary}]}>
                Friends
              </Text>
            </View>
          </View>
        </View>

        {/* Name + username (left aligned) */}
        <View style={styles.nameSection}>
          <Text style={[styles.displayName, {color: colors.text}]}>
            {user?.name}
          </Text>
          <Text style={[styles.username, {color: colors.textSecondary}]}>
            @{user?.username}
          </Text>
          {allStats && allStats.matches > 0 && (
            <View style={styles.bioRow}>
              <FeatherIcon
                name="percent"
                size={scale(12)}
                color={colors.primary}
              />
              <Text style={[styles.bioText, {color: colors.textSecondary}]}>
                {winRate}% win rate
              </Text>
              <Text style={{width: scale(6)}} />
              <FeatherIcon
                name="zap"
                size={scale(12)}
                color={colors.primary}
              />
              <Text style={[styles.bioText, {color: colors.textSecondary}]}>
                {allStats.batting.runs} runs
              </Text>
              <Text style={{width: scale(6)}} />
              <FeatherIcon
                name="target"
                size={scale(12)}
                color={colors.primary}
              />
              <Text style={[styles.bioText, {color: colors.textSecondary}]}>
                {allStats.bowling.wickets} wkts
              </Text>
            </View>
          )}
        </View>

        {/* Edit Profile button (full width) */}
        <View style={styles.editBtnRow}>
          <Button
            title={t('profile.editProfile')}
            variant="secondary"
            onPress={() => navigation.navigate('EditProfile')}
            fullWidth
          />
        </View>

        {/* Divider */}
        <View style={[styles.divider, {backgroundColor: colors.border}]} />

        {/* IG-style icon tab bar */}
        <View style={styles.igTabRow}>
          {statTabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.igTab,
                  isActive && {
                    borderBottomColor: colors.primary,
                    borderBottomWidth: 2,
                  },
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}>
                <FeatherIcon
                  name={tab.icon as any}
                  size={scale(18)}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.igTabLabel,
                    {color: isActive ? colors.primary : colors.textSecondary},
                  ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Stats content */}
        {hasStats ? (
          <>
            {/* Win/Loss summary strip */}
            <View style={styles.summaryStrip}>
              <View
                style={[
                  styles.summaryItem,
                  {backgroundColor: colors.success + '12'},
                ]}>
                <Text style={[styles.summaryValue, {color: colors.success}]}>
                  {stats.wins}
                </Text>
                <Text style={[styles.summaryLabel, {color: colors.success}]}>
                  W
                </Text>
              </View>
              <View
                style={[
                  styles.summaryItem,
                  {backgroundColor: colors.error + '12'},
                ]}>
                <Text style={[styles.summaryValue, {color: colors.error}]}>
                  {stats.losses}
                </Text>
                <Text style={[styles.summaryLabel, {color: colors.error}]}>
                  L
                </Text>
              </View>
              <View
                style={[
                  styles.summaryItem,
                  {backgroundColor: colors.primary + '12'},
                ]}>
                <Text style={[styles.summaryValue, {color: colors.primary}]}>
                  {stats.matches}
                </Text>
                <Text style={[styles.summaryLabel, {color: colors.primary}]}>
                  M
                </Text>
              </View>
            </View>

            {/* Batting */}
            <Card style={styles.statsCard} elevation={1}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.cardIconCircle,
                    {backgroundColor: colors.primary + '12'},
                  ]}>
                  <FeatherIcon
                    name="trending-up"
                    size={scale(14)}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.cardTitle, {color: colors.text}]}>
                  {t('profile.battingStats')}
                </Text>
              </View>
              <View style={styles.statsGrid}>
                <StatItem
                  label={t('cricket.runs')}
                  value={String(batting?.runs || 0)}
                  colors={colors}
                  highlight
                />
                <StatItem
                  label={t('profile.innings')}
                  value={String(batting?.innings || 0)}
                  colors={colors}
                />
                <StatItem
                  label={t('profile.battingAvg')}
                  value={(batting?.average || 0).toFixed(1)}
                  colors={colors}
                />
                <StatItem
                  label="SR"
                  value={(batting?.strikeRate || 0).toFixed(1)}
                  colors={colors}
                />
                <StatItem
                  label="HS"
                  value={String(batting?.highestScore || 0)}
                  colors={colors}
                  highlight
                />
                <StatItem
                  label="4s"
                  value={String(batting?.fours || 0)}
                  colors={colors}
                />
                <StatItem
                  label="6s"
                  value={String(batting?.sixes || 0)}
                  colors={colors}
                />
              </View>
            </Card>

            {/* Bowling */}
            <Card style={styles.statsCard} elevation={1}>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.cardIconCircle,
                    {backgroundColor: colors.primary + '12'},
                  ]}>
                  <FeatherIcon
                    name="target"
                    size={scale(14)}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.cardTitle, {color: colors.text}]}>
                  {t('profile.bowlingStats')}
                </Text>
              </View>
              <View style={styles.statsGrid}>
                <StatItem
                  label={t('cricket.wickets')}
                  value={String(bowling?.wickets || 0)}
                  colors={colors}
                  highlight
                />
                <StatItem
                  label="Overs"
                  value={bowling?.overs || '0.0'}
                  colors={colors}
                />
                <StatItem
                  label="Econ"
                  value={(bowling?.economy || 0).toFixed(1)}
                  colors={colors}
                />
                <StatItem
                  label="Runs"
                  value={String(bowling?.runsConceded || 0)}
                  colors={colors}
                />
                <StatItem
                  label="Best"
                  value={bowling?.bestBowling || '0/0'}
                  colors={colors}
                  highlight
                />
              </View>
            </Card>
          </>
        ) : (
          <View style={styles.noStatsContainer}>
            <View
              style={[
                styles.noStatsCircle,
                {backgroundColor: colors.textSecondary + '10'},
              ]}>
              <FeatherIcon
                name="bar-chart-2"
                size={scale(32)}
                color={colors.textSecondary}
              />
            </View>
            <Text style={[styles.noStatsTitle, {color: colors.text}]}>
              No Match Stats Yet
            </Text>
            <Text style={[styles.noStatsText, {color: colors.textSecondary}]}>
              {activeTab === 'all'
                ? 'Play matches to see your stats here'
                : `No ${activeTab} matches played yet`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Settings Drawer */}
      <SettingsDrawer
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={handleLogout}
      />

      <AppModal
        visible={showLogoutModal}
        title={t('profile.logout')}
        message="Are you sure you want to logout?"
        onClose={() => setShowLogoutModal(false)}
        actions={[
          {text: t('common.cancel'), style: 'cancel'},
          {
            text: t('profile.logout'),
            style: 'destructive',
            onPress: () => logout(),
          },
        ]}
      />
    </View>
  );
}

function StatItem({
  label,
  value,
  colors,
  highlight,
}: {
  label: string;
  value: string;
  colors: any;
  highlight?: boolean;
}) {
  return (
    <View style={statStyles.item}>
      <Text
        style={[
          statStyles.value,
          {color: highlight ? colors.primary : colors.text},
        ]}>
        {value}
      </Text>
      <Text style={[statStyles.label, {color: colors.textSecondary}]}>
        {label}
      </Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: {
    alignItems: 'center',
    width: '25%',
    marginBottom: scale(14),
  },
  value: {fontSize: scale(17), fontWeight: '700'},
  label: {fontSize: scale(10), marginTop: scale(2), fontWeight: '500'},
});

const styles = StyleSheet.create({
  container: {flex: 1},
  scroll: {padding: scale(16), paddingBottom: scale(40)},

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(8),
    paddingTop: scale(8),
  },
  headerIconBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: '700',
  },

  // Instagram header row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: scale(12),
  },
  countersRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: scale(20),
  },
  counterItem: {alignItems: 'center'},
  counterValue: {fontSize: scale(18), fontWeight: '700'},
  counterLabel: {fontSize: scale(12), marginTop: scale(2)},

  // Name section
  nameSection: {
    marginBottom: scale(12),
  },
  displayName: {fontSize: scale(16), fontWeight: '700'},
  username: {fontSize: scale(14), marginTop: scale(1)},
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: scale(6),
    flexWrap: 'wrap',
    gap: scale(3),
  },
  bioText: {fontSize: scale(12)},

  // Edit button
  editBtnRow: {
    marginBottom: scale(12),
  },

  // Divider
  divider: {height: 0.5, marginBottom: 0},

  // IG-style icon tab bar
  igTabRow: {
    flexDirection: 'row',
  },
  igTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: scale(12),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: scale(2),
  },
  igTabLabel: {fontSize: scale(10), fontWeight: '600'},

  // Summary strip
  summaryStrip: {
    flexDirection: 'row',
    paddingVertical: scale(12),
    gap: scale(8),
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(10),
    borderRadius: scale(10),
    gap: scale(4),
  },
  summaryValue: {fontSize: scale(16), fontWeight: '700'},
  summaryLabel: {fontSize: scale(12), fontWeight: '600'},

  // Stats cards
  statsCard: {marginBottom: scale(12)},
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(12),
    gap: scale(8),
  },
  cardIconCircle: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {fontSize: scale(14), fontWeight: '600'},
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // No stats
  noStatsContainer: {
    alignItems: 'center',
    paddingTop: scale(48),
    paddingHorizontal: scale(32),
  },
  noStatsCircle: {
    width: scale(64),
    height: scale(64),
    borderRadius: scale(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(16),
  },
  noStatsTitle: {
    fontSize: scale(16),
    fontWeight: '600',
  },
  noStatsText: {
    fontSize: scale(13),
    marginTop: scale(4),
    textAlign: 'center',
  },
});
