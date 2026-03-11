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
      {/* Match Title */}
      <Text style={[styles.matchTitle, {color: colors.text}]}>
        {match.teamA.name} vs {match.teamB.name}
      </Text>

      {/* Result Banner */}
      {(() => {
        const resultText = getResultText(
          match.result,
          match.teamA.name,
          match.teamB.name,
        );
        return resultText ? (
          <Card style={styles.resultCard}>
            <Text style={[styles.resultText, {color: colors.primary}]}>
              {resultText}
            </Text>
          </Card>
        ) : null;
      })()}

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
                {backgroundColor: colors.surface, borderColor: colors.border},
              ]}
              activeOpacity={0.7}>
              <Text style={[styles.inningsHeaderText, {color: colors.text}]}>
                {teamName} {formatScore(inn.totalRuns, inn.totalWickets)} (
                {formatOvers(inn.completedOvers)} Ov)
              </Text>
              <FeatherIcon
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={scale(20)}
                color={colors.textSecondary}
              />
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
      <Text style={[styles.tableTitle, {color: colors.text}]}>
        {t('cricket.batting')}
      </Text>
      <View style={styles.tableHeader}>
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
      <Text style={[styles.tableTitle, styles.bowlingTitle, {color: colors.text}]}>
        {t('cricket.bowling')}
      </Text>
      <View style={styles.tableHeader}>
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
          <Text style={[styles.fowText, {color: colors.text}]}>
            {fallOfWickets
              .map(
                f =>
                  `${f.score}-${f.wicketNumber} (${f.batsmanName}, ${f.overNumber} ov)`,
              )
              .join(', ')}
          </Text>
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
              <View style={[styles.partnershipBar, {backgroundColor: colors.divider}]}>
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
  matchTitle: {
    fontSize: scale(18),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: scale(12),
  },
  resultCard: {marginBottom: scale(16), alignItems: 'center'},
  resultText: {fontSize: scale(16), fontWeight: '600', textAlign: 'center'},
  inningsSection: {marginBottom: scale(12)},
  inningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    borderRadius: scale(10),
    borderWidth: 1,
  },
  inningsHeaderText: {fontSize: scale(15), fontWeight: '600', flex: 1},
  inningsContent: {marginTop: scale(4), paddingHorizontal: 0},
  tableTitle: {
    fontSize: scale(15),
    fontWeight: '600',
    paddingHorizontal: scale(12),
    marginBottom: scale(8),
    marginTop: scale(4),
  },
  bowlingTitle: {marginTop: scale(16)},
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: scale(6),
    paddingHorizontal: scale(12),
  },
  headerCell: {
    flex: 0.7,
    fontSize: scale(12),
    fontWeight: '600',
    textAlign: 'center',
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
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderTopWidth: 0.5,
  },
  fowTitle: {
    fontSize: scale(13),
    fontWeight: '600',
    marginBottom: scale(4),
  },
  fowText: {fontSize: scale(12), lineHeight: scale(18)},

  // Partnerships
  partnershipsSection: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderTopWidth: 0.5,
  },
  partnershipRow: {
    marginBottom: scale(8),
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
    paddingHorizontal: scale(12),
    paddingVertical: scale(10),
    borderTopWidth: 0.5,
  },
  oversToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scale(4),
  },
  overSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(6),
    borderBottomWidth: 0.5,
    gap: scale(4),
  },
  overNumCol: {
    width: scale(28),
  },
  overNum: {
    fontSize: scale(12),
    fontWeight: '600',
    textAlign: 'center',
  },
  overBowlerCol: {
    width: scale(70),
  },
  overBowler: {
    fontSize: scale(11),
  },
  overBallsCol: {
    flex: 1,
    flexDirection: 'row',
  },
  overBallDot: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(3),
  },
  overBallText: {
    fontSize: scale(10),
    fontWeight: '700',
  },
  overRuns: {
    width: scale(24),
    fontSize: scale(12),
    fontWeight: '700',
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
