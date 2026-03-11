import React, {useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  Dimensions,
  type LayoutRectangle,
} from 'react-native';
import FeatherIcon from '@react-native-vector-icons/feather';
import {useTheme} from '../../theme';
import {scale} from '../../utils/responsive';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

export interface DropdownOption {
  label: string;
  value: string;
  icon?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export default function Dropdown({
  options,
  value,
  onSelect,
  placeholder = 'Select...',
  label,
  disabled = false,
}: DropdownProps) {
  const {colors, borderRadius} = useTheme();
  const [open, setOpen] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState<LayoutRectangle | null>(
    null,
  );
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const triggerRef = useRef<View>(null);

  const selected = options.find(o => o.value === value);

  const openDropdown = useCallback(() => {
    if (disabled) return;
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownLayout({x, y, width, height});
      setOpen(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [disabled, fadeAnim, scaleAnim]);

  const closeDropdown = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setOpen(false));
  }, [fadeAnim, scaleAnim]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onSelect(optionValue);
      closeDropdown();
    },
    [onSelect, closeDropdown],
  );

  // Calculate dropdown position (above or below trigger)
  const getDropdownPosition = () => {
    if (!dropdownLayout) return {};
    const itemHeight = scale(46);
    const listHeight = Math.min(options.length * itemHeight, scale(230));
    const spaceBelow = SCREEN_HEIGHT - (dropdownLayout.y + dropdownLayout.height);
    const showAbove = spaceBelow < listHeight + scale(16);

    return {
      left: dropdownLayout.x,
      width: dropdownLayout.width,
      ...(showAbove
        ? {bottom: SCREEN_HEIGHT - dropdownLayout.y + scale(4)}
        : {top: dropdownLayout.y + dropdownLayout.height + scale(4)}),
      maxHeight: listHeight,
    };
  };

  const renderItem = ({item}: {item: DropdownOption}) => {
    const isSelected = item.value === value;
    return (
      <TouchableOpacity
        style={[
          styles.option,
          {borderBottomColor: colors.divider},
          isSelected && {backgroundColor: colors.primary + '10'},
        ]}
        onPress={() => handleSelect(item.value)}
        activeOpacity={0.6}>
        {item.icon && (
          <Text style={styles.optionIcon}>{item.icon}</Text>
        )}
        <Text
          style={[
            styles.optionLabel,
            {color: isSelected ? colors.primary : colors.text},
            isSelected && {fontWeight: '600'},
          ]}>
          {item.label}
        </Text>
        {isSelected && (
          <FeatherIcon name="check" size={scale(16)} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {label && (
        <Text style={[styles.label, {color: colors.textSecondary}]}>
          {label}
        </Text>
      )}
      <View ref={triggerRef} collapsable={false}>
        <TouchableOpacity
          style={[
            styles.trigger,
            {
              backgroundColor: colors.surface,
              borderColor: open ? colors.primary : colors.border,
              borderRadius: borderRadius.md,
            },
            disabled && {opacity: 0.5},
          ]}
          onPress={openDropdown}
          activeOpacity={0.7}
          disabled={disabled}>
          {selected?.icon && (
            <Text style={styles.triggerIcon}>{selected.icon}</Text>
          )}
          <Text
            style={[
              styles.triggerText,
              {color: selected ? colors.text : colors.textSecondary},
            ]}
            numberOfLines={1}>
            {selected?.label || placeholder}
          </Text>
          <FeatherIcon
            name={open ? 'chevron-up' : 'chevron-down'}
            size={scale(16)}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={closeDropdown}
        statusBarTranslucent>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeDropdown}>
          <Animated.View
            style={[
              styles.menu,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                opacity: fadeAnim,
                transform: [{scale: scaleAnim}],
              },
              getDropdownPosition(),
            ]}>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={renderItem}
              bounces={false}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: scale(12),
    fontWeight: '500',
    marginBottom: scale(6),
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(12),
    paddingVertical: scale(11),
    borderWidth: 1,
    gap: scale(8),
  },
  triggerIcon: {
    fontSize: scale(16),
  },
  triggerText: {
    flex: 1,
    fontSize: scale(14),
    fontWeight: '500',
  },
  backdrop: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
    borderBottomWidth: 0.5,
    gap: scale(10),
  },
  optionIcon: {
    fontSize: scale(16),
  },
  optionLabel: {
    flex: 1,
    fontSize: scale(14),
  },
});
