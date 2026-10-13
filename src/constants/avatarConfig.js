// 3D oyun avatarları — Metro statik require (Quaternius, CC0)
export const AVATAR_MODELS = {
  FOX:   require('../../assets/animals/Fox.gltf'),
  DOG:   require('../../assets/animals/ShibaInu.gltf'),
  HUSKY: require('../../assets/animals/Husky.gltf'),
  WOLF:  require('../../assets/animals/Wolf.gltf'),
};

export const AVATAR_TYPES = Object.keys(AVATAR_MODELS);

export const DEFAULT_AVATAR_TYPE = 'FOX';

/** Eski kayıtlardaki türler (CAT, PANDA...) varsayılana düşer */
export const normalizePetType = (petType) => {
  const key = petType ? String(petType).toUpperCase() : DEFAULT_AVATAR_TYPE;
  return AVATAR_MODELS[key] ? key : DEFAULT_AVATAR_TYPE;
};

export const getAvatarModel = (petType) => AVATAR_MODELS[normalizePetType(petType)];
