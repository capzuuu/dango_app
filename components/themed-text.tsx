import { Colors, TextStyles } from '@/constants/theme';
import { StyleSheet, Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = darkColor ?? lightColor ?? Colors.primaryText;

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    ...TextStyles.bodyLarge,
    color: Colors.primaryText,
  },
  defaultSemiBold: {
    ...TextStyles.bodyLarge,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  title: {
    ...TextStyles.headlineLarge,
    color: Colors.primaryText,
  },
  subtitle: {
    ...TextStyles.titleLarge,
    color: Colors.primaryText,
  },
  link: {
    ...TextStyles.bodyLarge,
    color: Colors.info,
  },
});
