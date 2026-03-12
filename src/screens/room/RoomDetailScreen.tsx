import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import FeatherIcon from '@react-native-vector-icons/feather';
import type {RoomStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useRoomStore} from '../../stores/room.store';
import {useAuthStore} from '../../stores/auth.store';
import {useSportTypeStore} from '../../stores/sportType.store';
import {roomService} from '../../services/room.service';
import {matchService} from '../../services/match.service';
import {friendService} from '../../services/friend.service';
import {
  joinRoom as wsJoin,
  leaveRoom as wsLeave,
  getSocket,
  SOCKET_EVENTS,
} from '../../api/socket';
import {roomAdapter} from '../../adapters/room.adapter';
import {scale} from '../../utils/responsive';
import {formatScore, formatOvers, getResultText} from '../../utils/formatters';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import AppModal from '../../components/ui/AppModal';
import PlayerSlotCard from '../../components/PlayerSlotCard';
import BottomSheet from '../../components/BottomSheet';
import Input from '../../components/ui/Input';
import Loader from '../../components/ui/Loader';
import Avatar from '../../components/ui/Avatar';
import ScreenHeader from '../../components/ScreenHeader';
import type {Friend, Match} from '../../models';

type Props = NativeStackScreenProps<RoomStackParams, 'RoomDetail'>;

export default function RoomDetailScreen({navigation, route}: Props) {
  const {roomId} = route.params;
  const {colors} = useTheme();
  const {t} = useTranslation();
  const user = useAuthStore(s => s.user);
  const sportType = useSportTypeStore(s => s.sportType);
  const {currentRoom, fetchRoom, setCurrentRoom, isLoading} = useRoomStore();

  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [addingToTeam, setAddingToTeam] = useState<'A' | 'B' | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showAddStatic, setShowAddStatic] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [roleSlotId, setRoleSlotId] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [staticName, setStaticName] = useState('');
  const [matchData, setMatchData] = useState<Match | null>(null);

  // Modal states
  const [errorMsg, setErrorMsg] = useState('');
  const [removeSlotId, setRemoveSlotId] = useState<string | null>(null);
  const [showAddType, setShowAddType] = useState(false);
  const [activeTeamTab, setActiveTeamTab] = useState<'A' | 'B'>('A');

  const isCreator =
    currentRoom &&
    (typeof currentRoom.creator === 'object'
      ? currentRoom.creator.id === user?.id
      : currentRoom.creator === user?.id);

  const isWaiting = currentRoom?.status === 'waiting';
  const teamSize = sportType?.config?.teamSize || 11;

  const loadRoom = useCallback(() => fetchRoom(roomId), [fetchRoom, roomId]);

  const showError = (err: any) => {
    setErrorMsg(err.response?.data?.message || 'Failed');
  };

  useEffect(() => {
    loadRoom();
    wsJoin(roomId);

    const socket = getSocket();
    const handleRoomUpdate = (data: any) => {
      setCurrentRoom(roomAdapter.adapt(data));
    };

    socket?.on(SOCKET_EVENTS.ROOM_UPDATED, handleRoomUpdate);
    socket?.on(SOCKET_EVENTS.TOSS_COMPLETED, handleRoomUpdate);
    socket?.on(SOCKET_EVENTS.MATCH_STARTED, (data: any) => {
      const room = roomAdapter.adapt(data);
      setCurrentRoom(room);
      if (room.matchId) {
        navigation.navigate('CricketScoring', {
          matchId: room.matchId,
          roomId: room.id,
        });
      }
    });

    return () => {
      wsLeave(roomId);
      socket?.off(SOCKET_EVENTS.ROOM_UPDATED, handleRoomUpdate);
      socket?.off(SOCKET_EVENTS.TOSS_COMPLETED);
      socket?.off(SOCKET_EVENTS.MATCH_STARTED);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // Fetch match data for completed rooms
  useEffect(() => {
    if (currentRoom?.status === 'completed' && currentRoom.matchId && !matchData) {
      matchService
        .getMatchByRoom(currentRoom.id)
        .then(setMatchData)
        .catch(() => {});
    }
  }, [currentRoom?.status, currentRoom?.matchId, currentRoom?.id, matchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRoom(roomId);
    setRefreshing(false);
  };

  // ── Add Player handlers ──────────────────────────────────────────────────

  const handleAddFriendOpen = async (team: 'A' | 'B') => {
    setAddingToTeam(team);
    setSelectedFriends(new Set());
    try {
      const list = await friendService.listFriends();
      setFriends(list);
    } catch {}
    setShowAddFriend(true);
  };

  const handleAddStaticOpen = (team: 'A' | 'B') => {
    setAddingToTeam(team);
    setShowAddStatic(true);
  };

  const toggleFriendSelect = (userId: string) => {
    setSelectedFriends(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleAddSelectedFriends = async () => {
    if (!addingToTeam || selectedFriends.size === 0) return;
    setShowAddFriend(false);
    setActionLoading(true);
    let lastRoom = null;
    for (const friendId of selectedFriends) {
      const friend = friends.find(f => f.user.id === friendId);
      if (!friend) continue;
      try {
        lastRoom = await roomService.addFriendPlayer(roomId, {
          friendUserId: friend.user.id,
          playerName: friend.user.name,
          team: addingToTeam,
        });
      } catch (err: any) {
        showError(err);
        break;
      }
    }
    if (lastRoom) setCurrentRoom(lastRoom);
    setSelectedFriends(new Set());
    setActionLoading(false);
  };

  const handleAddStatic = async () => {
    if (!staticName.trim() || !addingToTeam) return;
    setShowAddStatic(false);
    setActionLoading(true);
    try {
      const room = await roomService.addStaticPlayer(roomId, {
        name: staticName.trim(),
        team: addingToTeam,
      });
      setCurrentRoom(room);
      setStaticName('');
    } catch (err: any) {
      showError(err);
    }
    setActionLoading(false);
  };

  // ── Player management handlers ───────────────────────────────────────────

  const handleRemovePlayer = (slotId: string) => {
    setRemoveSlotId(slotId);
  };

  const confirmRemovePlayer = async () => {
    if (!removeSlotId) return;
    const slotId = removeSlotId;
    setRemoveSlotId(null);
    try {
      const room = await roomService.removePlayer(roomId, slotId);
      setCurrentRoom(room);
    } catch (err: any) {
      showError(err);
    }
  };

  const handleSwitchTeam = async (slotId: string) => {
    if (!currentRoom) return;
    const player = currentRoom.players.find(p => p.id === slotId);
    if (!player) return;
    const toTeam = player.team === 'A' ? 'B' : 'A';
    try {
      const room = await roomService.switchPlayerTeam(roomId, slotId, {
        team: toTeam,
      });
      setCurrentRoom(room);
    } catch (err: any) {
      showError(err);
    }
  };

  const handleSetCaptain = async (slotId: string) => {
    try {
      const room = await roomService.setCaptain(roomId, slotId);
      setCurrentRoom(room);
    } catch (err: any) {
      showError(err);
    }
  };

  const handleSetRoleOpen = (slotId: string) => {
    setRoleSlotId(slotId);
    setShowRolePicker(true);
  };

  const handleSetRole = async (role: string) => {
    if (!roleSlotId) return;
    setShowRolePicker(false);
    try {
      const room = await roomService.setPlayerRole(roomId, roleSlotId, {role});
      setCurrentRoom(room);
    } catch (err: any) {
      showError(err);
    }
  };

  // ── Room lifecycle handlers ──────────────────────────────────────────────

  const handleLock = async () => {
    setActionLoading(true);
    try {
      const room = await roomService.lockRoom(roomId);
      setCurrentRoom(room);
    } catch (err: any) {
      showError(err);
    }
    setActionLoading(false);
  };

  const handleStartMatch = async () => {
    setActionLoading(true);
    try {
      const room = await roomService.startRoom(roomId);
      setCurrentRoom(room);
      if (room.matchId) {
        navigation.navigate('CricketScoring', {
          matchId: room.matchId,
          roomId: room.id,
        });
      }
    } catch (err: any) {
      showError(err);
    }
    setActionLoading(false);
  };

  const handleOpenAddPlayer = (team: 'A' | 'B') => {
    setAddingToTeam(team);
    setShowAddType(true);
  };

  if (isLoading && !currentRoom) return <Loader />;
  if (!currentRoom) return null;

  const teamAPlayers = currentRoom.players.filter(p => p.team === 'A');
  const teamBPlayers = currentRoom.players.filter(p => p.team === 'B');
  const roles = sportType?.config?.roles?.map(r => r.name) || [];

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScreenHeader title={currentRoom?.name || t('room.room')} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Room Header */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={[styles.roomName, {color: colors.text}]}>
              {currentRoom.name}
            </Text>
            <Badge status={currentRoom.status} />
          </View>
          <Text style={[styles.matchupText, {color: colors.primary}]}>
            {currentRoom.teamAName} vs {currentRoom.teamBName}
          </Text>
          <Text style={[styles.playerCount, {color: colors.textSecondary}]}>
            {currentRoom.players.length}/{currentRoom.maxPlayers} players
            {currentRoom.oversPerInnings
              ? ` | ${currentRoom.oversPerInnings} overs`
              : ''}
          </Text>
        </Card>

        {/* Team Tab Selector */}
        <View style={[styles.teamTabRow, {backgroundColor: colors.surface, borderColor: colors.border}]}>
          <TouchableOpacity
            style={[
              styles.teamTab,
              activeTeamTab === 'A' && {backgroundColor: colors.primary},
            ]}
            onPress={() => setActiveTeamTab('A')}>
            <Text
              style={[
                styles.teamTabText,
                {color: activeTeamTab === 'A' ? '#FFF' : colors.textSecondary},
              ]}>
              {currentRoom.teamAName} ({teamAPlayers.filter(p => p.isActive).length}/{teamSize})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.teamTab,
              activeTeamTab === 'B' && {backgroundColor: colors.primary},
            ]}
            onPress={() => setActiveTeamTab('B')}>
            <Text
              style={[
                styles.teamTabText,
                {color: activeTeamTab === 'B' ? '#FFF' : colors.textSecondary},
              ]}>
              {currentRoom.teamBName} ({teamBPlayers.filter(p => p.isActive).length}/{teamSize})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Full-width player list for selected team */}
        <Card style={styles.teamCard}>
          {(activeTeamTab === 'A' ? teamAPlayers : teamBPlayers)
            .filter(p => p.isActive)
            .map(player => (
              <PlayerSlotCard
                key={player.id}
                player={player}
                isCaptain={
                  activeTeamTab === 'A'
                    ? currentRoom.captainA === player.id
                    : currentRoom.captainB === player.id
                }
                onRemove={
                  isCreator && isWaiting
                    ? () => handleRemovePlayer(player.id)
                    : undefined
                }
                onSwitchTeam={
                  isCreator && isWaiting
                    ? () => handleSwitchTeam(player.id)
                    : undefined
                }
                onSetCaptain={
                  isCreator && isWaiting
                    ? () => handleSetCaptain(player.id)
                    : undefined
                }
                onSetRole={
                  isCreator && isWaiting
                    ? () => handleSetRoleOpen(player.id)
                    : undefined
                }
              />
            ))}
          {isCreator &&
            isWaiting &&
            (activeTeamTab === 'A' ? teamAPlayers : teamBPlayers).filter(
              p => p.isActive,
            ).length < teamSize && (
              <Button
                title="+ Add Player"
                variant="secondary"
                onPress={() => handleOpenAddPlayer(activeTeamTab)}
                style={styles.addPlayerBtn}
              />
            )}
        </Card>

        {/* Toss Result */}
        {currentRoom.toss && (
          <>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>
              {t('toss.result')}
            </Text>
            <Card>
              <Text style={[styles.tossText, {color: colors.text}]}>
                Coin: {currentRoom.toss.coinResult} | Call:{' '}
                {currentRoom.toss.call}
              </Text>
              {currentRoom.toss.choice && (
                <Text style={[styles.tossText, {color: colors.primary}]}>
                  Choice: {currentRoom.toss.choice}
                </Text>
              )}
            </Card>
          </>
        )}

        {/* Creator Actions */}
        {isCreator && (
          <View style={styles.actions}>
            {isWaiting &&
              currentRoom.players.length >= currentRoom.minPlayers && (
                <Button
                  title={t('room.lockRoom')}
                  onPress={handleLock}
                  loading={actionLoading}
                />
              )}
            {currentRoom.status === 'toss_pending' && !currentRoom.toss && (
              <Button
                title={t('room.startToss')}
                onPress={() => navigation.navigate('Toss', {roomId})}
              />
            )}
            {currentRoom.status === 'toss_pending' &&
              currentRoom.toss?.choice && (
                <Button
                  title={t('room.startMatch')}
                  onPress={handleStartMatch}
                  loading={actionLoading}
                />
              )}
            {currentRoom.status === 'toss_pending' &&
              currentRoom.toss &&
              !currentRoom.toss.choice && (
                <Button
                  title="Complete Toss Choice"
                  onPress={() => navigation.navigate('Toss', {roomId})}
                />
              )}
          </View>
        )}

        {/* Go to match if active */}
        {currentRoom.matchId && currentRoom.status === 'active' && (
          <Button
            title="Go to Match"
            onPress={() =>
              navigation.navigate('CricketScoring', {
                matchId: currentRoom.matchId!,
                roomId: currentRoom.id,
              })
            }
            style={{marginTop: scale(16)}}
          />
        )}

        {/* Match Result if completed */}
        {currentRoom.status === 'completed' && matchData && (
          <>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>
              {t('match.result')}
            </Text>
            <Card>
              <View style={styles.resultScoreRow}>
                <Text style={[styles.resultTeamName, {color: colors.text}]}>
                  {currentRoom.teamAName}
                </Text>
                <Text style={[styles.resultScoreValue, {color: colors.text}]}>
                  {(() => {
                    const inn = matchData.innings.find(i => i.battingTeam === 'A');
                    return inn
                      ? `${formatScore(inn.totalRuns, inn.totalWickets)} (${formatOvers(inn.completedOvers)})`
                      : '-';
                  })()}
                </Text>
              </View>
              <View style={styles.resultScoreRow}>
                <Text style={[styles.resultTeamName, {color: colors.text}]}>
                  {currentRoom.teamBName}
                </Text>
                <Text style={[styles.resultScoreValue, {color: colors.text}]}>
                  {(() => {
                    const inn = matchData.innings.find(i => i.battingTeam === 'B');
                    return inn
                      ? `${formatScore(inn.totalRuns, inn.totalWickets)} (${formatOvers(inn.completedOvers)})`
                      : '-';
                  })()}
                </Text>
              </View>
              {(() => {
                const resultStr = getResultText(
                  matchData.result,
                  currentRoom.teamAName,
                  currentRoom.teamBName,
                );
                return resultStr ? (
                  <Text style={[styles.resultDescription, {color: colors.primary}]}>
                    {resultStr}
                  </Text>
                ) : null;
              })()}
            </Card>
            <Button
              title={t('match.viewScorecard')}
              onPress={() =>
                navigation.navigate('CricbuzzScorecard', {
                  matchId: currentRoom.matchId!,
                  roomId: currentRoom.id,
                })
              }
              style={{marginTop: scale(12)}}
            />
          </>
        )}
      </ScrollView>

      {/* Add Friend Bottom Sheet */}
      <BottomSheet
        visible={showAddFriend}
        onClose={() => setShowAddFriend(false)}>
        <Text style={[styles.sheetTitle, {color: colors.text}]}>
          {t('room.addFriend')} —{' '}
          {addingToTeam === 'A'
            ? currentRoom.teamAName
            : currentRoom.teamBName}
        </Text>
        <ScrollView style={{flex: 1}}>
          {friends
            .filter(
              f =>
                !currentRoom.players.some(
                  p => p.userId === f.user.id && p.isActive,
                ),
            )
            .map(f => {
              const selected = selectedFriends.has(f.user.id);
              return (
                <TouchableOpacity
                  key={f.user.id}
                  style={[
                    styles.friendRow,
                    {borderBottomColor: colors.divider},
                    selected && {backgroundColor: colors.primary + '15'},
                  ]}
                  activeOpacity={0.7}
                  onPress={() => toggleFriendSelect(f.user.id)}>
                  <Avatar name={f.user.name} size={36} />
                  <Text
                    style={[styles.friendName, {color: colors.text}]}
                    numberOfLines={1}>
                    {f.user.name}
                  </Text>
                  <FeatherIcon
                    name={selected ? 'check-circle' : 'circle'}
                    size={scale(22)}
                    color={selected ? colors.primary : colors.border}
                  />
                </TouchableOpacity>
              );
            })}
        </ScrollView>
        {selectedFriends.size > 0 && (
          <Button
            title={`Add ${selectedFriends.size} Player${selectedFriends.size > 1 ? 's' : ''}`}
            onPress={handleAddSelectedFriends}
            loading={actionLoading}
            style={{marginTop: scale(12)}}
          />
        )}
      </BottomSheet>

      {/* Add Static Player Bottom Sheet */}
      <BottomSheet
        visible={showAddStatic}
        onClose={() => setShowAddStatic(false)}
        height={250}>
        <Text style={[styles.sheetTitle, {color: colors.text}]}>
          {t('room.addPlayer')} —{' '}
          {addingToTeam === 'A'
            ? currentRoom.teamAName
            : currentRoom.teamBName}
        </Text>
        <Input
          placeholder={t('room.playerName')}
          value={staticName}
          onChangeText={setStaticName}
          autoFocus
        />
        <Button title="Add" onPress={handleAddStatic} />
      </BottomSheet>

      {/* Role Picker Bottom Sheet */}
      <BottomSheet
        visible={showRolePicker}
        onClose={() => setShowRolePicker(false)}
        height={300}>
        <Text style={[styles.sheetTitle, {color: colors.text}]}>
          Select Role
        </Text>
        <View style={styles.roleList}>
          {roles.map(role => (
            <Button
              key={role}
              title={role}
              variant="secondary"
              onPress={() => handleSetRole(role)}
              style={styles.roleBtn}
            />
          ))}
        </View>
      </BottomSheet>

      {/* Add Player Type Modal */}
      <AppModal
        visible={showAddType}
        title={t('room.addPlayer')}
        message="Choose player type"
        onClose={() => setShowAddType(false)}
        actions={[
          {
            text: t('room.addFriend'),
            onPress: () => addingToTeam && handleAddFriendOpen(addingToTeam),
          },
          {
            text: 'Guest',
            onPress: () => addingToTeam && handleAddStaticOpen(addingToTeam),
          },
        ]}
      />

      {/* Remove Player Confirm Modal */}
      <AppModal
        visible={!!removeSlotId}
        title="Remove Player"
        message="Are you sure?"
        onClose={() => setRemoveSlotId(null)}
        actions={[
          {text: t('common.cancel'), style: 'cancel'},
          {text: 'Remove', style: 'destructive', onPress: confirmRemovePlayer},
        ]}
      />

      {/* Error Modal */}
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
  container: {
    flex: 1,
  },
  scroll: {
    padding: scale(16),
    paddingBottom: scale(32),
  },
  headerCard: {
    marginBottom: scale(16),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    fontSize: scale(20),
    fontWeight: '700',
  },
  matchupText: {
    fontSize: scale(15),
    fontWeight: '600',
    marginTop: scale(4),
  },
  playerCount: {
    fontSize: scale(14),
    marginTop: scale(2),
  },
  teamTabRow: {
    flexDirection: 'row',
    borderRadius: scale(10),
    borderWidth: 1,
    padding: scale(3),
    marginBottom: scale(12),
  },
  teamTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: scale(10),
    borderRadius: scale(8),
  },
  teamTabText: {
    fontSize: scale(14),
    fontWeight: '600',
  },
  teamCard: {
    marginBottom: scale(8),
  },
  addPlayerBtn: {
    marginTop: scale(8),
    minHeight: scale(40),
  },
  sectionTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    marginBottom: scale(8),
    marginTop: scale(16),
  },
  actions: {
    marginTop: scale(20),
    gap: scale(10),
  },
  tossText: {
    fontSize: scale(15),
    marginBottom: scale(4),
  },
  sheetTitle: {
    fontSize: scale(18),
    fontWeight: '600',
    marginBottom: scale(16),
  },
  roleList: {
    gap: scale(8),
  },
  roleBtn: {
    minHeight: scale(40),
  },
  resultScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  resultTeamName: {
    fontSize: scale(15),
    fontWeight: '500',
  },
  resultScoreValue: {
    fontSize: scale(15),
    fontWeight: '700',
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(4),
    borderBottomWidth: 0.5,
    gap: scale(12),
  },
  friendName: {
    flex: 1,
    fontSize: scale(15),
    fontWeight: '500',
  },
  resultDescription: {
    fontSize: scale(14),
    fontWeight: '600',
    marginTop: scale(8),
  },
});
