export type ThemeName = 'orange' | 'red' | 'blue' | 'yellow' | 'green' | 'pink' | 'purple';

export interface ThemeConfig {
  id: ThemeName;
  name: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryGlow: string;
  primaryMuted: string;
  backgroundGlow: string;
  cardBorderGlow: string;
  accent: string;
  accentGlow: string;
  cyan: string;
  gradients: {
    ambient: readonly [string, string, string];
    activePill: readonly [string, string];
  };
}

export const THEME_KEYS: ThemeName[] = [
  'orange',
  'red',
  'blue',
  'yellow',
  'green',
  'pink',
  'purple',
];

export const THEMES: Record<ThemeName, ThemeConfig> = {
  orange: {
    id: 'orange',
    name: 'Solar Orange',
    primary: '#F97316',
    primaryDark: '#EA580C',
    primaryLight: '#FB923C',
    primaryGlow: 'rgba(249, 115, 22, 0.26)',
    primaryMuted: 'rgba(249, 115, 22, 0.10)',
    backgroundGlow: '#1E0D03',
    cardBorderGlow: 'rgba(249, 115, 22, 0.24)',
    accent: '#FBBF24',
    accentGlow: 'rgba(251, 191, 36, 0.18)',
    cyan: '#FDBA74',
    gradients: {
      ambient: ['rgba(249, 115, 22, 0.18)', 'rgba(251, 191, 36, 0.07)', 'transparent'] as const,
      activePill: ['#F97316', '#EA580C'] as const,
    },
  },
  red: {
    id: 'red',
    name: 'Scarlet Crimson',
    primary: '#EF4444',
    primaryDark: '#DC2626',
    primaryLight: '#F87171',
    primaryGlow: 'rgba(239, 68, 68, 0.26)',
    primaryMuted: 'rgba(239, 68, 68, 0.10)',
    backgroundGlow: '#1C0606',
    cardBorderGlow: 'rgba(239, 68, 68, 0.24)',
    accent: '#FB7185',
    accentGlow: 'rgba(251, 113, 133, 0.18)',
    cyan: '#FDA4AF',
    gradients: {
      ambient: ['rgba(239, 68, 68, 0.18)', 'rgba(244, 63, 94, 0.07)', 'transparent'] as const,
      activePill: ['#EF4444', '#DC2626'] as const,
    },
  },
  blue: {
    id: 'blue',
    name: 'Cyber Sapphire',
    primary: '#0EA5E9',
    primaryDark: '#0284C7',
    primaryLight: '#38BDF8',
    primaryGlow: 'rgba(14, 165, 233, 0.26)',
    primaryMuted: 'rgba(14, 165, 233, 0.10)',
    backgroundGlow: '#031220',
    cardBorderGlow: 'rgba(14, 165, 233, 0.24)',
    accent: '#6366F1',
    accentGlow: 'rgba(99, 102, 241, 0.18)',
    cyan: '#38BDF8',
    gradients: {
      ambient: ['rgba(14, 165, 233, 0.18)', 'rgba(99, 102, 241, 0.07)', 'transparent'] as const,
      activePill: ['#0EA5E9', '#0284C7'] as const,
    },
  },
  yellow: {
    id: 'yellow',
    name: 'Cyber Amber Gold',
    primary: '#D97706',
    primaryDark: '#B45309',
    primaryLight: '#FBBF24',
    primaryGlow: 'rgba(217, 119, 6, 0.22)',
    primaryMuted: 'rgba(217, 119, 6, 0.10)',
    backgroundGlow: '#1A1204',
    cardBorderGlow: 'rgba(217, 119, 6, 0.22)',
    accent: '#EA580C',
    accentGlow: 'rgba(234, 88, 12, 0.16)',
    cyan: '#FCD34D',
    gradients: {
      ambient: ['rgba(217, 119, 6, 0.16)', 'rgba(234, 88, 12, 0.06)', 'transparent'] as const,
      activePill: ['#F59E0B', '#D97706'] as const,
    },
  },
  green: {
    id: 'green',
    name: 'Emerald Aurora',
    primary: '#10B981',
    primaryDark: '#059669',
    primaryLight: '#34D399',
    primaryGlow: 'rgba(16, 185, 129, 0.24)',
    primaryMuted: 'rgba(16, 185, 129, 0.10)',
    backgroundGlow: '#031C13',
    cardBorderGlow: 'rgba(16, 185, 129, 0.24)',
    accent: '#06B6D4',
    accentGlow: 'rgba(6, 182, 212, 0.18)',
    cyan: '#6EE7B7',
    gradients: {
      ambient: ['rgba(16, 185, 129, 0.18)', 'rgba(6, 182, 212, 0.07)', 'transparent'] as const,
      activePill: ['#10B981', '#059669'] as const,
    },
  },
  pink: {
    id: 'pink',
    name: 'Electric Fuchsia',
    primary: '#EC4899',
    primaryDark: '#DB2777',
    primaryLight: '#F472B6',
    primaryGlow: 'rgba(236, 72, 153, 0.26)',
    primaryMuted: 'rgba(236, 72, 153, 0.10)',
    backgroundGlow: '#1E0717',
    cardBorderGlow: 'rgba(236, 72, 153, 0.24)',
    accent: '#A855F7',
    accentGlow: 'rgba(168, 85, 247, 0.18)',
    cyan: '#F472B6',
    gradients: {
      ambient: ['rgba(236, 72, 153, 0.18)', 'rgba(168, 85, 247, 0.07)', 'transparent'] as const,
      activePill: ['#EC4899', '#DB2777'] as const,
    },
  },
  purple: {
    id: 'purple',
    name: 'Electric Violet',
    primary: '#8B5CF6',
    primaryDark: '#7C3AED',
    primaryLight: '#A78BFA',
    primaryGlow: 'rgba(139, 92, 246, 0.26)',
    primaryMuted: 'rgba(139, 92, 246, 0.10)',
    backgroundGlow: '#100B1A',
    cardBorderGlow: 'rgba(139, 92, 246, 0.24)',
    accent: '#EC4899',
    accentGlow: 'rgba(236, 72, 153, 0.18)',
    cyan: '#38BDF8',
    gradients: {
      ambient: ['rgba(139, 92, 246, 0.16)', 'rgba(56, 189, 248, 0.05)', 'transparent'] as const,
      activePill: ['#8B5CF6', '#7C3AED'] as const,
    },
  },
};

export const colors = {
  // Deep space obsidian base
  background: '#07070A',
  backgroundGlow: '#120D1D',
  surface: '#0F0F16',
  surfaceLight: '#161622',
  surfaceBorder: 'rgba(255, 255, 255, 0.08)',
  surfaceBorderLight: 'rgba(255, 255, 255, 0.14)',

  // Dynamic Theme Accents (default: purple)
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryGlow: 'rgba(139, 92, 246, 0.32)',
  primaryMuted: 'rgba(139, 92, 246, 0.14)',

  // Highlights
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
    ambient: ['rgba(139, 92, 246, 0.18)', 'rgba(56, 189, 248, 0.07)', 'transparent'] as readonly [string, string, string],
    ambientWarm: ['rgba(251, 146, 60, 0.14)', 'rgba(236, 72, 153, 0.08)', 'transparent'] as const,
    gen: ['#8B5CF6', '#EC4899', '#FB923C'] as const,
    techna: ['#8B5CF6', '#EC4899', '#FB923C'] as const,
    technaOrb: ['#38BDF8', '#818CF8', '#C084FC', '#F472B6', '#FB923C'] as const,
    aurora: ['#38BDF8', '#818CF8', '#C084FC'] as const,
    activePill: ['#8B5CF6', '#7C3AED'] as readonly [string, string],
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

/**
 * Updates the global mutable colors object to match a selected theme.
 */
export function setGlobalTheme(themeName: ThemeName) {
  const conf = THEMES[themeName];
  if (!conf) return;

  colors.primary = conf.primary;
  colors.primaryDark = conf.primaryDark;
  colors.primaryLight = conf.primaryLight;
  colors.primaryGlow = conf.primaryGlow;
  colors.primaryMuted = conf.primaryMuted;
  colors.backgroundGlow = conf.backgroundGlow;
  colors.cardBorderGlow = conf.cardBorderGlow;
  colors.accent = conf.accent;
  colors.accentGlow = conf.accentGlow;
  colors.voiceActive = conf.primary;
  colors.voiceActiveGlow = conf.primaryGlow;
  colors.cyan = conf.cyan;
  colors.gradients.ambient = conf.gradients.ambient;
  colors.gradients.activePill = conf.gradients.activePill;
}

// Initial random seed on module load so initial StyleSheets also get a vibrant theme
const initialRandomTheme = THEME_KEYS[Math.floor(Math.random() * THEME_KEYS.length)];
setGlobalTheme(initialRandomTheme);
