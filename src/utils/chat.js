/** İki uid'den deterministik chatId üretir */
export const buildChatId = (uid1, uid2) =>
  [uid1, uid2].sort().join('_');

export const chatStorageKey = (petId, chatId) => `${petId}:${chatId}`;
