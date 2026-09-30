export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  base: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  huge: 32,
  giant: 40,
} as const;

export const padding = {
  screenHorizontal: spacing.xxl,
  screenVertical: spacing.lg,
  card: spacing.xl,
  cardCompact: spacing.lg,
  modal: spacing.xxl,
  pillHorizontal: spacing.lg,
  pillVertical: spacing.sm,
  buttonHorizontal: spacing.xl,
  buttonVertical: spacing.base,
  input: spacing.lg,
} as const;
