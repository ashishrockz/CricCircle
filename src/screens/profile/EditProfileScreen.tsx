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
import type {ProfileStackParams} from '../../navigation/types';
import {useTheme} from '../../theme';
import {useAuthStore} from '../../stores/auth.store';
import {authService} from '../../services/auth.service';
import {scale} from '../../utils/responsive';
import Avatar from '../../components/ui/Avatar';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import AppModal from '../../components/ui/AppModal';
import ScreenHeader from '../../components/ScreenHeader';

type Props = NativeStackScreenProps<ProfileStackParams, 'EditProfile'>;

export default function EditProfileScreen({navigation}: Props) {
  const {colors, borderRadius} = useTheme();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore(s => s.user);
  const setUser = useAuthStore(s => s.setUser);

  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{name?: string}>({});
  const [modalMsg, setModalMsg] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('error');

  const hasChanges = name.trim() !== (user?.name || '');

  const validate = () => {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = t('auth.nameRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const updated = await authService.updateProfile({
        name: name.trim(),
      });
      setUser(updated);
      setModalTitle('Success');
      setModalMsg('Profile updated successfully');
      setModalType('success');
    } catch (err: any) {
      setModalTitle(t('common.error'));
      setModalMsg(err.response?.data?.message || 'Update failed');
      setModalType('error');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title={t('profile.editProfile')} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {paddingBottom: insets.bottom + scale(32)},
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Avatar name={user?.name || ''} uri={user?.avatar} size={90} />
            <TouchableOpacity
              style={[
                styles.cameraBtn,
                {backgroundColor: colors.primary, borderColor: colors.background},
              ]}
              activeOpacity={0.7}>
              <FeatherIcon name="camera" size={scale(14)} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.avatarHint, {color: colors.textSecondary}]}>
            Tap to change photo
          </Text>
        </View>

        {/* Username - Read Only */}
        <Card style={styles.usernameCard} elevation={1}>
          <View style={styles.usernameRow}>
            <View style={styles.usernameLeft}>
              <View
                style={[
                  styles.usernameIconCircle,
                  {backgroundColor: colors.primary + '12'},
                ]}>
                <FeatherIcon
                  name="at-sign"
                  size={scale(16)}
                  color={colors.primary}
                />
              </View>
              <View style={styles.usernameInfo}>
                <Text
                  style={[styles.usernameLabel, {color: colors.textSecondary}]}>
                  {t('profile.username')}
                </Text>
                <Text style={[styles.usernameValue, {color: colors.text}]}>
                  @{user?.username}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.lockBadge,
                {backgroundColor: colors.border + '60'},
              ]}>
              <FeatherIcon
                name="lock"
                size={scale(12)}
                color={colors.textSecondary}
              />
            </View>
          </View>
          <View
            style={[
              styles.usernameNote,
              {backgroundColor: colors.info + '08', borderColor: colors.info + '20'},
            ]}>
            <FeatherIcon
              name="info"
              size={scale(13)}
              color={colors.info}
            />
            <Text style={[styles.usernameNoteText, {color: colors.info}]}>
              Username is unique and cannot be changed
            </Text>
          </View>
        </Card>

        {/* Editable Fields */}
        <Text style={[styles.sectionTitle, {color: colors.text}]}>
          Personal Information
        </Text>

        <Card style={styles.formCard} elevation={1}>
          <Input
            label={t('profile.name')}
            value={name}
            onChangeText={text => {
              setName(text);
              if (errors.name) setErrors({});
            }}
            error={errors.name}
            placeholder="Your full name"
            maxLength={50}
          />

          {/* Email - Read Only */}
          <View style={styles.readOnlyField}>
            <Text
              style={[styles.readOnlyLabel, {color: colors.textSecondary}]}>
              {t('profile.email')}
            </Text>
            <View
              style={[
                styles.readOnlyInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                },
              ]}>
              <FeatherIcon
                name="mail"
                size={scale(16)}
                color={colors.textSecondary}
              />
              <Text
                style={[
                  styles.readOnlyValue,
                  {color: user?.email ? colors.text : colors.textSecondary},
                ]}>
                {user?.email || 'Not set'}
              </Text>
            </View>
          </View>

          {/* Phone - Read Only */}
          {user?.phone && (
            <View style={styles.readOnlyField}>
              <Text
                style={[styles.readOnlyLabel, {color: colors.textSecondary}]}>
                Phone
              </Text>
              <View
                style={[
                  styles.readOnlyInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                  },
                ]}>
                <FeatherIcon
                  name="phone"
                  size={scale(16)}
                  color={colors.textSecondary}
                />
                <Text style={[styles.readOnlyValue, {color: colors.text}]}>
                  {user.phone}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Save Button */}
        <Button
          title={t('common.save')}
          onPress={handleSave}
          loading={loading}
          disabled={!hasChanges}
          style={styles.saveBtn}
        />
      </ScrollView>

      <AppModal
        visible={!!modalMsg}
        title={modalTitle}
        message={modalMsg}
        onClose={() => {
          setModalMsg('');
          if (modalType === 'success') navigation.navigate('ProfileMain');
        }}
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

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: scale(24),
    paddingTop: scale(8),
  },
  avatarWrapper: {
    position: 'relative',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: -scale(2),
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  avatarHint: {
    fontSize: scale(12),
    marginTop: scale(8),
  },

  // Username card
  usernameCard: {
    marginBottom: scale(20),
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  usernameLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    flex: 1,
  },
  usernameIconCircle: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  usernameInfo: {
    flex: 1,
  },
  usernameLabel: {
    fontSize: scale(11),
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  usernameValue: {
    fontSize: scale(16),
    fontWeight: '600',
    marginTop: scale(1),
  },
  lockBadge: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  usernameNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginTop: scale(12),
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(8),
    borderWidth: 1,
  },
  usernameNoteText: {
    fontSize: scale(12),
    fontWeight: '500',
    flex: 1,
  },

  // Section
  sectionTitle: {
    fontSize: scale(15),
    fontWeight: '600',
    marginBottom: scale(10),
    marginLeft: scale(4),
  },
  formCard: {
    marginBottom: scale(8),
  },

  // Read-only field
  readOnlyField: {
    marginBottom: scale(16),
  },
  readOnlyLabel: {
    fontSize: scale(14),
    fontWeight: '500',
    marginBottom: scale(6),
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingVertical: scale(13),
    borderWidth: 1,
    gap: scale(10),
    opacity: 0.7,
  },
  readOnlyValue: {
    fontSize: scale(16),
    flex: 1,
  },

  // Save
  saveBtn: {
    marginTop: scale(16),
  },
});
