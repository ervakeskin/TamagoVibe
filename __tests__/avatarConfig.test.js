const {
  AVATAR_MODELS, AVATAR_TYPES, normalizePetType, getAvatarModel, DEFAULT_AVATAR_TYPE,
} = require('../src/constants/avatarConfig');
const { PET_TYPES } = require('../src/constants/gameConfig');
const fs = require('fs');
const path = require('path');

test('her pet türünün bir 3D modeli var', () => {
  Object.keys(PET_TYPES).forEach((t) => expect(AVATAR_MODELS[t]).toBeDefined());
  expect(AVATAR_TYPES.sort()).toEqual(Object.keys(PET_TYPES).sort());
});

test('model dosyaları diskte mevcut ve lisans dosyası yanında', () => {
  ['Fox', 'ShibaInu', 'Husky', 'Wolf'].forEach((n) => {
    expect(fs.existsSync(path.join(__dirname, '../assets/animals', `${n}.gltf`))).toBe(true);
  });
  expect(fs.existsSync(path.join(__dirname, '../assets/animals/LICENSE-Quaternius-CC0.txt'))).toBe(true);
});

test('modeller animasyon klipleri içerir (Idle, Eating, Death)', () => {
  ['Fox', 'ShibaInu', 'Husky', 'Wolf'].forEach((n) => {
    const gltf = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/animals', `${n}.gltf`), 'utf8'));
    const names = gltf.animations.map((a) => a.name);
    ['Idle', 'Idle_2', 'Idle_2_HeadLow', 'Idle_HitReact1', 'Idle_HitReact2', 'Eating', 'Gallop_Jump', 'Death']
      .forEach((c) => expect(names).toContain(c));
  });
});

test('bilinmeyen veya eski tür varsayılana düşer', () => {
  expect(normalizePetType('cat')).toBe(DEFAULT_AVATAR_TYPE);
  expect(normalizePetType(null)).toBe(DEFAULT_AVATAR_TYPE);
  expect(normalizePetType('wolf')).toBe('WOLF');          // küçük harf kabul
  expect(getAvatarModel('PANDA')).toBe(AVATAR_MODELS.FOX);
});
