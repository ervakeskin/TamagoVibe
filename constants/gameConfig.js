// =============================================================================
// src/constants/gameConfig.js — TamagoVibe
// Tüm oyun sabitleri, pet türleri, XP sistemi ve renk paleti burada.
// PetAvatar.jsx ve theme.ts bu dosyadan import eder.
// =============================================================================

// ─── Ana Renk Paleti ─────────────────────────────────────────────────────────
export const COLORS = {
  // Arka planlar
  background: '#FFFBF5',   // kağıt beyazı — ana arka plan
  card:       '#FFFFFF',   // saf beyaz kartlar
  surface:    '#FAF6F1',   // krem yüzey

  // Metin
  text:       '#2D3748',   // yumuşak antrasit
  textSoft:   '#A08C89',   // ikincil metin
  textSubtle: '#C4B5B5',   // üçüncül / placeholder

  // Vurgu renkleri
  primary:    '#FF4D6D',   // ana pembe
  secondary:  '#48CAE4',   // sosyal mavi
  roseGold:   '#C9A69E',   // rose gold aksesuar

  // Pet renkleri (glow için)
  mint:       '#B2F5EA',   // nane — panda, kurbağa, capybara
  lavender:   '#E9D8FD',   // lavanta — tilki, aslan
  sky:        '#BEE3F8',   // gökyüzü mavisi — köpek, koala
  peach:      '#FFD6C0',   // şeftali — tavşan, kedi

  // Durum renkleri
  danger:     '#E8927C',   // uyarı / kritik
  success:    '#A8C5A0',   // başarı / sağlık
  warning:    '#F6AD55',   // dikkat
  info:       '#48CAE4',   // bilgi

  // Stat çubukları
  statHunger:    '#E8927C',   // coral
  statHappiness: '#D4A0C0',   // pembe mor
  statEnergy:    '#B5EAD7',   // nane
  statHealth:    '#A8C5A0',   // adaçayı yeşili
};

// ─── Kuluçka Süresi ───────────────────────────────────────────────────────────
// Test: 2 dk | Prodüksiyon için: 60 veya 120 yap
export const HATCH_TIME_MINUTES = 2;

// ─── Pet Türleri ─────────────────────────────────────────────────────────────
// id: PetAvatar.jsx PET_IMAGES map key'i ile eşleşmeli (büyük harf)
// image: assets/images/ klasörüne eklince true yap (PetAvatar otomatik yükler)
export const PET_TYPES = {
  FOX:      { id: 'FOX',      emoji: '🦊', color: COLORS.lavender, label: 'Tilki',    hasImage: true  },
  CAT:      { id: 'CAT',      emoji: '🐱', color: COLORS.peach,    label: 'Kedi',     hasImage: true  },
  PANDA:    { id: 'PANDA',    emoji: '🐼', color: COLORS.mint,     label: 'Panda',    hasImage: true  },
  RABBIT:   { id: 'RABBIT',   emoji: '🐰', color: COLORS.peach,    label: 'Tavşan',   hasImage: true  },
  DOG:      { id: 'DOG',      emoji: '🐶', color: COLORS.sky,      label: 'Köpek',    hasImage: false },
  KOALA:    { id: 'KOALA',    emoji: '🐨', color: COLORS.sky,      label: 'Koala',    hasImage: false },
  CAPYBARA: { id: 'CAPYBARA', emoji: '🦦', color: COLORS.mint,     label: 'Capybara', hasImage: false },
  LION:     { id: 'LION',     emoji: '🦁', color: COLORS.lavender, label: 'Aslan',    hasImage: false },
  FROG:     { id: 'FROG',     emoji: '🐸', color: COLORS.mint,     label: 'Kurbağa',  hasImage: false },
};

// ─── Başlangıç Pet State ──────────────────────────────────────────────────────
export const INITIAL_PET_STATE = {
  name:              '',
  petType:           null,       // PET_TYPES key'i atanır (hatch sırasında)
  hunger:            100,
  happiness:         100,
  energy:            100,
  health:            100,
  level:             1,
  xp:                0,
  age:               0,
  isDead:            false,
  isSick:            false,
  isSleeping:        false,
  mood:              'HAPPY',    // büyük harf: 'HAPPY' | 'SAD' | 'HUNGRY' | 'TIRED' | 'SICK' | 'SLEEPING' | 'DEAD'
  totalFeedings:     0,
  totalHealings:     0,
  partnerFeedings:   0,
  maxHappinessCount: 0,
  unlockedBadges:    [],
  legacyCount:       0,
  favoriteFood:      null,
  _foodCounts:       {},
  lastActionBy:      null,
  lastActionType:    null,
  lastFed:           null,
  hatchStartedAt:    null,       // Date.now() — Unix ms
  updatedAt:         null,
};

// ─── Titreşim Paternleri ──────────────────────────────────────────────────────
export const VIBRATION = {
  button:   10,
  action:   [0, 25, 50, 25],
  levelUp:  [0, 50, 20, 50],
  death:    [0, 100, 50, 100],
  rebirth:  30,
  alert:    [0, 40, 30, 40],
};

// ─── XP Sistemi ───────────────────────────────────────────────────────────────
/** Bir sonraki seviye için gereken XP: level × 100 */
export const xpForNextLevel = (level) => level * 100;

/** Toplam XP'den mevcut seviyeyi hesapla */
export const deriveLevelFromXp = (totalXp) => {
  let level = 1;
  let xp    = totalXp;
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level++;
  }
  return level;
};

/** Mevcut seviye içindeki ilerleme oranı (0.0 – 1.0) */
export const xpProgressInLevel = (totalXp) => {
  let level = 1;
  let xp    = totalXp;
  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level++;
  }
  return xp / xpForNextLevel(level);
};

// ─── Yemek Tipleri ────────────────────────────────────────────────────────────
export const FOOD_TYPES = {
  snack: {
    id:          'snack',
    label:       'Atıştırmalık',
    icon:        '🍪',
    hunger:      10,
    health:      0,
    happiness:   2,
    xp:          2,
    color:       COLORS.statHunger,
    description: 'Hafif atıştırmalık, düşük doyum',
  },
  meal: {
    id:          'meal',
    label:       'Ana Yemek',
    icon:        '🍱',
    hunger:      30,
    health:      0,
    happiness:   5,
    xp:          5,
    color:       COLORS.primary,
    description: 'Doyurucu ana öğün',
  },
  vitamin: {
    id:          'vitamin',
    label:       'Vitamin',
    icon:        '💊',
    hunger:      0,
    health:      8,
    happiness:   3,
    xp:          10,
    color:       COLORS.success,
    description: 'Sağlığı güçlendirir',
  },
  treat: {
    id:          'treat',
    label:       'Ödül Maması',
    icon:        '🍬',
    hunger:      15,
    health:      0,
    happiness:   15,
    xp:          8,
    color:       '#FFD166',
    description: 'Çok mutlu eder, az doyurur',
  },
};

// ─── Rozet Tanımları ──────────────────────────────────────────────────────────
export const ACHIEVEMENTS = [
  {
    id:          'first_meal',
    title:       'İlk Lokma',
    icon:        '🍖',
    color:       COLORS.statHunger,
    xpReward:    20,
    description: 'İlk kez besle',
    check:       (p) => p.totalFeedings >= 1,
  },
  {
    id:          'night_owl',
    title:       'Gece Kuşu',
    icon:        '🦉',
    color:       COLORS.lavender,
    xpReward:    50,
    description: 'Gece 00:00–06:00 arası besle',
    check:       (p, ctx) => {
      const h = ctx?.feedHour ?? new Date().getHours();
      return h >= 0 && h < 6 && p.totalFeedings >= 1;
    },
  },
  {
    id:          'survivor',
    title:       'Hayatta Kalma Uzmanı',
    icon:        '🏅',
    color:       '#FFD166',
    xpReward:    100,
    description: '60 tick yaşat',
    check:       (p) => p.age >= 60,
  },
  {
    id:          'social_carer',
    title:       'Sosyal Bakıcı',
    icon:        '🤝',
    color:       COLORS.secondary,
    xpReward:    75,
    description: 'Partner ile 10 kez besle',
    check:       (p) => (p.partnerFeedings ?? 0) >= 10,
  },
  {
    id:          'level5',
    title:       'Veteriner Dostu',
    icon:        '⭐',
    color:       COLORS.secondary,
    xpReward:    150,
    description: "Seviye 5'e ulaş",
    check:       (p) => p.level >= 5,
  },
  {
    id:          'healer',
    title:       'Şifacı',
    icon:        '💊',
    color:       COLORS.success,
    xpReward:    60,
    description: '3 kez iyileştir',
    check:       (p) => p.totalHealings >= 3,
  },
  {
    id:          'reborn',
    title:       'Yeniden Doğuş',
    icon:        '🔄',
    color:       '#FFD166',
    xpReward:    80,
    description: "Bir hayvanı Mezarlık'a uğurla",
    check:       (p) => (p.legacyCount ?? 0) >= 1,
  },
  {
    id:          'gourmet',
    title:       'Gurme',
    icon:        '🍽️',
    color:       COLORS.statHunger,
    xpReward:    45,
    description: 'Her yemek tipini en az 1 kez yedir',
    check:       (p) => {
      const counts = p._foodCounts ?? {};
      return Object.keys(FOOD_TYPES).every((k) => (counts[k] ?? 0) >= 1);
    },
  },
];

// ─── Level Ödülleri ───────────────────────────────────────────────────────────
export const LEVEL_REWARDS = {
  2:  { title: '🎉 Seviye 2!',  feature: 'Ödül Maması açıldı!' },
  3:  { title: '🚀 Seviye 3!',  feature: 'Partner bildirimleri aktif!' },
  5:  { title: '🌟 Seviye 5!',  feature: 'Efsanevi mod açıldı!' },
  10: { title: '👑 Seviye 10!', feature: 'Tüm rozetler açılabilir!' },
};
export const DEFAULT_LEVEL_REWARD = (l) => ({
  title:   `✨ Seviye ${l}!`,
  feature: 'Yeni maceralar seni bekliyor!',
});

// ─── Ölüm Sebebi Tahmini ──────────────────────────────────────────────────────
export const deriveDeathReason = (pet) => {
  if ((pet.hunger    ?? 100) < 5)   return 'Açlıktan';
  if ((pet.happiness ?? 100) < 5)   return 'İhmalden';
  if (pet.isSick)                   return 'Hastalıktan';
  if ((pet.age       ?? 0)   > 200) return 'Yaşlılıktan';
  return 'İhmalden';
};

// ─── Hızlı Mesajlar (ChatScreen) ─────────────────────────────────────────────
export const QUICK_MESSAGES = [
  { id: 'feed',  label: '🍖 Besle!',    text: "Hey! Koko aç, lütfen besler misin? 🍖" },
  { id: 'play',  label: '🎀 Oyna!',     text: 'Koko biraz oyun oynamak istiyor! 🎀' },
  { id: 'sick',  label: '🌡️ Hasta!',    text: 'Dikkat! Koko hasta görünüyor! 🌡️' },
  { id: 'check', label: '❤️ Nasıl?',    text: "Koko'nun durumu nasıl? ❤️" },
  { id: 'sleep', label: '💤 Uyutsana!', text: 'Koko yorgun, uyutmayı unutma! 💤' },
];