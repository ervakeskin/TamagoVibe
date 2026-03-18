// =============================================================================
// src/constants/theme.js — TamagoVibe Design System
// Tüm renk, tipografi, spacing ve gölge değerleri bu dosyadan yönetilir.
// =============================================================================

// ─── Neon Vurgu Renkleri ─────────────────────────────────────────────────────
export const NEON = {
  purple:  '#9d8df1',
  violet:  '#7c6aff',
  cyan:    '#48cae4',
  gold:    '#ffd166',
  coral:   '#f4845f',
  rose:    '#e06c75',
  green:   '#98c379',
  blue:    '#61afef',
  magenta: '#c678dd',
};

// ─── Mezarlık / Ölüm Paleti ──────────────────────────────────────────────────
export const GRAVEYARD = {
  bg:      '#0a0a0f',
  surface: '#111118',
  border:  'rgba(255,255,255,0.05)',
  text:    '#4a5568',
  accent:  '#553c7b',
  stone:   '#718096',
};

// ─── Uygulama Renk Paleti ────────────────────────────────────────────────────
export const COLORS = {
  // Arka planlar
  bg:          '#0d0c1a',
  bgCard:      '#161528',
  surface:     '#1e1c35',
  surfaceAlt:  '#252340',

  // Cam (Glassmorphism) efektleri
  glass:       'rgba(255,255,255,0.04)',
  glassMed:    'rgba(255,255,255,0.07)',
  glassHigh:   'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(255,255,255,0.10)',
  border:      'rgba(255,255,255,0.08)',

  // Metin hiyerarşisi
  textPrimary: '#f7fafc',
  textSecond:  '#cbd5e0',
  textMuted:   '#718096',
  textSubtle:  '#4a5568',

  // Stat renkleri
  hunger:    '#f4845f',
  happiness: '#c678dd',
  energy:    '#61afef',
  health:    '#98c379',
  xp:        '#ffd166',
  partner:   '#48cae4',

  // Durum renkleri
  danger:  '#ff6b6b',
  warning: '#f6ad55',
  success: '#98c379',
  info:    '#48cae4',
};

// ─── Tipografi ────────────────────────────────────────────────────────────────
export const FONTS = {
  regular:   '400',
  medium:    '500',
  semibold:  '600',
  bold:      '700',
  extrabold: '800',
  black:     '900',

  xs:    10,
  sm:    12,
  base:  14,
  md:    16,
  lg:    18,
  xl:    22,
  '2xl': 28,
  '3xl': 36,
  '4xl': 48,
  '5xl': 64,
};

// ─── Spacing Sistemi ─────────────────────────────────────────────────────────
export const SPACING = {
  xs:    4,
  sm:    8,
  md:    12,
  base:  16,
  lg:    20,
  xl:    24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 56,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 24,
  '3xl': 28,
  full:  9999,
};

// ─── Gölge Sistemi ────────────────────────────────────────────────────────────
export const SHADOWS = {
  sm: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius:  4,
    elevation:     3,
  },
  md: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius:  8,
    elevation:     6,
  },
  lg: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius:  16,
    elevation:     10,
  },
  /** Renkli neon glow gölgesi */
  neon: (color) => ({
    shadowColor:   color,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius:  16,
    elevation:     8,
  }),
};

// ─── Bileşik Kart Stili (paylaşımlı) ─────────────────────────────────────────
export const CARD_STYLE = {
  backgroundColor: COLORS.bgCard,
  borderRadius:    RADIUS['2xl'],
  padding:         SPACING.lg,
  borderWidth:     1,
  borderColor:     COLORS.border,
  ...SHADOWS.lg,
};
