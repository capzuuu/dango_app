export const Colors = {
  // Brand
  primary: '#E50914',
  onPrimary: '#FFFFFF',
  primaryContainer: 'rgba(229,9,20,0.14)',
  onPrimaryContainer: '#FFFFFF',

  // Backgrounds
  background: '#000000',
  secondaryBackground: '#121212',
  surface: '#181818',
  surfaceVariant: '#2F2F2F',

  // Text
  onSurface: '#FFFFFF',
  onSurfaceVariant: '#B3B3B3',
  primaryText: '#FFFFFF',
  secondaryText: '#B3B3B3',
  hint: '#808080',

  // Borders
  outline: '#333333',
  divider: '#222222',

  // Semantic
  success: '#46D369',
  warning: '#FFA000',
  error: '#E50914',
  info: '#54B1FF',

  // Misc
  tabBar: '#0A0A0A',
  transparent: 'transparent',
};

export const Spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const Radii = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 20,
  xxl: 32,
  full: 9999,
};

export const Fonts = {
  primary: 'Manrope',
  secondary: 'Inter',
  mono: 'SpaceGrotesk',
  // fallback aliases
  rounded: 'System',
};

export const TextStyles = {
  displayLarge: { fontSize: 58, fontWeight: '800' as const, lineHeight: 64 },
  displayMedium: { fontSize: 46, fontWeight: '800' as const, lineHeight: 51 },
  displaySmall: { fontSize: 38, fontWeight: '800' as const, lineHeight: 42 },
  headlineLarge: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38 },
  headlineMedium: { fontSize: 26, fontWeight: '700' as const, lineHeight: 31 },
  headlineSmall: { fontSize: 24, fontWeight: '700' as const, lineHeight: 29 },
  titleLarge: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  titleMedium: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  titleSmall: { fontSize: 14, fontWeight: '600' as const, lineHeight: 18 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
  labelLarge: { fontSize: 14, fontWeight: '600' as const, lineHeight: 18 },
  labelMedium: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  labelSmall: { fontSize: 10, fontWeight: '600' as const, lineHeight: 13 },
};
