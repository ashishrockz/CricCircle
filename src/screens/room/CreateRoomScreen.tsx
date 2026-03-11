import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import FeatherIcon from '@react-native-vector-icons/feather';
import type {HomeStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useSportTypeStore} from '../../stores/sportType.store';
import {useConfigStore} from '../../stores/config.store';
import {roomService} from '../../services/room.service';
import {scale} from '../../utils/responsive';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import AppModal from '../../components/ui/AppModal';
import ScreenHeader from '../../components/ScreenHeader';

type Props = NativeStackScreenProps<HomeStackParams, 'CreateRoom'>;

const OVERS_PRESETS = [5, 10, 15, 20];

export default function CreateRoomScreen({navigation}: Props) {
  const {colors, borderRadius} = useTheme();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const sportType = useSportTypeStore(s => s.sportType);
  const sportTypeId = useSportTypeStore(s => s.sportTypeId);
  const {minOvers, maxOvers} = useConfigStore(s => s.config.settings);

  const [name, setName] = useState('');
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const defaultOvers = sportType?.config?.oversPerInnings || 20;
  const [overs, setOvers] = useState(String(defaultOvers));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const showError = (msg: string) => setErrorMsg(msg);

  const handleCreate = async () => {
    if (!name.trim()) {
      showError(t('room.roomNamePlaceholder'));
      return;
    }
    if (!sportTypeId) {
      showError('Sport type not loaded');
      return;
    }
    const oversNum = parseInt(overs, 10);
    if (isNaN(oversNum) || oversNum < minOvers || oversNum > maxOvers) {
      showError(`Overs must be between ${minOvers} and ${maxOvers}`);
      return;
    }
    setLoading(true);
    try {
      const room = await roomService.createRoom({
        name: name.trim(),
        sportTypeId,
        teamAName: teamAName.trim() || undefined,
        teamBName: teamBName.trim() || undefined,
        oversPerInnings: oversNum,
        matchType: 'local',
      });
      const parent = navigation.getParent();
      parent?.navigate('RoomsTab', {
        screen: 'RoomDetail',
        params: {roomId: room.id},
      });
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const selectOversPreset = (val: number) => {
    if (val >= minOvers && val <= maxOvers) {
      setOvers(String(val));
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title={t('room.create')} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {paddingBottom: insets.bottom + scale(24)},
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Sport Info Header */}
        {sportType && (
          <Card style={styles.sportCard} elevation={2}>
            <View style={styles.sportHeader}>
              <View
                style={[
                  styles.sportIconCircle,
                  {backgroundColor: colors.primary + '15'},
                ]}>
                <FeatherIcon
                  name="target"
                  size={scale(22)}
                  color={colors.primary}
                />
              </View>
              <View style={styles.sportInfo}>
                <Text style={[styles.sportName, {color: colors.text}]}>
                  {sportType.name}
                </Text>
                <Text style={[styles.sportMeta, {color: colors.textSecondary}]}>
                  {sportType.config.teamSize}v{sportType.config.teamSize}
                  {'  |  '}
                  {sportType.config.oversPerInnings} overs
                  {'  |  '}
                  {sportType.config.minPlayers}-{sportType.config.maxPlayers}{' '}
                  players
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Section: Match Name */}
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          Match Details
        </Text>

        <Card style={styles.formCard} elevation={1}>
          <Input
            label={t('room.roomName')}
            placeholder={t('room.roomNamePlaceholder')}
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </Card>

        {/* Section: Teams */}
        <Text style={[styles.sectionTitle, {color: colors.text}]}>Teams</Text>

        <Card style={styles.formCard} elevation={1}>
          <View style={styles.teamRow}>
            {/* Team A */}
            <View style={styles.teamColumn}>
              <View style={styles.teamHeader}>
                <View
                  style={[styles.teamDot, {backgroundColor: colors.info}]}
                />
                <Text style={[styles.teamLabel, {color: colors.text}]}>
                  {t('room.teamA')}
                </Text>
              </View>
              <Input
                placeholder="Team A"
                value={teamAName}
                onChangeText={setTeamAName}
                maxLength={30}
              />
            </View>

            {/* VS Divider */}
            <View style={styles.vsDivider}>
              <View style={[styles.vsCircle, {backgroundColor: colors.border}]}>
                <Text style={[styles.vsText, {color: colors.textSecondary}]}>
                  VS
                </Text>
              </View>
            </View>

            {/* Team B */}
            <View style={styles.teamColumn}>
              <View style={styles.teamHeader}>
                <View
                  style={[styles.teamDot, {backgroundColor: colors.warning}]}
                />
                <Text style={[styles.teamLabel, {color: colors.text}]}>
                  {t('room.teamB')}
                </Text>
              </View>
              <Input
                placeholder="Team B"
                value={teamBName}
                onChangeText={setTeamBName}
                maxLength={30}
              />
            </View>
          </View>
        </Card>

        {/* Section: Overs */}
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          {t('room.overs')}
        </Text>

        <Card style={styles.formCard} elevation={1}>
          {/* Quick select chips */}
          <View style={styles.oversChips}>
            {OVERS_PRESETS.filter(v => v >= minOvers && v <= maxOvers).map(
              val => {
                const isSelected = overs === String(val);
                return (
                  <TouchableOpacity
                    key={val}
                    onPress={() => selectOversPreset(val)}
                    activeOpacity={0.7}
                    style={[
                      styles.oversChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surface,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                        borderRadius: borderRadius.lg,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.oversChipText,
                        {
                          color: isSelected ? colors.textInverse : colors.text,
                        },
                      ]}>
                      {val}
                    </Text>
                    <Text
                      style={[
                        styles.oversChipLabel,
                        {
                          color: isSelected
                            ? colors.textInverse + 'CC'
                            : colors.textSecondary,
                        },
                      ]}>
                      overs
                    </Text>
                  </TouchableOpacity>
                );
              },
            )}
          </View>

          {/* Custom overs input */}
          <View style={styles.customOversRow}>
            <Text
              style={[styles.customOversLabel, {color: colors.textSecondary}]}>
              Or enter custom:
            </Text>
            <View style={styles.customOversInput}>
              <Input
                placeholder={`${minOvers}-${maxOvers}`}
                value={overs}
                onChangeText={setOvers}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
        </Card>

        {/* Create Button */}
        <View style={styles.createBtnContainer}>
          <Button
            title={t('room.create')}
            onPress={handleCreate}
            loading={loading}
          />
        </View>
      </ScrollView>

      <AppModal
        visible={!!errorMsg}
        title={t('common.error')}
        message={errorMsg}
        onClose={() => setErrorMsg('')}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: scale(16),
  },
  sportCard: {
    marginBottom: scale(24),
  },
  sportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(14),
  },
  sportIconCircle: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportInfo: {
    flex: 1,
  },
  sportName: {
    fontSize: scale(18),
    fontWeight: '700',
  },
  sportMeta: {
    fontSize: scale(13),
    marginTop: scale(2),
  },
  sectionTitle: {
    fontSize: scale(15),
    fontWeight: '600',
    marginBottom: scale(10),
    marginLeft: scale(4),
  },
  formCard: {
    marginBottom: scale(20),
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  teamColumn: {
    flex: 1,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: scale(8),
  },
  teamDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
  },
  teamLabel: {
    fontSize: scale(14),
    fontWeight: '600',
  },
  vsDivider: {
    width: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: scale(28),
  },
  vsCircle: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: scale(11),
    fontWeight: '700',
  },
  oversChips: {
    flexDirection: 'row',
    gap: scale(10),
    marginBottom: scale(16),
  },
  oversChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(14),
    borderWidth: 1.5,
  },
  oversChipText: {
    fontSize: scale(20),
    fontWeight: '700',
  },
  oversChipLabel: {
    fontSize: scale(11),
    marginTop: scale(2),
  },
  customOversRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  customOversLabel: {
    fontSize: scale(13),
    flex: 1,
  },
  customOversInput: {
    width: scale(90),
  },
  createBtnContainer: {
    marginTop: scale(8),
  },
});
