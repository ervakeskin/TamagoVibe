// =============================================================================
// src/constants/theme.ts — TamagoVibe
// Expo Router / React Native için renk ve font sabitleri.
// COLORS'u gameConfig.js'den türetir — iki kaynak çakışmaz.
// =============================================================================

import { Platform } from 'react-native';

// ─── Uygulama Renkleri (Light-only — koyu tema yok) ──────────────────────────
// Tek tema: Kawaii kağıt / pastel / krem ağırlıklı light mode

const palette = {
  // Zemin
  background: '#FFFBF5',   // kağıt beyazı
  card:       '#FFFFFF',   // saf beyaz kart
  surface:    '#FAF6F1',   // krem yüzey (ikincil arka plan)
  surfaceAlt: '#F3EDE4',   // daha derin krem

  // Metin hiyerarşisi
  textPrimary: '#2D3748',  // yumuşak antrasit
  textSoft:    '#A08C89',  // ikincil
  textSubtle:  '#C4B5B5',  // üçüncül / placeholder

  // Çizgiler & kenarlıklar
  border:     'rgba(201,166,158,0.22)',
  borderSoft: 'rgba(201,166,158,0.12)',

  // Vurgu
  primary:    '#FF4D6D',   // sıcak pembe
  secondary:  '#48CAE4',   // pastel mavi
  roseGold:   '#C9A69E',   // rose gold

  // Pet glow renkleri
  mint:       '#B2F5EA',
  lavender:   '#E9D8FD',
  sky:        '#BEE3F8',
  peach:      '#FFD6C0',

  // Durum
  danger:     '#E8927C',
  success:    '#A8C5A0',
  warning:    '#F6AD55',
};

// ─── Expo Router uyumlu Colors export ────────────────────────────────────────
// useColorScheme() hook'u ile kullanılır.
// Koyu tema yok — her iki modda da aynı kawaii palette.
export const Colors = {
  light: {
    text:           palette.textPrimary,
    background:     palette.background,
    tint:           palette.roseGold,
    icon:           palette.textSoft,
    tabIconDefault: palette.textSoft,
    tabIconSelected: palette.roseGold,

    // Ek TamagoVibe token'ları
    card:           palette.card,
    surface:        palette.surface,
    surfaceAlt:     palette.surfaceAlt,
    border:         palette.border,
    primary:        palette.primary,
    secondary:      palette.secondary,
    roseGold:       palette.roseGold,
    textSoft:       palette.textSoft,
    textSubtle:     palette.textSubtle,
    danger:         palette.danger,
    success:        palette.success,
    warning:        palette.warning,
    mint:           palette.mint,
    lavender:       palette.lavender,
    sky:            palette.sky,
    peach:          palette.peach,
  },
  dark: {
    // Koyu tema desteklenmiyor — light ile aynı tutulur.
    // İleride eklemek istersen burası düzenlenir.
    text:           palette.textPrimary,
    background:     palette.background,
    tint:           palette.roseGold,
    icon:           palette.textSoft,
    tabIconDefault: palette.textSoft,
    tabIconSelected: palette.roseGold,

    card:           palette.card,
    surface:        palette.surface,
    surfaceAlt:     palette.surfaceAlt,
    border:         palette.border,
    primary:        palette.primary,
    secondary:      palette.secondary,
    roseGold:       palette.roseGold,
    textSoft:       palette.textSoft,
    textSubtle:     palette.textSubtle,
    danger:         palette.danger,
    success:        palette.success,
    warning:        palette.warning,
    mint:           palette.mint,
    lavender:       palette.lavender,
    sky:            palette.sky,
    peach:          palette.peach,
  },
};

// ─── Font Sistemi ─────────────────────────────────────────────────────────────
// Platform.select ile iOS / Android / Web için en uygun fontlar seçilir.
// "rounded" font — kawaii his için tercih edilen ana font.
export const Fonts = Platform.select({
  ios: {
    /** Varsayılan system font */
    sans:    'system-ui',
    /** Serif — anıt/mezarlık ekranları için */
    serif:   'ui-serif',
    /** Yuvarlak — kawaii hissi, başlıklar ve isimler */
    rounded: 'ui-rounded',
    /** Monospace — pet ID / kod gösterimi */
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ─── Spacing Sistemi ─────────────────────────────────────────────────────────
export const Spacing = {
  xs:    4,
  sm:    8,
  md:    12,
  base:  16,
  lg:    20,
  xl:    24,
  '2xl': 32,
  '3xl': 40,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 28,
  full: 9999,
} as const;

// ─── Gölge (iOS + Android) ────────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius:  4,
    elevation:     2,
  },
  md: {
    shadowColor:   '#C9A69E',
    shadowOffset:  { width: 2, height: 3 },
    shadowOpacity: 0.11,
    shadowRadius:  8,
    elevation:     3,
  },
  lg: {
    shadowColor:   '#C9A69E',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius:  14,
    elevation:     6,
  },
  /** Pet türüne özel renkli glow */
  neon: (color: string) => ({
    shadowColor:   color,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius:  20,
    elevation:     6,
  }),
} as const;

// ─── Ortak Kart Stili ────────────────────────────────────────────────────────
export const CardStyle = {
  backgroundColor: palette.card,
  borderRadius:    Radius['2xl'],
  borderWidth:     1.5,
  borderColor:     palette.border,
  ...Shadows.md,
} as const;