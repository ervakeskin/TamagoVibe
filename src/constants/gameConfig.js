// =============================================================================
// src/constants/gameConfig.js — TamagoVibe oyun sabitleri (tek kaynak)
// Renk ve tipografi için bkz. ./theme.js
// =============================================================================

import { COLORS } from './theme';

export { COLORS, NEON, FONTS, SPACING, RADIUS, SHADOWS, CARD_STYLE, VIBRATION } from './theme';

// ─── Nadirlik seviyeleri ─────────────────────────────────────────────────────
export const RARITIES = {
  common: { id: 'common', label: 'Yaygın',    stars: 1, color: '#A8C5A0' },
  rare:   { id: 'rare',   label: 'Nadir',     stars: 2, color: '#8DB8E8' },
  epic:   { id: 'epic',   label: 'Efsanevi',  stars: 3, color: '#D4A0C0' },
};

// ─── Hayvan türleri (assets/animals ile eşleşir, bkz. avatarConfig.js) ───────
// weight: yumurtadan çıkma şansı (toplam 100)
export const PET_TYPES = {
  FOX:   { id: 'FOX',   emoji: '🦊', label: 'Tilki',  rarity: 'common', weight: 35, color: COLORS.peach,
           about: 'Kurnaz ve oyuncu. Gün batımında en mutlu halidir.' },
  DOG:   { id: 'DOG',   emoji: '🐕', label: 'Shiba',  rarity: 'common', weight: 35, color: COLORS.sky,
           about: 'Sadık ve inatçı. Yemek saatini asla unutmaz.' },
  HUSKY: { id: 'HUSKY', emoji: '🐶', label: 'Husky',  rarity: 'rare',   weight: 20, color: COLORS.sky,
           about: 'Enerjik bir kuzey dostu. Oyun oynamaya bayılır.' },
  WOLF:  { id: 'WOLF',  emoji: '🐺', label: 'Kurt',   rarity: 'epic',   weight: 10, color: COLORS.lavender,
           about: 'Sürünün gizemli lideri. Çok az bakıcıya eşlik eder.' },
};

/** Ağırlığa göre rastgele tür seç (nadir türler daha az çıkar) */
export const pickPetType = (rand = Math.random) => {
  const entries = Object.values(PET_TYPES);
  const total = entries.reduce((sum, t) => sum + t.weight, 0);
  let roll = rand() * total;
  for (const t of entries) {
    roll -= t.weight;
    if (roll < 0) return t.id;
  }
  return entries[0].id;
};

// ─── Oyun hızı ───────────────────────────────────────────────────────────────
/** Test için 1'den büyük yapılabilir (ör. 60 = 1 dakikada 1 saat) */
export const GAME_SPEED = 1;

/** Yumurtanın çıkma süresi: geliştirmede 1 dk, yayında 10 dk */
export const HATCH_TIME_MINUTES = typeof __DEV__ !== 'undefined' && __DEV__ ? 1 : 10;
export const HATCH_SECONDS = HATCH_TIME_MINUTES * 60;

/** Ekran açıkken kaç ms'de bir durum güncellenir */
export const TICK_MS = 30 * 1000;

/** Saatlik düşüş / artış oranları (0-100 ölçeği) */
export const DECAY_PER_HOUR = {
  hunger:         12.5,  // ~8 saatte aç
  happiness:       8,    // ~12 saatte mutsuz
  energy:          6,    // ~16 saatte yorgun
  sleepEnergy:    25,    // uyurken enerji artışı
  sleepHungerMul:  0.4,  // uyurken açlık yavaşlar
  healthLoss:      8,    // aç / mutsuzken sağlık kaybı
  healthRegen:     2,    // iyiyken sağlık toparlanması
};

/** Uygulama kapalıyken sağlık bu değerin altına düşmez (tek seferde ölüm yok) */
export const OFFLINE_HEALTH_FLOOR = 10;
/** Bu süreden (ms) uzun aralık "kapalıyken geçti" sayılır */
export const OFFLINE_THRESHOLD_MS = 2 * 60 * 1000;

// ─── Başlangıç state ─────────────────────────────────────────────────────────
export const INITIAL_PET_STATE = {
  name:           '',
  petType:        null,
  hunger:         80,
  happiness:      80,
  energy:         80,
  health:         100,
  xp:             0,
  level:          1,
  age:            0,      // yaşanan saat
  isSick:         false,
  isSleeping:     false,
  isDead:         false,
  hatchStartedAt: null,
  lastTickAt:     null,
  bornAt:         null,
  graveRecorded:  false,
  totalFeedings:  0,
  totalHealings:  0,
  unlockedBadges: [],
  legacyCount:    0,
  partnerIds:     [],
  updatedAt:      null,
};

// ─── XP sistemi ──────────────────────────────────────────────────────────────
export const xpForNextLevel = (level) => level * 100;

export const deriveLevelFromXp = (totalXp) => {
  let level = 1;
  let xp = totalXp;
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level++;
  }
  return level;
};

export const xpProgressInLevel = (totalXp) => {
  let level = 1;
  let xp = totalXp;
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level++;
  }
  return xp / xpForNextLevel(level);
};

// ─── Yemekler ────────────────────────────────────────────────────────────────
export const FOOD_TYPES = {
  snack: {
    id: 'snack', label: 'Atıştırmalık', icon: '🍪',
    hunger: 10, health: 0, happiness: 5, xp: 5, color: '#f4845f',
  },
  meal: {
    id: 'meal', label: 'Ana Yemek', icon: '🍱',
    hunger: 35, health: 2, happiness: 5, xp: 15, color: '#c678dd',
  },
  dragon_fruit: {
    id: 'dragon_fruit', label: 'Ejder Meyvesi', icon: '🐲',
    hunger: 5, health: 10, happiness: 20, xp: 50, color: '#e06c75',
    description: 'Efsanevi XP ve Mutluluk verir!',
  },
  sushi: {
    id: 'sushi', label: 'Usta Sushi', icon: '🍣',
    hunger: 20, health: 5, happiness: 10, xp: 25, color: '#48cae4',
  },
  ramen: {
    id: 'ramen', label: 'Sıcak Ramen', icon: '🍜',
    hunger: 60, health: 0, happiness: 8, xp: 20, color: '#ffd166',
  },
  vitamin: {
    id: 'vitamin', label: 'Şifalı Vitamin', icon: '💊',
    hunger: 0, health: 15, happiness: 0, xp: 10, color: '#98c379',
  },
};

// ─── Rozetler ────────────────────────────────────────────────────────────────
export const ACHIEVEMENTS = [
  {
    id: 'first_meal', title: 'İlk Lokma', icon: '🍖', color: COLORS.statHunger,
    xpReward: 20, description: 'İlk kez besle',
    check: (p) => (p.totalFeedings ?? 0) >= 1,
  },
  {
    id: 'night_owl', title: 'Gece Kuşu', icon: '🦉', color: COLORS.lavender,
    xpReward: 50, description: 'Gece 00:00–06:00 arası besle',
    check: (p, ctx) => {
      const h = ctx?.feedHour ?? new Date().getHours();
      return h >= 0 && h < 6 && (p.totalFeedings ?? 0) >= 1;
    },
  },
  {
    id: 'survivor', title: 'Hayatta Kalma Uzmanı', icon: '🏅', color: '#FFD166',
    xpReward: 100, description: '24 saat yaşat',
    check: (p) => (p.age ?? 0) >= 24,
  },
  {
    id: 'social_carer', title: 'Sosyal Bakıcı', icon: '🤝', color: COLORS.secondary,
    xpReward: 75, description: 'Partner ile 10 kez besle',
    check: (p) => (p.partnerFeedings ?? 0) >= 10,
  },
  {
    id: 'level5', title: 'Veteriner Dostu', icon: '⭐', color: COLORS.secondary,
    xpReward: 150, description: "Seviye 5'e ulaş",
    check: (p) => (p.level ?? 1) >= 5,
  },
  {
    id: 'healer', title: 'Şifacı', icon: '💊', color: COLORS.success,
    xpReward: 60, description: '3 kez iyileştir',
    check: (p) => (p.totalHealings ?? 0) >= 3,
  },
  {
    id: 'reborn', title: 'Yeniden Doğuş', icon: '🔄', color: '#FFD166',
    xpReward: 80, description: "Bir hayvanı Mezarlık'a uğurla",
    check: (p) => (p.legacyCount ?? 0) >= 1,
  },
  {
    id: 'gourmet', title: 'Gurme', icon: '🍽️', color: COLORS.statHunger,
    xpReward: 45, description: 'Her yemek tipini en az 1 kez yedir',
    check: (p) => {
      const counts = p._foodCounts ?? {};
      return Object.keys(FOOD_TYPES).every((k) => (counts[k] ?? 0) >= 1);
    },
  },
];

// ─── Seviye ödülleri ─────────────────────────────────────────────────────────
export const LEVEL_REWARDS = {
  2:  { title: '🎉 Seviye 2!',  feature: 'Yeni maceralar başlıyor!' },
  3:  { title: '🚀 Seviye 3!',  feature: 'Harika gidiyorsun!' },
  5:  { title: '🌟 Seviye 5!',  feature: 'Veteriner Dostu rozeti!' },
  10: { title: '👑 Seviye 10!', feature: 'Efsanevi bakıcı!' },
};
export const DEFAULT_LEVEL_REWARD = (l) => ({
  title:   `✨ Seviye ${l}!`,
  feature: 'Yeni maceralar seni bekliyor!',
});

// ─── Ölüm sebebi ─────────────────────────────────────────────────────────────
export const deriveDeathReason = (pet) => {
  if ((pet.hunger    ?? 100) < 5)       return 'Açlıktan';
  if ((pet.happiness ?? 100) < 5)       return 'İhmalden';
  if (pet.isSick)                       return 'Hastalıktan';
  if ((pet.age       ?? 0)   > 24 * 7)  return 'Yaşlılıktan';
  return 'İhmalden';
};

// ─── Hızlı mesajlar ──────────────────────────────────────────────────────────
export const QUICK_MESSAGES = [
  { id: 'feed',  label: '🍖 Besleyin',  text: 'Dostumuz çok acıktı, birileri besleyebilir mi? 🍖' },
  { id: 'play',  label: '🎮 Oyun!',     text: 'Hadi hep beraber oyun oynayalım! 🎮' },
  { id: 'check', label: '❤️ Durum?',    text: 'Dostumuzun durumu şu an nasıl? ❤️' },
  { id: 'love',  label: '✨ Sevgi',     text: 'Ona biraz sevgi göstermeye ne dersiniz? ✨' },
];
