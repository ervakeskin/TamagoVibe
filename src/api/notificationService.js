// =============================================================================
// src/api/notificationService.js — TamagoVibe Bildirim Servisi
// expo-notifications wrapper; yerel bildirimler + push token yönetimi
// =============================================================================

import * as Notifications from 'expo-notifications';
import * as Device        from 'expo-device';
import { Platform }       from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db }             from './firebaseConfig';

// Uygulama ön plandayken de bildirimleri göster
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// Android bildirim kanalı
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('tamagovibe', {
    name:             'TamagoVibe',
    importance:       Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor:       '#ffd166',
  });
}

// ─── Push Token Kaydı ────────────────────────────────────────────────────────
export const registerForPushNotifications = async (userId) => {
  if (!Device.isDevice) return null;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync();

    if (userId) {
      await updateDoc(doc(db, 'users', userId), {
        expoPushToken:  token,
        tokenUpdatedAt: new Date().toISOString(),
      });
    }

    return token;
  } catch (e) {
    console.error('[Notifications] Token alınamadı:', e);
    return null;
  }
};

// ─── Yerel Bildirim Gönderici ─────────────────────────────────────────────────
const scheduleLocal = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null, // anında gönder
    });
  } catch (e) {
    console.error('[Notifications] Gönderilemedi:', e);
  }
};

// ─── İş Mantığı Bildirimleri ─────────────────────────────────────────────────
export const notifyCriticalHealth  = (name) => scheduleLocal('🚨 Kritik Durum!',    `${name}'nin sağlığı tehlikede!`,        { type: 'critical_health' });
export const notifyHunger          = (name) => scheduleLocal('🍖 Acıktı!',           `${name} çok aç!`,                       { type: 'hunger' });
export const notifyPetDeath        = (name) => scheduleLocal('💀 Üzücü Haber',       `${name} dünyayla vedalaştı...`,          { type: 'death' });
export const notifyLevelUp         = (name, lvl) => scheduleLocal('🎉 Seviye Atlandı!', `${name} artık Seviye ${lvl}! ✨`,   { type: 'level_up', lvl });
export const notifyPartnerAction   = (partner, action, name) => {
  const msgs = {
    feed:  `${partner}, ${name}'ü besledi! 🍖`,
    play:  `${partner}, ${name} ile oynadı! 🎮`,
    heal:  `${partner}, ${name}'ü iyileştirdi! 💊`,
    sleep: `${partner}, ${name}'ü uyuttu! 💤`,
  };
  return scheduleLocal('🤝 Partner Eylemi', msgs[action] ?? `${partner} bir şeyler yaptı!`, { type: 'partner', action });
};
