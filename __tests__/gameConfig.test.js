const {
  deriveLevelFromXp, xpProgressInLevel, xpForNextLevel,
  FOOD_TYPES, ACHIEVEMENTS, deriveDeathReason,
  PET_TYPES, RARITIES, pickPetType, INITIAL_PET_STATE,
  HATCH_SECONDS, QUICK_MESSAGES,
} = require('../src/constants/gameConfig');

describe('XP ve seviye', () => {
  test('seviye başına 100 x seviye XP gerekir', () => {
    expect(xpForNextLevel(1)).toBe(100);
    expect(xpForNextLevel(3)).toBe(300);
  });

  test('toplam XP seviyeye çevrilir', () => {
    expect(deriveLevelFromXp(0)).toBe(1);
    expect(deriveLevelFromXp(99)).toBe(1);
    expect(deriveLevelFromXp(100)).toBe(2);
    expect(deriveLevelFromXp(300)).toBe(3);   // 100 + 200
    expect(deriveLevelFromXp(600)).toBe(4);   // 100 + 200 + 300
  });

  test('seviye içi ilerleme 0-1 arasındadır', () => {
    expect(xpProgressInLevel(50)).toBeCloseTo(0.5);
    expect(xpProgressInLevel(100)).toBeCloseTo(0);
    expect(xpProgressInLevel(200)).toBeCloseTo(0.5);
  });
});

describe('yemekler', () => {
  test('her yemeğin etiketi, ikonu ve XP değeri var', () => {
    Object.values(FOOD_TYPES).forEach((f) => {
      expect(f.label).toBeTruthy();
      expect(f.icon).toBeTruthy();
      expect(f.xp).toBeGreaterThan(0);
    });
  });

  test('en az 6 yemek tanımlı', () => {
    expect(Object.keys(FOOD_TYPES)).toHaveLength(6);
  });
});

describe('rozetler', () => {
  const byId = (id) => ACHIEVEMENTS.find((a) => a.id === id);

  test('ilk lokma ilk beslemede açılır', () => {
    expect(byId('first_meal').check({ totalFeedings: 0 })).toBe(false);
    expect(byId('first_meal').check({ totalFeedings: 1 })).toBe(true);
  });

  test('gece kuşu sadece 00:00-06:00 arası', () => {
    expect(byId('night_owl').check({ totalFeedings: 1 }, { feedHour: 3 })).toBe(true);
    expect(byId('night_owl').check({ totalFeedings: 1 }, { feedHour: 14 })).toBe(false);
  });

  test('hayatta kalma 24 saat yaşayınca açılır', () => {
    expect(byId('survivor').check({ age: 23 })).toBe(false);
    expect(byId('survivor').check({ age: 24 })).toBe(true);
  });

  test('gurme tüm yemekleri yemeyi ister', () => {
    const all = Object.fromEntries(Object.keys(FOOD_TYPES).map((k) => [k, 1]));
    expect(byId('gourmet').check({ _foodCounts: all })).toBe(true);
    expect(byId('gourmet').check({ _foodCounts: { snack: 1 } })).toBe(false);
  });

  test('rozet kimlikleri benzersiz', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('ölüm sebebi', () => {
  test('açlık, mutsuzluk, hastalık ve yaşlılık ayrışır', () => {
    expect(deriveDeathReason({ hunger: 0 })).toBe('Açlıktan');
    expect(deriveDeathReason({ hunger: 50, happiness: 1 })).toBe('İhmalden');
    expect(deriveDeathReason({ hunger: 50, happiness: 50, isSick: true })).toBe('Hastalıktan');
    expect(deriveDeathReason({ hunger: 50, happiness: 50, age: 24 * 8 })).toBe('Yaşlılıktan');
  });
});

describe('türler ve nadirlik', () => {
  test('tür ağırlıkları toplamı 100', () => {
    const total = Object.values(PET_TYPES).reduce((s, t) => s + t.weight, 0);
    expect(total).toBe(100);
  });

  test('her türün geçerli bir nadirliği var', () => {
    Object.values(PET_TYPES).forEach((t) => {
      expect(RARITIES[t.rarity]).toBeDefined();
      expect(t.about).toBeTruthy();
    });
  });

  test('pickPetType ağırlığa göre seçer', () => {
    expect(pickPetType(() => 0)).toBe('FOX');
    expect(pickPetType(() => 0.999)).toBe('WOLF');
  });

  test('1000 çekilişte yaygın türler nadirlerden fazla çıkar', () => {
    const counts = {};
    for (let i = 0; i < 1000; i++) {
      const t = pickPetType();
      counts[t] = (counts[t] ?? 0) + 1;
    }
    expect((counts.FOX ?? 0) + (counts.DOG ?? 0)).toBeGreaterThan(counts.WOLF ?? 0);
    Object.keys(counts).forEach((k) => expect(PET_TYPES[k]).toBeDefined());
  });
});

describe('başlangıç durumu', () => {
  test('yeni pet isimsiz ve tam doludur', () => {
    expect(INITIAL_PET_STATE.name).toBe('');
    expect(INITIAL_PET_STATE.health).toBe(100);
    expect(INITIAL_PET_STATE.isDead).toBe(false);
  });

  test('kuluçka süresi pozitif', () => {
    expect(HATCH_SECONDS).toBeGreaterThan(0);
  });

  test('hızlı mesajlar tanımlı', () => {
    expect(QUICK_MESSAGES.length).toBeGreaterThan(0);
  });
});
