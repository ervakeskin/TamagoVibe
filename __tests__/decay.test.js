const {
  applyElapsed, deriveMood, hatchSecondsLeft, needsHatchMigration, clamp, formatAge,
} = require('../src/utils/decay');
const { OFFLINE_HEALTH_FLOOR } = require('../src/constants/gameConfig');

const HOUR = 60 * 60 * 1000;
const base = () => ({
  name: 'Koko', hunger: 100, happiness: 100, energy: 100, health: 100,
  isSick: false, isSleeping: false, isDead: false, age: 0,
});

describe('applyElapsed', () => {
  test('süre geçmezse pet değişmez', () => {
    const pet = base();
    expect(applyElapsed(pet, 0)).toBe(pet);
  });

  test('ölü pet değişmez', () => {
    const pet = { ...base(), isDead: true };
    expect(applyElapsed(pet, 5 * HOUR)).toBe(pet);
  });

  test('1 saatte açlık ~12.5 puan düşer', () => {
    const next = applyElapsed(base(), HOUR);
    expect(next.hunger).toBeCloseTo(87.5, 1);
    expect(next.happiness).toBeCloseTo(92, 1);
    expect(next.energy).toBeCloseTo(94, 1);
  });

  test('8 saat sonra pet aç (açlık ~0)', () => {
    const next = applyElapsed(base(), 8 * HOUR);
    expect(next.hunger).toBeLessThan(5);
  });

  test('2 dakikada açlık neredeyse hiç değişmez (eski hızlı oyun düzeldi)', () => {
    const next = applyElapsed(base(), 2 * 60 * 1000);
    expect(next.hunger).toBeGreaterThan(99);
  });

  test('uyurken enerji artar ve açlık yavaşlar', () => {
    const sleeping = { ...base(), isSleeping: true, energy: 20 };
    const next = applyElapsed(sleeping, HOUR);
    expect(next.energy).toBeGreaterThan(40);
    expect(next.hunger).toBeCloseTo(95, 1);   // 12.5 x 0.4 = 5
    expect(next.mood).toBe('SLEEPING');
  });

  test('değerler 0-100 dışına çıkmaz', () => {
    const next = applyElapsed(base(), 500 * HOUR);
    [next.hunger, next.happiness, next.energy, next.health].forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    });
  });

  test('uzun süre kapalıyken sağlık tabanın altına düşmez, pet ölmez', () => {
    const next = applyElapsed(base(), 72 * HOUR);
    expect(next.health).toBeGreaterThanOrEqual(OFFLINE_HEALTH_FLOOR);
    expect(next.isDead).toBe(false);
    expect(next.isSick).toBe(true);
  });

  test('ekran açıkken (kısa aralık) açlıkta sağlık kaybı olur ve ölüm mümkün', () => {
    let pet = { ...base(), hunger: 0, happiness: 0, health: 1 };
    for (let i = 0; i < 20; i++) pet = applyElapsed(pet, 60 * 1000, { speed: 60 });
    expect(pet.isDead).toBe(true);
    expect(pet.mood).toBe('DEAD');
  });

  test('yaş saat cinsinden artar', () => {
    const next = applyElapsed(base(), 3 * HOUR);
    expect(next.age).toBeCloseTo(3, 2);
  });

  test('hız çarpanı süreyi hızlandırır', () => {
    const slow = applyElapsed(base(), 60 * 1000, { speed: 1 });
    const fast = applyElapsed(base(), 60 * 1000, { speed: 60 });
    expect(fast.hunger).toBeLessThan(slow.hunger);
  });

  test('orijinal pet nesnesi değiştirilmez', () => {
    const pet = base();
    applyElapsed(pet, HOUR);
    expect(pet.hunger).toBe(100);
  });
});

describe('deriveMood', () => {
  test('öncelik sırası', () => {
    expect(deriveMood({ isDead: true })).toBe('DEAD');
    expect(deriveMood({ isSick: true, isSleeping: true })).toBe('SICK');
    expect(deriveMood({ isSleeping: true })).toBe('SLEEPING');
    expect(deriveMood({ energy: 10 })).toBe('TIRED');
    expect(deriveMood({ hunger: 10 })).toBe('HUNGRY');
    expect(deriveMood({ happiness: 10 })).toBe('SAD');
    expect(deriveMood({ hunger: 90, happiness: 90, energy: 90 })).toBe('HAPPY');
    expect(deriveMood({ hunger: 50, happiness: 50, energy: 60 })).toBe('NEUTRAL');
  });
});

describe('kuluçka', () => {
  test('kalan süre geriye sayar ve 0da durur', () => {
    const start = 1_000_000;
    expect(hatchSecondsLeft(start, 60, start)).toBe(60);
    expect(hatchSecondsLeft(start, 60, start + 20_000)).toBe(40);
    expect(hatchSecondsLeft(start, 60, start + 90_000)).toBe(0);
  });

  test('zaman damgası yoksa süre 0', () => {
    expect(hatchSecondsLeft(null, 60)).toBe(0);
  });

  test('eski kayıt göçü: isimsiz, ölü olmayan, kuluçkasız pet', () => {
    expect(needsHatchMigration({ name: '', isDead: false, hatchStartedAt: null })).toBe(true);
    expect(needsHatchMigration({ name: 'Koko' })).toBe(false);
    expect(needsHatchMigration({ name: '', isDead: true })).toBe(false);
    expect(needsHatchMigration({ name: '', hatchStartedAt: 5 })).toBe(false);
    expect(needsHatchMigration(null)).toBe(false);
  });
});

test('clamp sınırları', () => {
  expect(clamp(-5)).toBe(0);
  expect(clamp(150)).toBe(100);
  expect(clamp(42)).toBe(42);
});

test('yaş biçimi saat ve gün gösterir', () => {
  expect(formatAge(0)).toBe('0 sa');
  expect(formatAge(5.9)).toBe('5 sa');
  expect(formatAge(24)).toBe('1 gün 0 sa');
  expect(formatAge(51)).toBe('2 gün 3 sa');
  expect(formatAge(undefined)).toBe('0 sa');
});
