// =============================================================================
// authService.js — Yerel oturum (Firebase Auth yerine)
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  findAccountByEmail,
  createUserWithPet,
  getUser,
} from './localStore';

const SESSION_KEY = '@tamago/session';

const listeners = new Set();

const notify = (session) => {
  listeners.forEach((cb) => {
    try { cb(session); } catch (e) { console.error('[authService]', e); }
  });
};

export const getSession = async () => {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setSession = async (session) => {
  if (session) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    await AsyncStorage.removeItem(SESSION_KEY);
  }
  notify(session);
};

/** App.js uyumluluğu: { uid, displayName, petId } */
export const subscribeSession = (callback) => {
  listeners.add(callback);
  getSession()
    .then(callback)
    .catch((e) => {
      console.error('[authService] getSession:', e);
      callback(null);
    });
  return () => listeners.delete(callback);
};

export const register = async ({ displayName, email, password }) => {
  const normalized = email.trim().toLowerCase();
  const existing = await findAccountByEmail(normalized);
  if (existing) {
    const err = new Error('Bu e-posta zaten kullanılıyor.');
    err.code = 'auth/email-already-in-use';
    throw err;
  }

  const uid = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { petId } = await createUserWithPet({
    uid,
    email: normalized,
    displayName,
    password,
  });

  const session = {
    uid,
    displayName: displayName.trim(),
    email: normalized,
    petId,
  };
  await setSession(session);
  return session;
};

export const login = async ({ email, password }) => {
  const normalized = email.trim().toLowerCase();
  const account = await findAccountByEmail(normalized);
  if (!account || account.password !== password) {
    const err = new Error('E-posta veya şifre hatalı.');
    err.code = 'auth/invalid-credential';
    throw err;
  }

  const profile = await getUser(account.uid);
  const session = {
    uid: account.uid,
    displayName: profile?.displayName ?? 'Oyuncu',
    email: normalized,
    petId: profile?.petId ?? `pet_${account.uid}`,
  };
  await setSession(session);
  return session;
};

export const logout = async () => {
  await setSession(null);
};
