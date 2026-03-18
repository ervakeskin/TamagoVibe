// =============================================================================
// src/screens/ChatScreen.jsx — Bakıcılar Odası (Grup Sohbeti v7)
// Firestore: /pets/{petId}/messages | onSnapshot ile gerçek zamanlı grup chat
// =============================================================================

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList,
  StyleSheet, SafeAreaView, StatusBar,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import {
  collection, addDoc, onSnapshot,
  orderBy, query, serverTimestamp, limit,
} from 'firebase/firestore';
import { db }               from '../api/firebaseConfig';
import { COLORS, NEON, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { QUICK_MESSAGES }   from '../constants/gameConfig';

// ─── Grup Mesaj Balonu ───────────────────────────────────────────────────────
const MessageBubble = memo(({ msg, isMine }) => {
  const time = msg.createdAt?.toDate
    ? msg.createdAt.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '...';

  return (
    <View style={[styles.bubbleWrap, isMine ? styles.myWrap : styles.theirWrap]}>
      {/* Gönderen ismi (Sadece başkalarında görünür) */}
      {!isMine && <Text style={styles.senderName}>👤 {msg.senderName}</Text>}
      
      <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
        <Text style={styles.bubbleText}>{msg.text}</Text>
      </View>
      
      <Text style={styles.timeText}>{time}</Text>
    </View>
  );
});

// ─── Hızlı Hatırlatıcı Butonu ────────────────────────────────────────────────
const QuickBtn = memo(({ item, onPress }) => (
  <Pressable style={styles.quickBtn} onPress={() => onPress(item.text)}>
    <Text style={styles.quickTxt}>{item.label}</Text>
  </Pressable>
));

// =============================================================================
const ChatScreen = ({ route, navigation }) => {
  const { petId, userId, displayName } = route.params ?? {};

  const [messages,  setMessages]  = useState([]);
  const [text,      setText]      = useState('');
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const listRef                   = useRef(null);

  // Grup mesajlarını gerçek zamanlı dinle
  useEffect(() => {
    if (!petId) return;

    const q = query(
      collection(db, 'pets', petId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(200) // Grup chat için limiti biraz artırdık
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error('[ChatScreen] Grup hatası:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [petId]);

  // Yeni mesaj geldiğinde sona kaydır
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const send = useCallback(async (customText) => {
    const content = (customText ?? text).trim();
    if (!content || !petId || sending) return;

    setText('');
    setSending(true);

    try {
      await addDoc(collection(db, 'pets', petId, 'messages'), {
        text:       content,
        senderId:   userId,
        senderName: displayName ?? 'Misafir Bakıcı',
        createdAt:  serverTimestamp(),
      });
    } catch (e) {
      console.error('[ChatScreen] Mesaj gönderilemedi:', e);
    } finally {
      setSending(false);
    }
  }, [text, petId, userId, displayName, sending]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>‹ Kapat</Text>
        </Pressable>
        <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🏠 Bakıcılar Odası</Text>
            <Text style={styles.onlineStatus}>Şu an aktif grup</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      {/* Hızlı Grup Bildirimleri */}
      <View style={styles.quickBar}>
        <Text style={styles.quickLabel}>Hızlı Hatırlatıcılar:</Text>
        <FlatList
          data={QUICK_MESSAGES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: SPACING.base, gap: SPACING.sm }}
          renderItem={({ item }) => <QuickBtn item={item} onPress={send} />}
        />
      </View>

      {/* Grup Sohbet Alanı */}
      {loading ? (
        <View style={styles.loadCenter}>
          <ActivityIndicator color={NEON.cyan} size="large" />
          <Text style={styles.loadTxt}>Sohbet yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.msgList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <MessageBubble msg={item} isMine={item.senderId === userId} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>✉️</Text>
              <Text style={styles.emptyTxt}>Burası çok sessiz...</Text>
              <Text style={styles.emptyHint}>Diğer bakıcılara bir "Selam" yaz!</Text>
            </View>
          }
        />
      )}

      {/* Mesaj Giriş Paneli */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Grup için bir mesaj yaz..."
            placeholderTextColor={COLORS.textSubtle}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendDisabled]}
            onPress={() => send()}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendLabel}>GÖNDER</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.03)', borderBottomWidth: 1, borderColor: COLORS.border,
  },
  headerCenter: { alignItems: 'center' },
  onlineStatus: { fontSize: 9, color: '#48cae4', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },
  backBtn: { width: 60 },
  backTxt: { color: NEON.purple, fontWeight: '900', fontSize: 14 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

  quickBar: { paddingVertical: SPACING.md },
  quickLabel: { fontSize: 10, color: COLORS.textMuted, marginLeft: SPACING.base, marginBottom: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  quickBtn: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  quickTxt: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  loadCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadTxt: { color: COLORS.textMuted, marginTop: 10, fontSize: 12 },
  msgList: { padding: SPACING.base, paddingBottom: 30 },

  bubbleWrap: { marginBottom: 15, maxWidth: '85%' },
  myWrap: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirWrap: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderName: { fontSize: 11, color: '#48cae4', marginBottom: 4, fontWeight: 'bold', marginLeft: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
  myBubble: { backgroundColor: NEON.violet, borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderBottomLeftRadius: 4 },
  bubbleText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  timeText: { fontSize: 9, color: COLORS.textSubtle, marginTop: 4, marginHorizontal: 6 },

  emptyWrap: { flex: 1, alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 50, marginBottom: 15 },
  emptyTxt: { fontSize: 18, fontWeight: 'bold', color: COLORS.textMuted },
  emptyHint: { fontSize: 13, color: COLORS.textSubtle, marginTop: 5 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 15, backgroundColor: COLORS.bg, borderTopWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  input: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: 15, paddingHorizontal: 15,
    paddingVertical: 12, color: '#fff',
    fontSize: 14, maxHeight: 100,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sendBtn: {
    paddingHorizontal: 15, height: 45, borderRadius: 12,
    backgroundColor: NEON.violet,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.neon(NEON.violet)
  },
  sendDisabled: { backgroundColor: COLORS.surface, opacity: 0.5 },
  sendLabel: { color: '#fff', fontSize: 11, fontWeight: '900' },
});

export default ChatScreen;