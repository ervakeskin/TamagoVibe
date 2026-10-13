// =============================================================================
// src/constants/theme.js — TamagoVibe tek tasarım sistemi (krem / pastel)
// Tüm ekranlar renk, tipografi, boşluk ve gölgeyi buradan alır.
// =============================================================================

// ─── Pastel vurgu renkleri ───────────────────────────────────────────────────
export const NEON = {
  purple:  '#B9A7E8',
  violet:  '#9C87E0',
  cyan:    '#7CCBD9',
  gold:    '#F2C46D',
  coral:   '#E8927C',
  rose:    '#E58E9A',
  green:   '#A8C5A0',
  blue:    '#8DB8E8',
  magenta: '#D4A0C0',
};

// ─── Mezarlık / Ölüm paleti (bilinçli koyu) ──────────────────────────────────
export const GRAVEYARD = {
  bg:      '#0a0a0f',
  surface: '#111118',
  border:  'rgba(255,255,255,0.05)',
  text:    '#4a5568',
  accent:  '#553c7b',
  stone:   '#718096',
};

// ─── Ana palet ───────────────────────────────────────────────────────────────
export const COLORS = {
  // Arka planlar
  bg:          '#FAF6F1',   // krem
  bgDeep:      '#F3EDE4',
  bgCard:      '#FFFFFF',
  surface:     '#FFFBF5',
  surfaceAlt:  '#F3EDE4',
  background:  '#FAF6F1',
  card:        '#FFFFFF',

  // Cihaz / LCD
  shell:       '#F7D6D0',   // Tamagotchi kabuğu
  shellDeep:   '#E9B7AE',
  shellShine:  '#FFF1EE',
  lcd:         '#E6EDD6',   // yeşilimsi LCD
  lcdDeep:     '#CBD8B4',
  lcdInk:      '#4A5A3A',

  // Cam / çizgi
  glass:       'rgba(255,255,255,0.65)',
  glassMed:    'rgba(255,255,255,0.8)',
  glassHigh:   '#FFFFFF',
  glassBorder: 'rgba(201,166,158,0.35)',
  border:      'rgba(201,166,158,0.22)',

  // Metin
  text:        '#3D2C2C',
  textPrimary: '#3D2C2C',
  textSecond:  '#6B5A57',
  textSoft:    '#A08C89',
  textMuted:   '#A08C89',
  textSubtle:  '#C4B5B5',

  // Vurgu
  primary:     '#E58E9A',
  secondary:   '#7CCBD9',
  roseGold:    '#C9A69E',

  // Pet renkleri (glow)
  mint:        '#B2F5EA',
  lavender:    '#E9D8FD',
  sky:         '#BEE3F8',
  peach:       '#FFD6C0',

  // Stat çubukları
  statHunger:    '#E8927C',
  statHappiness: '#D4A0C0',
  statEnergy:    '#8DB8E8',
  statHealth:    '#A8C5A0',
  hunger:        '#E8927C',
  happiness:     '#D4A0C0',
  energy:        '#8DB8E8',
  health:        '#A8C5A0',
  xp:            '#F2C46D',
  partner:       '#7CCBD9',

  // Durum
  danger:  '#E8927C',
  warning: '#F4A261',
  success: '#A8C5A0',
  info:    '#7CCBD9',
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

// ─── Boşluk ───────────────────────────────────────────────────────────────────
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

// ─── Köşe yarıçapı ────────────────────────────────────────────────────────────
export const RADIUS = {
  sm:    8,
  md:    12,
  lg:    16,
  xl:    20,
  '2xl': 24,
  '3xl': 28,
  full:  9999,
};

// ─── Gölgeler (yumuşak, gül altını) ───────────────────────────────────────────
const SHADOW_COLOR = '#C9A69E';
export const SHADOWS = {
  sm: {
    shadowColor:   SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius:  4,
    elevation:     2,
  },
  md: {
    shadowColor:   SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius:  8,
    elevation:     4,
  },
  lg: {
    shadowColor:   SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius:  16,
    elevation:     8,
  },
  /** Renkli yumuşak parıltı */
  neon: (color) => ({
    shadowColor:   color,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius:  14,
    elevation:     6,
  }),
};

// ─── Kart stili ───────────────────────────────────────────────────────────────
export const CARD_STYLE = {
  backgroundColor: COLORS.bgCard,
  borderRadius:    RADIUS['2xl'],
  padding:         SPACING.lg,
  borderWidth:     1.5,
  borderColor:     COLORS.border,
  ...SHADOWS.md,
};

/** Ekranlarda kullanılan kart yardımcısı */
export const cardStyle = (extra = {}) => ({ ...CARD_STYLE, ...extra });

// ─── Titreşim paternleri ──────────────────────────────────────────────────────
export const VIBRATION = {
  button:   10,
  action:   [0, 25, 50, 25],
  levelUp:  [0, 50, 20, 50],
  death:    [0, 100, 50, 100],
  rebirth:  30,
  alert:    [0, 40, 30, 40],
};
