import React, {useEffect, useState, useMemo, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Share,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import FeatherIcon from '@react-native-vector-icons/feather';
import type {RoomStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useMatchStore} from '../../stores/match.store';
import {useRoomStore} from '../../stores/room.store';
import {scale} from '../../utils/responsive';
import {formatScore, formatOvers, getResultText} from '../../utils/formatters';
import {
  getBattingStats,
  getBowlingStats,
  getFallOfWickets,
  getOverSummaries,
  getPartnerships,
} from '../../utils/matchStats';
import Card from '../../components/ui/Card';
import BattingCard from '../../components/BattingCard';
import BowlingCard from '../../components/BowlingCard';
import Loader from '../../components/ui/Loader';
import ScreenHeader from '../../components/ScreenHeader';
import type {Innings} from '../../models';

let ViewShot: any = null;
try {
  ViewShot = require('react-native-view-shot').default;
} catch {}

let RNShare: any = null;
try {
  RNShare = require('react-native-share').default;
} catch {}

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<RoomStackParams, 'CricbuzzScorecard'>;

export default function CricbuzzScorecardScreen({navigation, route}: Props) {
  const {matchId, roomId} = route.params;
  const {colors} = useTheme();
  const {t} = useTranslation();
  const {currentMatch, fetchMatch} = useMatchStore();
  const {currentRoom, fetchRoom} = useRoomStore();
  const viewShotRef = useRef<any>(null);

  const [expandedInnings, setExpandedInnings] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    fetchMatch(matchId);
    fetchRoom(roomId);
  }, [matchId, roomId, fetchMatch, fetchRoom]);

  const match = currentMatch;

  const getPlayerName = useMemo(() => {
    const players = currentRoom?.players || [];
    return (slotId: string): string =>
      players.find(p => p.id === slotId)?.name || 'Unknown';
  }, [currentRoom?.players]);

  const handleShareScorecard = async () => {
    if (!match) return;

    // Build text scorecard for sharing
    let text = `${match.teamA.name} vs ${match.teamB.name}\n`;
    const resultText = getResultText(
      match.result,
      match.teamA.name,
      match.teamB.name,
    );
    if (resultText) text += `${resultText}\n`;
    text += '\n';

    for (const inn of match.innings) {
      const teamName =
        inn.battingTeam === 'A' ? match.teamA.name : match.teamB.name;
      text += `${teamName}: ${formatScore(inn.totalRuns, inn.totalWickets)} (${formatOvers(inn.completedOvers)} ov)\n`;

      const batting = getBattingStats(inn, getPlayerName);
      for (const b of batting) {
        const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
        text += `  ${b.name}${b.out ? ` (${b.out})` : '*'}: ${b.runs}(${b.balls}) 4s:${b.fours} 6s:${b.sixes} SR:${sr}\n`;
      }
      text += '\n';
    }

    text += 'Shared via CricCircle';

    // Try image capture first, fall back to text
    if (ViewShot && viewShotRef.current && RNShare) {
      try {
        const uri = await viewShotRef.current.capture();
        await RNShare.open({
          url: uri,
          title: t('match.shareScorecard'),
          message: text,
          type: 'image/png',
        });
        return;
      } catch {}
    }

    // Fallback to text share
    try {
      await Share.share({message: text, title: t('match.shareScorecard')});
    } catch {}
  };

  if (!match || !currentRoom) return <Loader />;

  const toggleInnings = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedInnings(prev => ({...prev, [index]: !prev[index]}));
  };

  const getTeamName = (inn: Innings) =>
    inn.battingTeam === 'A' ? match.teamA.name : match.teamB.name;

  const ScorecardContent = (
    <>
      {/* Match Header Card */}
      <Card style={StyleSheet.flatten([styles.headerCard, {backgroundColor: colors.surface}])}>
        <Text style={[styles.matchTitle, {color: colors.text}]}>
          {match.teamA.name} <Text style={{color: colors.primary}}>vs</Text> {match.teamB.name}
        </Text>

        {/* Result Banner */}
        {(() => {
          const resultText = getResultText(
            match.result,
            match.teamA.name,
            match.teamB.name,
          );
          return resultText ? (
            <View style={[styles.resultBadge, {backgroundColor: colors.primary + '15'}]}>
              <Text style={[styles.resultText, {color: colors.primary}]}>
                {resultText}
              </Text>
            </View>
          ) : null;
        })()}
      </Card>

      {/* Innings Sections */}
      {match.innings.map((inn, index) => {
        const isExpanded = expandedInnings[index] ?? false;
        const teamName = getTeamName(inn);

        return (
          <View key={index} style={styles.inningsSection}>
            {/* Collapsible Header */}
            <TouchableOpacity
              onPress={() => toggleInnings(index)}
              style={[
                styles.inningsHeader,
                {backgroundColor: colors.surface, borderLeftColor: colors.primary},
                isExpanded && styles.inningsHeaderExpanded
              ]}
              activeOpacity={0.8}>
              <View style={styles.inningsHeaderTitleContainer}>
                <Text style={[styles.inningsTeamName, {color: colors.text}]}>
                  {teamName}
                </Text>
                <Text style={[styles.inningsScore, {color: colors.text}]}>
                  {formatScore(inn.totalRuns, inn.totalWickets)} <Text style={[styles.inningsOvers, {color: colors.textSecondary}]}>({formatOvers(inn.completedOvers)} Ov)</Text>
                </Text>
              </View>
              <View style={[styles.iconCircle, {backgroundColor: colors.background}]}>
                <FeatherIcon
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={scale(18)}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>

            {/* Expanded Content */}
            {isExpanded && (
              <InningsDetail
                innings={inn}
                getPlayerName={getPlayerName}
                colors={colors}
                t={t}
              />
            )}
          </View>
        );
      })}

      {/* No innings data */}
      {match.innings.length === 0 && (
        <Text
          style={[
            styles.noData,
            {color: colors.textSecondary},
          ]}>
          {t('common.noData')}
        </Text>
      )}
    </>
  );

  return (
    <View style={[{flex: 1, backgroundColor: colors.background}]}>
    <ScreenHeader
      title={t('cricket.scorecard')}
      onBack={() =>
        navigation.getParent()?.navigate('RoomsTab', {screen: 'RoomList'})
      }
    />
    <ScrollView
      style={[styles.container]}
      contentContainerStyle={styles.scroll}>
      {ViewShot ? (
        <ViewShot
          ref={viewShotRef}
          options={{format: 'png', quality: 0.9}}
          style={{backgroundColor: colors.background}}>
          {ScorecardContent}
        </ViewShot>
      ) : (
        ScorecardContent
      )}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {/* Share */}
        <TouchableOpacity
          onPress={handleShareScorecard}
          style={[styles.actionBtn, {backgroundColor: colors.primary}]}>
          <FeatherIcon name="share-2" size={scale(16)} color="#FFF" />
          <Text style={styles.actionBtnText}>{t('match.shareScorecard')}</Text>
        </TouchableOpacity>

        {/* Commentary */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Commentary', {matchId})}
          style={[
            styles.actionBtn,
            {backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border},
          ]}>
          <FeatherIcon name="message-circle" size={scale(16)} color={colors.primary} />
          <Text style={[styles.actionBtnText, {color: colors.primary}]}>
            {t('match.commentary')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  );
}

function InningsDetail({
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
  const [showOvers, setShowOvers] = useState(false);

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
  const overSummaries = useMemo(
    () => getOverSummaries(innings, getPlayerName),
    [innings, getPlayerName],
  );
  const partnerships = useMemo(
    () => getPartnerships(innings, getPlayerName),
    [innings, getPlayerName],
  );

  const totalExtras =
    innings.extras.wide +
    innings.extras.noball +
    innings.extras.bye +
    innings.extras.legbye;

  return (
    <Card style={styles.inningsContent}>
      {/* Batting Table */}
      <View style={[styles.sectionHeaderWrap, {backgroundColor: colors.primary + '11'}]}>
        <Text style={[styles.tableTitle, {color: colors.primary}]}>
          {t('cricket.batting')}
        </Text>
      </View>
      <View style={[styles.tableHeader, {borderBottomColor: colors.divider, borderBottomWidth: 1}]}>
        <Text
          style={[styles.headerCell, styles.nameCell, {color: colors.textSecondary}]}>
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

      {/* Extras */}
      <View style={[styles.extrasRow, {borderTopColor: colors.divider}]}>
        <Text style={[styles.extrasLabel, {color: colors.textSecondary}]}>
          {t('cricket.extras')}
        </Text>
        <Text style={[styles.extrasValue, {color: colors.text}]}>
          {totalExtras} (W:{innings.extras.wide} Nb:{innings.extras.noball} B:
          {innings.extras.bye} Lb:{innings.extras.legbye})
        </Text>
      </View>

      {/* Total */}
      <View style={[styles.totalRow, {borderTopColor: colors.divider}]}>
        <Text style={[styles.totalLabel, {color: colors.text}]}>
          {t('cricket.total')}
        </Text>
        <Text style={[styles.totalValue, {color: colors.text}]}>
          {formatScore(innings.totalRuns, innings.totalWickets)} (
          {formatOvers(innings.completedOvers)} ov)
        </Text>
      </View>

      {/* Bowling Table */}
      <View style={[styles.sectionHeaderWrap, {backgroundColor: colors.primary + '11', marginTop: scale(8)}]}>
        <Text style={[styles.tableTitle, {color: colors.primary}]}>
          {t('cricket.bowling')}
        </Text>
      </View>
      <View style={[styles.tableHeader, {borderBottomColor: colors.divider, borderBottomWidth: 1}]}>
        <Text
          style={[styles.headerCell, styles.nameCell, {color: colors.textSecondary}]}>
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

      {/* Fall of Wickets */}
      {fallOfWickets.length > 0 && (
        <View style={[styles.fowSection, {borderTopColor: colors.divider}]}>
          <Text style={[styles.fowTitle, {color: colors.textSecondary}]}>
            {t('cricket.fallOfWickets')}
          </Text>
          <View style={styles.fowChipsContainer}>
            {fallOfWickets.map((f, idx) => (
              <View key={idx} style={[styles.fowChip, {backgroundColor: colors.surface, borderColor: colors.border}]}>
                <Text style={[styles.fowChipScore, {color: colors.text}]}>
                  {f.score}-{f.wicketNumber}
                </Text>
                <Text style={[styles.fowChipDetail, {color: colors.textSecondary}]}>
                  {f.batsmanName}, {f.overNumber}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Partnerships */}
      {partnerships.length > 0 && (
        <View style={[styles.partnershipsSection, {borderTopColor: colors.divider}]}>
          <Text style={[styles.fowTitle, {color: colors.textSecondary}]}>
            {t('match.partnerships')}
          </Text>
          {partnerships.map((p, i) => (
            <View key={i} style={styles.partnershipRow}>
              <View style={styles.partnershipInfo}>
                <Text style={[styles.partnershipWicket, {color: colors.textSecondary}]}>
                  {i < partnerships.length - 1 || innings.status === 'completed'
                    ? `${p.wicketNumber}th wkt`
                    : 'Current'}
                </Text>
                <Text style={[styles.partnershipNames, {color: colors.text}]}>
                  {p.batter1Name} & {p.batter2Name}
                </Text>
              </View>
              <View style={styles.partnershipStats}>
                <Text style={[styles.partnershipRuns, {color: colors.text}]}>
                  {p.runs}
                </Text>
                <Text style={[styles.partnershipBalls, {color: colors.textSecondary}]}>
                  ({p.balls})
                </Text>
              </View>
              {/* Partnership bar */}
              <View style={[styles.partnershipBar, {backgroundColor: colors.border}]}>
                <View
                  style={[
                    styles.partnershipBarFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.min(100, (p.runs / Math.max(innings.totalRuns, 1)) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Over-by-Over Summary */}
      {overSummaries.length > 0 && (
        <View style={[styles.oversSection, {borderTopColor: colors.divider}]}>
          <TouchableOpacity
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setShowOvers(!showOvers);
            }}
            style={styles.oversToggle}>
            <Text style={[styles.fowTitle, {color: colors.textSecondary}]}>
              {t('match.overByOver')}
            </Text>
            <FeatherIcon
              name={showOvers ? 'chevron-up' : 'chevron-down'}
              size={scale(16)}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {showOvers &&
            overSummaries.map((over, i) => (
              <View
                key={i}
                style={[
                  styles.overSummaryRow,
                  {borderBottomColor: colors.divider},
                ]}>
                <View style={styles.overNumCol}>
                  <Text style={[styles.overNum, {color: colors.textSecondary}]}>
                    {over.overNumber}
                  </Text>
                </View>
                <View style={styles.overBowlerCol}>
                  <Text
                    style={[styles.overBowler, {color: colors.text}]}
                    numberOfLines={1}>
                    {over.bowlerName}
                  </Text>
                </View>
                <View style={styles.overBallsCol}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}>
                    {over.balls.map((ball, j) => {
                      let bg = 'transparent';
                      let tc = colors.text;
                      if (ball === 'W') {
                        bg = colors.wicket;
                        tc = '#FFF';
                      } else if (ball === '4') {
                        bg = colors.four;
                        tc = '#FFF';
                      } else if (ball === '6') {
                        bg = colors.six;
                        tc = '#FFF';
                      } else if (ball.includes('wd') || ball.includes('nb')) {
                        bg = colors.extra + '30';
                        tc = colors.extra;
                      }
                      return (
                        <View
                          key={j}
                          style={[styles.overBallDot, {backgroundColor: bg}]}>
                          <Text style={[styles.overBallText, {color: tc}]}>
                            {ball}
                          </Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
                <Text style={[styles.overRuns, {color: colors.text}]}>
                  {over.runs}
                </Text>
              </View>
            ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  scroll: {padding: scale(16), paddingBottom: scale(32)},
  headerCard: {
    paddingVertical: scale(20),
    paddingHorizontal: scale(16),
    marginBottom: scale(20),
    alignItems: 'center',
    borderRadius: scale(16),
  },
  matchTitle: {
    fontSize: scale(20),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: scale(12),
    letterSpacing: 0.5,
  },
  resultBadge: {
    paddingVertical: scale(6),
    paddingHorizontal: scale(16),
    borderRadius: scale(20),
  },
  resultText: {
    fontSize: scale(13),
    fontWeight: '700',
    textAlign: 'center',
  },
  inningsSection: {
    marginBottom: scale(16),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  inningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(16),
    paddingHorizontal: scale(16),
    borderRadius: scale(12),
    borderLeftWidth: 4,
  },
  inningsHeaderExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  inningsHeaderTitleContainer: {
    flex: 1,
    gap: scale(4),
  },
  inningsTeamName: {
    fontSize: scale(13),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inningsScore: {
    fontSize: scale(22),
    fontWeight: '800',
  },
  inningsOvers: {
    fontSize: scale(14),
    fontWeight: '500',
  },
  iconCircle: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  inningsContent: {
    marginTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingHorizontal: 0,
    paddingTop: 0, // removed to let section headers touch the top
    overflow: 'hidden',
  },
  sectionHeaderWrap: {
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
  },
  tableTitle: {
    fontSize: scale(14),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: scale(10),
    paddingHorizontal: scale(16),
  },
  headerCell: {
    flex: 0.7,
    fontSize: scale(11),
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  nameCell: {flex: 2, textAlign: 'left'},
  extrasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderTopWidth: 0.5,
  },
  extrasLabel: {fontSize: scale(14)},
  extrasValue: {fontSize: scale(14)},
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderTopWidth: 0.5,
  },
  totalLabel: {fontSize: scale(15), fontWeight: '700'},
  totalValue: {fontSize: scale(15), fontWeight: '700'},
  fowSection: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
    borderTopWidth: 1,
  },
  fowTitle: {
    fontSize: scale(13),
    fontWeight: '700',
    marginBottom: scale(12),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fowChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  fowChip: {
    paddingVertical: scale(6),
    paddingHorizontal: scale(10),
    borderRadius: scale(8),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fowChipScore: {
    fontSize: scale(13),
    fontWeight: '700',
  },
  fowChipDetail: {
    fontSize: scale(10),
    marginTop: scale(2),
  },

  // Partnerships
  partnershipsSection: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
    borderTopWidth: 1,
  },
  partnershipRow: {
    marginBottom: scale(12),
  },
  partnershipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: scale(2),
  },
  partnershipWicket: {
    fontSize: scale(11),
    fontWeight: '600',
    width: scale(60),
  },
  partnershipNames: {
    fontSize: scale(12),
    flex: 1,
  },
  partnershipStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: scale(4),
    marginBottom: scale(4),
    paddingLeft: scale(60),
  },
  partnershipRuns: {
    fontSize: scale(14),
    fontWeight: '700',
  },
  partnershipBalls: {
    fontSize: scale(11),
  },
  partnershipBar: {
    height: scale(4),
    borderRadius: scale(2),
    marginLeft: scale(60),
  },
  partnershipBarFill: {
    height: '100%',
    borderRadius: scale(2),
    minWidth: scale(2),
  },

  // Over-by-over
  oversSection: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(16),
    borderTopWidth: 1,
  },
  oversToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  overSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: scale(8),
  },
  overNumCol: {
    width: scale(32),
  },
  overNum: {
    fontSize: scale(13),
    fontWeight: '700',
    textAlign: 'center',
  },
  overBowlerCol: {
    width: scale(80),
  },
  overBowler: {
    fontSize: scale(12),
    fontWeight: '500',
  },
  overBallsCol: {
    flex: 1,
    flexDirection: 'row',
  },
  overBallDot: {
    width: scale(26),
    height: scale(26),
    borderRadius: scale(13),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(6),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  overBallText: {
    fontSize: scale(11),
    fontWeight: '800',
  },
  overRuns: {
    width: scale(28),
    fontSize: scale(14),
    fontWeight: '800',
    textAlign: 'right',
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: scale(10),
    marginTop: scale(12),
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(6),
    paddingVertical: scale(12),
    borderRadius: scale(10),
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: scale(13),
    fontWeight: '600',
  },

  noData: {
    fontSize: scale(14),
    textAlign: 'center',
    marginVertical: scale(24),
  },
});
