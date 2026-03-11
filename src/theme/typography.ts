import {Platform} from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  h1: {fontSize: 28, fontWeight: '700' as const, lineHeight: 36, fontFamily},
  h2: {fontSize: 24, fontWeight: '700' as const, lineHeight: 32, fontFamily},
  h3: {fontSize: 20, fontWeight: '600' as const, lineHeight: 28, fontFamily},
  h4: {fontSize: 18, fontWeight: '600' as const, lineHeight: 24, fontFamily},
  body: {fontSize: 16, fontWeight: '400' as const, lineHeight: 24, fontFamily},
  bodySmall: {fontSize: 14, fontWeight: '400' as const, lineHeight: 20, fontFamily},
  caption: {fontSize: 12, fontWeight: '400' as const, lineHeight: 16, fontFamily},
  label: {fontSize: 14, fontWeight: '500' as const, lineHeight: 20, fontFamily},
  button: {fontSize: 16, fontWeight: '600' as const, lineHeight: 24, fontFamily},
  score: {fontSize: 32, fontWeight: '700' as const, lineHeight: 40, fontFamily},
  scoreLarge: {fontSize: 48, fontWeight: '700' as const, lineHeight: 56, fontFamily},
} as const;
