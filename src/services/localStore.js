// =============================================================================
// localStore.js — AsyncStorage tabanlı yerel veri (Firebase yerine)
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_PET_STATE, pickPetType } from '../constants/gameConfig';
import { DEMO_PARTNER, DEMO_WELCOME_MESSAGES } from '../constants/demoConfig';
import { buildChatId, chatStorageKey } from '../utils/chat';
import { needsHatchMigration } from '../utils/decay';
import { logError } from '../utils/logger';
import { makeCredentials, verifyPassword } from '../utils/passwordHash';

const DATA_KEY = '@tamago/data';

const emptyData = () => ({
  users: {},
  pets: {},
  graveyard: [],
  chats: {},
  accounts: [], // { email, uid, salt, hash } — yalnızca cihazda (eski kayıtlarda password)
});

let cache = null;
const petListeners = new Map();   // petId -> Set<callback>
const chatListeners = new Map();    // storageKey -> Set<callback>
const graveyardListeners = new Map(); // userId -> Set<callback>

const notify = (map, key, payload) => {
  const set = map.get(key);
  if (!set) return;
  set.forEach((cb) => {
    try { cb(payload); } catch (e) { logError('localStore.notify', e); }
  });
};

const load = async () => {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(DATA_KEY);
    cache = raw ? { ...emptyData(), ...JSON.parse(raw) } : emptyData();
  } catch (e) {
    logError('localStore.load', e);
    cache = emptyData();
  }
  if (!cache.users) cache.users = {};
  if (!cache.pets) cache.pets = {};
  if (!cache.graveyard) cache.graveyard = [];
  if (!cache.chats) cache.chats = {};
  if (!cache.accounts) cache.accounts = [];
  return cache;
};

const persist = async () => {
  if (!cache) return;
  await AsyncStorage.setItem(DATA_KEY, JSON.stringify(cache));
};

const genId = () => `_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// ─── Hesaplar (authService ile paylaşılır) ────────────────────────────────────
export const findAccountByEmail = async (email) => {
  const data = await load();
  return data.accounts.find((a) => a.email === email.trim().toLowerCase()) ?? null;
};

export const addAccount = async ({ email, password, uid }) => {
  const data = await load();
  data.accounts.push({
    email: email.trim().toLowerCase(),
    uid,
    ...makeCredentials(password),
  });
  await persist();
};

/**
 * Şifre kontrolü. Eski (düz metin) kayıt doğru şifreyle girilirse otomatik olarak
 * tuzlu özete yükseltilir ve düz metin silinir.
 */
export const checkPassword = async (email, password) => {
  const data = await load();
  const account = data.accounts.find((a) => a.email === email.trim().toLowerCase());
  if (!account) return null;

  if (account.hash) return verifyPassword(password, account) ? account : null;

  if (typeof account.password === 'string' && account.password === password) {
    Object.assign(account, makeCredentials(password));
    delete account.password;
    await persist();
    return account;
  }
  return null;
};

// ─── Kullanıcı / pet ──────────────────────────────────────────────────────────
export const getUser = async (uid) => {
  const data = await load();
  return data.users[uid] ?? null;
};

export const saveUser = async (uid, patch) => {
  const data = await load();
  data.users[uid] = { ...data.users[uid], ...patch };
  await persist();
};

export const getPet = async (petId) => {
  const data = await load();
  return data.pets[petId] ?? null;
};

export const savePet = async (petId, petData) => {
  const data = await load();
  data.pets[petId] = { ...petData, updatedAt: Date.now() };
  await persist();
  notify(petListeners, petId, data.pets[petId]);
};

export const subscribePet = (petId, callback) => {
  if (!petListeners.has(petId)) petListeners.set(petId, new Set());
  petListeners.get(petId).add(callback);

  load().then((data) => {
    const pet = data.pets[petId];
    if (pet) callback(pet);
  });

  return () => petListeners.get(petId)?.delete(callback);
};

export const createUserWithPet = async ({
  uid,
  email,
  displayName,
  password,
}) => {
  const data = await load();
  const petId = `pet_${uid}`;

  data.users[uid] = {
    displayName: displayName.trim(),
    email: email.trim().toLowerCase(),
    petId,
    legacyCount: 0,
    totalBadges: 0,
    createdAt: Date.now(),
  };

  data.pets[petId] = {
    ...INITIAL_PET_STATE,
    name: '',
    petType: pickPetType(),
    ownerId: uid,
    partnerIds: [DEMO_PARTNER.uid],
    hatchStartedAt: Date.now(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  data.users[DEMO_PARTNER.uid] = {
    displayName: DEMO_PARTNER.displayName,
    email: 'demo@tamagovibe.local',
    petId: null,
    isDemo: true,
  };
  const chatId = buildChatId(uid, DEMO_PARTNER.uid);
  const key = chatStorageKey(petId, chatId);
  const now = Date.now();
  data.chats[key] = DEMO_WELCOME_MESSAGES.map((text, i) => ({
    id: genId(),
    text,
    senderId: DEMO_PARTNER.uid,
    senderName: DEMO_PARTNER.displayName,
    createdAt: now - (DEMO_WELCOME_MESSAGES.length - i) * 60000,
  }));

  data.accounts.push({
    email: email.trim().toLowerCase(),
    uid,
    ...makeCredentials(password),
  });

  await persist();
  notify(petListeners, petId, data.pets[petId]);
  return { uid, petId };
};

const ensureDemoSeed = (data, petId, ownerId) => {
  if (!data.users[DEMO_PARTNER.uid]) {
    data.users[DEMO_PARTNER.uid] = {
      displayName: DEMO_PARTNER.displayName,
      email: 'demo@tamagovibe.local',
      petId: null,
      isDemo: true,
    };
  }
  const chatId = buildChatId(ownerId, DEMO_PARTNER.uid);
  const key = chatStorageKey(petId, chatId);
  if (!data.chats[key]?.length) {
    const now = Date.now();
    data.chats[key] = DEMO_WELCOME_MESSAGES.map((text, i) => ({
      id: genId(),
      text,
      senderId: DEMO_PARTNER.uid,
      senderName: DEMO_PARTNER.displayName,
      createdAt: now - (DEMO_WELCOME_MESSAGES.length - i) * 60000,
    }));
  }
};

export const ensurePet = async (petId, ownerId) => {
  const data = await load();
  if (data.pets[petId]) {
    const pet = data.pets[petId];
    let changed = false;
    if (!(pet.partnerIds ?? []).includes(DEMO_PARTNER.uid)) {
      pet.partnerIds = [...(pet.partnerIds ?? []), DEMO_PARTNER.uid];
      ensureDemoSeed(data, petId, ownerId);
      changed = true;
    }
    // Eski kayıt: isimsiz pet yumurta ekranını atlıyordu → kuluçkaya al
    if (needsHatchMigration(pet)) {
      pet.hatchStartedAt = Date.now();
      changed = true;
    }
    if (!pet.name && !pet.petType) {
      pet.petType = pickPetType();
      changed = true;
    }
    if (changed) {
      await persist();
      notify(petListeners, petId, pet);
    }
    return pet;
  }
  const pet = {
    ...INITIAL_PET_STATE,
    ownerId,
    petType: pickPetType(),
    hatchStartedAt: Date.now(),
    partnerIds: [DEMO_PARTNER.uid],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  data.pets[petId] = pet;
  ensureDemoSeed(data, petId, ownerId);
  await persist();
  notify(petListeners, petId, pet);
  return pet;
};

export const incrementLegacy = async (uid) => {
  const data = await load();
  const u = data.users[uid];
  if (!u) return;
  u.legacyCount = (u.legacyCount ?? 0) + 1;
  await persist();
};

// ─── Mezarlık ─────────────────────────────────────────────────────────────────
export const addGraveyardEntry = async (entry) => {
  const data = await load();
  const row = { id: genId(), diedAt: Date.now(), ...entry };
  data.graveyard.unshift(row);
  await persist();
  notify(graveyardListeners, entry.ownerId, getGraveyardForUser(entry.ownerId, data));
  return row;
};

const getGraveyardForUser = (userId, data = cache) =>
  (data?.graveyard ?? [])
    .filter((e) => e.ownerId === userId)
    .sort((a, b) => (b.diedAt ?? 0) - (a.diedAt ?? 0))
    .slice(0, 50);

export const getGraveyard = async (userId) => {
  const data = await load();
  return getGraveyardForUser(userId, data);
};

export const subscribeGraveyard = (userId, callback) => {
  if (!graveyardListeners.has(userId)) graveyardListeners.set(userId, new Set());
  graveyardListeners.get(userId).add(callback);

  load().then((data) => callback(getGraveyardForUser(userId, data)));

  return () => graveyardListeners.get(userId)?.delete(callback);
};

// ─── Sohbet ───────────────────────────────────────────────────────────────────
export const getMessages = async (petId, chatId) => {
  const data = await load();
  const key = chatStorageKey(petId, chatId);
  return [...(data.chats[key] ?? [])].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
};

export const appendMessage = async (petId, chatId, message) => {
  const data = await load();
  const key = chatStorageKey(petId, chatId);
  const list = data.chats[key] ?? [];
  const row = {
    id: genId(),
    createdAt: Date.now(),
    ...message,
  };
  list.push(row);
  data.chats[key] = list;
  await persist();
  // Kopya gönder: aynı dizi referansı React'in yeniden çizimini engeller
  notify(chatListeners, key, [...list]);
  return row;
};

export const subscribeMessages = (petId, chatId, callback) => {
  const key = chatStorageKey(petId, chatId);
  if (!chatListeners.has(key)) chatListeners.set(key, new Set());
  chatListeners.get(key).add(callback);

  getMessages(petId, chatId).then(callback);

  return () => chatListeners.get(key)?.delete(callback);
};

export const getLastMessage = async (petId, chatId) => {
  const msgs = await getMessages(petId, chatId);
  return msgs.length ? msgs[msgs.length - 1] : null;
};

export const getPartnersForPet = async (petId, currentUserId) => {
  const data = await load();
  const pet = data.pets[petId];
  if (!pet) return [];
  const ids = (pet.partnerIds ?? []).filter((id) => id !== currentUserId);
  return ids
    .map((uid) => {
      const u = data.users[uid];
      if (!u) return null;
      return { uid, ...u };
    })
    .filter(Boolean);
};
