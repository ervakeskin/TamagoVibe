// =============================================================================
// src/screens/GraveyardScreen.jsx
// Firestore graveyard koleksiyonunu gerçek zamanlı dinler
// Ölen dostları lüks "Anıt Kartı" olarak listeler
// =============================================================================

import React, { useState, useEffect, memo } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  SafeAreaView, StatusBar, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  collection, query, where,
  orderBy, onSnapshot, limit,
} from 'firebase/firestore';
import { db } from '../api/firebaseConfig';

const P = {
  cream:       '#FAF6F1',
  creamDeep:   '#F3EDE4',
  creamBorder: 'rgba(201,166,158,0.22)',
  roseGold:    '#C9A69E',
  roseLight:   '#F7D6D0',
  stone:       '#9B8B8B',
  stoneSoft:   '#C4B5B5',
  text:        '#3D2C2C',
  textSoft:    '#A08C89',
  white:       '#FFFFFF',
  mint:        '#B5EAD7',
};

// ─── Pet türü emoji tablosu ───────────────────────────────────────────────────
const PET_EMOJI = {
  fox:    '🦊',
  rabbit: '🐰',
  panda:  '🐼',
  cat:    '🐱',
};

// ─── Anıt Kartı ───────────────────────────────────────────────────────────────
const MemorialCard = memo(({ entry }) => {
  const emoji = PET_EMOJI[entry.petType] ?? '🐾';
  const diedDate = entry.diedAt?.toDate
    ? entry.diedAt.toDate().toLocaleDateString('tr-TR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—';

  return (
    <View style={styles.card}>
      {/* Üst şerit: emoji + isim + tarih */}
      <View style={styles.cardTop}>
        <View style={styles.emojiCircle}>
          <Text style={styles.petEmoji}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.petName}>{entry.name ?? 'İsimsiz'}</Text>
          <Text style={styles.diedDate}>{diedDate}</Text>
        </View>
        {/* Level rozeti */}
        <View style={styles.levelBadge}>
          <Text style={styles.levelTxt}>LV {entry.level ?? 1}</Text>
        </View>
      </View>

      {/* Rose gold çizgi */}
      <View style={styles.divider} />

      {/* İstatistik satırı */}
      <View style={styles.statsRow}>
        <Stat icon="🕰️" label="Yaşı"     value={`${entry.age ?? 0} gün`} />
        <Stat icon="✨"  label="Toplam XP" value={entry.xp ?? 0} />
        <Stat icon="🏅"  label="Rozetler" value={entry.unlockedBadges?.length ?? 0} />
        <Stat icon="🍖"  label="Besleme"  value={entry.totalFeedings ?? 0} />
      </View>

      {/* Ölüm sebebi */}
      <View style={styles.deathBanner}>
        <Text style={styles.deathTxt}>⚰️  {entry.deathReason ?? 'Nedeni bilinmiyor'}</Text>
      </View>

      {/* Favori yemek */}
      {entry.favoriteFood && entry.favoriteFood !== 'Bilinmiyor' && (
        <Text style={styles.favFood}>
          En sevdiği:{' '}
          {{ snack: '🍪 Atıştırmalık', meal: '🍱 Ana Yemek', vitamin: '💊 Vitamin', treat: '🍬 Ödül Maması' }[entry.favoriteFood] ?? entry.favoriteFood}
        </Text>
      )}
    </View>
  );
});

const Stat = ({ icon, label, value }) => (
  <View style={styles.stat}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statVal}>{value}</Text>
    <Text style={styles.statLbl}>{label}</Text>
  </View>
);

// =============================================================================
const GraveyardScreen = ({ route }) => {
  const { userId } = route.params ?? {};

  const [entries,    setEntries]    = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Gerçek zamanlı Firestore dinleyicisi ──────────────────────────────────
  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }

    const q = query(
      collection(db, 'graveyard'),
      where('ownerId', '==', userId),
      orderBy('diedAt', 'desc'),
      limit(50),
    );

    const unsub = onSnapshot(q,
      (snap) => {
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setIsLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error('[Graveyard]', err);
        setIsLoading(false);
        setRefreshing(false);
      },
    );

    return () => unsub();
  }, [userId]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={P.cream} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Anıt Salonu</Text>
        <Text style={styles.headerSub}>
          {entries.length > 0 ? `${entries.length} değerli dost` : ''}
        </Text>
      </View>
      <View style={styles.line} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={P.roseGold} />
          <Text style={styles.loadTxt}>Anılar yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => setRefreshing(true)}
              tintColor={P.roseGold}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🌱</Text>
              <Text style={styles.emptyTitle}>Mezarlık henüz boş</Text>
              <Text style={styles.emptySub}>
                Dostların uzun yaşasın! 🌸
              </Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          renderItem={({ item }) => <MemorialCard entry={item} />}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Stiller ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: P.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 22,
    paddingTop:        16,
    paddingBottom:     12,
  },
  headerTitle: {
    fontSize:   22,
    fontWeight: '900',
    color:      P.text,
    fontStyle:  'italic',
  },
  headerSub: { fontSize: 12, color: P.textSoft, marginTop: 2 },
  line:      { height: 1, backgroundColor: P.creamBorder, marginHorizontal: 20, marginBottom: 4 },
  list:      { padding: 20, paddingBottom: 48 },
  loadTxt:   { color: P.textSoft, marginTop: 10, fontSize: 13, fontStyle: 'italic' },

  // ── Anıt Kartı ─────────────────────────────────────────────────────────
  card: {
    backgroundColor: P.white,
    borderRadius:    22,
    padding:         18,
    borderWidth:     1.5,
    borderColor:     P.creamBorder,
    shadowColor:     '#C9A69E',
    shadowOffset:    { width: 2, height: 3 },
    shadowOpacity:   0.10,
    shadowRadius:    8,
    elevation:       3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiCircle: {
    width:           52,
    height:          52,
    borderRadius:    26,
    backgroundColor: P.creamDeep,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
    borderColor:     P.creamBorder,
    // Soluk efekt — vefat hissi
    opacity:         0.75,
  },
  petEmoji:   { fontSize: 28 },
  petName:    { fontSize: 17, fontWeight: '800', color: P.text, fontStyle: 'italic' },
  diedDate:   { fontSize: 11, color: P.textSoft, marginTop: 2 },
  levelBadge: {
    backgroundColor:   P.creamDeep,
    paddingHorizontal: 10,
    paddingVertical:    5,
    borderRadius:       99,
    borderWidth:        1,
    borderColor:        P.creamBorder,
  },
  levelTxt: { fontSize: 11, fontWeight: '700', color: P.roseGold },

  divider: {
    height:          1,
    backgroundColor: 'rgba(201,166,158,0.20)',
    marginVertical:  14,
  },

  statsRow: {
    flexDirection:  'row',
    justifyContent: 'space-around',
    marginBottom:   14,
  },
  stat:     { alignItems: 'center' },
  statIcon: { fontSize: 18, marginBottom: 3 },
  statVal:  { fontSize: 15, fontWeight: '800', color: P.text },
  statLbl:  { fontSize: 10, color: P.textSoft, marginTop: 2 },

  deathBanner: {
    backgroundColor: P.creamDeep,
    borderRadius:    12,
    paddingVertical:  8,
    paddingHorizontal: 14,
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     P.creamBorder,
  },
  deathTxt: { fontSize: 12, color: P.stone, fontStyle: 'italic' },

  favFood: {
    fontSize:   11,
    color:      P.textSoft,
    textAlign:  'center',
    marginTop:  10,
    fontStyle:  'italic',
  },

  // ── Boş liste ─────────────────────────────────────────────────────────
  emptyWrap:  { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: P.text, fontStyle: 'italic' },
  emptySub:   { fontSize: 13, color: P.textSoft, textAlign: 'center', marginTop: 8 },
});

export default GraveyardScreen;