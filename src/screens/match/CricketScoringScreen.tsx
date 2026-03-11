import React, {useEffect, useState, useMemo, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import FeatherIcon from '@react-native-vector-icons/feather';
import MDIcon from '@react-native-vector-icons/material-design-icons';
import type {RoomStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useMatchStore} from '../../stores/match.store';
import {useRoomStore} from '../../stores/room.store';
import {useAuthStore} from '../../stores/auth.store';
import {matchService} from '../../services/match.service';
import {
  joinRoom as wsJoin,
  leaveRoom as wsLeave,
  getSocket,
  SOCKET_EVENTS,
} from '../../api/socket';
import {matchAdapter} from '../../adapters/match.adapter';
import {scale} from '../../utils/responsive';
import {
  formatScore,
  formatOvers,
  formatRunRate,
  formatStrikeRate,
  formatEconomy,
  getResultText,
} from '../../utils/formatters';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import BottomSheet from '../../components/BottomSheet';
import CommentaryItem from '../../components/CommentaryItem';
import Loader from '../../components/ui/Loader';
import AppModal from '../../components/ui/AppModal';
import {haptics} from '../../utils/haptics';
import type {Match, Innings} from '../../models';

type Props = NativeStackScreenProps<RoomStackParams, 'CricketScoring'>;

const RUN_BUTTONS = [0, 1, 2, 3, 4, 6];
const WICKET_TYPES = [
  'bowled',
  'caught',
  'lbw',
  'run_out',
  'stumped',
  'hit_wicket',
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getPlayerBattingStats(innings: Innings, playerId: string) {
  let runs = 0,
    balls = 0,
    fours = 0,
    sixes = 0;
  for (const over of innings.overs) {
    for (const ball of over.balls) {
      if (ball.batsmanId === playerId) {
        runs += ball.runs;
        if (ball.isLegal) balls++;
        if (ball.runs === 4) fours++;
        if (ball.runs === 6) sixes++;
      }
    }
  }
  return {runs, balls, fours, sixes};
}

function getPlayerBowlingStats(innings: Innings, playerId: string) {
  let overs = 0,
    maidens = 0,
    runs = 0,
    wickets = 0,
    legalBalls = 0;
  for (const over of innings.overs) {
    if (over.bowlerId !== playerId) continue;
    const overLegal = over.balls.filter(b => b.isLegal).length;
    legalBalls += overLegal;
    runs += over.runs;
    wickets += over.wickets;
    if (over.isComplete) {
      overs++;
      if (over.runs === 0) maidens++;
    }
  }
  const partialBalls = legalBalls % 6;
  const displayOvers =
    overs + (partialBalls > 0 ? partialBalls / 10 : 0);
  return {overs: displayOvers, maidens, runs, wickets};
}

function formatBowlerOvers(stats: {overs: number}) {
  return stats.overs % 1 === 0
    ? stats.overs + '.0'
    : stats.overs.toFixed(1);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CricketScoringScreen({navigation, route}: Props) {
  const {matchId, roomId} = route.params;
  const {colors} = useTheme();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const {currentMatch, setMatch, fetchMatch, commentary} = useMatchStore();
  const {currentRoom, fetchRoom} = useRoomStore();

  const [loading, setLoading] = useState(false);
  const [showLineup, setShowLineup] = useState(false);
  const [showWicket, setShowWicket] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const [showNewBowler, setShowNewBowler] = useState(false);
  const [showNewBatsman, setShowNewBatsman] = useState(false);
  const [selectedExtra, setSelectedExtra] = useState('');
  const [selectedWicketType, setSelectedWicketType] = useState('');
  const [selectedFielder, setSelectedFielder] = useState('');
  const [lineupStriker, setLineupStriker] = useState('');
  const [lineupNonStriker, setLineupNonStriker] = useState('');
  const [lineupBowler, setLineupBowler] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Local strike tracking
  const [localStriker, setLocalStriker] = useState('');
  const [localNonStriker, setLocalNonStriker] = useState('');
  const [localBowler, setLocalBowler] = useState('');
  const pendingOverComplete = useRef(false);

  const showError = (msg: string) => setErrorMsg(msg);

  const match = currentMatch;
  const isCreator =
    currentRoom &&
    (typeof currentRoom.creator === 'object'
      ? currentRoom.creator.id === user?.id
      : currentRoom.creator === user?.id);

  // ── Memos ──────────────────────────────────────────────────────────────────

  const currentInnings = useMemo(() => {
    if (!match?.innings.length) return null;
    // Use backend's currentInnings (1-based) to pick the correct innings
    const idx = (match.currentInnings || 1) - 1;
    return match.innings[idx] || match.innings[match.innings.length - 1];
  }, [match]);

  const currentOver = useMemo(() => {
    if (!currentInnings?.overs.length) return null;
    return currentInnings.overs[currentInnings.overs.length - 1];
  }, [currentInnings]);

  const battingTeamPlayers = useMemo(() => {
    if (!match || !currentRoom || !currentInnings) return [];
    const teamKey = currentInnings.battingTeam;
    const teamPlayers =
      teamKey === 'A' ? match.teamA.players : match.teamB.players;
    return currentRoom.players.filter(p => teamPlayers.includes(p.id));
  }, [match, currentRoom, currentInnings]);

  const bowlingTeamPlayers = useMemo(() => {
    if (!match || !currentRoom || !currentInnings) return [];
    const teamKey = currentInnings.bowlingTeam;
    const teamPlayers =
      teamKey === 'A' ? match.teamA.players : match.teamB.players;
    return currentRoom.players.filter(p => teamPlayers.includes(p.id));
  }, [match, currentRoom, currentInnings]);

  const needsLineup = useMemo(() => {
    if (!currentInnings) return false;
    return !currentInnings.currentBatsmen?.striker;
  }, [currentInnings]);

  const dismissedBatsmanIds = useMemo(() => {
    const ids = new Set<string>();
    if (!currentInnings) return ids;
    for (const over of currentInnings.overs) {
      for (const ball of over.balls) {
        if (ball.wicket?.type) ids.add(ball.batsmanId);
      }
    }
    return ids;
  }, [currentInnings]);

  const availableNewBatsmen = useMemo(
    () =>
      battingTeamPlayers.filter(
        p =>
          !dismissedBatsmanIds.has(p.id) &&
          p.id !== localNonStriker &&
          p.id !== localStriker,
      ),
    [battingTeamPlayers, dismissedBatsmanIds, localNonStriker, localStriker],
  );

  const lastCompletedOverBowlerId = useMemo(() => {
    if (!currentInnings?.overs.length) return null;
    for (let i = currentInnings.overs.length - 1; i >= 0; i--) {
      if (currentInnings.overs[i].isComplete) {
        return currentInnings.overs[i].bowlerId;
      }
    }
    return null;
  }, [currentInnings]);

  const availableBowlers = useMemo(
    () =>
      bowlingTeamPlayers.filter(p => p.id !== lastCompletedOverBowlerId),
    [bowlingTeamPlayers, lastCompletedOverBowlerId],
  );

  // ── Effects ────────────────────────────────────────────────────────────────

  // Sync local state from match data
  useEffect(() => {
    if (currentInnings?.currentBatsmen?.striker) {
      setLocalStriker(currentInnings.currentBatsmen.striker);
    }
    if (currentInnings?.currentBatsmen?.nonStriker) {
      setLocalNonStriker(currentInnings.currentBatsmen.nonStriker);
    }
    if (currentInnings?.currentBowler) {
      setLocalBowler(currentInnings.currentBowler);
    }
  }, [
    currentInnings?.currentBatsmen?.striker,
    currentInnings?.currentBatsmen?.nonStriker,
    currentInnings?.currentBowler,
  ]);

  // Reset lineup selections when innings changes (for 2nd innings)
  useEffect(() => {
    setLineupStriker('');
    setLineupNonStriker('');
    setLineupBowler('');
  }, [currentInnings?.number]);

  useEffect(() => {
    fetchMatch(matchId);
    fetchRoom(roomId);
    wsJoin(roomId);

    const socket = getSocket();
    const handleScoreUpdate = (data: any) => {
      setMatch(matchAdapter.adapt(data));
    };

    socket?.on(SOCKET_EVENTS.MATCH_SCORE_UPDATE, handleScoreUpdate);
    socket?.on(SOCKET_EVENTS.MATCH_INNINGS_BREAK, handleScoreUpdate);
    socket?.on(SOCKET_EVENTS.MATCH_INNINGS_RESUME, handleScoreUpdate);
    socket?.on(SOCKET_EVENTS.MATCH_COMPLETED, handleScoreUpdate);
    socket?.on(SOCKET_EVENTS.MATCH_ABANDONED, handleScoreUpdate);

    return () => {
      wsLeave(roomId);
      socket?.off(SOCKET_EVENTS.MATCH_SCORE_UPDATE, handleScoreUpdate);
      socket?.off(SOCKET_EVENTS.MATCH_INNINGS_BREAK, handleScoreUpdate);
      socket?.off(SOCKET_EVENTS.MATCH_INNINGS_RESUME, handleScoreUpdate);
      socket?.off(SOCKET_EVENTS.MATCH_COMPLETED, handleScoreUpdate);
      socket?.off(SOCKET_EVENTS.MATCH_ABANDONED, handleScoreUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, roomId]);

  // Auto-start match if still not_started
  useEffect(() => {
    if (match?.status === 'not_started' && isCreator) {
      matchService
        .startMatch(matchId)
        .then(updated => setMatch(updated))
        .catch(() => {});
    }
  }, [match?.status, isCreator, matchId, setMatch]);

  const getPlayerName = useCallback(
    (slotId: string): string =>
      currentRoom?.players.find(p => p.id === slotId)?.name || 'Unknown',
    [currentRoom],
  );

  // ── Post-ball logic (strike rotation, auto-prompts) ────────────────────────

  const handlePostBall = useCallback(
    async (updated: Match) => {
      const idx = (updated.currentInnings || 1) - 1;
      const inn = updated.innings[idx] || updated.innings[updated.innings.length - 1];
      if (!inn?.overs.length) return;

      // Find the last over that actually has balls — backend may have
      // already created an empty next-over object after the completed one.
      let ballOver = inn.overs[inn.overs.length - 1];
      if (ballOver.balls.length === 0 && inn.overs.length > 1) {
        ballOver = inn.overs[inn.overs.length - 2];
      }
      const lastBall = ballOver.balls[ballOver.balls.length - 1];
      if (!lastBall) return;

      const hadWicket = !!lastBall.wicket?.type;
      const overComplete = ballOver.isComplete;
      const inningsEnded = inn.status === 'completed';

      // Calculate runs that determine strike rotation
      let strikeChangeRuns: number;
      if (lastBall.extras) {
        if (lastBall.extras.type === 'wide') {
          strikeChangeRuns = Math.max(0, (lastBall.extras.runs || 0) - 1);
        } else if (lastBall.extras.type === 'noball') {
          strikeChangeRuns = lastBall.runs;
        } else {
          strikeChangeRuns = lastBall.extras.runs || 0;
        }
      } else {
        strikeChangeRuns = lastBall.runs;
      }
      const oddRuns = strikeChangeRuns % 2 === 1;

      if (inningsEnded) return;

      if (hadWicket && overComplete) {
        // Wicket + over complete: need new batsman first, then bowler
        pendingOverComplete.current = true;
        setShowNewBatsman(true);
      } else if (hadWicket) {
        // Wicket only: need new batsman
        pendingOverComplete.current = false;
        setShowNewBatsman(true);
      } else if (overComplete) {
        // Over complete: swap strike + need new bowler
        const newStriker = localNonStriker;
        const newNonStriker = localStriker;
        setLocalStriker(newStriker);
        setLocalNonStriker(newNonStriker);
        setShowNewBowler(true);
      } else if (oddRuns) {
        // Odd runs: silent strike swap
        const newStriker = localNonStriker;
        const newNonStriker = localStriker;
        setLocalStriker(newStriker);
        setLocalNonStriker(newNonStriker);
        try {
          await matchService.setLineup(matchId, {
            strikerId: newStriker,
            nonStrikerId: newNonStriker,
            bowlerId: localBowler,
          });
        } catch {
          // Silently handle — backend state will sync via WebSocket
        }
      }
    },
    [localStriker, localNonStriker, localBowler, matchId],
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSetLineup = async () => {
    if (!lineupStriker || !lineupNonStriker || !lineupBowler) {
      showError('Please select all players');
      return;
    }
    setLoading(true);
    try {
      const updated = await matchService.setLineup(matchId, {
        strikerId: lineupStriker,
        nonStrikerId: lineupNonStriker,
        bowlerId: lineupBowler,
      });
      setMatch(updated);
      setLocalStriker(lineupStriker);
      setLocalNonStriker(lineupNonStriker);
      setLocalBowler(lineupBowler);
      setShowLineup(false);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  const recordBall = async (
    runs: number,
    extras?: {type: string; runs: number},
    wicket?: {type: string; fielderId?: string},
  ) => {
    if (!localStriker || !localBowler) return;

    // Haptic feedback on ball recording
    haptics.medium();

    setLoading(true);
    try {
      const payload: any = {
        batsmanId: localStriker,
        bowlerId: localBowler,
        runs,
        isLegal:
          !extras || (extras.type !== 'wide' && extras.type !== 'noball'),
      };
      if (extras) payload.extras = extras;
      if (wicket) payload.wicket = wicket;

      let updated = await matchService.recordBall(matchId, payload);
      setMatch(updated);

      // Haptic feedback based on outcome
      if (wicket) {
        haptics.error();
      } else if (runs === 6 || runs === 4) {
        haptics.heavy();
      }

      // Chase win: if 2nd innings and target reached mid-over, complete match
      if (
        updated.status === 'active' &&
        updated.innings.length > 1 &&
        updated.currentInnings === 2
      ) {
        const firstInningsRuns = updated.innings[0].totalRuns;
        const secondInnings = updated.innings[1];
        if (secondInnings.totalRuns > firstInningsRuns) {
          const teamSize = secondInnings.battingTeam === 'A'
            ? updated.teamA.players.length
            : updated.teamB.players.length;
          const wicketsLeft = (teamSize || 11) - 1 - secondInnings.totalWickets;
          try {
            updated = await matchService.completeMatch(matchId, {
              winner: secondInnings.battingTeam,
              margin: `${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`,
            });
            setMatch(updated);
            haptics.success();
          } catch {
            // Backend may have already completed
          }
        }
      }

      await handlePostBall(updated);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  const handleAbandonMatch = async () => {
    setShowAbandonConfirm(false);
    setLoading(true);
    try {
      const updated = await matchService.abandonMatch(matchId);
      setMatch(updated);
      haptics.warning();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  const handleLeaveMatch = () => {
    setShowLeaveConfirm(false);
    wsLeave(roomId);
    navigation.navigate('RoomDetail', {roomId});
  };

  const handleRunPress = (runs: number) => recordBall(runs);

  const handleExtraPress = (type: string) => {
    setSelectedExtra(type);
    setShowExtras(true);
  };

  const handleExtraConfirm = (extraRuns: number) => {
    setShowExtras(false);
    if (selectedExtra === 'bye' || selectedExtra === 'legbye') {
      // Legal delivery, runs go to extras (not batsman)
      recordBall(0, {type: selectedExtra, runs: extraRuns});
    } else if (selectedExtra === 'noball') {
      // No ball: batsman can score runs + 1 penalty run
      recordBall(extraRuns, {type: 'noball', runs: 1});
    } else {
      // Wide: all runs are extras (1 penalty + additional)
      recordBall(0, {type: 'wide', runs: extraRuns + 1});
    }
  };

  const handleWicketConfirm = () => {
    setShowWicket(false);
    recordBall(0, undefined, {
      type: selectedWicketType,
      fielderId: selectedFielder || undefined,
    });
    setSelectedWicketType('');
    setSelectedFielder('');
  };

  const handleResumeInnings = async () => {
    setLoading(true);
    try {
      const updated = await matchService.resumeInnings(matchId);
      setMatch(updated);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  const handleNewBatsman = async (batsmanId: string) => {
    setShowNewBatsman(false);
    const newStriker = batsmanId;
    let striker = newStriker;
    let nonStriker = localNonStriker;

    if (pendingOverComplete.current) {
      // Over also completed: swap strike for new over
      striker = nonStriker;
      nonStriker = newStriker;
      pendingOverComplete.current = false;
      setLocalStriker(striker);
      setLocalNonStriker(nonStriker);
      setShowNewBowler(true);
      return; // setLineup will happen when bowler is selected
    }

    setLocalStriker(striker);
    setLocalNonStriker(nonStriker);
    setLoading(true);
    try {
      const updated = await matchService.setLineup(matchId, {
        strikerId: striker,
        nonStrikerId: nonStriker,
        bowlerId: localBowler,
      });
      setMatch(updated);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  const handleNewBowler = async (bowlerId: string) => {
    setShowNewBowler(false);
    setLocalBowler(bowlerId);
    setLoading(true);
    try {
      const updated = await matchService.setLineup(matchId, {
        strikerId: localStriker,
        nonStrikerId: localNonStriker,
        bowlerId,
      });
      setMatch(updated);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  const handleSwapStrike = async () => {
    const newStriker = localNonStriker;
    const newNonStriker = localStriker;
    setLocalStriker(newStriker);
    setLocalNonStriker(newNonStriker);
    try {
      await matchService.setLineup(matchId, {
        strikerId: newStriker,
        nonStrikerId: newNonStriker,
        bowlerId: localBowler,
      });
    } catch {}
  };

  // Partnership (runs since last wicket)
  const partnership = useMemo(() => {
    if (!currentInnings) return null;
    let runs = 0,
      balls = 0;
    let started = currentInnings.totalWickets === 0;
    for (const over of currentInnings.overs) {
      for (const ball of over.balls) {
        if (ball.wicket?.type) {
          runs = 0;
          balls = 0;
          started = true;
          continue;
        }
        if (started) {
          runs += ball.runs + (ball.extras?.runs || 0);
          if (ball.isLegal) balls++;
        }
      }
    }
    return {runs, balls};
  }, [currentInnings]);

  const overNumber = useMemo(
    () =>
      currentOver
        ? currentOver.overNumber 
        : (currentInnings?.completedOvers || 0),
    [currentOver, currentInnings],
  );

  // ── Derived values ─────────────────────────────────────────────────────────

  if (!match) return <Loader />;

  const isMatchActive =
    match.status === 'active' || match.status === 'not_started';
  const isMatchCompleted =
    match.status === 'completed' || match.status === 'abandoned';
  const isInningsBreak = match.status === 'innings_break';

  const legalBalls =
    currentOver?.balls.filter(b => b.isLegal).length || 0;

  const showScoringControls =
    isCreator && isMatchActive && !needsLineup && !isMatchCompleted;

  // Batsmen stats
  const strikerStats =
    currentInnings && localStriker
      ? getPlayerBattingStats(currentInnings, localStriker)
      : null;
  const nonStrikerStats =
    currentInnings && localNonStriker
      ? getPlayerBattingStats(currentInnings, localNonStriker)
      : null;
  const bowlerStats =
    currentInnings && localBowler
      ? getPlayerBowlingStats(currentInnings, localBowler)
      : null;

  // Target info for 2nd innings
  const targetRuns =
    match.innings.length > 1 && currentInnings?.number === 2
      ? match.innings[0].totalRuns + 1
      : null;
  const runsNeeded =
    targetRuns && currentInnings
      ? Math.max(0, targetRuns - currentInnings.totalRuns)
      : null;
  const totalBallsInInnings = (match.config?.oversPerInnings || 20) * 6;
  const ballsBowled = currentInnings
    ? currentInnings.completedOvers * 6 + legalBalls
    : 0;
  const ballsRemaining = totalBallsInInnings - ballsBowled;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: colors.background, paddingTop: insets.top},
      ]}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <TouchableOpacity
          onPress={() => {
            if (isMatchActive && !isCreator) {
              setShowLeaveConfirm(true);
            } else {
              navigation.navigate('RoomDetail', {roomId});
            }
          }}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <FeatherIcon name="arrow-left" size={scale(22)} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTeams} numberOfLines={1}>
            {match.teamA.name || 'Team A'} vs {match.teamB.name || 'Team B'}
          </Text>
          {isMatchActive && (
            <View style={styles.liveBadge}>
              <View style={styles.livePulse} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
          {!isMatchActive && (
            <Badge
              status={match.status}
              label={match.status}
            />
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MatchDetail', {matchId})}
            style={styles.headerIconBtn}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <FeatherIcon name="bar-chart-2" size={scale(20)} color="#FFF" />
          </TouchableOpacity>
          {isCreator && isMatchActive && (
            <TouchableOpacity
              onPress={() => setShowAbandonConfirm(true)}
              style={styles.headerIconBtn}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <FeatherIcon name="x-circle" size={scale(20)} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Scrollable Content ─────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scroll,
          showScoringControls && {paddingBottom: scale(8)},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Score Card */}
        {currentInnings && (
          <View
            style={[styles.scoreCard, {backgroundColor: colors.surface}]}>
            {/* Team & innings label */}
            <View style={styles.scoreHeader}>
              <View style={styles.scoreHeaderLeft}>
                <View
                  style={[
                    styles.inningsIndicator,
                    {backgroundColor: currentInnings.battingTeam === 'A' ? colors.info : colors.warning},
                  ]}
                />
                <Text
                  style={[styles.teamLabel, {color: colors.text}]}>
                  {currentInnings.battingTeam === 'A'
                    ? match.teamA.name || 'Team A'
                    : match.teamB.name || 'Team B'}
                </Text>
                <View style={[styles.inningsBadge, {backgroundColor: colors.background}]}>
                  <Text style={[styles.inningsBadgeText, {color: colors.textSecondary}]}>
                    {currentInnings.number === 1
                      ? t('cricket.firstInnings')
                      : t('cricket.secondInnings')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Big score */}
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreText, {color: colors.text}]}>
                {formatScore(
                  currentInnings.totalRuns,
                  currentInnings.totalWickets,
                )}
              </Text>
              <Text
                style={[styles.oversTextBig, {color: colors.textSecondary}]}>
                ({formatOvers(currentInnings.completedOvers, legalBalls)} ov)
              </Text>
            </View>

            {/* Run rate & target */}
            <View style={styles.infoRow}>
              <View style={[styles.rrBadge, {backgroundColor: colors.primary + '12'}]}>
                <Text
                  style={[styles.infoText, {color: colors.primary}]}>
                  RR{' '}
                  {formatRunRate(
                    currentInnings.totalRuns,
                    currentInnings.completedOvers + legalBalls / 6,
                  )}
                </Text>
              </View>
              {targetRuns && runsNeeded !== null && (
                <View style={[styles.targetBadge, {backgroundColor: colors.accent + '15'}]}>
                  <MDIcon name="target" size={scale(14)} color={colors.accent} />
                  <Text style={[styles.targetText, {color: colors.accent}]}>
                    {t('cricket.needFromBalls', {
                      runs: runsNeeded,
                      balls: ballsRemaining,
                    })}
                  </Text>
                </View>
              )}
            </View>

            {/* Divider */}
            <View
              style={[styles.divider, {backgroundColor: colors.divider}]}
            />

            {/* Batsmen stats table */}
            {localStriker && (
              <View style={styles.statsSection}>
                {/* Table header */}
                <View style={styles.statsRow}>
                  <Text
                    style={[
                      styles.statsHeaderLabel,
                      {color: colors.textSecondary},
                    ]}>
                    {t('cricket.batting')}
                  </Text>
                  <View style={styles.statsValues}>
                    <Text style={[styles.statsHeader, {color: colors.textSecondary}]}>
                      R
                    </Text>
                    <Text style={[styles.statsHeader, {color: colors.textSecondary}]}>
                      B
                    </Text>
                    <Text style={[styles.statsHeader, {color: colors.textSecondary}]}>
                      4s
                    </Text>
                    <Text style={[styles.statsHeader, {color: colors.textSecondary}]}>
                      6s
                    </Text>
                    <Text style={[styles.statsHeader, {color: colors.textSecondary}]}>
                      SR
                    </Text>
                  </View>
                </View>

                {/* Striker */}
                <View style={styles.statsRow}>
                  <View style={styles.playerNameRow}>
                    <MDIcon
                      name="cricket"
                      size={scale(14)}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.playerName, {color: colors.text}]}
                      numberOfLines={1}>
                      {getPlayerName(localStriker)} *
                    </Text>
                  </View>
                  {strikerStats && (
                    <View style={styles.statsValues}>
                      <Text
                        style={[styles.statValue, styles.statBold, {color: colors.text}]}>
                        {strikerStats.runs}
                      </Text>
                      <Text style={[styles.statValue, {color: colors.textSecondary}]}>
                        {strikerStats.balls}
                      </Text>
                      <Text style={[styles.statValue, {color: colors.textSecondary}]}>
                        {strikerStats.fours}
                      </Text>
                      <Text style={[styles.statValue, {color: colors.textSecondary}]}>
                        {strikerStats.sixes}
                      </Text>
                      <Text style={[styles.statValue, {color: colors.textSecondary}]}>
                        {formatStrikeRate(
                          strikerStats.runs,
                          strikerStats.balls,
                        )}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Non-striker */}
                {localNonStriker && nonStrikerStats && (
                  <View style={styles.statsRow}>
                    <View style={styles.playerNameRow}>
                      <View style={{width: scale(14)}} />
                      <Text
                        style={[
                          styles.playerName,
                          {color: colors.textSecondary},
                        ]}
                        numberOfLines={1}>
                        {getPlayerName(localNonStriker)}
                      </Text>
                    </View>
                    <View style={styles.statsValues}>
                      <Text
                        style={[styles.statValue, styles.statBold, {color: colors.text}]}>
                        {nonStrikerStats.runs}
                      </Text>
                      <Text
                        style={[styles.statValue, {color: colors.textSecondary}]}>
                        {nonStrikerStats.balls}
                      </Text>
                      <Text
                        style={[styles.statValue, {color: colors.textSecondary}]}>
                        {nonStrikerStats.fours}
                      </Text>
                      <Text
                        style={[styles.statValue, {color: colors.textSecondary}]}>
                        {nonStrikerStats.sixes}
                      </Text>
                      <Text
                        style={[styles.statValue, {color: colors.textSecondary}]}>
                        {formatStrikeRate(
                          nonStrikerStats.runs,
                          nonStrikerStats.balls,
                        )}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Divider */}
            {localBowler && (
              <View
                style={[styles.divider, {backgroundColor: colors.divider}]}
              />
            )}

            {/* Bowler stats */}
            {localBowler && bowlerStats && (
              <View style={styles.statsSection}>
                <View style={styles.statsRow}>
                  <Text
                    style={[
                      styles.statsHeaderLabel,
                      {color: colors.textSecondary},
                    ]}>
                    {t('cricket.bowling')}
                  </Text>
                  <View style={styles.statsValues}>
                    <Text style={[styles.statsHeader, {color: colors.textSecondary}]}>
                      O
                    </Text>
                    <Text style={[styles.statsHeader, {color: colors.textSecondary}]}>
                      M
                    </Text>
                    <Text style={[styles.statsHeader, {color: colors.textSecondary}]}>
                      R
                    </Text>
                    <Text style={[styles.statsHeader, {color: colors.textSecondary}]}>
                      W
                    </Text>
                    <Text style={[styles.statsHeader, {color: colors.textSecondary}]}>
                      Econ
                    </Text>
                  </View>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.playerNameRow}>
                    <MDIcon
                      name="bowling"
                      size={scale(14)}
                      color={colors.accent}
                    />
                    <Text
                      style={[styles.playerName, {color: colors.text}]}
                      numberOfLines={1}>
                      {getPlayerName(localBowler)}
                    </Text>
                  </View>
                  <View style={styles.statsValues}>
                    <Text
                      style={[styles.statValue, {color: colors.textSecondary}]}>
                      {formatBowlerOvers(bowlerStats)}
                    </Text>
                    <Text
                      style={[styles.statValue, {color: colors.textSecondary}]}>
                      {bowlerStats.maidens}
                    </Text>
                    <Text
                      style={[styles.statValue, {color: colors.textSecondary}]}>
                      {bowlerStats.runs}
                    </Text>
                    <Text
                      style={[styles.statValue, styles.statBold, {color: colors.text}]}>
                      {bowlerStats.wickets}
                    </Text>
                    <Text
                      style={[styles.statValue, {color: colors.textSecondary}]}>
                      {formatEconomy(bowlerStats.runs, bowlerStats.overs)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Partnership */}
            {partnership && partnership.balls > 0 && (
              <>
                <View
                  style={[
                    styles.divider,
                    {backgroundColor: colors.divider},
                  ]}
                />
                <Text
                  style={[
                    styles.partnershipText,
                    {color: colors.textSecondary},
                  ]}>
                  Partnership: {partnership.runs} ({partnership.balls})
                </Text>
              </>
            )}
          </View>
        )}

        {/* ── Over Strip ──────────────────────────────────────────────── */}
        {currentOver && (
          <View
            style={[
              styles.overStripContainer,
              {backgroundColor: colors.surface, borderColor: colors.divider},
            ]}>
            <View style={styles.overLabelRow}>
              <View style={[styles.overBadge, {backgroundColor: colors.primary + '15'}]}>
                <Text style={[styles.overBadgeText, {color: colors.primary}]}>
                  Over {overNumber}
                </Text>
              </View>
              <Text
                style={[styles.overRuns, {color: colors.textSecondary}]}>
                {currentOver.runs} runs
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.overBalls}>
              {currentOver.balls.map((ball, i) => {
                let label = String(ball.runs);
                let bg = colors.background;
                let textColor = colors.text;

                if (ball.wicket?.type) {
                  label = 'W';
                  bg = colors.wicket;
                  textColor = '#FFF';
                } else if (ball.extras?.type === 'wide') {
                  label = `${ball.extras.runs}wd`;
                  bg = colors.extra;
                  textColor = '#FFF';
                } else if (ball.extras?.type === 'noball') {
                  label = `${ball.runs}nb`;
                  bg = colors.extra;
                  textColor = '#FFF';
                } else if (
                  ball.extras?.type === 'bye' ||
                  ball.extras?.type === 'legbye'
                ) {
                  label = `${ball.extras.runs}b`;
                  bg = colors.extra + '25';
                  textColor = colors.extra;
                } else if (ball.runs === 4) {
                  bg = colors.four;
                  textColor = '#FFF';
                } else if (ball.runs === 6) {
                  bg = colors.six;
                  textColor = '#FFF';
                } else if (ball.runs === 0) {
                  label = '\u00B7';
                }

                return (
                  <View
                    key={i}
                    style={[
                      styles.ballDot,
                      {backgroundColor: bg},
                    ]}>
                    <Text
                      style={[styles.ballText, {color: textColor}]}
                      numberOfLines={1}>
                      {label}
                    </Text>
                  </View>
                );
              })}
              {/* Empty ball placeholders for remaining legal deliveries */}
              {Array.from({length: Math.max(0, 6 - legalBalls)}).map((_, i) => (
                <View
                  key={`empty-${i}`}
                  style={[
                    styles.ballDot,
                    styles.ballDotEmpty,
                    {borderColor: colors.border},
                  ]}>
                  <Text style={[styles.ballText, {color: colors.border}]}>
                    {'\u00B7'}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Innings Break ───────────────────────────────────────────── */}
        {isInningsBreak && (
          <Card style={styles.breakCard} elevation={2}>
            <MDIcon
              name="timer-sand"
              size={scale(32)}
              color={colors.accent}
            />
            <Text style={[styles.breakText, {color: colors.accent}]}>
              {t('cricket.inningsBreak')}
            </Text>
            <Text style={[styles.breakScore, {color: colors.text}]}>
              {match.innings[0] &&
                `${
                  match.innings[0].battingTeam === 'A'
                    ? match.teamA.name
                    : match.teamB.name
                } scored ${formatScore(
                  match.innings[0].totalRuns,
                  match.innings[0].totalWickets,
                )}`}
            </Text>
            {isCreator ? (
              <Button
                title={t('cricket.startSecondInnings')}
                onPress={handleResumeInnings}
                loading={loading}
                style={{marginTop: scale(12)}}
              />
            ) : (
              <Text
                style={[
                  styles.breakSubtext,
                  {color: colors.textSecondary},
                ]}>
                Waiting for scorer to start 2nd innings...
              </Text>
            )}
          </Card>
        )}

        {/* ── Match Completed ─────────────────────────────────────────── */}
        {isMatchCompleted && (
          <Card style={styles.resultCard} elevation={2}>
            <MDIcon
              name="trophy"
              size={scale(36)}
              color={colors.milestone}
            />
            <Text style={[styles.resultText, {color: colors.primary}]}>
              {getResultText(match.result, match.teamA.name, match.teamB.name) || t('match.completed')}
            </Text>
            <Button
              title={t('match.scorecard')}
              variant="secondary"
              onPress={() => navigation.navigate('MatchDetail', {matchId})}
              style={{marginTop: scale(12)}}
            />
          </Card>
        )}

        {/* ── Lineup Setup ────────────────────────────────────────────── */}
        {needsLineup && isMatchActive && (
          <Card style={styles.lineupCard} elevation={2}>
            <MDIcon
              name="account-group"
              size={scale(32)}
              color={colors.primary}
            />
            <Text style={[styles.lineupTitle, {color: colors.text}]}>
              {t('cricket.setLineup')}
            </Text>
            <Text
              style={[
                styles.lineupSubtext,
                {color: colors.textSecondary},
              ]}>
              {isCreator
                ? 'Select openers and opening bowler to start'
                : 'Waiting for the scorer to set the batting lineup'}
            </Text>
            {isCreator && (
              <Button
                title="Select Players"
                onPress={() => setShowLineup(true)}
                style={{marginTop: scale(12)}}
              />
            )}
          </Card>
        )}

        {/* ── Commentary Feed (Cricbuzz-style) ─────────────────────────── */}
        {commentary.length > 0 && (
          <View style={styles.commentarySection}>
            <View style={styles.commentaryHeader}>
              <Text style={[styles.commentaryTitle, {color: colors.text}]}>
                {t('match.commentary')}
              </Text>
              <Text
                style={[
                  styles.commentaryCount,
                  {color: colors.textSecondary},
                ]}>
                {commentary.length} entries
              </Text>
            </View>
            {[...commentary].reverse().map((entry, i) => (
              <CommentaryItem key={i} entry={entry} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Fixed Bottom Scoring Panel ──────────────────────────────────── */}
      {showScoringControls && (
        <View
          style={[
            styles.scoringPanel,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.divider,
              paddingBottom: insets.bottom || scale(8),
            },
          ]}>
          {/* Run buttons */}
          <View style={styles.runsRow}>
            {RUN_BUTTONS.map(r => {
              const isFour = r === 4;
              const isSix = r === 6;
              const isDot = r === 0;
              return (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.runBtn,
                    {
                      backgroundColor: isFour
                        ? colors.four
                        : isSix
                        ? colors.six
                        : colors.background,
                      borderColor: isFour || isSix ? 'transparent' : colors.border,
                    },
                  ]}
                  onPress={() => handleRunPress(r)}
                  disabled={loading}
                  activeOpacity={0.6}>
                  <Text
                    style={[
                      styles.runBtnText,
                      {color: isFour || isSix ? '#FFF' : colors.text},
                    ]}>
                    {isDot ? '\u00B7' : r}
                  </Text>
                  {(isFour || isSix) && (
                    <Text style={styles.runBtnLabel}>
                      {isFour ? 'FOUR' : 'SIX'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Extras + Swap + Wicket */}
          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={[
                styles.extraChip,
                {backgroundColor: colors.extra + '12', borderColor: colors.extra + '40'},
              ]}
              onPress={() => handleExtraPress('wide')}
              disabled={loading}
              activeOpacity={0.6}>
              <Text style={[styles.extraChipText, {color: colors.extra}]}>
                Wd
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.extraChip,
                {backgroundColor: colors.extra + '12', borderColor: colors.extra + '40'},
              ]}
              onPress={() => handleExtraPress('noball')}
              disabled={loading}
              activeOpacity={0.6}>
              <Text style={[styles.extraChipText, {color: colors.extra}]}>
                Nb
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.extraChip,
                {backgroundColor: colors.extra + '12', borderColor: colors.extra + '40'},
              ]}
              onPress={() => handleExtraPress('bye')}
              disabled={loading}
              activeOpacity={0.6}>
              <Text style={[styles.extraChipText, {color: colors.extra}]}>
                B
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.extraChip,
                {backgroundColor: colors.extra + '12', borderColor: colors.extra + '40'},
              ]}
              onPress={() => handleExtraPress('legbye')}
              disabled={loading}
              activeOpacity={0.6}>
              <Text style={[styles.extraChipText, {color: colors.extra}]}>
                Lb
              </Text>
            </TouchableOpacity>

            {/* Swap Strike */}
            <TouchableOpacity
              style={[
                styles.swapBtn,
                {backgroundColor: colors.info + '12', borderColor: colors.info + '40'},
              ]}
              onPress={handleSwapStrike}
              disabled={loading}
              activeOpacity={0.6}>
              <MDIcon
                name="swap-horizontal"
                size={scale(18)}
                color={colors.info}
              />
            </TouchableOpacity>

            {/* Wicket */}
            <TouchableOpacity
              style={[styles.wicketBtn, {backgroundColor: colors.wicket}]}
              onPress={() => setShowWicket(true)}
              disabled={loading}
              activeOpacity={0.7}>
              <MDIcon name="wicket" size={scale(14)} color="#FFF" />
              <Text style={styles.wicketBtnText}>OUT</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Bottom Sheets ──────────────────────────────────────────────── */}

      {/* Lineup BottomSheet */}
      <BottomSheet visible={showLineup} onClose={() => setShowLineup(false)}>
        <Text style={[styles.sheetTitle, {color: colors.text}]}>
          {t('cricket.setLineup')}
        </Text>

        <Text style={[styles.sheetLabel, {color: colors.textSecondary}]}>
          {t('cricket.selectStriker')}
        </Text>
        <ScrollView horizontal style={styles.playerPicker}>
          {battingTeamPlayers.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.chipBtn,
                {
                  backgroundColor:
                    lineupStriker === p.id
                      ? colors.primary
                      : colors.background,
                  borderColor:
                    lineupStriker === p.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setLineupStriker(p.id)}>
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      lineupStriker === p.id ? '#FFF' : colors.text,
                  },
                ]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.sheetLabel, {color: colors.textSecondary}]}>
          {t('cricket.selectNonStriker')}
        </Text>
        <ScrollView horizontal style={styles.playerPicker}>
          {battingTeamPlayers
            .filter(p => p.id !== lineupStriker)
            .map(p => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.chipBtn,
                  {
                    backgroundColor:
                      lineupNonStriker === p.id
                        ? colors.primary
                        : colors.background,
                    borderColor:
                      lineupNonStriker === p.id
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => setLineupNonStriker(p.id)}>
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        lineupNonStriker === p.id ? '#FFF' : colors.text,
                    },
                  ]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
        </ScrollView>

        <Text style={[styles.sheetLabel, {color: colors.textSecondary}]}>
          {t('cricket.selectBowler')}
        </Text>
        <ScrollView horizontal style={styles.playerPicker}>
          {bowlingTeamPlayers.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.chipBtn,
                {
                  backgroundColor:
                    lineupBowler === p.id
                      ? colors.primary
                      : colors.background,
                  borderColor:
                    lineupBowler === p.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setLineupBowler(p.id)}>
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      lineupBowler === p.id ? '#FFF' : colors.text,
                  },
                ]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Button
          title={t('common.confirm')}
          onPress={handleSetLineup}
          loading={loading}
          style={{marginTop: scale(12)}}
        />
      </BottomSheet>

      {/* New Batsman BottomSheet (auto-opens after wicket) */}
      <BottomSheet visible={showNewBatsman} onClose={() => {}}>
        <View style={styles.sheetHeader}>
          <MDIcon
            name="cricket"
            size={scale(24)}
            color={colors.wicket}
          />
          <Text style={[styles.sheetTitle, {color: colors.text, marginBottom: 0}]}>
            {t('cricket.selectNewBatsman')}
          </Text>
        </View>
        <Text style={[styles.sheetSubtext, {color: colors.textSecondary}]}>
          {getPlayerName(localStriker)} is out
        </Text>
        <View style={styles.playerList}>
          {availableNewBatsmen.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.playerOptionCard,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleNewBatsman(p.id)}>
              <View
                style={[
                  styles.playerAvatar,
                  {backgroundColor: colors.primary + '20'},
                ]}>
                <Text style={[styles.playerAvatarText, {color: colors.primary}]}>
                  {p.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.playerOptionText, {color: colors.text}]}>
                {p.name}
              </Text>
              <FeatherIcon
                name="chevron-right"
                size={scale(18)}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
          {availableNewBatsmen.length === 0 && (
            <Text style={[styles.noPlayers, {color: colors.textSecondary}]}>
              No batsmen available — All out!
            </Text>
          )}
        </View>
      </BottomSheet>

      {/* New Bowler BottomSheet (auto-opens after over) */}
      <BottomSheet visible={showNewBowler} onClose={() => {}}>
        <View style={styles.sheetHeader}>
          <MDIcon
            name="bowling"
            size={scale(24)}
            color={colors.accent}
          />
          <Text style={[styles.sheetTitle, {color: colors.text, marginBottom: 0}]}>
            {t('cricket.selectNewBowler')}
          </Text>
        </View>
        <Text style={[styles.sheetSubtext, {color: colors.textSecondary}]}>
          {t('cricket.overComplete')} — select next bowler
        </Text>
        <View style={styles.playerList}>
          {availableBowlers.map(p => {
            const bStats = currentInnings
              ? getPlayerBowlingStats(currentInnings, p.id)
              : null;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.playerOptionCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleNewBowler(p.id)}>
                <View
                  style={[
                    styles.playerAvatar,
                    {backgroundColor: colors.accent + '20'},
                  ]}>
                  <Text
                    style={[
                      styles.playerAvatarText,
                      {color: colors.accent},
                    ]}>
                    {p.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{flex: 1}}>
                  <Text
                    style={[styles.playerOptionText, {color: colors.text}]}>
                    {p.name}
                  </Text>
                  {bStats && bStats.overs > 0 && (
                    <Text
                      style={[
                        styles.bowlerMiniStats,
                        {color: colors.textSecondary},
                      ]}>
                      {formatBowlerOvers(bStats)}-{bStats.maidens}-
                      {bStats.runs}-{bStats.wickets}
                    </Text>
                  )}
                </View>
                <FeatherIcon
                  name="chevron-right"
                  size={scale(18)}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>

      {/* Wicket BottomSheet */}
      <BottomSheet visible={showWicket} onClose={() => setShowWicket(false)}>
        <Text style={[styles.sheetTitle, {color: colors.text}]}>
          {t('cricket.selectWicketType')}
        </Text>
        <View style={styles.wicketGrid}>
          {WICKET_TYPES.map(w => {
            const isSelected = selectedWicketType === w;
            return (
              <TouchableOpacity
                key={w}
                style={[
                  styles.wicketTypeBtn,
                  {
                    backgroundColor: isSelected
                      ? colors.wicket
                      : colors.background,
                    borderColor: isSelected
                      ? colors.wicket
                      : colors.border,
                  },
                ]}
                onPress={() => setSelectedWicketType(w)}>
                <Text
                  style={[
                    styles.wicketTypeText,
                    {color: isSelected ? '#FFF' : colors.text},
                  ]}>
                  {t(
                    `cricket.${
                      w === 'run_out'
                        ? 'runOut'
                        : w === 'hit_wicket'
                        ? 'hitWicket'
                        : w
                    }`,
                  )}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Fielder selection for caught, run_out, stumped */}
        {(selectedWicketType === 'caught' ||
          selectedWicketType === 'run_out' ||
          selectedWicketType === 'stumped') && (
          <>
            <Text
              style={[styles.sheetLabel, {color: colors.textSecondary}]}>
              {t('cricket.selectFielder')}
            </Text>
            <ScrollView horizontal style={styles.playerPicker}>
              {bowlingTeamPlayers.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.chipBtn,
                    {
                      backgroundColor:
                        selectedFielder === p.id
                          ? colors.primary
                          : colors.background,
                      borderColor:
                        selectedFielder === p.id
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedFielder(p.id)}>
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color:
                          selectedFielder === p.id ? '#FFF' : colors.text,
                      },
                    ]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        <Button
          title={t('common.confirm')}
          variant="danger"
          onPress={handleWicketConfirm}
          disabled={!selectedWicketType}
          style={{marginTop: scale(12)}}
        />
      </BottomSheet>

      {/* Extras BottomSheet */}
      <BottomSheet
        visible={showExtras}
        onClose={() => setShowExtras(false)}
        height={280}>
        <Text style={[styles.sheetTitle, {color: colors.text}]}>
          {selectedExtra === 'wide'
            ? t('cricket.wide')
            : selectedExtra === 'noball'
            ? t('cricket.noBall')
            : selectedExtra === 'bye'
            ? t('cricket.bye')
            : t('cricket.legBye')}{' '}
          — Additional Runs
        </Text>
        <Text style={[styles.sheetSubtext, {color: colors.textSecondary}]}>
          {selectedExtra === 'noball'
            ? 'Runs scored by batsman (1 penalty auto-added)'
            : selectedExtra === 'wide'
            ? 'Additional runs/overthrows (1 wide auto-added)'
            : 'Runs scored as byes'}
        </Text>
        <View style={styles.extraRunsRow}>
          {[0, 1, 2, 3, 4].map(r => (
            <TouchableOpacity
              key={r}
              style={[
                styles.extraRunBtn,
                {backgroundColor: colors.background, borderColor: colors.border},
              ]}
              onPress={() => handleExtraConfirm(r)}>
              <Text style={[styles.runBtnText, {color: colors.text}]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>

      <AppModal
        visible={!!errorMsg}
        title="Error"
        message={errorMsg}
        onClose={() => setErrorMsg('')}
      />

      {/* Abandon Match Confirmation */}
      <AppModal
        visible={showAbandonConfirm}
        title={t('match.abandonConfirmTitle')}
        message={t('match.abandonConfirmMessage')}
        onClose={() => setShowAbandonConfirm(false)}
        actions={[
          {text: t('common.cancel'), style: 'cancel'},
          {
            text: t('match.abandonMatch'),
            style: 'destructive',
            onPress: handleAbandonMatch,
          },
        ]}
      />

      {/* Leave Match Confirmation */}
      <AppModal
        visible={showLeaveConfirm}
        title={t('match.leaveConfirmTitle')}
        message={t('match.leaveConfirmMessage')}
        onClose={() => setShowLeaveConfirm(false)}
        actions={[
          {text: t('common.cancel'), style: 'cancel'},
          {
            text: t('match.leaveMatch'),
            onPress: handleLeaveMatch,
          },
        ]}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1},

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
    gap: scale(10),
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  headerTeams: {
    color: '#FFF',
    fontSize: scale(15),
    fontWeight: '600',
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  headerIconBtn: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: scale(8),
    paddingVertical: scale(3),
    borderRadius: scale(10),
    gap: scale(5),
  },
  livePulse: {
    width: scale(7),
    height: scale(7),
    borderRadius: scale(4),
    backgroundColor: '#FF4444',
  },
  liveText: {
    color: '#FFF',
    fontSize: scale(10),
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Scroll
  scrollView: {flex: 1},
  scroll: {padding: scale(12), paddingBottom: scale(24)},

  // Score Card
  scoreCard: {
    borderRadius: scale(12),
    padding: scale(14),
    marginBottom: scale(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  inningsIndicator: {
    width: scale(4),
    height: scale(20),
    borderRadius: scale(2),
  },
  teamLabel: {fontSize: scale(14), fontWeight: '600'},
  inningsBadge: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(2),
    borderRadius: scale(8),
  },
  inningsBadgeText: {
    fontSize: scale(11),
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: scale(8),
    marginTop: scale(2),
  },
  scoreText: {fontSize: scale(36), fontWeight: '800', letterSpacing: -1},
  oversTextBig: {fontSize: scale(15), fontWeight: '500'},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginTop: scale(6),
    flexWrap: 'wrap',
  },
  rrBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(10),
  },
  infoText: {fontSize: scale(12), fontWeight: '600'},
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(10),
    gap: scale(4),
  },
  targetText: {fontSize: scale(12), fontWeight: '600'},
  divider: {height: 1, marginVertical: scale(8)},

  // Stats table
  statsSection: {gap: scale(4)},
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: scale(24),
  },
  statsHeaderLabel: {
    fontSize: scale(11),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  statsValues: {
    flexDirection: 'row',
    width: scale(190),
    justifyContent: 'space-between',
  },
  statsHeader: {
    fontSize: scale(11),
    fontWeight: '600',
    width: scale(34),
    textAlign: 'center',
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    flex: 1,
    minWidth: 0,
  },
  playerName: {fontSize: scale(13), fontWeight: '500', flexShrink: 1},
  statValue: {
    fontSize: scale(13),
    width: scale(34),
    textAlign: 'center',
  },
  statBold: {fontWeight: '700'},
  partnershipText: {
    fontSize: scale(12),
    textAlign: 'center',
  },

  // Over Strip
  overStripContainer: {
    borderRadius: scale(12),
    padding: scale(12),
    marginBottom: scale(10),
    borderWidth: 1,
  },
  overLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: scale(10),
  },
  overBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(3),
    borderRadius: scale(8),
  },
  overBadgeText: {
    fontSize: scale(12),
    fontWeight: '700',
  },
  overBalls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  ballDot: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ballDotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  ballText: {fontSize: scale(12), fontWeight: '700'},
  overRuns: {fontSize: scale(12), fontWeight: '500'},

  // Break / Result / Lineup cards
  breakCard: {marginVertical: scale(12), alignItems: 'center', gap: scale(6)},
  breakText: {fontSize: scale(18), fontWeight: '700'},
  breakScore: {fontSize: scale(14)},
  breakSubtext: {fontSize: scale(13), marginTop: scale(4)},
  resultCard: {marginVertical: scale(12), alignItems: 'center', gap: scale(8)},
  resultText: {
    fontSize: scale(16),
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: scale(8),
  },
  lineupCard: {
    marginVertical: scale(12),
    alignItems: 'center',
    gap: scale(6),
  },
  lineupTitle: {fontSize: scale(16), fontWeight: '600'},
  lineupSubtext: {fontSize: scale(13), textAlign: 'center'},

  // Commentary
  commentarySection: {marginTop: scale(4)},
  commentaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  commentaryTitle: {fontSize: scale(15), fontWeight: '600'},
  commentaryCount: {fontSize: scale(12)},

  // ─── Fixed Bottom Scoring Panel ────────────────────────────────────────
  scoringPanel: {
    paddingTop: scale(10),
    paddingHorizontal: scale(12),
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  runsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: scale(8),
    gap: scale(6),
  },
  runBtn: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: scale(56),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  runBtnText: {fontSize: scale(22), fontWeight: '800'},
  runBtnLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: scale(8),
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: -scale(2),
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  extraChip: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  extraChipText: {fontSize: scale(12), fontWeight: '700'},
  swapBtn: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(7),
    borderRadius: scale(8),
    borderWidth: 1,
    marginLeft: 'auto',
  },
  wicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    gap: scale(4),
    elevation: 2,
    shadowColor: '#D32F2F',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  wicketBtnText: {color: '#FFF', fontSize: scale(12), fontWeight: '800', letterSpacing: 0.5},

  // ─── Bottom Sheet Shared ───────────────────────────────────────────────
  sheetTitle: {
    fontSize: scale(18),
    fontWeight: '700',
    marginBottom: scale(10),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: scale(6),
  },
  sheetSubtext: {
    fontSize: scale(13),
    marginBottom: scale(12),
  },
  sheetLabel: {
    fontSize: scale(13),
    fontWeight: '500',
    marginBottom: scale(8),
    marginTop: scale(8),
  },
  playerPicker: {marginBottom: scale(4)},
  chipBtn: {
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    marginRight: scale(8),
    borderWidth: 1.5,
  },
  chipText: {fontSize: scale(13), fontWeight: '600'},

  // Player selection list (new batsman / new bowler)
  playerList: {gap: scale(6)},
  playerOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(12),
    borderRadius: scale(10),
    borderWidth: 1,
    gap: scale(10),
  },
  playerAvatar: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {fontSize: scale(15), fontWeight: '700'},
  playerOptionText: {fontSize: scale(15), fontWeight: '500', flex: 1},
  bowlerMiniStats: {fontSize: scale(12), marginTop: scale(1)},
  noPlayers: {
    textAlign: 'center',
    paddingVertical: scale(20),
    fontSize: scale(14),
  },

  // Wicket type grid
  wicketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
    marginBottom: scale(8),
  },
  wicketTypeBtn: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(10),
    borderWidth: 1.5,
    minWidth: scale(80),
    alignItems: 'center',
  },
  wicketTypeText: {fontSize: scale(13), fontWeight: '600'},

  // Extra runs
  extraRunsRow: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: scale(8),
  },
  extraRunBtn: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
