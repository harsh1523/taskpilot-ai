export const colors = {
  // Dark obsidian theme
  background: '#0D0D11',
  backgroundGlow: '#2D1A10',
  surface: '#1A1A1E',
  surfaceLight: '#242429',
  surfaceBorder: '#2E2E36',
  surfaceBorderLight: '#3D3D48',

  // Signature Warm Peach / Salmon from screenshots
  primary: '#F8A878',
  primaryDark: '#DF8B5A',
  primaryLight: '#FFC2A1',
  primaryGlow: 'rgba(248, 168, 120, 0.25)',
  primaryMuted: 'rgba(248, 168, 120, 0.12)',

  // Soft Icy Blue / White (used in PM toggle & Clock center disc)
  iceWhite: '#E8F1F5',
  iceWhiteDark: '#D4E2E8',
  iceWhiteText: '#18181B',

  // Bottom Sheet White Card
  sheetWhite: '#FFFFFF',
  sheetInput: '#EDEDF0',
  sheetDarkBtn: '#18181A',

  // Accent & Voice
  accent: '#F8A878',
  accentGlow: 'rgba(248, 168, 120, 0.2)',
  voiceActive: '#F8A878',
  voiceActiveGlow: 'rgba(248, 168, 120, 0.35)',

  // Text hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: '#9A9AA2',
  textMuted: '#666670',
  textDark: '#121214',

  // Semantic
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',

  // Additional surface & card tokens
  card: '#14141A',
  cardAlt: '#16161F',
  cardBorder: '#22222E',
  inputBg: '#1A1A1E',
  border: '#242432',
  divider: '#1E1E28',

  // Gradients
  gradients: {
    ambient: ['rgba(248, 168, 120, 0.14)', 'rgba(217, 126, 78, 0.04)', 'transparent'] as const,
    techna: ['#A855F7', '#EC4899', '#F97316'] as const,
    technaOrb: ['#38BDF8', '#818CF8', '#C084FC', '#F472B6', '#FB923C'] as const,
  },

  priorities: {
    urgent: {
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.16)',
      label: 'Urgent',
    },
    high: {
      color: '#F97316',
      bg: 'rgba(249, 115, 22, 0.16)',
      label: 'High',
    },
    medium: {
      color: '#F8A878',
      bg: 'rgba(248, 168, 120, 0.16)',
      label: 'Medium',
    },
    low: {
      color: '#34D399',
      bg: 'rgba(52, 211, 153, 0.16)',
      label: 'Low',
    },
  },

  categories: {
    Work: '#F8A878',
    Personal: '#93C5FD',
    Urgent: '#F87171',
    Health: '#34D399',
    Finance: '#FBBF24',
    General: '#A78BFA',
  },
};

export { spacing, padding } from './spacing';
export { radius } from './radius';
export { fontSizes, fontWeights, typography } from './typography';
export { commonStyles } from './layout';


