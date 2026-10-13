// =============================================================================
// partnerService.js — Partner & mesaj API (yerel; ileride remote takılabilir)
// =============================================================================

import { DEMO_PARTNER } from '../constants/demoConfig';
import { QUICK_MESSAGES } from '../constants/gameConfig';
import { buildChatId } from '../utils/chat';
import {
  getPartnersForPet,
  getLastMessage,
  subscribeMessages,
  appendMessage,
  subscribePet,
  getPet,
} from './localStore';

export { DEMO_PARTNER };

export const listPartners = (petId, userId) =>
  getPartnersForPet(petId, userId);

export const watchPartners = (petId, userId, callback) =>
  subscribePet(petId, () => {
    getPartnersForPet(petId, userId).then(callback);
  });

export const watchLastMessage = (petId, userId, partnerId, callback) => {
  const chatId = buildChatId(userId, partnerId);
  return subscribeMessages(petId, chatId, (msgs) => {
    callback(msgs.length ? msgs[msgs.length - 1] : null);
  });
};

export const watchMessages = subscribeMessages;

export const sendMessage = async ({
  petId,
  userId,
  partnerId,
  displayName,
  text,
}) => {
  const chatId = buildChatId(userId, partnerId);
  const row = await appendMessage(petId, chatId, {
    text: text.trim(),
    senderId: userId,
    senderName: displayName ?? 'Ben',
  });

  if (partnerId === DEMO_PARTNER.uid) {
    scheduleDemoReply(petId, chatId);
  }

  return row;
};

const DEMO_REPLIES = [
  'Harika fikir! 🌸',
  'Ben de öyle düşünüyorum!',
  'Hadi petimize bakalım 🐾',
  'Demo modunda birlikte oynuyoruz ✨',
];

let demoReplyTimer = null;

const scheduleDemoReply = (petId, chatId) => {
  if (demoReplyTimer) clearTimeout(demoReplyTimer);
  demoReplyTimer = setTimeout(async () => {
    const quick = QUICK_MESSAGES[Math.floor(Math.random() * QUICK_MESSAGES.length)];
    const text = Math.random() > 0.5
      ? quick.text
      : DEMO_REPLIES[Math.floor(Math.random() * DEMO_REPLIES.length)];
    await appendMessage(petId, chatId, {
      text,
      senderId: DEMO_PARTNER.uid,
      senderName: DEMO_PARTNER.displayName,
    });
  }, 900);
};

/** İleride gerçek eşleşme — şimdilik stub */
export const addPartnerByCode = async () => {
  const err = new Error(
    'Gerçek partner eşleşmesi yakında. Şimdilik Elif ile demo sohbet edebilirsiniz.',
  );
  err.code = 'partner/not-available';
  throw err;
};

export const getPetPartnerIds = async (petId) => {
  const pet = await getPet(petId);
  return pet?.partnerIds ?? [];
};
