// =============================================================================
// src/constants/gameConfig.js — Global Sosyal Versiyon (v8)
// Lüks Arayüz için Renk ve Stat Optimizasyonları
// =============================================================================

export { COLORS, NEON, FONTS, SPACING, RADIUS, SHADOWS, CARD_STYLE } from './theme';

// ─── Hayvan Türleri & Karakterler ─────────────────────────────────────────────
// Lüks Arayüz için her türe özel derinlik renkleri eklendi
export const PET_TYPES = {
  cat:      { id: 'cat',      label: 'Kedi',     emoji: '🐱', color: '#ffd166', deepColor: '#2d2416' },
  dog:      { id: 'dog',      label: 'Köpek',    emoji: '🐶', color: '#f4845f', deepColor: '#2a1610' },
  fox:      { id: 'fox',      label: 'Tilki',    emoji: '🦊', color: '#e06c75', deepColor: '#2a1012' },
  rabbit:   { id: 'rabbit',   label: 'Tavşan',   emoji: '🐰', color: '#48cae4', deepColor: '#0e2029' },
  capybara: { id: 'capybara', label: 'Capybara', emoji: '🦦', color: '#98c379', deepColor: '#102418' },
  lion:     { id: 'lion',     label: 'Aslan',    emoji: '🦁', color: '#ffd166', deepColor: '#2d2416' },
  panda:    { id: 'panda',    label: 'Panda',    emoji: '🐼', color: '#f7fafc', deepColor: '#1a1f28' },
  koala:    { id: 'koala',    label: 'Koala',    emoji: '🐨', color: '#a0aec0', deepColor: '#1a1f28' },
  frog:     { id: 'frog',     label: 'Kurbağa',  emoji: '🐸', color: '#68d391', deepColor: '#102418' },
};

// ─── Oyun Dengesi Sabitleri ──────────────────────────────────────────────────
export const HATCH_TIME_MINUTES = 2; // Test için 1 dakikaya indirebilirsin

// ─── Yemek Tipleri (Gurme Menüsü & Neon Efektler) ─────────────────────────────
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

// ─── Hızlı Mesajlar (Evrensel & Sosyal) ───────────────────────────────────────
export const QUICK_MESSAGES = [
  { id: 'feed',  label: '🍖 Besleyin',  text: "Dostumuz çok acıktı, birileri besleyebilir mi? 🍖" },
  { id: 'play',  label: '🎮 Oyun!',     text: 'Hadi hep beraber oyun oynayalım! 🎮' },
  { id: 'check', label: '❤️ Durum?',    text: "Dostumuzun durumu şu an nasıl? ❤️" },
  { id: 'love',  label: '✨ Sevgi',     text: 'Ona biraz sevgi göstermeye ne dersiniz? ✨' },
];

// --- Başlangıç State (Evrensel & Sonsuz Döngü) ---
export const INITIAL_PET_STATE = {
  name:              '',
  petType:           null,
  hunger:            80,
  happiness:         80,
  energy:            80,
  health:            100,
  xp:                0,
  level:             1,
  age:               0,
  isSick:            false,
  isSleeping:        false,
  isDead:            false,
  hatchStartedAt:    null, 
  unlockedBadges:    [],
  legacyCount:       0,
  partnerIds:        [],   
  updatedAt:         null,
};

// XP ve Seviye hesaplama fonksiyonları v8 için korundu
export const xpForNextLevel = (level) => level * 100;
export const deriveLevelFromXp = (totalXp) => {
  let level = 1; let xp = totalXp;
  while (xp >= xpForNextLevel(level)) { xp -= xpForNextLevel(level); level++; }
  return level;
};
export const xpProgressInLevel = (totalXp) => {
  let level = 1; let xp = totalXp;
  while (xp >= xpForNextLevel(level)) { xp -= xpForNextLevel(level); level++; }
  return xp / xpForNextLevel(level);
};