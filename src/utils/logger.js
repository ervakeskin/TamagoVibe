// =============================================================================
// logger.js — Hata günlüğü. Konsola yazar ve AsyncStorage'da son 100 kaydı tutar.
// Kullanım: logError('kapsam', err)   ·   okuma: getErrorLog()
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

export const ERROR_LOG_KEY = '@tamago/errors';
export const MAX_LOG_ENTRIES = 100;

let queue = Promise.resolve();

const toEntry = (scope, err) => ({
  at:      new Date().toISOString(),
  scope:   String(scope ?? 'app'),
  message: String(err?.message ?? err ?? 'Bilinmeyen hata').slice(0, 500),
  stack:   err?.stack ? String(err.stack).split('\n').slice(0, 6).join('\n') : undefined,
});

export const getErrorLog = async () => {
  try {
    const raw = await AsyncStorage.getItem(ERROR_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const clearErrorLog = async () => {
  try { await AsyncStorage.removeItem(ERROR_LOG_KEY); } catch { /* yok say */ }
};

/** Hatayı kaydeder; kendisi asla hata fırlatmaz. Dönen promise testler içindir. */
export const logError = (scope, err) => {
  const entry = toEntry(scope, err);
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.warn(`[${entry.scope}] ${entry.message}`);
  }
  queue = queue
    .then(async () => {
      const list = await getErrorLog();
      list.push(entry);
      await AsyncStorage.setItem(
        ERROR_LOG_KEY,
        JSON.stringify(list.slice(-MAX_LOG_ENTRIES)),
      );
    })
    .catch(() => {});
  return queue;
};

/** Yakalanmamış JS hatalarını günlüğe yönlendirir (App.js içinde bir kez çağrılır) */
export const installGlobalErrorHandler = () => {
  const utils = globalThis.ErrorUtils;
  if (!utils?.setGlobalHandler || installGlobalErrorHandler.done) return;
  installGlobalErrorHandler.done = true;
  const previous = utils.getGlobalHandler?.();
  utils.setGlobalHandler((error, isFatal) => {
    logError(isFatal ? 'fatal' : 'uncaught', error);
    previous?.(error, isFatal);
  });
};

export const formatErrorLog = (list) =>
  list.length
    ? list.map((e) => `${e.at} [${e.scope}] ${e.message}`).join('\n')
    : 'Hata günlüğü boş.';
