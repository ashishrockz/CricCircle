import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../theme';
import {scale} from '../utils/responsive';

interface MilestoneItem {
  emoji: string;
  label: string;
  value: number;
}

interface Props {
  milestones: MilestoneItem[];
}

export default function MilestoneBadges({milestones}: Props) {
  const {colors} = useTheme();
  const visible = milestones.filter(m => m.value > 0);
  if (visible.length === 0) return null;

  return (
    <View style={styles.container}>
      {visible.map(m => (
        <View
          key={m.label}
          style={[styles.badge, {backgroundColor: colors.primary + '10', borderColor: colors.primary + '25'}]}>
          <Text style={styles.emoji}>{m.emoji}</Text>
          <Text style={[styles.value, {color: colors.primary}]}>{m.value}</Text>
          <Text style={[styles.label, {color: colors.primary + 'CC'}]}>{m.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(6),
    marginTop: scale(10),
    paddingTop: scale(10),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(10),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1,
    gap: scale(4),
  },
  emoji: {
    fontSize: scale(13),
  },
  value: {
    fontSize: scale(13),
    fontWeight: '700',
  },
  label: {
    fontSize: scale(11),
    fontWeight: '500',
  },
});
