// =============================================================================
// src/screens/ChatDetailScreen.jsx
// Partnere özel DM ekranı — hand-drawn pastel balonlar
// Firestore: /pets/{petId}/chats/{chatId}/messages
// =============================================================================

import React, {
  useState, useEffect, useRef,
  useCallback, memo,
} from 'react';
import {
  View, Text, TextInput, Pressable, FlatList,
  StyleSheet, SafeAreaView, StatusBar,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import {
  collection, addDoc, onSnapshot,
  orderBy, query, serverTimestamp, limit,
} from 'firebase/firestore';
import { db }           from '../api/firebaseConfig';
import { buildChatId }  from './ChatListScreen';
import { QUICK_MESSAGES } from '../constants/gameConfig';

// ─── Pastel Palet ─────────────────────────────────────────────────────────────
const P = {
  cream:       '#FAF6F1',
  creamDeep:   '#F3EDE4',
  creamBorder: 'rgba(201,166,158,0.22)',
  roseGold:    '#C9A69E',
  roseLight:   '#F7D6D0',
  roseBubble:  '#FDE8E4',   // benim balonlarım
  partnerBubble: '#F0F7F4', // partner balonları (nane tonu)
  text:        '#3D2C2C',
  textSoft:    '#A08C89',
  white:       '#FFFFFF',
  mint:        '#B5EAD7',
  sendBtn:     '#C9A69E',
};

// ─── Hızlı mesaj butonu ───────────────────────────────────────────────────────
const QuickChip = memo(({ item, onPress }) => (
  <Pressable style={styles.chip} onPress={() => onPress(item.text)}>
    <Text style={styles.chipTxt}>{item.label}</Text>
  </Pressable>
));

// ─── Mesaj balonu ─────────────────────────────────────────────────────────────
const Bubble = memo(({ msg, isMine }) => {
  const time = msg.createdAt?.toDate
    ? msg.createdAt.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={[styles.bubbleWrap, isMine ? styles.myWrap : styles.theirWrap]}>
      <View
        style={[
          styles.bubble,
          isMine ? styles.myBubble : styles.theirBubble,
        ]}
      >
        <Text style={[styles.bubbleTxt, isMine && styles.myBubbleTxt]}>
          {msg.text}
        </Text>
      </View>
      {!!time && (
        <Text style={[styles.timeTxt, isMine && { textAlign: 'right' }]}>
          {time}
        </Text>
      )}
    </View>
  );
});

// =============================================================================
const ChatDetailScreen = ({ route, navigation }) => {
  const {
    petId,
    userId,
    displayName,
    partnerId,
    partnerDisplayName,
  } = route.params ?? {};

  // Her iki kullanıcı için deterministik, sıralanmış chatId
  const chatId = buildChatId(userId, partnerId);

  const [messages,  setMessages]  = useState([]);
  const [text,      setText]      = useState('');
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const listRef                   = useRef(null);

  // ── Mesajları gerçek zamanlı dinle ────────────────────────────────────────
  useEffect(() => {
    if (!petId || !chatId) return;

    const q = query(
      collection(db, 'pets', petId, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(200),
    );

    const unsub = onSnapshot(q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('[ChatDetail] Snapshot hatası:', err);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [petId, chatId]);

  // ── Yeni mesajda listeyi aşağı kaydır ────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  // ── Mesaj gönder ──────────────────────────────────────────────────────────
  const send = useCallback(async (customText) => {
    const content = (customText ?? text).trim();
    if (!content || !petId || sending) return;

    setText('');
    setSending(true);
    try {
      await addDoc(
        collection(db, 'pets', petId, 'chats', chatId, 'messages'),
        {
          text:        content,
          senderId:    userId,
          senderName:  displayName ?? 'Ben',
          createdAt:   serverTimestamp(),
        },
      );
    } catch (e) {
      console.error('[ChatDetail] Mesaj gönderilemedi:', e);
    } finally {
      setSending(false);
    }
  }, [text, petId, chatId, userId, displayName, sending]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={P.cream} />

      {/* Header — partnerin adı */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>‹</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          {/* Mini avatar */}
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarTxt}>
              {(partnerDisplayName ?? '?')[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.headerName}>{partnerDisplayName ?? 'Bakıcı'}</Text>
            <Text style={styles.headerSub}>Bakıcı Dostu 🐾</Text>
          </View>
        </View>

        <View style={{ width: 36 }} />
      </View>

      <View style={styles.headerLine} />

      {/* Hızlı hatırlatıcı chip'leri */}
      <View style={styles.chipBar}>
        <FlatList
          data={QUICK_MESSAGES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => <QuickChip item={item} onPress={send} />}
        />
      </View>

      {/* Mesaj listesi */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={P.roseGold} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🌸</Text>
              <Text style={styles.emptyTxt}>Henüz mesaj yok</Text>
              <Text style={styles.emptyHint}>
                Yukarıdaki hızlı mesajları dene!
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Bubble msg={item} isMine={item.senderId === userId} />
          )}
        />
      )}

      {/* Input alanı */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Bir şeyler yaz..."
            placeholderTextColor={P.textSoft}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={300}
          />
          <Pressable
            style={[
              styles.sendBtn,
              (!text.trim() || sending) && styles.sendBtnOff,
            ]}
            onPress={() => send()}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color={P.white} />
              : <Text style={styles.sendArrow}>↑</Text>
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Stiller ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: P.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
  },
  backBtn:  { width: 36 },
  backTxt:  { fontSize: 28, color: P.roseGold, fontWeight: '300', lineHeight: 32 },

  headerCenter: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            10,
  },
  headerAvatar: {
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: P.roseLight,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
    borderColor:     P.creamBorder,
  },
  headerAvatarTxt: { fontSize: 15, fontWeight: '800', color: P.text },
  headerName:      { fontSize: 15, fontWeight: '800', color: P.text },
  headerSub:       { fontSize: 11, color: P.textSoft, marginTop: 1 },

  headerLine: { height: 1, backgroundColor: P.creamBorder, marginHorizontal: 20 },

  // Chip bar
  chipBar: { paddingVertical: 10, borderBottomWidth: 1, borderColor: P.creamBorder },
  chip: {
    backgroundColor:   P.creamDeep,
    paddingHorizontal: 13,
    paddingVertical:    7,
    borderRadius:       99,
    borderWidth:        1,
    borderColor:        P.creamBorder,
  },
  chipTxt: { fontSize: 12, color: P.text, fontWeight: '600' },

  // Mesaj listesi
  msgList: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 24 },

  // ── Balon ──────────────────────────────────────────────────────────────────
  bubbleWrap: { marginBottom: 12, maxWidth: '78%' },
  myWrap:    { alignSelf: 'flex-end',   alignItems: 'flex-end' },
  theirWrap: { alignSelf: 'flex-start', alignItems: 'flex-start' },

  bubble: {
    paddingHorizontal: 14,
    paddingVertical:   10,
    // Hand-drawn: köşeler kasıtlı asimetrik
    borderTopLeftRadius:     18,
    borderTopRightRadius:    14,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius:  14,
    borderWidth:             1.5,
  },
  myBubble: {
    backgroundColor:    P.roseBubble,
    borderColor:        'rgba(201,166,158,0.35)',
    // Benim mesajımın alt-sağ köşesi sivri (WhatsApp tarzı)
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor:   P.partnerBubble,
    borderColor:       'rgba(181,234,215,0.45)',
    // Partnerin alt-sol köşesi sivri
    borderBottomLeftRadius: 4,
  },
  bubbleTxt: {
    fontSize:   14,
    color:      P.text,
    lineHeight: 20,
  },
  myBubbleTxt: { color: '#5C3D3D' },

  timeTxt: { fontSize: 10, color: P.textSoft, marginTop: 3, paddingHorizontal: 2 },

  // Boş liste
  emptyWrap:  { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 42, marginBottom: 10 },
  emptyTxt:   { fontSize: 16, fontWeight: '700', color: P.text, fontStyle: 'italic' },
  emptyHint:  { fontSize: 12, color: P.textSoft, marginTop: 6 },

  // Input
  inputRow: {
    flexDirection:  'row',
    alignItems:     'flex-end',
    padding:         12,
    gap:             8,
    borderTopWidth: 1,
    borderColor:    P.creamBorder,
    backgroundColor: P.cream,
  },
  input: {
    flex:              1,
    backgroundColor:   P.white,
    borderRadius:      20,
    paddingHorizontal: 16,
    paddingVertical:   10,
    color:             P.text,
    fontSize:          14,
    maxHeight:         100,
    borderWidth:       1.5,
    borderColor:       P.creamBorder,
  },
  sendBtn: {
    width:           42,
    height:          42,
    borderRadius:    21,
    backgroundColor: P.sendBtn,
    alignItems:      'center',
    justifyContent:  'center',
  },
  sendBtnOff:  { backgroundColor: P.creamDeep },
  sendArrow:   { color: P.white, fontSize: 18, fontWeight: '800' },
});

export default ChatDetailScreen;