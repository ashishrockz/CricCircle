import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import FeatherIcon from '@react-native-vector-icons/feather';
import {useTheme} from '../theme';
import {scale} from '../utils/responsive';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export default function ScreenHeader({
  title,
  showBack = true,
  onBack,
  rightElement,
  style,
}: ScreenHeaderProps) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          paddingTop: insets.top + scale(8),
          borderBottomColor: colors.border,
        },
        style,
      ]}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            activeOpacity={0.7}>
            <FeatherIcon
              name="chevron-left"
              size={scale(24)}
              color={colors.text}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <Text
          style={[styles.title, {color: colors.text}]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {title}
        </Text>

        {rightElement ? (
          <View style={styles.rightSlot}>{rightElement}</View>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0.5,
    paddingBottom: scale(10),
    paddingHorizontal: scale(8),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: scale(36),
    height: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: scale(17),
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: scale(4),
  },
  placeholder: {
    width: scale(36),
  },
  rightSlot: {
    width: scale(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
