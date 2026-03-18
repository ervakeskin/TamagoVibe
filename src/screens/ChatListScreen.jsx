// =============================================================================
// src/screens/ChatListScreen.jsx
// WhatsApp/Instagram DM tarzı partner listesi
// Pet'e bağlı olan bakıcıları listeler, birine tıklayınca özel sohbet açılır
// =============================================================================

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import {
  collection, query, where, onSnapshot,
  orderBy, limit, doc, getDoc,
} from 'firebase/firestore';
import { db } from '../api/firebaseConfig';

// ─── Pastel Palet ─────────────────────────────────────────────────────────────
const P = {
  cream:       '#FAF6F1',
  creamDeep:   '#F3EDE4',
  creamBorder: 'rgba(201,166,158,0.22)',
  roseGold:    '#C9A69E',
  roseLight:   '#F7D6D0',
  text:        '#3D2C2C',
  textSoft:    '#A08C89',
  white:       '#FFFFFF',
  mint:        '#B5EAD7',
  online:      '#98C379',
};

// ─── Sabit renk seti: her partner için tutarlı avatar rengi ───────────────────
const AVATAR_COLORS = [
  '#F7D6D0', '#B5EAD7', '#D8CCEF',
  '#FFD6A5', '#CAFFBF', '#FFC8DD',
];
const avatarColor = (uid = '') =>
  AVATAR_COLORS[uid.charCodeAt(0) % AVATAR_COLORS.length];

// ─── Tek partner satırı ───────────────────────────────────────────────────────
const PartnerRow = memo(({ partner, lastMsg, onPress }) => {
  const color  = avatarColor(partner.uid);
  const initials = (partner.displayName ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const timeStr = lastMsg?.createdAt?.toDate
    ? lastMsg.createdAt.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Pressable style={styles.row} onPress={onPress}>
      {/* Avatar dairesi */}
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* İsim + son mesaj */}
      <View style={styles.rowInfo}>
        <Text style={styles.partnerName} numberOfLines={1}>
          {partner.displayName ?? 'Bakıcı'}
        </Text>
        <Text style={styles.lastMsg} numberOfLines={1}>
          {lastMsg?.text ?? 'Henüz mesaj yok...'}
        </Text>
      </View>

      {/* Saat */}
      {!!timeStr && <Text style={styles.timeStr}>{timeStr}</Text>}
    </Pressable>
  );
});

// =============================================================================
const ChatListScreen = ({ route, navigation }) => {
  const { petId, userId, displayName } = route.params ?? {};

  const [partners,  setPartners]  = useState([]);
  const [lastMsgs,  setLastMsgs]  = useState({});   // { uid: lastMessage }
  const [isLoading, setIsLoading] = useState(true);

  // ── Pet dökümanından partnerIds çek ──────────────────────────────────────
  useEffect(() => {
    if (!petId) return;

    const unsub = onSnapshot(doc(db, 'pets', petId), async (snap) => {
      if (!snap.exists()) { setIsLoading(false); return; }

      const ids = (snap.data().partnerIds ?? []).filter((id) => id !== userId);
      if (!ids.length) { setPartners([]); setIsLoading(false); return; }

      // Her id için users/{id} dökümanını çek
      try {
        const profileSnaps = await Promise.all(
          ids.map((id) => getDoc(doc(db, 'users', id)))
        );
        const list = profileSnaps
          .filter((s) => s.exists())
          .map((s) => ({ uid: s.id, ...s.data() }));
        setPartners(list);
      } catch (e) {
        console.error('[ChatList] Partner profilleri alınamadı:', e);
      }
      setIsLoading(false);
    });

    return () => unsub();
  }, [petId, userId]);

  // ── Her partner için son mesajı dinle ────────────────────────────────────
  useEffect(() => {
    if (!partners.length || !petId) return;

    const unsubList = partners.map((partner) => {
      const chatId = buildChatId(userId, partner.uid);
      const q = query(
        collection(db, 'pets', petId, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(1),
      );
      return onSnapshot(q, (snap) => {
        const msg = snap.docs[0]?.data() ?? null;
        setLastMsgs((prev) => ({ ...prev, [partner.uid]: msg }));
      });
    });

    return () => unsubList.forEach((u) => u());
  }, [partners, petId, userId]);

  const handlePress = useCallback((partner) => {
    navigation.navigate('ChatDetail', {
      petId,
      userId,
      displayName,
      partnerId:          partner.uid,
      partnerDisplayName: partner.displayName ?? 'Bakıcı',
    });
  }, [navigation, petId, userId, displayName]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={P.cream} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Mesajlar</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* İnce rose gold çizgi */}
      <View style={styles.headerLine} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={P.roseGold} />
        </View>
      ) : (
        <FlatList
          data={partners}
          keyExtractor={(p) => p.uid}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🌸</Text>
              <Text style={styles.emptyTitle}>Henüz kimse yok</Text>
              <Text style={styles.emptySub}>
                Sosyal panelden bir arkadaş ekle,{'\n'}onunla sohbet etmeye başla!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PartnerRow
              partner={item}
              lastMsg={lastMsgs[item.uid]}
              onPress={() => handlePress(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

// ─── chatId: iki uid'den her zaman aynı string üretir ─────────────────────────
export const buildChatId = (uid1, uid2) =>
  [uid1, uid2].sort().join('_');

// ─── Stiller ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: P.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingVertical:   14,
  },
  backBtn:     { width: 36, justifyContent: 'center' },
  backTxt:     { fontSize: 28, color: P.roseGold, fontWeight: '300', lineHeight: 32 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: P.text, fontStyle: 'italic' },
  headerLine:  { height: 1, backgroundColor: P.creamBorder, marginHorizontal: 20 },

  list: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },

  // Partner satırı
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: 13,
  },
  avatar: {
    width:          48,
    height:         48,
    borderRadius:   24,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    14,
    borderWidth:    1.5,
    borderColor:    'rgba(201,166,158,0.25)',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: P.text },
  rowInfo:    { flex: 1, marginRight: 8 },
  partnerName: { fontSize: 15, fontWeight: '700', color: P.text, marginBottom: 3 },
  lastMsg:     { fontSize: 12, color: P.textSoft },
  timeStr:     { fontSize: 11, color: P.textSoft },

  separator: { height: 1, backgroundColor: P.creamBorder, marginLeft: 62 },

  // Boş liste
  emptyWrap:  { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: P.text, fontStyle: 'italic' },
  emptySub:   { fontSize: 13, color: P.textSoft, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

export default ChatListScreen;