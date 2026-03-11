import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../theme';
import {scale} from '../utils/responsive';
import Button from './ui/Button';
import PlayerSlotCard from './PlayerSlotCard';
import type {PlayerSlot} from '../models';

interface TeamColumnProps {
  team: 'A' | 'B';
  teamName: string;
  players: PlayerSlot[];
  maxPerTeam: number;
  captainId: string | null;
  isCreator: boolean;
  isWaiting: boolean;
  onAdd?: () => void;
  onRemove?: (slotId: string) => void;
  onSwitchTeam?: (slotId: string) => void;
  onSetCaptain?: (slotId: string) => void;
  onSetRole?: (slotId: string) => void;
}

export default function TeamColumn({
  team,
  teamName,
  players,
  maxPerTeam,
  captainId,
  isCreator,
  isWaiting,
  onAdd,
  onRemove,
  onSwitchTeam,
  onSetCaptain,
  onSetRole,
}: TeamColumnProps) {
  const {colors} = useTheme();
  const activePlayers = players.filter(p => p.isActive);

  return (
    <View style={[styles.column, {borderColor: colors.divider}]}>
      <View style={[styles.header, {backgroundColor: team === 'A' ? colors.primary + '15' : colors.accent + '15'}]}>
        <Text style={[styles.teamName, {color: team === 'A' ? colors.primary : colors.accent}]}>
          {teamName}
        </Text>
        <Text style={[styles.count, {color: colors.textSecondary}]}>
          {activePlayers.length}/{maxPerTeam}
        </Text>
      </View>

      {activePlayers.map(player => (
        <PlayerSlotCard
          key={player.id}
          player={player}
          isCaptain={captainId === player.id}
          onRemove={isCreator && isWaiting ? () => onRemove?.(player.id) : undefined}
          onSwitchTeam={isCreator && isWaiting ? () => onSwitchTeam?.(player.id) : undefined}
          onSetCaptain={isCreator && isWaiting ? () => onSetCaptain?.(player.id) : undefined}
          onSetRole={isCreator && isWaiting ? () => onSetRole?.(player.id) : undefined}
        />
      ))}

      {isCreator && isWaiting && activePlayers.length < maxPerTeam && (
        <Button
          title={`+ Add Player`}
          variant="secondary"
          onPress={onAdd}
          style={styles.addBtn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    borderWidth: 1,
    borderRadius: scale(8),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: scale(8),
  },
  teamName: {
    fontSize: scale(14),
    fontWeight: '700',
  },
  count: {
    fontSize: scale(12),
  },
  addBtn: {
    margin: scale(8),
    minHeight: scale(36),
  },
});
