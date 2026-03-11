import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import FeatherIcon from '@react-native-vector-icons/feather';
import type {FriendsStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useAuthStore} from '../../stores/auth.store';
import {friendService} from '../../services/friend.service';
import {scale} from '../../utils/responsive';
import client from '../../api/client';
import {ENDPOINTS} from '../../api/endpoints';
import {userAdapter} from '../../adapters/user.adapter';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import AppModal from '../../components/ui/AppModal';
import ScreenHeader from '../../components/ScreenHeader';
import type {User, FriendshipStatus} from '../../models';

type Props = NativeStackScreenProps<FriendsStackParams, 'UserSearch'>;

interface SearchResult {
  user: User;
  status: FriendshipStatus;
  friendsCount?: number;
}

export default function UserSearchScreen({navigation}: Props) {
  const {colors, borderRadius} = useTheme();
  const {t} = useTranslation();
  const currentUser = useAuthStore(s => s.user);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (text: string) => {
      if (text.trim().length < 2) {
        setResults([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      setSearched(true);
      try {
        const {data} = await client.get(ENDPOINTS.USER.LIST, {
          params: {search: text.trim()},
        });
        const rawUsers = Array.isArray(data)
          ? data
          : data.users || data.data || [];

        const mapped: SearchResult[] = rawUsers
          .map((u: any) => ({
            user: userAdapter.adapt(u),
            status: (u.friendship?.status === 'pending'
              ? u.friendship?.direction === 'outgoing'
                ? 'pending_sent'
                : 'pending_received'
              : u.friendship?.status === 'accepted'
                ? 'friends'
                : u.friendship?.status || 'none') as FriendshipStatus,
            friendsCount: u.friendsCount || 0,
          }))
          .filter((r: SearchResult) => r.user.id !== currentUser?.id);

        setResults(mapped);
      } catch {
        setResults([]);
      }
      setLoading(false);
    },
    [currentUser?.id],
  );

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text), 400);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  const handleSendRequest = async (userId: string) => {
    setActionLoading(userId);
    try {
      await friendService.sendRequest(userId);
      setResults(prev =>
        prev.map(r =>
          r.user.id === userId ? {...r, status: 'pending_sent'} : r,
        ),
      );
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to send request');
    }
    setActionLoading(null);
  };

  const renderStatusAction = (item: SearchResult) => {
    const isLoading = actionLoading === item.user.id;

    switch (item.status) {
      case 'friends':
      case 'accepted' as FriendshipStatus:
        return (
          <View
            style={[
              styles.statusChip,
              {backgroundColor: colors.success + '15'},
            ]}>
            <FeatherIcon
              name="check-circle"
              size={scale(14)}
              color={colors.success}
            />
            <Text style={[styles.statusChipText, {color: colors.success}]}>
              Friends
            </Text>
          </View>
        );

      case 'pending_sent':
        return (
          <View
            style={[
              styles.statusChip,
              {backgroundColor: colors.warning + '15'},
            ]}>
            <FeatherIcon name="clock" size={scale(14)} color={colors.warning} />
            <Text style={[styles.statusChipText, {color: colors.warning}]}>
              Sent
            </Text>
          </View>
        );

      case 'pending_received':
        return (
          <View
            style={[
              styles.statusChip,
              {backgroundColor: colors.primary + '15'},
            ]}>
            <FeatherIcon
              name="user-check"
              size={scale(14)}
              color={colors.primary}
            />
            <Text style={[styles.statusChipText, {color: colors.primary}]}>
              Accept?
            </Text>
          </View>
        );

      case 'blocked':
        return (
          <View
            style={[
              styles.statusChip,
              {backgroundColor: colors.error + '15'},
            ]}>
            <FeatherIcon name="slash" size={scale(14)} color={colors.error} />
            <Text style={[styles.statusChipText, {color: colors.error}]}>
              Blocked
            </Text>
          </View>
        );

      default:
        return (
          <TouchableOpacity
            style={[
              styles.addBtn,
              {backgroundColor: colors.primary, borderRadius: borderRadius.md},
            ]}
            onPress={() => handleSendRequest(item.user.id)}
            disabled={isLoading}
            activeOpacity={0.7}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <FeatherIcon name="user-plus" size={scale(14)} color="#FFF" />
                <Text style={styles.addBtnText}>Add</Text>
              </>
            )}
          </TouchableOpacity>
        );
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScreenHeader title={t('friends.searchUsers')} />
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}>
          <FeatherIcon
            name="search"
            size={scale(18)}
            color={colors.textSecondary}
          />
          <TextInput
            placeholder={t('friends.searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={handleQueryChange}
            autoFocus
            style={[styles.searchTextInput, {color: colors.text}]}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {loading && (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
          {!loading && query.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <FeatherIcon
                name="x-circle"
                size={scale(18)}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        {searched && results.length > 0 && (
          <Text style={[styles.resultCount, {color: colors.textSecondary}]}>
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </Text>
        )}
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={item => item.user.id}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('UserProfile', {userId: item.user.id})
            }
            activeOpacity={0.7}>
          <Card style={styles.userCard} elevation={1}>
            <View style={styles.userRow}>
              <Avatar
                name={item.user.name}
                uri={item.user.avatar}
                size={48}
              />
              <View style={styles.userInfo}>
                <Text
                  style={[styles.userName, {color: colors.text}]}
                  numberOfLines={1}>
                  {item.user.name}
                </Text>
                <Text
                  style={[styles.userUsername, {color: colors.textSecondary}]}>
                  @{item.user.username}
                </Text>
                {(item.friendsCount ?? 0) > 0 && (
                  <View style={styles.mutualRow}>
                    <FeatherIcon
                      name="users"
                      size={scale(11)}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.mutualText,
                        {color: colors.textSecondary},
                      ]}>
                      {item.friendsCount} friends
                    </Text>
                  </View>
                )}
              </View>
              {renderStatusAction(item)}
            </View>
          </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          searched && !loading ? (
            <EmptyState
              icon="search"
              message="No users found"
              submessage="Try a different name or username"
            />
          ) : !searched ? (
            <View style={styles.hintContainer}>
              <View
                style={[
                  styles.hintIconCircle,
                  {backgroundColor: colors.primary + '10'},
                ]}>
                <FeatherIcon
                  name="search"
                  size={scale(32)}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.hintTitle, {color: colors.text}]}>
                Find Friends
              </Text>
              <Text style={[styles.hintText, {color: colors.textSecondary}]}>
                Search by name or username to{'\n'}find and add friends
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <AppModal
        visible={!!errorMsg}
        title="Error"
        message={errorMsg}
        onClose={() => setErrorMsg('')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},

  // Search
  searchSection: {
    paddingHorizontal: scale(16),
    paddingTop: scale(12),
    paddingBottom: scale(8),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    height: scale(46),
    borderWidth: 1,
    gap: scale(10),
  },
  searchTextInput: {
    flex: 1,
    fontSize: scale(15),
    paddingVertical: 0,
  },
  resultCount: {
    fontSize: scale(12),
    marginTop: scale(8),
    marginLeft: scale(4),
  },

  // List
  list: {flexGrow: 1, paddingHorizontal: scale(16), paddingTop: scale(4)},

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
  mutualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    marginTop: scale(3),
  },
  mutualText: {fontSize: scale(11)},

  // Status chips
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(14),
    gap: scale(4),
  },
  statusChipText: {fontSize: scale(12), fontWeight: '600'},

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    gap: scale(5),
  },
  addBtnText: {color: '#FFF', fontSize: scale(13), fontWeight: '600'},

  // Hint (before search)
  hintContainer: {
    alignItems: 'center',
    paddingTop: scale(60),
    paddingHorizontal: scale(32),
  },
  hintIconCircle: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(16),
  },
  hintTitle: {fontSize: scale(18), fontWeight: '700', marginBottom: scale(8)},
  hintText: {
    fontSize: scale(14),
    textAlign: 'center',
    lineHeight: scale(20),
  },
});
