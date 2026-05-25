import { Colors } from '@/constants/theme';

/**
 * Always returns dark-theme colors since Dango is a dark-only app.
 * Accepts optional overrides for light/dark for legacy compatibility.
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors
) {
  const colorFromProps = props['dark'] ?? props['light'];
  if (colorFromProps) {
    return colorFromProps;
  }
  const value = Colors[colorName];
  return typeof value === 'string' ? value : Colors.primaryText;
}
