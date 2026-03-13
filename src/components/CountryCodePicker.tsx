import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import FeatherIcon from '@react-native-vector-icons/feather';
import {useTheme} from '../theme';
import {scale} from '../utils/responsive';
import {COUNTRIES, type Country} from '../utils/countries';

interface Props {
  selected: Country;
  onSelect: (country: Country) => void;
}

export default function CountryCodePicker({selected, onSelect}: Props) {
  const {colors, borderRadius} = useTheme();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase();
    return COUNTRIES.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [search]);

  const renderItem = ({item}: {item: Country}) => (
    <TouchableOpacity
      style={[
        styles.item,
        {borderBottomColor: colors.border},
        item.code === selected.code && {backgroundColor: colors.surface},
      ]}
      onPress={() => {
        onSelect(item);
        setVisible(false);
        setSearch('');
      }}>
      <Text style={styles.flag}>{item.flag}</Text>
      <Text style={[styles.itemName, {color: colors.text}]} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={[styles.itemDial, {color: colors.textSecondary}]}>
        {item.dialCode}
      </Text>
    </TouchableOpacity>
  );

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            borderRadius: borderRadius.md,
          },
        ]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}>
        <Text style={styles.triggerFlag}>{selected.flag}</Text>
        <Text style={[styles.triggerDial, {color: colors.text}]}>
          {selected.dialCode}
        </Text>
        <FeatherIcon
          name="chevron-down"
          size={scale(14)}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setVisible(false);
          setSearch('');
        }}>
        <View
          style={[
            styles.modal,
            {
              backgroundColor: colors.background,
              paddingTop: Platform.OS === 'ios' ? scale(12) : insets.top,
            },
          ]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, {color: colors.text}]}>
              Select Country
            </Text>
            <TouchableOpacity
              onPress={() => {
                setVisible(false);
                setSearch('');
              }}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <FeatherIcon
                name="x"
                size={scale(24)}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.searchWrapper,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                borderRadius: borderRadius.md,
              },
            ]}>
            <FeatherIcon
              name="search"
              size={scale(18)}
              color={colors.textSecondary}
            />
            <TextInput
              style={[styles.searchInput, {color: colors.text}]}
              placeholder="Search country or code..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={item => item.code}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{paddingBottom: insets.bottom}}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: scale(10),
    paddingVertical: scale(12),
    gap: scale(4),
    marginRight: scale(8),
  },
  triggerFlag: {
    fontSize: scale(18),
  },
  triggerDial: {
    fontSize: scale(14),
    fontWeight: '500',
  },
  modal: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
  },
  headerTitle: {
    fontSize: scale(18),
    fontWeight: '600',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginHorizontal: scale(16),
    marginBottom: scale(8),
    paddingHorizontal: scale(12),
    gap: scale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: scale(15),
    paddingVertical: scale(10),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: scale(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: scale(10),
  },
  flag: {
    fontSize: scale(22),
  },
  itemName: {
    flex: 1,
    fontSize: scale(15),
  },
  itemDial: {
    fontSize: scale(14),
    fontWeight: '500',
  },
});
