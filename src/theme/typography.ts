import { colors } from './colors';

export const fontSizes = {
  tiny: 10,
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 15,
  subtitle: 16,
  titleSm: 18,
  titleMd: 20,
  titleLg: 24,
  headline: 28,
  display: 34,
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const typography = {
  h1: {
    fontSize: fontSizes.titleLg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  h2: {
    fontSize: fontSizes.titleMd,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  h3: {
    fontSize: fontSizes.titleSm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.regular,
    color: colors.textPrimary,
  },
  bodyMuted: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.regular,
    color: colors.textMuted,
  },
  caption: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  button: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: '#101014',
  },
  pill: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
} as const;
