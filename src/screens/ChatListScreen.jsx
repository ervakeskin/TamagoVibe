// =============================================================================
// src/screens/ChatListScreen.jsx — Yerel partner DM listesi
// =============================================================================

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { listPartners, watchPartners, watchLastMessage } from '../services/partnerService';
import { formatMessageTime } from '../utils/time';

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
};

const AVATAR_COLORS = [
  '#F7D6D0', '#B5EAD7', '#D8CCEF',
  '#FFD6A5', '#CAFFBF', '#FFC8DD',
];
const avatarColor = (uid = '') =>
  AVATAR_COLORS[uid.charCodeAt(0) % AVATAR_COLORS.length];

const PartnerRow = memo(({ partner, lastMsg, onPress }) => {
  const color  = avatarColor(partner.uid);
  const initials = (partner.displayName ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const timeStr = formatMessageTime(lastMsg?.createdAt);

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.rowInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.partnerName} numberOfLines={1}>
            {partner.displayName ?? 'Bakıcı'}
          </Text>
          {partner.isDemo && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeTxt}>Demo</Text>
            </View>
          )}
        </View>
        <Text style={styles.lastMsg} numberOfLines={1}>
          {lastMsg?.text ?? 'Henüz mesaj yok...'}
        </Text>
      </View>
      {!!timeStr && <Text style={styles.timeStr}>{timeStr}</Text>}
    </Pressable>
  );
});

const ChatListScreen = ({ route, navigation }) => {
  const { petId, userId, displayName } = route.params ?? {};

  const [partners,  setPartners]  = useState([]);
  const [lastMsgs,  setLastMsgs]  = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!petId || !userId) return;

    const refresh = () => {
      listPartners(petId, userId).then((list) => {
        setPartners(list);
        setIsLoading(false);
      });
    };

    refresh();
    return watchPartners(petId, userId, refresh);
  }, [petId, userId]);

  useEffect(() => {
    if (!partners.length || !petId || !userId) return;

    const unsubs = partners.map((partner) =>
      watchLastMessage(petId, userId, partner.uid, (msg) => {
        setLastMsgs((prev) => ({ ...prev, [partner.uid]: msg }));
      }),
    );

    return () => unsubs.forEach((u) => u());
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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={P.cream} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mesajlar</Text>
      </View>
      <View style={styles.headerLine} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={P.roseGold} />
        </View>
      ) : partners.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>Henüz partner yok</Text>
          <Text style={styles.emptySub}>Sosyal sekmesinden demo partneri görebilirsin.</Text>
        </View>
      ) : (
        <FlatList
          data={partners}
          keyExtractor={(p) => p.uid}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: P.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 20,
    paddingVertical:   14,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: P.text, fontStyle: 'italic' },
  headerLine:  { height: 1, backgroundColor: P.creamBorder, marginHorizontal: 20 },
  list: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical: 13,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14, borderWidth: 1.5, borderColor: 'rgba(201,166,158,0.25)',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: P.text },
  rowInfo:    { flex: 1, marginRight: 8 },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  partnerName: { fontSize: 15, fontWeight: '700', color: P.text, flexShrink: 1 },
  demoBadge: {
    backgroundColor: P.mint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  demoBadgeTxt: { fontSize: 9, fontWeight: '700', color: P.text },
  lastMsg:     { fontSize: 12, color: P.textSoft },
  timeStr:     { fontSize: 11, color: P.textSoft },
  separator: { height: 1, backgroundColor: P.creamBorder, marginLeft: 62 },
  emptyWrap:  { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: P.text, fontStyle: 'italic' },
  emptySub:   { fontSize: 13, color: P.textSoft, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

export default ChatListScreen;
