import React, {useEffect, useState, useMemo, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import type {RoomStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useMatchStore} from '../../stores/match.store';
import {useRoomStore} from '../../stores/room.store';
import {scale} from '../../utils/responsive';
import {formatScore, formatOvers, getResultText} from '../../utils/formatters';
import Card from '../../components/ui/Card';
import BattingCard from '../../components/BattingCard';
import BowlingCard from '../../components/BowlingCard';
import Loader from '../../components/ui/Loader';
import ScreenHeader from '../../components/ScreenHeader';
import {
  getBattingStats,
  getBowlingStats,
  getFallOfWickets,
  getOverSummaries,
  getPartnerships,
} from '../../utils/matchStats';
import type {Innings} from '../../models';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

type Props = NativeStackScreenProps<RoomStackParams, 'MatchDetail'>;

export default function MatchDetailScreen({navigation, route}: Props) {
  const {matchId} = route.params;
  const {colors} = useTheme();
  const {t} = useTranslation();
  const {currentMatch, fetchMatch} = useMatchStore();
  const {currentRoom} = useRoomStore();
  const pagerRef = useRef<FlatList>(null);

  const [selectedInnings, setSelectedInnings] = useState(0);

  useEffect(() => {
    if (!currentMatch || currentMatch.id !== matchId) {
      fetchMatch(matchId);
    }
  }, [matchId, currentMatch, fetchMatch]);

  const getPlayerName = useCallback(
    (slotId: string): string =>
      currentRoom?.players.find(p => p.id === slotId)?.name || 'Unknown',
    [currentRoom],
  );

  const match = currentMatch;
  if (!match) return <Loader />;

  const handleTabPress = (index: number) => {
    setSelectedInnings(index);
    pagerRef.current?.scrollToIndex({index, animated: true});
  };

  const handleSwipe = (e: any) => {
    const offset = e.nativeEvent.contentOffset.x;
    const page = Math.round(offset / (SCREEN_WIDTH - scale(32)));
    if (page !== selectedInnings && page >= 0 && page < match.innings.length) {
      setSelectedInnings(page);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScreenHeader title={t('cricket.scorecard')} />
      {/* Result */}
      {(() => {
        const resultStr = getResultText(match.result, match.teamA.name, match.teamB.name);
        return resultStr ? (
          <Card style={styles.resultCard} elevation={2}>
            <Text style={[styles.resultText, {color: colors.primary}]}>
              {resultStr}
            </Text>
          </Card>
        ) : null;
      })()}

      {/* Innings Tabs */}
      <View style={styles.tabRow}>
        {match.innings.map((inn, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => handleTabPress(i)}
            style={[
              styles.tab,
              {
                borderBottomColor:
                  selectedInnings === i ? colors.primary : 'transparent',
              },
            ]}>
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    selectedInnings === i ? colors.primary : colors.textSecondary,
                },
              ]}>
              {i === 0 ? t('cricket.firstInnings') : t('cricket.secondInnings')}
            </Text>
            <Text style={[styles.tabScore, {color: colors.text}]}>
              {formatScore(inn.totalRuns, inn.totalWickets)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Swipeable Innings Content */}
      <FlatList
        ref={pagerRef}
        data={match.innings}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleSwipe}
        keyExtractor={(_, i) => String(i)}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH - scale(32),
          offset: (SCREEN_WIDTH - scale(32)) * index,
          index,
        })}
        renderItem={({item: innings}) => (
          <InningsContent
            innings={innings}
            getPlayerName={getPlayerName}
            colors={colors}
            t={t}
          />
        )}
        style={styles.pager}
        contentContainerStyle={styles.pagerContent}
      />

      {/* Links */}
      <View style={styles.links}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Commentary', {matchId})}>
          <Text style={[styles.linkText, {color: colors.primary}]}>
            {t('match.commentary')} →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InningsContent({
  innings,
  getPlayerName,
  colors,
  t,
}: {
  innings: Innings;
  getPlayerName: (id: string) => string;
  colors: any;
  t: any;
}) {
  const battingStats = useMemo(
    () => getBattingStats(innings, getPlayerName),
    [innings, getPlayerName],
  );
  const bowlingStats = useMemo(
    () => getBowlingStats(innings, getPlayerName),
    [innings, getPlayerName],
  );
  const fallOfWickets = useMemo(
    () => getFallOfWickets(innings, getPlayerName),
    [innings, getPlayerName],
  );
  const partnerships = useMemo(
    () => getPartnerships(innings, getPlayerName),
    [innings, getPlayerName],
  );

  return (
    <ScrollView
      style={{width: SCREEN_WIDTH - scale(32)}}
      contentContainerStyle={styles.inningsScroll}
      showsVerticalScrollIndicator={false}>
      {/* Batting Table */}
      <Card style={styles.tableCard}>
        <Text style={[styles.tableTitle, {color: colors.text}]}>
          {t('cricket.batting')}
        </Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.nameCell, {color: colors.textSecondary}]}>
            Batter
          </Text>
          <Text style={[styles.headerCell, {color: colors.textSecondary}]}>R</Text>
          <Text style={[styles.headerCell, {color: colors.textSecondary}]}>B</Text>
          <Text style={[styles.headerCell, {color: colors.textSecondary}]}>4s</Text>
          <Text style={[styles.headerCell, {color: colors.textSecondary}]}>6s</Text>
          <Text style={[styles.headerCell, {color: colors.textSecondary}]}>SR</Text>
        </View>
        {battingStats.map(b => (
          <BattingCard
            key={b.id}
            name={b.name}
            runs={b.runs}
            balls={b.balls}
            fours={b.fours}
            sixes={b.sixes}
            isOut={!!b.out}
            dismissal={b.out}
          />
        ))}
        <View style={styles.extrasRow}>
          <Text style={[styles.extrasLabel, {color: colors.textSecondary}]}>
            {t('cricket.extras')}
          </Text>
          <Text style={[styles.extrasValue, {color: colors.text}]}>
            {innings.extras.wide + innings.extras.noball + innings.extras.bye + innings.extras.legbye}
            {' ('}W:{innings.extras.wide} Nb:{innings.extras.noball} B:{innings.extras.bye} Lb:{innings.extras.legbye})
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, {color: colors.text}]}>
            {t('cricket.total')}
          </Text>
          <Text style={[styles.totalValue, {color: colors.text}]}>
            {formatScore(innings.totalRuns, innings.totalWickets)} (
            {formatOvers(innings.completedOvers)} ov)
          </Text>
        </View>
      </Card>

      {/* Bowling Table */}
      <Card style={styles.tableCard}>
        <Text style={[styles.tableTitle, {color: colors.text}]}>
          {t('cricket.bowling')}
        </Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.headerCell, styles.nameCell, {color: colors.textSecondary}]}>
            Bowler
          </Text>
          <Text style={[styles.headerCell, {color: colors.textSecondary}]}>O</Text>
          <Text style={[styles.headerCell, {color: colors.textSecondary}]}>M</Text>
          <Text style={[styles.headerCell, {color: colors.textSecondary}]}>R</Text>
          <Text style={[styles.headerCell, {color: colors.textSecondary}]}>W</Text>
          <Text style={[styles.headerCell, {color: colors.textSecondary}]}>Eco</Text>
        </View>
        {bowlingStats.map(b => (
          <BowlingCard
            key={b.id}
            name={b.name}
            overs={b.overs}
            maidens={b.maidens}
            runs={b.runs}
            wickets={b.wickets}
          />
        ))}
      </Card>

      {/* Fall of Wickets */}
      {fallOfWickets.length > 0 && (
        <Card style={styles.tableCard}>
          <Text style={[styles.tableTitle, {color: colors.text}]}>
            {t('cricket.fallOfWickets')}
          </Text>
          {fallOfWickets.map((f, i) => (
            <View key={i} style={styles.fowRow}>
              <Text style={[styles.fowScore, {color: colors.text}]}>
                {f.score}-{f.wicketNumber}
              </Text>
              <Text style={[styles.fowName, {color: colors.textSecondary}]}>
                {f.batsmanName}
              </Text>
              <Text style={[styles.fowOver, {color: colors.textSecondary}]}>
                {f.overNumber} ov
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Partnerships */}
      {partnerships.length > 0 && (
        <Card style={styles.tableCard}>
          <Text style={[styles.tableTitle, {color: colors.text}]}>
            {t('match.partnerships')}
          </Text>
          {partnerships.map((p, i) => (
            <View key={i} style={styles.partnerRow}>
              <View style={styles.partnerInfo}>
                <Text style={[styles.partnerNames, {color: colors.text}]} numberOfLines={1}>
                  {p.batter1Name} & {p.batter2Name}
                </Text>
              </View>
              <View style={styles.partnerValues}>
                <Text style={[styles.partnerRuns, {color: colors.text}]}>
                  {p.runs}
                </Text>
                <Text style={[styles.partnerBalls, {color: colors.textSecondary}]}>
                  ({p.balls})
                </Text>
              </View>
              <View style={[styles.partnerBar, {backgroundColor: colors.divider}]}>
                <View
                  style={[
                    styles.partnerBarFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.min(100, (p.runs / Math.max(innings.totalRuns, 1)) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, padding: scale(16)},
  resultCard: {marginBottom: scale(16), alignItems: 'center'},
  resultText: {fontSize: scale(16), fontWeight: '600', textAlign: 'center'},
  tabRow: {flexDirection: 'row', marginBottom: scale(12), gap: scale(16)},
  tab: {flex: 1, alignItems: 'center', paddingBottom: scale(8), borderBottomWidth: 3},
  tabText: {fontSize: scale(13), fontWeight: '500'},
  tabScore: {fontSize: scale(20), fontWeight: '700', marginTop: scale(2)},
  pager: {flex: 1},
  pagerContent: {},
  inningsScroll: {paddingBottom: scale(16)},
  tableCard: {marginBottom: scale(12), paddingHorizontal: 0},
  tableTitle: {fontSize: scale(16), fontWeight: '600', paddingHorizontal: scale(12), marginBottom: scale(8)},
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: scale(6),
    paddingHorizontal: scale(12),
  },
  headerCell: {flex: 0.7, fontSize: scale(12), fontWeight: '600', textAlign: 'center'},
  nameCell: {flex: 2, textAlign: 'left'},
  extrasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
  },
  extrasLabel: {fontSize: scale(14)},
  extrasValue: {fontSize: scale(14)},
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
  },
  totalLabel: {fontSize: scale(15), fontWeight: '700'},
  totalValue: {fontSize: scale(15), fontWeight: '700'},
  links: {paddingVertical: scale(12), alignItems: 'center'},
  linkText: {fontSize: scale(15), fontWeight: '600'},

  // Fall of Wickets
  fowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    gap: scale(8),
  },
  fowScore: {fontSize: scale(14), fontWeight: '700', width: scale(50)},
  fowName: {fontSize: scale(13), flex: 1},
  fowOver: {fontSize: scale(12)},

  // Partnerships
  partnerRow: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
  },
  partnerInfo: {
    flexDirection: 'row',
    marginBottom: scale(2),
  },
  partnerNames: {fontSize: scale(13), flex: 1},
  partnerValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: scale(4),
    marginBottom: scale(4),
  },
  partnerRuns: {fontSize: scale(15), fontWeight: '700'},
  partnerBalls: {fontSize: scale(11)},
  partnerBar: {
    height: scale(4),
    borderRadius: scale(2),
  },
  partnerBarFill: {
    height: '100%',
    borderRadius: scale(2),
    minWidth: scale(2),
  },
});
