// =============================================================================
// src/screens/SocialScreen.jsx — Yerel partner paneli + demo
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, FlatList,
  StyleSheet, SafeAreaView, StatusBar,
  ActivityIndicator,
} from 'react-native';
import { listPartners, watchPartners, addPartnerByCode } from '../services/partnerService';
import { logout } from '../services/authService';
import { showAlert, confirmDialog } from '../utils/dialog';
import { getErrorLog, clearErrorLog, formatErrorLog } from '../utils/logger';

const P = {
  cream:       '#FAF6F1',
  creamDeep:   '#F3EDE4',
  creamBorder: 'rgba(201,166,158,0.22)',
  roseGold:    '#C9A69E',
  text:        '#3D2C2C',
  textSoft:    '#A08C89',
  white:       '#FFFFFF',
  mint:        '#B5EAD7',
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

const SocialScreen = ({ route, navigation }) => {
  const { petId, userId, displayName } = route.params ?? {};

  const [partners,   setPartners]   = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [myPetId,    setMyPetId]    = useState('');
  const [loading,    setLoading]    = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [logText,    setLogText]    = useState(null);

  useEffect(() => {
    if (!petId || !userId) return;
    const refresh = () => {
      listPartners(petId, userId).then((list) => {
        setPartners(list);
        setLoading(false);
      });
    };
    refresh();
    return watchPartners(petId, userId, refresh);
  }, [petId, userId]);

  useEffect(() => { setMyPetId(petId ?? ''); }, [petId]);

  const handleAdd = useCallback(async () => {
    const code = inviteCode.trim();
    if (!code) return;
    if (code === petId) {
      showAlert('Hata', 'Kendi kodunu giremezsin 🙈');
      return;
    }
    setAddLoading(true);
    try {
      await addPartnerByCode(code, petId, userId);
      setInviteCode('');
      showAlert('Harika!', 'Partner eklendi!');
    } catch (e) {
      showAlert('Bilgi', e.message ?? 'Gerçek eşleşme yakında.');
    } finally {
      setAddLoading(false);
    }
  }, [inviteCode, petId, userId]);

  const handleLogout = useCallback(() => {
    confirmDialog('Çıkış', 'Hesabından çıkmak istiyor musun?', 'Çıkış', () => logout());
  }, []);

  const toggleLog = useCallback(async () => {
    if (logText !== null) { setLogText(null); return; }
    setLogText(formatErrorLog(await getErrorLog()));
  }, [logText]);

  const clearLog = useCallback(async () => {
    await clearErrorLog();
    setLogText(formatErrorLog([]));
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={P.cream} />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.backTxt}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Sosyal Panel</Text>
        <Pressable onPress={handleLogout}>
          <Text style={styles.logoutTxt}>Çıkış</Text>
        </Pressable>
      </View>
      <View style={styles.line} />

      <FlatList
        data={partners}
        keyExtractor={(p) => p.uid}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={card({ padding: 18, marginBottom: 14 })}>
              <Text style={styles.sectionLabel}>SENİN PET KODUN</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText} selectable>{myPetId}</Text>
              </View>
              <Text style={styles.codeHint}>İleride gerçek partner bu kodla eşleşecek</Text>
            </View>

            <View style={card({ padding: 18, marginBottom: 20 })}>
              <Text style={styles.sectionLabel}>PARTNER EKLE</Text>
              <Text style={styles.demoNote}>
                Şimdilik demo partner Elif ile sohbet edebilirsin. Gerçek eşleşme yakında.
              </Text>
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

            <View style={card({ padding: 14, marginBottom: 20 })}>
              <Pressable onPress={toggleLog} accessibilityLabel="Hata günlüğü">
                <Text style={styles.sectionLabel}>
                  HATA GÜNLÜĞÜ {logText === null ? '▸' : '▾'}
                </Text>
              </Pressable>
              {logText !== null && (
                <>
                  <Text style={styles.logTxt} selectable>{logText}</Text>
                  <Pressable onPress={clearLog}>
                    <Text style={styles.logoutTxt}>Temizle</Text>
                  </Pressable>
                </>
              )}
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
              <View style={styles.nameRow}>
                <Text style={styles.partnerName}>{item.displayName ?? 'Bakıcı'}</Text>
                {item.isDemo && (
                  <View style={styles.demoBadge}>
                    <Text style={styles.demoBadgeTxt}>Demo</Text>
                  </View>
                )}
              </View>
              <Text style={styles.partnerSub}>Bakıcı Dostu 🐾</Text>
            </View>
            <Pressable
              style={styles.msgBtn}
              onPress={() => navigation.navigate('ChatDetail', {
                petId,
                userId,
                displayName,
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
  logoutTxt:   { fontSize: 13, color: P.textSoft, fontWeight: '600' },
  logTxt:      { fontSize: 11, color: P.text, marginVertical: 8, lineHeight: 16 },
  line:        { height: 1, backgroundColor: P.creamBorder, marginHorizontal: 20 },
  list:        { padding: 20, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: P.textSoft,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10,
  },
  demoNote: {
    fontSize: 12, color: P.textSoft, lineHeight: 18, marginBottom: 12,
  },
  codeBox: {
    backgroundColor: P.creamDeep, borderRadius: 12,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: P.creamBorder, borderStyle: 'dashed',
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
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  partnerName: { fontSize: 14, fontWeight: '700', color: P.text },
  demoBadge: {
    backgroundColor: P.mint, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  demoBadgeTxt: { fontSize: 9, fontWeight: '700', color: P.text },
  partnerSub:  { fontSize: 11, color: P.textSoft, marginTop: 2 },
  msgBtn:      { padding: 8 },
  emptyWrap:   { alignItems: 'center', paddingTop: 30 },
  emptyEmoji:  { fontSize: 40, marginBottom: 10 },
  emptyTxt:    { fontSize: 16, fontWeight: '700', color: P.text, fontStyle: 'italic' },
});

export default SocialScreen;
