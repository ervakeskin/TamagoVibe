// =============================================================================
// decay.js — Geçen süreye göre pet durumunu hesaplayan saf fonksiyonlar
// Hem ekran açıkken (tick) hem uygulama kapalıyken geçen süre için kullanılır.
// =============================================================================

import {
  DECAY_PER_HOUR,
  GAME_SPEED,
  OFFLINE_HEALTH_FLOOR,
  OFFLINE_THRESHOLD_MS,
} from '../constants/gameConfig';

const HOUR_MS = 60 * 60 * 1000;

export const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));

export const deriveMood = (s) => {
  if (s.isDead)                  return 'DEAD';
  if (s.isSick)                  return 'SICK';
  if (s.isSleeping)              return 'SLEEPING';
  if ((s.energy    ?? 100) < 20) return 'TIRED';
  if ((s.hunger    ?? 100) < 30) return 'HUNGRY';
  if ((s.happiness ?? 100) < 30) return 'SAD';
  if (
    (s.hunger    ?? 100) > 70 &&
    (s.happiness ?? 100) > 70 &&
    (s.energy    ?? 100) > 50
  )                              return 'HAPPY';
  return 'NEUTRAL';
};

/** Bir değerin eşik altında geçirdiği süre (saat), sabit oranda azaldığı varsayımıyla */
const hoursBelow = (start, ratePerHour, threshold, elapsedHours) => {
  if (ratePerHour <= 0) return start < threshold ? elapsedHours : 0;
  const hoursUntilThreshold = Math.max(0, (start - threshold) / ratePerHour);
  return Math.max(0, elapsedHours - hoursUntilThreshold);
};

/**
 * Pet'e `elapsedMs` süre uygular. Pet nesnesini değiştirmez, yenisini döner.
 * - Uyurken enerji artar, açlık yavaşlar.
 * - Açlık veya mutluluk < 10 iken sağlık düşer, iyiyken yavaşça toparlanır.
 * - Uzun (uygulama kapalı) aralıkta sağlık OFFLINE_HEALTH_FLOOR altına düşmez.
 */
export const applyElapsed = (pet, elapsedMs, { speed = GAME_SPEED } = {}) => {
  if (!pet || pet.isDead || !(elapsedMs > 0)) return pet;

  const hours = (elapsedMs * speed) / HOUR_MS;
  const sleeping = !!pet.isSleeping;
  const R = DECAY_PER_HOUR;

  const hungerRate    = R.hunger * (sleeping ? R.sleepHungerMul : 1);
  const happinessRate = R.happiness;

  const hunger    = clamp((pet.hunger    ?? 100) - hungerRate * hours);
  const happiness = clamp((pet.happiness ?? 100) - happinessRate * hours);
  const energy    = sleeping
    ? clamp((pet.energy ?? 100) + R.sleepEnergy * hours)
    : clamp((pet.energy ?? 100) - R.energy * hours);

  const starveHours = Math.max(
    hoursBelow(pet.hunger    ?? 100, hungerRate,    10, hours),
    hoursBelow(pet.happiness ?? 100, happinessRate, 10, hours),
  );

  let health = pet.health ?? 100;
  const wellHours = Math.max(0, hours - starveHours);
  if (hunger >= 30 && happiness >= 30) health += R.healthRegen * wellHours;
  health -= R.healthLoss * starveHours;
  health = clamp(health);

  const offline = elapsedMs >= OFFLINE_THRESHOLD_MS;
  if (offline) {
    health = Math.max(health, Math.min(pet.health ?? 100, OFFLINE_HEALTH_FLOOR));
  }

  const next = {
    ...pet,
    hunger,
    happiness,
    energy,
    health,
    isSick:  health < 30,
    isDead:  health <= 0,
    age:     Math.round(((pet.age ?? 0) + hours) * 1000) / 1000,
  };
  next.mood = deriveMood(next);
  return next;
};

/** Yaş (saat) → "5 sa" veya "2 gün 3 sa" */
export const formatAge = (hours = 0) => {
  const h = Math.max(0, Math.floor(hours));
  const days = Math.floor(h / 24);
  return days > 0 ? `${days} gün ${h % 24} sa` : `${h} sa`;
};

/** Kuluçka: kalan saniye (0 = hazır). Zaman damgası yoksa 0 döner. */
export const hatchSecondsLeft = (hatchStartedAt, hatchSeconds, now = Date.now()) => {
  if (!hatchStartedAt) return 0;
  const elapsed = Math.floor((now - hatchStartedAt) / 1000);
  return Math.max(0, hatchSeconds - elapsed);
};

/** Eski kayıt: isimsiz, ölü değil ve kuluçka zamanı yok → kuluçkaya al */
export const needsHatchMigration = (pet) =>
  !!pet && !pet.name && !pet.isDead && !pet.hatchStartedAt;
