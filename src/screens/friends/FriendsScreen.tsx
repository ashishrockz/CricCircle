import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import FeatherIcon from '@react-native-vector-icons/feather';
import type {FriendsStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {friendService} from '../../services/friend.service';
import {scale} from '../../utils/responsive';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';
import AppModal from '../../components/ui/AppModal';
import type {Friend, FriendRequest, FriendStats} from '../../models';

type Props = NativeStackScreenProps<FriendsStackParams, 'FriendsList'>;
type TabKey = 'friends' | 'incoming' | 'outgoing';

export default function FriendsScreen({navigation}: Props) {
  const {colors, borderRadius} = useTheme();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabKey>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [stats, setStats] = useState<FriendStats>({total: 0, incoming: 0, outgoing: 0});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [unfriendTarget, setUnfriendTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [f, inc, out, s] = await Promise.all([
        friendService.listFriends(),
        friendService.getIncomingRequests(),
        friendService.getOutgoingRequests(),
        friendService.getStats().catch(() => ({total: 0, incoming: 0, outgoing: 0})),
      ]);
      setFriends(f);
      setIncoming(inc);
      setOutgoing(out);
      setStats(s);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await friendService.acceptRequest(requestId);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed');
    }
    setActionLoading(null);
  };

  const handleReject = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await friendService.rejectRequest(requestId);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed');
    }
    setActionLoading(null);
  };

  const handleCancel = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await friendService.cancelRequest(requestId);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed');
    }
    setActionLoading(null);
  };

  const handleUnfriend = (userId: string, userName: string) => {
    setUnfriendTarget({id: userId, name: userName});
  };

  const confirmUnfriend = async () => {
    if (!unfriendTarget) return;
    setUnfriendTarget(null);
    setActionLoading(unfriendTarget.id);
    try {
      await friendService.unfriend(unfriendTarget.id);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed');
    }
    setActionLoading(null);
  };

  const tabs: {key: TabKey; label: string; count: number; icon: string}[] = [
    {key: 'friends', label: t('friends.myFriends'), count: friends.length, icon: 'users'},
    {key: 'incoming', label: t('friends.incoming'), count: incoming.length, icon: 'user-plus'},
    {key: 'outgoing', label: t('friends.outgoing'), count: outgoing.length, icon: 'send'},
  ];

  if (loading) return <Loader />;

  const navigateToProfile = (uId: string) => {
    navigation.navigate('UserProfile', {userId: uId});
  };

  const renderFriendItem = ({item}: {item: Friend}) => (
    <TouchableOpacity
      onPress={() => navigateToProfile(item.user.id)}
      activeOpacity={0.7}>
      <Card style={styles.userCard} elevation={1}>
        <View style={styles.userRow}>
          <Avatar name={item.user.name} uri={item.user.avatar} size={48} />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, {color: colors.text}]} numberOfLines={1}>
              {item.user.name}
            </Text>
            <Text style={[styles.userUsername, {color: colors.textSecondary}]}>
              @{item.user.username}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.iconBtn, {backgroundColor: colors.error + '10'}]}
            onPress={() => handleUnfriend(item.user.id, item.user.name)}
            disabled={actionLoading === item.user.id}
            activeOpacity={0.6}>
            <FeatherIcon name="user-minus" size={scale(16)} color={colors.error} />
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderIncomingItem = ({item}: {item: FriendRequest}) => (
    <TouchableOpacity
      onPress={() => navigateToProfile(item.from.id)}
      activeOpacity={0.7}>
    <Card style={styles.userCard} elevation={1}>
      <View style={styles.userRow}>
        <Avatar name={item.from.name} uri={item.from.avatar} size={48} />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, {color: colors.text}]} numberOfLines={1}>
            {item.from.name}
          </Text>
          <Text style={[styles.userUsername, {color: colors.textSecondary}]}>
            @{item.from.username}
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[
            styles.requestBtn,
            {backgroundColor: colors.primary, borderRadius: borderRadius.md},
          ]}
          onPress={() => handleAccept(item.id)}
          disabled={actionLoading === item.id}
          activeOpacity={0.7}>
          <FeatherIcon name="check" size={scale(16)} color="#FFF" />
          <Text style={styles.requestBtnText}>{t('friends.accept')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.requestBtn,
            styles.requestBtnOutlined,
            {borderColor: colors.border, borderRadius: borderRadius.md},
          ]}
          onPress={() => handleReject(item.id)}
          disabled={actionLoading === item.id}
          activeOpacity={0.7}>
          <FeatherIcon name="x" size={scale(16)} color={colors.textSecondary} />
          <Text style={[styles.requestBtnTextOutlined, {color: colors.textSecondary}]}>
            {t('friends.reject')}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
    </TouchableOpacity>
  );

  const renderOutgoingItem = ({item}: {item: FriendRequest}) => (
    <TouchableOpacity
      onPress={() => navigateToProfile(item.to.id)}
      activeOpacity={0.7}>
    <Card style={styles.userCard} elevation={1}>
      <View style={styles.userRow}>
        <Avatar name={item.to.name} uri={item.to.avatar} size={48} />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, {color: colors.text}]} numberOfLines={1}>
            {item.to.name}
          </Text>
          <Text style={[styles.userUsername, {color: colors.textSecondary}]}>
            @{item.to.username}
          </Text>
        </View>
        <View style={styles.pendingBadge}>
          <View style={[styles.pendingDot, {backgroundColor: colors.warning}]} />
          <Text style={[styles.pendingText, {color: colors.warning}]}>
            Pending
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.cancelBtn,
          {borderColor: colors.border, borderRadius: borderRadius.md},
        ]}
        onPress={() => handleCancel(item.id)}
        disabled={actionLoading === item.id}
        activeOpacity={0.7}>
        <FeatherIcon name="x-circle" size={scale(14)} color={colors.textSecondary} />
        <Text style={[styles.cancelBtnText, {color: colors.textSecondary}]}>
          {t('friends.cancelRequest')}
        </Text>
      </TouchableOpacity>
    </Card>
    </TouchableOpacity>
  );

  const getEmptyConfig = () => {
    switch (activeTab) {
      case 'friends':
        return {icon: 'users', message: t('friends.noFriends'), sub: 'Search and add friends to get started'};
      case 'incoming':
        return {icon: 'user-plus', message: t('friends.noIncoming'), sub: 'When someone sends you a request, it will appear here'};
      case 'outgoing':
        return {icon: 'send', message: t('friends.noOutgoing'), sub: 'Send a friend request from the search page'};
    }
  };

  const empty = getEmptyConfig();

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: colors.background, paddingTop: insets.top},
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, {color: colors.text}]}>
            {t('friends.title')}
          </Text>
          <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
            {stats.total} {stats.total === 1 ? 'friend' : 'friends'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('UserSearch')}
          style={[styles.searchBtn, {backgroundColor: colors.primary}]}
          activeOpacity={0.7}>
          <FeatherIcon name="user-plus" size={scale(18)} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Stat Cards */}
      {(incoming.length > 0 || outgoing.length > 0) && (
        <View style={styles.statsRow}>
          {incoming.length > 0 && (
            <TouchableOpacity
              style={[styles.statCard, {backgroundColor: colors.primary + '10', borderColor: colors.primary + '25'}]}
              onPress={() => setActiveTab('incoming')}
              activeOpacity={0.7}>
              <View style={[styles.statIconCircle, {backgroundColor: colors.primary + '20'}]}>
                <FeatherIcon name="user-plus" size={scale(16)} color={colors.primary} />
              </View>
              <Text style={[styles.statCount, {color: colors.primary}]}>
                {incoming.length}
              </Text>
              <Text style={[styles.statLabel, {color: colors.primary}]}>
                {incoming.length === 1 ? 'Request' : 'Requests'}
              </Text>
            </TouchableOpacity>
          )}
          {outgoing.length > 0 && (
            <TouchableOpacity
              style={[styles.statCard, {backgroundColor: colors.warning + '10', borderColor: colors.warning + '25'}]}
              onPress={() => setActiveTab('outgoing')}
              activeOpacity={0.7}>
              <View style={[styles.statIconCircle, {backgroundColor: colors.warning + '20'}]}>
                <FeatherIcon name="send" size={scale(16)} color={colors.warning} />
              </View>
              <Text style={[styles.statCount, {color: colors.warning}]}>
                {outgoing.length}
              </Text>
              <Text style={[styles.statLabel, {color: colors.warning}]}>
                Sent
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Tab Selector */}
      <View style={[styles.tabRow, {backgroundColor: colors.surface, borderColor: colors.border}]}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tab,
                isActive && {backgroundColor: colors.primary},
              ]}
              activeOpacity={0.7}>
              <FeatherIcon
                name={tab.icon as any}
                size={scale(14)}
                color={isActive ? '#FFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  {color: isActive ? '#FFF' : colors.textSecondary},
                ]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View
                  style={[
                    styles.tabBadge,
                    {
                      backgroundColor: isActive ? '#FFF' : colors.primary,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.tabBadgeText,
                      {color: isActive ? colors.primary : '#FFF'},
                    ]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {activeTab === 'friends' && (
        <FlatList
          data={friends}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={renderFriendItem}
          ListEmptyComponent={
            <EmptyState icon={empty.icon} message={empty.message} submessage={empty.sub} />
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'incoming' && (
        <FlatList
          data={incoming}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={renderIncomingItem}
          ListEmptyComponent={
            <EmptyState icon={empty.icon} message={empty.message} submessage={empty.sub} />
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'outgoing' && (
        <FlatList
          data={outgoing}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={renderOutgoingItem}
          ListEmptyComponent={
            <EmptyState icon={empty.icon} message={empty.message} submessage={empty.sub} />
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AppModal
        visible={!!errorMsg}
        title="Error"
        message={errorMsg}
        onClose={() => setErrorMsg('')}
      />
      <AppModal
        visible={!!unfriendTarget}
        title={t('friends.unfriend')}
        message={`Remove ${unfriendTarget?.name} as a friend?`}
        onClose={() => setUnfriendTarget(null)}
        actions={[
          {text: t('common.cancel'), style: 'cancel'},
          {
            text: t('friends.unfriend'),
            style: 'destructive',
            onPress: confirmUnfriend,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
    paddingBottom: scale(12),
  },
  title: {fontSize: scale(24), fontWeight: '700'},
  subtitle: {fontSize: scale(13), marginTop: scale(2)},
  searchBtn: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(21),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: scale(16),
    gap: scale(10),
    marginBottom: scale(12),
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(12),
    borderRadius: scale(12),
    borderWidth: 1,
    gap: scale(8),
  },
  statIconCircle: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCount: {fontSize: scale(18), fontWeight: '700'},
  statLabel: {fontSize: scale(12), fontWeight: '500'},

  // Tabs
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: scale(16),
    borderRadius: scale(12),
    borderWidth: 1,
    padding: scale(3),
    marginBottom: scale(12),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(9),
    borderRadius: scale(10),
    gap: scale(4),
  },
  tabText: {fontSize: scale(12), fontWeight: '600'},
  tabBadge: {
    minWidth: scale(18),
    height: scale(18),
    borderRadius: scale(9),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(4),
  },
  tabBadgeText: {fontSize: scale(10), fontWeight: '700'},

  // List
  list: {flexGrow: 1, paddingHorizontal: scale(16), paddingBottom: scale(16)},

  // User Card
  userCard: {marginBottom: scale(8)},
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  userInfo: {flex: 1},
  userName: {fontSize: scale(15), fontWeight: '600'},
  userUsername: {fontSize: scale(13), marginTop: scale(1)},

  // Icon button (unfriend)
  iconBtn: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Request action buttons
  requestActions: {
    flexDirection: 'row',
    gap: scale(8),
    marginTop: scale(12),
    paddingTop: scale(12),
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(128,128,128,0.15)',
  },
  requestBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(10),
    gap: scale(6),
  },
  requestBtnText: {
    color: '#FFF',
    fontSize: scale(14),
    fontWeight: '600',
  },
  requestBtnOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  requestBtnTextOutlined: {
    fontSize: scale(14),
    fontWeight: '600',
  },

  // Pending badge
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  pendingDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: scale(3),
  },
  pendingText: {fontSize: scale(12), fontWeight: '600'},

  // Cancel button
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: scale(10),
    paddingVertical: scale(8),
    borderWidth: 1,
    gap: scale(6),
  },
  cancelBtnText: {fontSize: scale(13), fontWeight: '500'},
});
