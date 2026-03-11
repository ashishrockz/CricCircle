import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import {useTheme} from '../../theme';
import {scale} from '../../utils/responsive';
import {getInitials} from '../../utils/formatters';

interface AvatarProps {
  uri?: string;
  name: string;
  size?: number;
}

export default function Avatar({uri, name, size = 40}: AvatarProps) {
  const {colors} = useTheme();
  const s = scale(size);

  if (uri) {
    return (
      <Image
        source={{uri}}
        style={[
          styles.image,
          {width: s, height: s, borderRadius: s / 2},
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: s,
          height: s,
          borderRadius: s / 2,
          backgroundColor: colors.primary + '30',
        },
      ]}>
      <Text
        style={[
          styles.initials,
          {color: colors.primary, fontSize: s * 0.4},
        ]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});
