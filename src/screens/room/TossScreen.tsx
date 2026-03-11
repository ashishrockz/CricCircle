import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
  ScrollView,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MDIcon from '@react-native-vector-icons/material-design-icons';
import FeatherIcon from '@react-native-vector-icons/feather';
import type {RoomStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useRoomStore} from '../../stores/room.store';
import {roomService} from '../../services/room.service';
import {scale} from '../../utils/responsive';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AppModal from '../../components/ui/AppModal';
import ScreenHeader from '../../components/ScreenHeader';

type Props = NativeStackScreenProps<RoomStackParams, 'Toss'>;

const COIN_SIZE = scale(140);
const COIN_BORDER = scale(6);

export default function TossScreen({navigation, route}: Props) {
  const {roomId} = route.params;
  const {colors, borderRadius} = useTheme();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {currentRoom, setCurrentRoom} = useRoomStore();

  const [callerTeam, setCallerTeam] = useState<'A' | 'B' | null>(null);
  const [call, setCall] = useState<'heads' | 'tails' | null>(null);
  const [loading, setLoading] = useState(false);
  const [tossResult, setTossResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [flipPhase, setFlipPhase] = useState<
    'idle' | 'flipping' | 'result'
  >('idle');

  const flipAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const resultFadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  const teamAName = currentRoom?.teamAName || t('room.teamA');
  const teamBName = currentRoom?.teamBName || t('room.teamB');

  const getTeamName = (team: 'A' | 'B') =>
    team === 'A' ? teamAName : teamBName;

  const showError = (msg: string) => setErrorMsg(msg);

  // Animate result entrance
  useEffect(() => {
    if (tossResult && flipPhase === 'result') {
      Animated.parallel([
        Animated.timing(resultFadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(confettiAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [tossResult, flipPhase, resultFadeAnim, confettiAnim]);

  const handleFlip = async () => {
    if (!callerTeam || !call) {
      showError('Please select a team and call');
      return;
    }
    setLoading(true);
    setFlipPhase('flipping');

    // Reset animations
    flipAnim.setValue(0);
    bounceAnim.setValue(0);
    scaleAnim.setValue(1);

    // 3D coin flip: multiple rotations with bounce
    Animated.sequence([
      // Coin rises up
      Animated.parallel([
        Animated.timing(bounceAnim, {
          toValue: -scale(80),
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Fast spinning in the air
      Animated.parallel([
        Animated.timing(flipAnim, {
          toValue: 8, // 8 half-rotations = 4 full flips
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -scale(120),
            duration: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
        ]),
      ]),
      // Settle back
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        // Final half-rotation to land on correct side
        Animated.timing(flipAnim, {
          toValue: 10, // lands flat
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    try {
      const room = await roomService.performToss(roomId, {
        call,
        callerTeam,
      });
      setCurrentRoom(room);

      // Delay result reveal slightly for dramatic effect
      setTimeout(() => {
        setTossResult(room.toss);
        setFlipPhase('result');
        setLoading(false);
      }, 1800);
    } catch (err: any) {
      setFlipPhase('idle');
      showError(err.response?.data?.message || 'Toss failed');
      setLoading(false);
    }
  };

  const handleChoice = async (choice: string) => {
    setLoading(true);
    try {
      const room = await roomService.tossChoice(roomId, {choice});
      setCurrentRoom(room);
      setTossResult(room.toss);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to set choice');
    } finally {
      setLoading(false);
    }
  };

  const winnerName = tossResult ? getTeamName(tossResult.winnerTeam) : '';
  const loserName = tossResult
    ? getTeamName(tossResult.winnerTeam === 'A' ? 'B' : 'A')
    : '';

  // Interpolate rotation for 3D flip effect
  const rotateY = flipAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    outputRange: [
      '0deg',
      '180deg',
      '360deg',
      '540deg',
      '720deg',
      '900deg',
      '1080deg',
      '1260deg',
      '1440deg',
      '1620deg',
      '1800deg',
    ],
  });

  // Show heads face when rotation is near 0/360 degrees, tails when near 180
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.25, 0.75, 1, 1.25, 1.75, 2],
    outputRange: [1, 0, 0, 1, 0, 0, 1],
    extrapolate: 'extend',
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.25, 0.75, 1, 1.25, 1.75, 2],
    outputRange: [0, 1, 1, 0, 1, 1, 0],
    extrapolate: 'extend',
  });

  const renderCoin = () => (
    <View style={styles.coinWrapper}>
      <Animated.View
        style={[
          styles.coinShadow,
          {
            transform: [{translateY: bounceAnim}, {scaleX: scaleAnim}],
            opacity: scaleAnim.interpolate({
              inputRange: [0.85, 1],
              outputRange: [0.2, 0.4],
            }),
          },
        ]}
      />
      <Animated.View
        style={[
          styles.coinContainer,
          {
            transform: [
              {perspective: 800},
              {translateY: bounceAnim},
              {rotateY},
              {scale: scaleAnim},
            ],
          },
        ]}>
        {/* Heads face */}
        <Animated.View
          style={[
            styles.coin,
            {
              backgroundColor: '#FFD700',
              borderColor: '#DAA520',
              opacity: frontOpacity,
            },
          ]}>
          <View style={[styles.coinInner, {backgroundColor: '#FFC107'}]}>
            <MDIcon name="crown" size={scale(44)} color="#B8860B" />
            <Text style={styles.coinFaceText}>HEADS</Text>
          </View>
        </Animated.View>
        {/* Tails face */}
        <Animated.View
          style={[
            styles.coin,
            styles.coinBack,
            {
              backgroundColor: '#FFD700',
              borderColor: '#DAA520',
              opacity: backOpacity,
            },
          ]}>
          <View style={[styles.coinInner, {backgroundColor: '#FFC107'}]}>
            <MDIcon name="shield-crown" size={scale(44)} color="#B8860B" />
            <Text style={styles.coinFaceText}>TAILS</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );

  const renderStep1 = () => (
    <>
      {/* Select Calling Team */}
      <Card style={styles.sectionCard} elevation={1}>
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionIconCircle,
              {backgroundColor: colors.primary + '15'},
            ]}>
            <FeatherIcon
              name="users"
              size={scale(18)}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            {t('toss.selectCaller')}
          </Text>
        </View>
        <View style={styles.teamRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCallerTeam('A')}
            style={[
              styles.teamCard,
              {
                backgroundColor:
                  callerTeam === 'A' ? colors.info + '15' : colors.background,
                borderColor:
                  callerTeam === 'A' ? colors.info : colors.border,
                borderRadius: borderRadius.lg,
              },
            ]}>
            <View
              style={[
                styles.teamIndicator,
                {
                  backgroundColor:
                    callerTeam === 'A' ? colors.info : colors.border,
                },
              ]}
            />
            <Text
              style={[
                styles.teamName,
                {
                  color: callerTeam === 'A' ? colors.info : colors.text,
                },
              ]}
              numberOfLines={1}>
              {teamAName}
            </Text>
            {callerTeam === 'A' && (
              <FeatherIcon
                name="check-circle"
                size={scale(18)}
                color={colors.info}
              />
            )}
          </TouchableOpacity>

          <View style={styles.vsContainer}>
            <Text style={[styles.vsLabel, {color: colors.textSecondary}]}>
              VS
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCallerTeam('B')}
            style={[
              styles.teamCard,
              {
                backgroundColor:
                  callerTeam === 'B'
                    ? colors.warning + '15'
                    : colors.background,
                borderColor:
                  callerTeam === 'B' ? colors.warning : colors.border,
                borderRadius: borderRadius.lg,
              },
            ]}>
            <View
              style={[
                styles.teamIndicator,
                {
                  backgroundColor:
                    callerTeam === 'B' ? colors.warning : colors.border,
                },
              ]}
            />
            <Text
              style={[
                styles.teamName,
                {
                  color:
                    callerTeam === 'B' ? colors.warning : colors.text,
                },
              ]}
              numberOfLines={1}>
              {teamBName}
            </Text>
            {callerTeam === 'B' && (
              <FeatherIcon
                name="check-circle"
                size={scale(18)}
                color={colors.warning}
              />
            )}
          </TouchableOpacity>
        </View>
      </Card>

      {/* Call Selection */}
      <Card style={styles.sectionCard} elevation={1}>
        <View style={styles.sectionHeader}>
          <View
            style={[
              styles.sectionIconCircle,
              {backgroundColor: colors.accent + '15'},
            ]}>
            <MDIcon
              name="coin"
              size={scale(18)}
              color={colors.accent}
            />
          </View>
          <Text style={[styles.sectionTitle, {color: colors.text}]}>
            {t('toss.call')}
          </Text>
        </View>
        <View style={styles.callRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCall('heads')}
            style={[
              styles.callCard,
              {
                backgroundColor:
                  call === 'heads' ? '#FFF8E1' : colors.background,
                borderColor: call === 'heads' ? '#FFD700' : colors.border,
                borderRadius: borderRadius.lg,
              },
            ]}>
            <View
              style={[
                styles.miniCoin,
                {
                  backgroundColor:
                    call === 'heads' ? '#FFD700' : colors.border + '80',
                },
              ]}>
              <MDIcon
                name="crown"
                size={scale(24)}
                color={call === 'heads' ? '#B8860B' : colors.textSecondary}
              />
            </View>
            <Text
              style={[
                styles.callText,
                {
                  color: call === 'heads' ? '#B8860B' : colors.text,
                  fontWeight: call === 'heads' ? '700' : '500',
                },
              ]}>
              {t('toss.heads')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setCall('tails')}
            style={[
              styles.callCard,
              {
                backgroundColor:
                  call === 'tails' ? '#FFF8E1' : colors.background,
                borderColor: call === 'tails' ? '#FFD700' : colors.border,
                borderRadius: borderRadius.lg,
              },
            ]}>
            <View
              style={[
                styles.miniCoin,
                {
                  backgroundColor:
                    call === 'tails' ? '#FFD700' : colors.border + '80',
                },
              ]}>
              <MDIcon
                name="shield-crown"
                size={scale(24)}
                color={call === 'tails' ? '#B8860B' : colors.textSecondary}
              />
            </View>
            <Text
              style={[
                styles.callText,
                {
                  color: call === 'tails' ? '#B8860B' : colors.text,
                  fontWeight: call === 'tails' ? '700' : '500',
                },
              ]}>
              {t('toss.tails')}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Flip Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleFlip}
        disabled={!callerTeam || !call || loading}
        style={[
          styles.flipButton,
          {
            backgroundColor:
              !callerTeam || !call ? colors.border : colors.primary,
            borderRadius: borderRadius.xl,
          },
        ]}>
        <MDIcon name="rotate-3d-variant" size={scale(22)} color="#FFF" />
        <Text style={styles.flipButtonText}>Flip the Coin!</Text>
      </TouchableOpacity>
    </>
  );

  const renderWinnerResult = () => {
    if (!tossResult) return null;

    const isWinnerTeamA = tossResult.winnerTeam === 'A';
    const winnerColor = isWinnerTeamA ? colors.info : colors.warning;

    return (
      <Animated.View
        style={[
          styles.resultContainer,
          {
            opacity: resultFadeAnim,
            transform: [
              {
                translateY: resultFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [scale(30), 0],
                }),
              },
            ],
          },
        ]}>
        {/* Toss info pill */}
        <View
          style={[
            styles.tossInfoPill,
            {backgroundColor: colors.surface, borderColor: colors.border},
          ]}>
          <Text style={[styles.tossInfoText, {color: colors.textSecondary}]}>
            Coin landed on{' '}
            <Text style={{fontWeight: '700', color: colors.text}}>
              {tossResult.coinResult.toUpperCase()}
            </Text>
            {'  •  '}
            {getTeamName(tossResult.callerTeam)} called{' '}
            <Text style={{fontWeight: '700', color: colors.text}}>
              {tossResult.call.toUpperCase()}
            </Text>
          </Text>
        </View>

        {/* Winner Card */}
        <Card style={styles.winnerCard} elevation={3}>
          <Animated.View
            style={[
              styles.trophyCircle,
              {
                backgroundColor: '#FFD700' + '20',
                transform: [
                  {
                    scale: confettiAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.5, 1.15, 1],
                    }),
                  },
                ],
              },
            ]}>
            <MDIcon name="trophy" size={scale(36)} color="#FFD700" />
          </Animated.View>

          <Text style={[styles.winnerLabel, {color: colors.textSecondary}]}>
            TOSS WINNER
          </Text>
          <Text style={[styles.winnerName, {color: winnerColor}]}>
            {winnerName}
          </Text>

          {!tossResult.choice ? (
            <>
              <View
                style={[
                  styles.choiceDivider,
                  {backgroundColor: colors.divider},
                ]}
              />
              <Text
                style={[styles.chooseLabel, {color: colors.textSecondary}]}>
                {winnerName} elects to...
              </Text>
              <View style={styles.choiceRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleChoice('bat')}
                  disabled={loading}
                  style={[
                    styles.choiceCard,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: borderRadius.lg,
                    },
                  ]}>
                  <MDIcon name="cricket" size={scale(32)} color="#FFF" />
                  <Text style={styles.choiceText}>{t('toss.bat')}</Text>
                  <Text style={styles.choiceSubtext}>
                    {loserName} bowls first
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleChoice('bowl')}
                  disabled={loading}
                  style={[
                    styles.choiceCard,
                    {
                      backgroundColor: colors.accent,
                      borderRadius: borderRadius.lg,
                    },
                  ]}>
                  <MDIcon name="bowling" size={scale(32)} color="#FFF" />
                  <Text style={styles.choiceText}>{t('toss.bowl')}</Text>
                  <Text style={styles.choiceSubtext}>
                    {loserName} bats first
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.choiceBadge}>
                <MDIcon
                  name={tossResult.choice === 'bat' ? 'cricket' : 'bowling'}
                  size={scale(18)}
                  color={colors.primary}
                />
                <Text
                  style={[styles.choiceBadgeText, {color: colors.primary}]}>
                  Elected to {tossResult.choice} first
                </Text>
              </View>

              <View
                style={[
                  styles.matchupSummary,
                  {backgroundColor: colors.background, borderRadius: borderRadius.lg},
                ]}>
                <View style={styles.matchupRow}>
                  <MDIcon
                    name="cricket"
                    size={scale(16)}
                    color={colors.primary}
                  />
                  <Text style={[styles.matchupText, {color: colors.text}]}>
                    {tossResult.choice === 'bat' ? winnerName : loserName}{' '}
                    bats first
                  </Text>
                </View>
                <View style={styles.matchupRow}>
                  <MDIcon
                    name="bowling"
                    size={scale(16)}
                    color={colors.accent}
                  />
                  <Text style={[styles.matchupText, {color: colors.text}]}>
                    {tossResult.choice === 'bowl' ? winnerName : loserName}{' '}
                    bowls first
                  </Text>
                </View>
              </View>

              <Button
                title="Continue to Match"
                onPress={() => navigation.navigate('RoomDetail', {roomId})}
                style={{marginTop: scale(16), alignSelf: 'stretch'}}
              />
            </>
          )}
        </Card>
      </Animated.View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: colors.background, paddingBottom: insets.bottom},
      ]}>
      <ScreenHeader title={t('toss.title')} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Coin */}
        {renderCoin()}

        {/* Step 1: Select team & call */}
        {flipPhase !== 'result' && renderStep1()}

        {/* Result */}
        {flipPhase === 'result' && renderWinnerResult()}
      </ScrollView>

      <AppModal
        visible={!!errorMsg}
        title={t('common.error')}
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
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: scale(8),
  },
  pageTitle: {
    fontSize: scale(22),
    fontWeight: '700',
  },

  // Coin
  coinWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: COIN_SIZE + scale(100),
    marginBottom: scale(8),
  },
  coinShadow: {
    position: 'absolute',
    bottom: scale(10),
    width: COIN_SIZE * 0.7,
    height: scale(14),
    borderRadius: COIN_SIZE,
    backgroundColor: '#000',
    opacity: 0.3,
  },
  coinContainer: {
    width: COIN_SIZE,
    height: COIN_SIZE,
  },
  coin: {
    position: 'absolute',
    width: COIN_SIZE,
    height: COIN_SIZE,
    borderRadius: COIN_SIZE / 2,
    borderWidth: COIN_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#B8860B',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  coinBack: {
    backfaceVisibility: 'hidden',
  },
  coinInner: {
    width: COIN_SIZE - COIN_BORDER * 2 - scale(12),
    height: COIN_SIZE - COIN_BORDER * 2 - scale(12),
    borderRadius: (COIN_SIZE - COIN_BORDER * 2 - scale(12)) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DAA520',
    borderStyle: 'dashed',
  },
  coinFaceText: {
    color: '#B8860B',
    fontSize: scale(11),
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: scale(4),
  },

  // Sections
  sectionCard: {
    marginBottom: scale(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    marginBottom: scale(14),
  },
  sectionIconCircle: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: scale(15),
    fontWeight: '600',
  },

  // Team selection
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  teamCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(14),
    borderWidth: 2,
    gap: scale(10),
  },
  teamIndicator: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
  },
  teamName: {
    flex: 1,
    fontSize: scale(14),
    fontWeight: '600',
  },
  vsContainer: {
    width: scale(30),
    alignItems: 'center',
  },
  vsLabel: {
    fontSize: scale(12),
    fontWeight: '700',
  },

  // Call selection
  callRow: {
    flexDirection: 'row',
    gap: scale(12),
  },
  callCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: scale(18),
    borderWidth: 2,
    gap: scale(10),
  },
  miniCoin: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    alignItems: 'center',
    justifyContent: 'center',
  },
  callText: {
    fontSize: scale(14),
  },

  // Flip button
  flipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(16),
    gap: scale(10),
    marginTop: scale(4),
    marginBottom: scale(16),
  },
  flipButtonText: {
    color: '#FFF',
    fontSize: scale(17),
    fontWeight: '700',
  },

  // Result
  resultContainer: {
    marginTop: scale(8),
  },
  tossInfoPill: {
    alignSelf: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderRadius: scale(20),
    borderWidth: 1,
    marginBottom: scale(16),
  },
  tossInfoText: {
    fontSize: scale(12),
    textAlign: 'center',
  },
  winnerCard: {
    alignItems: 'center',
    paddingVertical: scale(24),
  },
  trophyCircle: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(12),
  },
  winnerLabel: {
    fontSize: scale(12),
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: scale(4),
  },
  winnerName: {
    fontSize: scale(26),
    fontWeight: '800',
    marginBottom: scale(4),
  },
  choiceDivider: {
    width: '80%',
    height: 1,
    marginVertical: scale(16),
  },
  chooseLabel: {
    fontSize: scale(14),
    marginBottom: scale(14),
  },
  choiceRow: {
    flexDirection: 'row',
    gap: scale(14),
    alignSelf: 'stretch',
  },
  choiceCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(20),
    gap: scale(6),
  },
  choiceText: {
    color: '#FFF',
    fontSize: scale(16),
    fontWeight: '700',
  },
  choiceSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: scale(11),
    marginTop: scale(2),
  },
  choiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginTop: scale(8),
    marginBottom: scale(16),
  },
  choiceBadgeText: {
    fontSize: scale(15),
    fontWeight: '600',
  },
  matchupSummary: {
    alignSelf: 'stretch',
    padding: scale(14),
    gap: scale(10),
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  matchupText: {
    fontSize: scale(14),
    fontWeight: '500',
  },
});
