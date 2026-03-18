// =============================================================================
// src/screens/SocialScreen.jsx
// Partner ekleme ve yönetim ekranı
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList,
  StyleSheet, SafeAreaView, StatusBar,
  ActivityIndicator, Alert,
} from 'react-native';
import {
  doc, getDoc, updateDoc, arrayUnion, onSnapshot,
} from 'firebase/firestore';
import { db } from '../api/firebaseConfig';

const P = {
  cream:       '#FAF6F1',
  creamDeep:   '#F3EDE4',
  creamBorder: 'rgba(201,166,158,0.22)',
  roseGold:    '#C9A69E',
  roseLight:   '#F7D6D0',
  mint:        '#B5EAD7',
  text:        '#3D2C2C',
  textSoft:    '#A08C89',
  white:       '#FFFFFF',
  danger:      '#E8927C',
};

const card = (extra = {}) => ({
  backgroundColor: P.white,
  borderRadius:    20,
  borderWidth:     1.5,
  borderColor:     P.creamBorder,
  shadowColor:     '#C9A69E',
  shadowOffset:    { width: 2, height: 3 },
  shadowOpacity:   0.10,
  shadowRadius:    8,
  elevation:       3,
  ...extra,
});

const AVATAR_COLORS = ['#F7D6D0','#B5EAD7','#D8CCEF','#FFD6A5','#CAFFBF','#FFC8DD'];
const avatarColor = (uid = '') => AVATAR_COLORS[uid.charCodeAt(0) % AVATAR_COLORS.length];

// =============================================================================
const SocialScreen = ({ route, navigation }) => {
  const { petId, userId } = route.params ?? {};

  const [partners,     setPartners]     = useState([]);
  const [inviteCode,   setInviteCode]   = useState('');
  const [myPetId,      setMyPetId]      = useState('');
  const [loading,      setLoading]      = useState(true);
  const [addLoading,   setAddLoading]   = useState(false);

  // ── Pet'in mevcut partnerlarını dinle ─────────────────────────────────────
  useEffect(() => {
    if (!petId) return;
    const unsub = onSnapshot(doc(db, 'pets', petId), async (snap) => {
      if (!snap.exists()) { setLoading(false); return; }
      const ids = (snap.data().partnerIds ?? []).filter((id) => id !== userId);
      if (!ids.length) { setPartners([]); setLoading(false); return; }
      try {
        const snaps = await Promise.all(ids.map((id) => getDoc(doc(db, 'users', id))));
        setPartners(snaps.filter((s) => s.exists()).map((s) => ({ uid: s.id, ...s.data() })));
      } catch (e) { console.error(e); }
      setLoading(false);
    });
    return () => unsub();
  }, [petId, userId]);

  // ── Kendi pet kodunu göster ───────────────────────────────────────────────
  useEffect(() => { setMyPetId(petId ?? ''); }, [petId]);

  // ── Partner ekle ─────────────────────────────────────────────────────────
  const handleAdd = useCallback(async () => {
    const code = inviteCode.trim();
    if (!code) return;
    if (code === petId) {
      Alert.alert('Hata', 'Kendi kodunu giremezsin 🙈'); return;
    }
    setAddLoading(true);
    try {
      // Diğer pet dökümanını bul
      const otherSnap = await getDoc(doc(db, 'pets', code));
      if (!otherSnap.exists()) {
        Alert.alert('Bulunamadı', 'Bu pet kodu geçerli değil.'); return;
      }
      // Her iki pet'e userId'leri ekle
      await updateDoc(doc(db, 'pets', petId),  { partnerIds: arrayUnion(otherSnap.data().ownerId) });
      await updateDoc(doc(db, 'pets', code),   { partnerIds: arrayUnion(userId) });
      setInviteCode('');
      Alert.alert('✨ Harika!', 'Partner başarıyla eklendi!');
    } catch (e) {
      console.error(e);
      Alert.alert('Hata', 'Bir şeyler ters gitti.');
    } finally { setAddLoading(false); }
  }, [inviteCode, petId, userId]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={P.cream} />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Sosyal Panel</Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={styles.line} />

      <FlatList
        data={partners}
        keyExtractor={(p) => p.uid}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Kendi kodu */}
            <View style={card({ padding: 18, marginBottom: 14 })}>
              <Text style={styles.sectionLabel}>SENİN PET KODUN</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText} selectable>{myPetId}</Text>
              </View>
              <Text style={styles.codeHint}>Bu kodu arkadaşına gönder 🌸</Text>
            </View>

            {/* Partner ekle */}
            <View style={card({ padding: 18, marginBottom: 20 })}>
              <Text style={styles.sectionLabel}>PARTNER EKLE</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Arkadaşının pet kodunu gir..."
                  placeholderTextColor={P.textSoft}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="none"
                />
                <Pressable
                  style={[styles.addBtn, addLoading && { opacity: 0.6 }]}
                  onPress={handleAdd}
                  disabled={addLoading || !inviteCode.trim()}
                >
                  {addLoading
                    ? <ActivityIndicator size="small" color={P.white} />
                    : <Text style={styles.addBtnTxt}>Ekle</Text>
                  }
                </Pressable>
              </View>
            </View>

            <Text style={styles.sectionLabel}>BAKICI DOSTLARIN ({partners.length})</Text>
          </>
        }
        ListEmptyComponent={
          loading
            ? <ActivityIndicator color={P.roseGold} style={{ marginTop: 20 }} />
            : (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>🌱</Text>
                <Text style={styles.emptyTxt}>Henüz kimse yok</Text>
                <Text style={styles.emptySub}>Kodunu paylaşarak arkadaş ekle!</Text>
              </View>
            )
        }
        renderItem={({ item }) => (
          <View style={[card({ padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10 })]}>
            <View style={[styles.avatar, { backgroundColor: avatarColor(item.uid) }]}>
              <Text style={styles.avatarTxt}>
                {(item.displayName ?? '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.partnerName}>{item.displayName ?? 'Bakıcı'}</Text>
              <Text style={styles.partnerSub}>Bakıcı Dostu 🐾</Text>
            </View>
            <Pressable
              style={styles.msgBtn}
              onPress={() => navigation.navigate('ChatDetail', {
                petId,
                userId,
                partnerId:          item.uid,
                partnerDisplayName: item.displayName,
              })}
            >
              <Text style={{ fontSize: 20 }}>💬</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: P.cream },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backTxt:     { fontSize: 28, color: P.roseGold, fontWeight: '300', lineHeight: 32 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: P.text, fontStyle: 'italic' },
  line:        { height: 1, backgroundColor: P.creamBorder, marginHorizontal: 20 },
  list:        { padding: 20, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: P.textSoft,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10,
  },
  codeBox: {
    backgroundColor: P.creamDeep, borderRadius: 12,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: P.creamBorder,
    borderStyle: 'dashed',
  },
  codeText: { fontSize: 14, fontWeight: '700', color: P.roseGold, letterSpacing: 1 },
  codeHint: { fontSize: 11, color: P.textSoft, marginTop: 8, textAlign: 'center' },
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: P.creamDeep,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    color: P.text, fontSize: 13,
    borderWidth: 1, borderColor: P.creamBorder,
  },
  addBtn: {
    backgroundColor: P.roseGold, borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 12,
  },
  addBtnTxt: { color: P.white, fontWeight: '700', fontSize: 13 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, borderWidth: 1.5, borderColor: P.creamBorder,
  },
  avatarTxt:   { fontSize: 16, fontWeight: '800', color: P.text },
  partnerName: { fontSize: 14, fontWeight: '700', color: P.text },
  partnerSub:  { fontSize: 11, color: P.textSoft, marginTop: 2 },
  msgBtn:      { padding: 8 },
  emptyWrap:   { alignItems: 'center', paddingTop: 30 },
  emptyEmoji:  { fontSize: 40, marginBottom: 10 },
  emptyTxt:    { fontSize: 16, fontWeight: '700', color: P.text, fontStyle: 'italic' },
  emptySub:    { fontSize: 12, color: P.textSoft, marginTop: 6 },
});

export default SocialScreen;