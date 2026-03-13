import React, {useState} from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import {useConfigStore} from '../stores/config.store';
import {useTheme} from '../theme';
import {scale} from '../utils/responsive';

export default function TossSponsor() {
  const {colors, borderRadius} = useTheme();
  const ads = useConfigStore(s => s.config.advertisements);
  const [imgError, setImgError] = useState(false);

  if (!ads?.enabled) return null;

  const toss = ads.placements?.tossScreen;
  if (!toss?.enabled || !toss.logoUrl || imgError) return null;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.logoCard,
          {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            borderColor: colors.border,
          },
        ]}>
        <Image
          source={{uri: toss.logoUrl}}
          style={[styles.logo, {borderRadius: borderRadius.md}]}
          resizeMode="contain"
          onError={() => setImgError(true)}
        />
      </View>
      {toss.sponsorName ? (
        <View style={styles.textRow}>
          <Text style={[styles.poweredBy, {color: colors.textSecondary}]}>
            Powered by
          </Text>
          <Text style={[styles.sponsorName, {color: colors.text}]}>
            {toss.sponsorName}
          </Text>
        </View>
      ) : null}
      {toss.tagline ? (
        <Text style={[styles.tagline, {color: colors.textSecondary}]}>
          {toss.tagline}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: scale(16),
  },
  logoCard: {
    padding: scale(12),
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logo: {
    width: scale(120),
    height: scale(50),
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    marginTop: scale(8),
  },
  poweredBy: {
    fontSize: scale(11),
  },
  sponsorName: {
    fontSize: scale(13),
    fontWeight: '600',
  },
  tagline: {
    fontSize: scale(10),
    marginTop: scale(2),
  },
});
