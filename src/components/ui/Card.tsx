import React from 'react';
import {View, StyleSheet, Platform, type ViewStyle} from 'react-native';
import {useTheme} from '../../theme';
import {scale} from '../../utils/responsive';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: 1 | 2 | 3;
}

export default function Card({children, style, elevation = 1}: CardProps) {
  const {colors, borderRadius} = useTheme();

  const shadows = {
    1: Platform.select({
      ios: {shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.12, shadowRadius: 3},
      android: {elevation: 2},
    }),
    2: Platform.select({
      ios: {shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.15, shadowRadius: 6},
      android: {elevation: 4},
    }),
    3: Platform.select({
      ios: {shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.15, shadowRadius: 10},
      android: {elevation: 8},
    }),
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: borderRadius.lg,
          shadowColor: '#000',
        },
        shadows[elevation],
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: scale(16),
  },
});
