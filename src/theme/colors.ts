export const colors = {
  // Milkinside Gen UI - Deep space velvety obsidian
  background: '#07070A',
  backgroundGlow: '#120D1D',
  surface: '#0F0F16',
  surfaceLight: '#161622',
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',
  surfaceBorderLight: 'rgba(255, 255, 255, 0.14)',

  // Signature Gen UI Accents (Electric Violet & Aurora)
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryGlow: 'rgba(139, 92, 246, 0.32)',
  primaryMuted: 'rgba(139, 92, 246, 0.14)',

  // Aurora Highlights
  cyan: '#38BDF8',
  cyanGlow: 'rgba(56, 189, 248, 0.28)',
  rose: '#EC4899',
  amber: '#FB923C',
  violet: '#8B5CF6',

  // Soft Icy Blue / White
  iceWhite: '#F1F5F9',
  iceWhiteDark: '#CBD5E1',
  iceWhiteText: '#07070A',

  // Sheet / Modal surfaces
  sheetWhite: '#FFFFFF',
  sheetInput: '#EDEDF2',
  sheetDarkBtn: '#0E0E14',

  // Accent & Voice
  accent: '#EC4899',
  accentGlow: 'rgba(236, 72, 153, 0.28)',
  voiceActive: '#8B5CF6',
  voiceActiveGlow: 'rgba(139, 92, 246, 0.45)',

  // Text hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: '#9494A8',
  textMuted: '#5C5C70',
  textDark: '#07070A',

  // Semantic
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',

  // Frosted Glass & Surface Card tokens
  card: 'rgba(16, 16, 24, 0.88)',
  cardAlt: 'rgba(22, 22, 32, 0.92)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  cardBorderGlow: 'rgba(139, 92, 246, 0.35)',
  inputBg: 'rgba(20, 20, 30, 0.8)',
  border: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.06)',

  // Gradients
  gradients: {
    ambient: ['rgba(139, 92, 246, 0.18)', 'rgba(56, 189, 248, 0.07)', 'transparent'] as const,
    ambientWarm: ['rgba(251, 146, 60, 0.14)', 'rgba(236, 72, 153, 0.08)', 'transparent'] as const,
    gen: ['#8B5CF6', '#EC4899', '#FB923C'] as const,
    techna: ['#8B5CF6', '#EC4899', '#FB923C'] as const,
    technaOrb: ['#38BDF8', '#818CF8', '#C084FC', '#F472B6', '#FB923C'] as const,
    aurora: ['#38BDF8', '#818CF8', '#C084FC'] as const,
    activePill: ['#8B5CF6', '#7C3AED'] as const,
  },

  priorities: {
    urgent: {
      color: '#EF4444',
      bg: 'rgba(239, 68, 68, 0.16)',
      label: 'Urgent',
    },
    high: {
      color: '#FB923C',
      bg: 'rgba(251, 146, 60, 0.16)',
      label: 'High',
    },
    medium: {
      color: '#A78BFA',
      bg: 'rgba(167, 139, 250, 0.16)',
      label: 'Medium',
    },
    low: {
      color: '#34D399',
      bg: 'rgba(52, 211, 153, 0.16)',
      label: 'Low',
    },
  },

  categories: {
    Work: '#A78BFA',
    Personal: '#38BDF8',
    Urgent: '#F87171',
    Health: '#34D399',
    Finance: '#FBBF24',
    General: '#C084FC',
  },
};


