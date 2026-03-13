import React, {useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import Video from 'react-native-video';
import {useConfigStore} from '../stores/config.store';
import {useTheme} from '../theme';
import {scale} from '../utils/responsive';

interface Props {
  placement: 'splash' | 'homeBanner';
}

export default function SponsorBanner({placement}: Props) {
  const {colors, borderRadius} = useTheme();
  const ads = useConfigStore(s => s.config.advertisements);
  const [mediaError, setMediaError] = useState(false);

  if (!ads?.enabled) return null;

  const config = ads.placements?.[placement];
  if (!config?.enabled || !config.mediaUrl || mediaError) return null;

  const handlePress = () => {
    if (config.linkUrl) {
      Linking.openURL(config.linkUrl).catch(() => {});
    }
  };

  const isSplash = placement === 'splash';
  const isVideo = config.mediaType === 'video';
  const mediaHeight = isSplash ? scale(100) : scale(180);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      disabled={!config.linkUrl}
      style={[
        styles.container,
        {borderRadius: borderRadius.lg},
        isSplash && styles.splashContainer,
      ]}>
      {isVideo ? (
        <Video
          source={{uri: config.mediaUrl}}
          style={[styles.media, {height: mediaHeight, borderRadius: borderRadius.lg}]}
          resizeMode="cover"
          repeat
          muted
          paused={false}
          onError={() => setMediaError(true)}
        />
      ) : (
        <Image
          source={{uri: config.mediaUrl}}
          style={[styles.media, {height: mediaHeight, borderRadius: borderRadius.lg}]}
          resizeMode="cover"
          onError={() => setMediaError(true)}
        />
      )}
      <View style={styles.labelRow}>
        <View style={[styles.adBadge, {backgroundColor: colors.textSecondary}]}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>
        {config.sponsorName ? (
          <Text
            style={[styles.sponsorName, {color: colors.textSecondary}]}
            numberOfLines={1}>
            {config.sponsorName}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: scale(12),
    overflow: 'hidden',
  },
  splashContainer: {
    position: 'absolute',
    bottom: scale(40),
    left: scale(16),
    right: scale(16),
  },
  media: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    paddingHorizontal: scale(4),
    paddingTop: scale(4),
  },
  adBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: scale(1),
    borderRadius: scale(3),
  },
  adBadgeText: {
    color: '#FFF',
    fontSize: scale(9),
    fontWeight: '700',
  },
  sponsorName: {
    fontSize: scale(11),
    flex: 1,
  },
});
