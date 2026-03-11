import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import FeatherIcon from '@react-native-vector-icons/feather';
import type {FriendsStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useAuthStore} from '../../stores/auth.store';
import {friendService} from '../../services/friend.service';
import client from '../../api/client';
import {ENDPOINTS} from '../../api/endpoints';
import {userAdapter} from '../../adapters/user.adapter';
import {scale} from '../../utils/responsive';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import Loader from '../../components/ui/Loader';
import AppModal from '../../components/ui/AppModal';
import ScreenHeader from '../../components/ScreenHeader';
import type {User, FriendshipStatus} from '../../models';

type Props = NativeStackScreenProps<FriendsStackParams, 'UserProfile'>;
type StatsTab = 'all' | 'local' | 'tournament';

interface UserProfileData {
  user: User;
  friendsCount: number;
  friendship: {
    status: FriendshipStatus;
    friendshipId?: string;
    direction?: 'outgoing' | 'incoming';
  };
}

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

export default function UserProfileScreen({route}: Props) {
  const {userId} = route.params;
  const {colors, borderRadius} = useTheme();
  const {t} = useTranslation();
  const currentUser = useAuthStore(s => s.user);

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [activeTab, setActiveTab] = useState<StatsTab>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      const [userRes, statsRes] = await Promise.all([
        client.get(ENDPOINTS.USER.GET(userId)),
        client.get(ENDPOINTS.USER.STATS(userId)),
      ]);

      const raw = userRes.data;
      const adapted = userAdapter.adapt(raw);

      const friendshipStatus: FriendshipStatus =
        raw.friendship?.status === 'pending'
          ? raw.friendship?.direction === 'outgoing'
            ? 'pending_sent'
            : 'pending_received'
          : raw.friendship?.status === 'accepted'
            ? 'friends'
            : raw.friendship?.status === 'self'
              ? 'friends'
              : (raw.friendship?.status || 'none');

      const profileData = {
        user: adapted,
        friendsCount: raw.friendsCount || 0,
        friendship: {
          status: friendshipStatus,
          friendshipId: raw.friendship?.friendshipId,
          direction: raw.friendship?.direction,
        },
      };
      setProfile(profileData);

      if (statsRes.data?.cricket) {
        setPlayerStats(statsRes.data.cricket);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load profile');
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSendRequest = async () => {
    setActionLoading(true);
    try {
      await friendService.sendRequest(userId);
      setProfile(prev =>
        prev
          ? {...prev, friendship: {...prev.friendship, status: 'pending_sent'}}
          : prev,
      );
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to send request');
    }
    setActionLoading(false);
  };

  const handleAcceptRequest = async () => {
    if (!profile?.friendship.friendshipId) return;
    setActionLoading(true);
    try {
      await friendService.acceptRequest(profile.friendship.friendshipId);
      setProfile(prev =>
        prev
          ? {...prev, friendship: {...prev.friendship, status: 'friends'}}
          : prev,
      );
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to accept');
    }
    setActionLoading(false);
  };

  const handleUnfriend = async () => {
    setActionLoading(true);
    try {
      await friendService.unfriend(userId);
      setProfile(prev =>
        prev
          ? {...prev, friendship: {...prev.friendship, status: 'none'}}
          : prev,
      );
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed');
    }
    setActionLoading(false);
  };

  if (loading) return <Loader />;
  if (!profile) return null;

  const isSelf = currentUser?.id === userId;
  const allStats = playerStats?.all;
  const stats = playerStats?.[activeTab];
  const batting = stats?.batting;
  const bowling = stats?.bowling;
  const hasStats = stats && stats.matches > 0;

  // ── Instagram-style action button ──────────────────────────────────────────
  const renderActionButton = () => {
    if (isSelf) return null;

    switch (profile.friendship.status) {
      case 'friends':
        return (
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1},
              ]}
              onPress={handleUnfriend}
              disabled={actionLoading}
              activeOpacity={0.7}>
              {actionLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={[styles.actionBtnText, {color: colors.text}]}>
                  Friends
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );

      case 'pending_sent':
        return (
          <View style={styles.actionBtnRow}>
            <View
              style={[
                styles.actionBtn,
                {backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1},
              ]}>
              <Text style={[styles.actionBtnText, {color: colors.textSecondary}]}>
                Requested
              </Text>
            </View>
          </View>
        );

      case 'pending_received':
        return (
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, {backgroundColor: colors.primary}]}
              onPress={handleAcceptRequest}
              disabled={actionLoading}
              activeOpacity={0.7}>
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={[styles.actionBtnText, {color: '#FFF'}]}>
                  Accept
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );

      case 'blocked':
        return (
          <View style={styles.actionBtnRow}>
            <View
              style={[
                styles.actionBtn,
                {backgroundColor: colors.error + '12', borderColor: colors.error + '30', borderWidth: 1},
              ]}>
              <Text style={[styles.actionBtnText, {color: colors.error}]}>
                Blocked
              </Text>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={[styles.actionBtn, {backgroundColor: colors.primary}]}
              onPress={handleSendRequest}
              disabled={actionLoading}
              activeOpacity={0.7}>
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={[styles.actionBtnText, {color: '#FFF'}]}>
                  Add Friend
                </Text>
              )}
            </TouchableOpacity>
          </View>
        );
    }
  };

  const statTabs: {key: StatsTab; label: string; icon: string}[] = [
    {key: 'all', label: 'All', icon: 'bar-chart-2'},
    {key: 'local', label: t('profile.local'), icon: 'map-pin'},
    {key: 'tournament', label: t('profile.tournament'), icon: 'award'},
  ];

  const winRate =
    allStats && allStats.matches > 0
      ? ((allStats.wins / allStats.matches) * 100).toFixed(0)
      : '0';

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScreenHeader title={profile.user.name} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Instagram-style header: Avatar left, counters right ── */}
        <View style={styles.headerRow}>
          <Avatar
            name={profile.user.name}
            uri={profile.user.avatar}
            size={86}
          />
          <View style={styles.countersRow}>
            <View style={styles.counterItem}>
              <Text style={[styles.counterValue, {color: colors.text}]}>
                {allStats?.matches || 0}
              </Text>
              <Text style={[styles.counterLabel, {color: colors.textSecondary}]}>
                Matches
              </Text>
            </View>
            <View style={styles.counterItem}>
              <Text style={[styles.counterValue, {color: colors.text}]}>
                {allStats?.wins || 0}
              </Text>
              <Text style={[styles.counterLabel, {color: colors.textSecondary}]}>
                Wins
              </Text>
            </View>
            <View style={styles.counterItem}>
              <Text style={[styles.counterValue, {color: colors.text}]}>
                {profile.friendsCount}
              </Text>
              <Text style={[styles.counterLabel, {color: colors.textSecondary}]}>
                Friends
              </Text>
            </View>
          </View>
        </View>

        {/* ── Name + username (left aligned like IG) ── */}
        <View style={styles.nameSection}>
          <Text style={[styles.displayName, {color: colors.text}]}>
            {profile.user.name}
          </Text>
          <Text style={[styles.username, {color: colors.textSecondary}]}>
            @{profile.user.username}
          </Text>
          {allStats && allStats.matches > 0 && (
            <View style={styles.bioRow}>
              <FeatherIcon name="percent" size={scale(12)} color={colors.primary} />
              <Text style={[styles.bioText, {color: colors.textSecondary}]}>
                {winRate}% win rate
              </Text>
              <Text style={[styles.bioDot, {color: colors.textSecondary}]}>
                {'  '}
              </Text>
              <FeatherIcon name="zap" size={scale(12)} color={colors.primary} />
              <Text style={[styles.bioText, {color: colors.textSecondary}]}>
                {allStats.batting.runs} runs
              </Text>
              <Text style={[styles.bioDot, {color: colors.textSecondary}]}>
                {'  '}
              </Text>
              <FeatherIcon name="target" size={scale(12)} color={colors.primary} />
              <Text style={[styles.bioText, {color: colors.textSecondary}]}>
                {allStats.bowling.wickets} wkts
              </Text>
            </View>
          )}
        </View>

        {/* ── Action button (full width like IG Follow/Message) ── */}
        {renderActionButton()}

        {/* ── Divider ── */}
        <View style={[styles.divider, {backgroundColor: colors.border}]} />

        {/* ── Stats tab bar (icon tabs like IG grid/reels/tagged) ── */}
        <View style={styles.igTabRow}>
          {statTabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.igTab,
                  isActive && {borderBottomColor: colors.primary, borderBottomWidth: 2},
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

        {/* ── Stats content ── */}
        {hasStats ? (
          <>
            {/* Win/Loss summary strip */}
            <View style={styles.summaryStrip}>
              <View style={[styles.summaryItem, {backgroundColor: colors.success + '12'}]}>
                <Text style={[styles.summaryValue, {color: colors.success}]}>
                  {stats.wins}
                </Text>
                <Text style={[styles.summaryLabel, {color: colors.success}]}>W</Text>
              </View>
              <View style={[styles.summaryItem, {backgroundColor: colors.error + '12'}]}>
                <Text style={[styles.summaryValue, {color: colors.error}]}>
                  {stats.losses}
                </Text>
                <Text style={[styles.summaryLabel, {color: colors.error}]}>L</Text>
              </View>
              <View style={[styles.summaryItem, {backgroundColor: colors.primary + '12'}]}>
                <Text style={[styles.summaryValue, {color: colors.primary}]}>
                  {stats.matches}
                </Text>
                <Text style={[styles.summaryLabel, {color: colors.primary}]}>M</Text>
              </View>
            </View>

            {/* Batting */}
            <Card style={styles.statsCard} elevation={1}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconCircle, {backgroundColor: colors.primary + '12'}]}>
                  <FeatherIcon name="trending-up" size={scale(14)} color={colors.primary} />
                </View>
                <Text style={[styles.cardTitle, {color: colors.text}]}>
                  {t('profile.battingStats')}
                </Text>
              </View>
              <View style={styles.statsGrid}>
                <StatItem label={t('cricket.runs')} value={String(batting?.runs || 0)} colors={colors} highlight />
                <StatItem label={t('profile.innings')} value={String(batting?.innings || 0)} colors={colors} />
                <StatItem label={t('profile.battingAvg')} value={(batting?.average || 0).toFixed(1)} colors={colors} />
                <StatItem label="SR" value={(batting?.strikeRate || 0).toFixed(1)} colors={colors} />
                <StatItem label="HS" value={String(batting?.highestScore || 0)} colors={colors} highlight />
                <StatItem label="4s" value={String(batting?.fours || 0)} colors={colors} />
                <StatItem label="6s" value={String(batting?.sixes || 0)} colors={colors} />
              </View>
            </Card>

            {/* Bowling */}
            <Card style={styles.statsCard} elevation={1}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconCircle, {backgroundColor: colors.primary + '12'}]}>
                  <FeatherIcon name="target" size={scale(14)} color={colors.primary} />
                </View>
                <Text style={[styles.cardTitle, {color: colors.text}]}>
                  {t('profile.bowlingStats')}
                </Text>
              </View>
              <View style={styles.statsGrid}>
                <StatItem label={t('cricket.wickets')} value={String(bowling?.wickets || 0)} colors={colors} highlight />
                <StatItem label="Overs" value={bowling?.overs || '0.0'} colors={colors} />
                <StatItem label="Econ" value={(bowling?.economy || 0).toFixed(1)} colors={colors} />
                <StatItem label="Runs" value={String(bowling?.runsConceded || 0)} colors={colors} />
                <StatItem label="Best" value={bowling?.bestBowling || '0/0'} colors={colors} highlight />
              </View>
            </Card>
          </>
        ) : (
          <View style={styles.noStatsContainer}>
            <View style={[styles.noStatsCircle, {backgroundColor: colors.textSecondary + '10'}]}>
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
                ? "This user hasn't played any matches yet"
                : `No ${activeTab} matches played yet`}
            </Text>
          </View>
        )}
      </ScrollView>

      <AppModal
        visible={!!errorMsg}
        title="Error"
        message={errorMsg}
        onClose={() => setErrorMsg('')}
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
  scroll: {paddingBottom: scale(40)},

  // ── Instagram header row: avatar + counters ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
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

  // ── Name section (left aligned) ──
  nameSection: {
    paddingHorizontal: scale(16),
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
  bioDot: {fontSize: scale(12)},

  // ── Action button (full width) ──
  actionBtnRow: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    marginBottom: scale(12),
    gap: scale(6),
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(9),
    borderRadius: scale(8),
  },
  actionBtnText: {fontSize: scale(14), fontWeight: '600'},

  // ── Divider ──
  divider: {height: 0.5, marginBottom: 0},

  // ── IG-style icon tab bar ──
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

  // ── Summary strip ──
  summaryStrip: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
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

  // ── Stats cards ──
  statsCard: {marginHorizontal: scale(16), marginBottom: scale(12)},
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

  // ── No stats ──
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
