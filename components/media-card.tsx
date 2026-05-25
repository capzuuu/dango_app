import { Colors, Radii, Spacing, TextStyles } from '@/constants/theme';
import { formatRating, getTitle, posterUrl, TMDBMovie, TMDBShow } from '@/lib/tmdb';
import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

type Item = TMDBMovie | TMDBShow;

interface Props {
  item: Item;
  onPress: () => void;
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export function MediaCard({ item, onPress, width = 110, height = 164, style }: Props) {
  const poster = posterUrl(item.poster_path, 'w342');
  const title = getTitle(item);
  const rating = formatRating(item.vote_average);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { width, height }, style]}>
      {poster ? (
        <Image
          source={{ uri: poster }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <Text style={styles.placeholderText} numberOfLines={3}>{title}</Text>
        </View>
      )}
      {/* Bottom gradient overlay */}
      <View style={styles.overlay} />
      {/* Rating pill */}
      <View style={styles.ratingPill}>
        <Text style={styles.ratingText}>★ {rating}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
  },
  placeholder: {
    backgroundColor: Colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  placeholderText: {
    ...TextStyles.labelSmall,
    color: Colors.secondaryText,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 48,
    backgroundColor: 'transparent',
  },
  ratingPill: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: Radii.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
  },
  ratingText: {
    color: Colors.primaryText,
    fontSize: 9,
    fontWeight: '700',
  },
});
