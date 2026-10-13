// =============================================================================
// src/api/notificationService.js — Yerel bildirimler (Firebase yok)
// =============================================================================

import * as Notifications from 'expo-notifications';
import * as Device        from 'expo-device';
import { Platform }       from 'react-native';
import { logError }       from '../utils/logger';

const SUPPORTED = Platform.OS !== 'web';   // expo-notifications web'de yok

if (SUPPORTED) Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('tamagovibe', {
    name:             'TamagoVibe',
    importance:       Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor:       '#ffd166',
  }).catch(() => {});
}

/** Push token artık sunucuya kaydedilmiyor — yalnızca izin isteği */
export const registerForPushNotifications = async () => {
  if (!SUPPORTED || !Device.isDevice) return null;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync();
    return token;
  } catch (e) {
    logError('notifications.token', e);
    return null;
  }
};

const scheduleLocal = async (title, body, data = {}) => {
  if (!SUPPORTED) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null,
    });
  } catch (e) {
    logError('notifications.send', e);
  }
};

export const notifyCriticalHealth  = (name) => scheduleLocal('Kritik Durum!',    `${name}'nin sağlığı tehlikede!`,        { type: 'critical_health' });
export const notifyHunger          = (name) => scheduleLocal('Acıktı!',           `${name} çok aç!`,                       { type: 'hunger' });
export const notifyPetDeath        = (name) => scheduleLocal('Üzücü Haber',       `${name} dünyayla vedalaştı...`,          { type: 'death' });
export const notifyLevelUp         = (name, lvl) => scheduleLocal('Seviye Atlandı!', `${name} artık Seviye ${lvl}!`,   { type: 'level_up', lvl });
export const notifyPartnerAction   = (partner, action, name) => {
  const msgs = {
    feed:  `${partner}, ${name}'ü besledi!`,
    play:  `${partner}, ${name} ile oynadı!`,
    heal:  `${partner}, ${name}'ü iyileştirdi!`,
    sleep: `${partner}, ${name}'ü uyuttu!`,
  };
  return scheduleLocal('Partner Eylemi', msgs[action] ?? `${partner} bir şeyler yaptı!`, { type: 'partner', action });
};

// ─── Zamanlanmış hatırlatıcılar (uygulama kapalıyken çalışır) ────────────────
const REMINDER_TAG = 'tamago-reminder';

export const cancelReminders = async () => {
  if (!SUPPORTED) return;
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      all
        .filter((n) => n.content?.data?.tag === REMINDER_TAG)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch (e) {
    logError('notifications.cancel', e);
  }
};

/** `secondsFromNow` sonra tek seferlik hatırlatıcı kur */
export const scheduleReminder = async (title, body, secondsFromNow, type) => {
  if (!SUPPORTED || !(secondsFromNow > 30)) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true, data: { tag: REMINDER_TAG, type } },
      trigger: { seconds: Math.round(secondsFromNow) },
    });
  } catch (e) {
    logError('notifications.schedule', e);
  }
};
