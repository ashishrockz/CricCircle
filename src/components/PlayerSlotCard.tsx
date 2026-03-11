import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import FeatherIcon from '@react-native-vector-icons/feather';
import Avatar from './ui/Avatar';
import {useTheme} from '../theme';
import {scale} from '../utils/responsive';
import type {PlayerSlot} from '../models';

interface PlayerSlotCardProps {
  player: PlayerSlot;
  onRemove?: () => void;
  onSwitchTeam?: () => void;
  onSetCaptain?: () => void;
  onSetRole?: () => void;
  isCaptain?: boolean;
}

export default function PlayerSlotCard({
  player,
  onRemove,
  onSwitchTeam,
  onSetCaptain,
  isCaptain,
  onSetRole,
}: PlayerSlotCardProps) {
  const {colors} = useTheme();

  return (
    <View style={[styles.container, {borderBottomColor: colors.divider}]}>
      <Avatar name={player.name} size={36} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, {color: colors.text}]} numberOfLines={1}>
            {player.name}
          </Text>
          {isCaptain && (
            <Text style={[styles.captainBadge, {color: colors.accent}]}>C</Text>
          )}
        </View>
        <View style={styles.meta}>
          {player.isStatic && (
            <Text style={[styles.tag, {color: colors.textSecondary}]}>
              Guest
            </Text>
          )}
          {player.role ? (
            <TouchableOpacity onPress={onSetRole} disabled={!onSetRole}>
              <Text style={[styles.tag, {color: colors.primary}]}>
                {player.role}
              </Text>
            </TouchableOpacity>
          ) : onSetRole ? (
            <TouchableOpacity onPress={onSetRole}>
              <Text style={[styles.tag, {color: colors.textSecondary}]}>
                Set role
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        {onSetCaptain && !isCaptain && (
          <TouchableOpacity onPress={onSetCaptain} hitSlop={hitSlop}>
            <FeatherIcon name="star" size={scale(16)} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        {onSwitchTeam && (
          <TouchableOpacity onPress={onSwitchTeam} hitSlop={hitSlop}>
            <FeatherIcon name="repeat" size={scale(16)} color={colors.primary} />
          </TouchableOpacity>
        )}
        {onRemove && (
          <TouchableOpacity onPress={onRemove} hitSlop={hitSlop}>
            <FeatherIcon name="x" size={scale(16)} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const hitSlop = {top: 10, bottom: 10, left: 10, right: 10};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(4),
    borderBottomWidth: 0.5,
    gap: scale(12),
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  name: {
    fontSize: scale(15),
    fontWeight: '500',
    flexShrink: 1,
  },
  captainBadge: {
    fontSize: scale(12),
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: scale(4),
    paddingHorizontal: scale(4),
    paddingVertical: scale(1),
    overflow: 'hidden',
  },
  meta: {
    flexDirection: 'row',
    gap: scale(8),
    marginTop: scale(2),
  },
  tag: {
    fontSize: scale(12),
  },
  actions: {
    flexDirection: 'row',
    gap: scale(12),
    alignItems: 'center',
  },
});
