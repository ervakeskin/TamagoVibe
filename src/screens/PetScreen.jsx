// =============================================================================
// src/screens/PetScreen.jsx — v5
// • Arka plan: kırık beyaz #FFFBF5 (siyahlık tamamen gitti)
// • FoodModal seçimde otomatik kapanır
// • PetAvatar onTouch → touchPet() çağrısı
// • Otomatik mood → useSocialPet içinde deriveMood ile yönetilir
// • Auth Guard: isLoading / hata / veda / kuluçka / dashboard akışı
// =============================================================================

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  Pressable, TextInput, ActivityIndicator, StatusBar,
  Animated,
} from 'react-native';
import { useSocialPet }  from '../hooks/useSocialPet';
import PetAvatar         from '../components/PetAvatar';
import StatBar           from '../components/StatBar';
import FoodModal         from '../components/FoodModal';
import LevelUpModal      from '../components/LevelUpModal';
import { COLORS }        from '../constants/gameConfig';

// ─── Kuluçka süresi ───────────────────────────────────────────────────────────
const HATCH_SECONDS = 2 * 60; // gameConfig'teki HATCH_TIME_MINUTES ile eşleşir
const fmt = (s) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

// ─── Kart stili (el çizimi hissi) ────────────────────────────────────────────
const S = {
  cream:    '#FFFBF5',
  card:     '#FFFFFF',
  border:   'rgba(201,166,158,0.22)',
  roseGold: '#C9A69E',
  textSoft: '#A08C89',
  coral:    '#E8927C',
  mint:     '#B2F5EA',
  sage:     '#A8C5A0',
};

const cardStyle = (extra = {}) => ({
  backgroundColor: S.card,
  borderRadius:    22,
  borderWidth:     1.5,
  borderColor:     S.border,
  shadowColor:     '#C9A69E',
  shadowOffset:    { width: 2, height: 3 },
  shadowOpacity:   0.10,
  shadowRadius:    8,
  elevation:       3,
  ...extra,
});

// ─── Animasyonlu Aksiyon Butonu ───────────────────────────────────────────────
const ActionPill = memo(({ icon, label, onPress, color, disabled }) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(scale, { toValue: 0.88, friction: 4, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    friction: 4, tension: 80, useNativeDriver: true }).start();
  const press    = () => { if (!disabled) { pressIn(); setTimeout(pressOut, 100); onPress?.(); } };

  return (
    <Animated.View style={[styles.pillWrap, { transform: [{ scale }] }]}>
      <Pressable
        style={[
          styles.pill,
          { backgroundColor: color + '22', borderColor: color + '55' },
          disabled && styles.pillOff,
        ]}
        onPressIn={disabled ? null : pressIn}
        onPressOut={disabled ? null : pressOut}
        onPress={press}
      >
        <Text style={styles.pillIcon}>{icon}</Text>
        <Text style={[styles.pillLabel, { color: disabled ? S.textSoft : COLORS.text }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
});

// ─── Veda ekranı stat özeti ───────────────────────────────────────────────────
const StatChip = ({ icon, label, value }) => (
  <View style={styles.statChip}>
    <Text style={{ fontSize: 22 }}>{icon}</Text>
    <Text style={styles.statChipVal}>{value}</Text>
    <Text style={styles.statChipLbl}>{label}</Text>
  </View>
);

// =============================================================================
const PetScreen = ({ route, navigation }) => {
  const { petId, userId, displayName } = route.params ?? {};

  const {
    pet, isLoading, error,
    xpProgress, levelUpData,
    showRebirth, actions,
  } = useSocialPet({ petId, userId, displayName });

  const [hatchName,   setHatchName]   = useState('');
  const [timeLeft,    setTimeLeft]    = useState(HATCH_SECONDS);
  const [foodVisible, setFoodVisible] = useState(false);

  // ── Kuluçka geri sayımı (Date.now tabanlı) ────────────────────────────────
  useEffect(() => {
    if (!pet?.hatchStartedAt) return;
    const calc = () => {
      const elapsed = Math.floor((Date.now() - pet.hatchStartedAt) / 1000);
      setTimeLeft(Math.max(0, HATCH_SECONDS - elapsed));
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [pet?.hatchStartedAt]);

  // ── FoodModal seçimi → besle + otomatik kapat ────────────────────────────
  const handleFeed = useCallback((foodType) => {
    actions.feed(foodType);
    setFoodVisible(false);   // modal otomatik kapanır
  }, [actions]);

  // ── Yükleme ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={{ fontSize: 52 }}>🥚</Text>
          <ActivityIndicator color={S.roseGold} style={{ marginTop: 16 }} />
          <Text style={styles.loadTxt}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={{ fontSize: 40 }}>⚠️</Text>
          <Text style={[styles.loadTxt, { color: S.coral, marginTop: 12 }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Veda Ekranı ───────────────────────────────────────────────────────────
  if (pet?.isDead || showRebirth) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={S.cream} />
        <View style={styles.farewellWrap}>
          <View style={{ opacity: 0.4 }}>
            <PetAvatar mood="DEAD" name={pet?.name ?? ''} level={pet?.level ?? 1} petType={pet?.petType ?? 'FOX'} />
          </View>
          <Text style={styles.farewellTitle}>
            {pet?.name ? `${pet.name} veda etti` : 'Dostumuz veda etti'}
          </Text>
          <Text style={styles.farewellSub}>Lv.{pet?.level ?? 1} • {pet?.age ?? 0} gün 🌸</Text>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            <StatChip icon="✨" label="XP"      value={pet?.xp ?? 0} />
            <StatChip icon="🏅" label="Rozet"   value={pet?.unlockedBadges?.length ?? 0} />
            <StatChip icon="🍖" label="Besleme" value={pet?.totalFeedings ?? 0} />
          </View>
          <View style={styles.divider} />
          <Pressable style={styles.rebirthBtn} onPress={actions.startNewLife}>
            <Text style={styles.rebirthTxt}>✨  Yeni Bir Hayat Başlat</Text>
          </Pressable>
          <Text style={styles.farewellHint}>Anılar mezarlıkta saklanacak 🪦</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Kuluçka Ekranı ────────────────────────────────────────────────────────
  if (pet && !pet.name && pet.hatchStartedAt) {
    const isReady = timeLeft <= 0;
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={S.cream} />
        <View style={styles.hatchWrap}>
          <Text style={styles.hatchEmoji}>{isReady ? '🐣' : '🥚'}</Text>
          <Text style={styles.hatchTitle}>{isReady ? 'Hazır! İsim ver ✨' : 'Kuluçka süreci...'}</Text>
          {!isReady && (
            <View style={styles.timerPill}>
              <Text style={styles.timerTxt}>{fmt(timeLeft)}</Text>
            </View>
          )}
          <View style={{ ...cardStyle({ width: '100%', marginTop: 22, padding: 4 }) }}>
            <TextInput
              style={styles.nameInput}
              placeholder="Dostuna bir isim ver..."
              placeholderTextColor={S.textSoft}
              value={hatchName}
              onChangeText={setHatchName}
              maxLength={14}
              autoCapitalize="words"
            />
          </View>
          <Pressable
            style={[styles.hatchBtn, !isReady && { opacity: 0.45 }]}
            onPress={() => hatchName.trim() && actions.hatchPet(hatchName)}
          >
            <Text style={styles.hatchBtnTxt}>
              {isReady ? '🐣  Yumurtayı Çatlat' : '⏳  Bekliyoruz...'}
            </Text>
          </Pressable>
          <Text style={styles.hatchHint}>
            {isReady ? 'İsim gir ve butona bas!' : 'İstersen şimdiden isim yazabilirsin 🌸'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Ana Dashboard ─────────────────────────────────────────────────────────
  const p = pet ?? {};
  const showHealthWarn = (p.health   ?? 100) < 20 && !p.isDead;
  const showHungerWarn = (p.hunger   ?? 100) < 15 && !p.isDead && !showHealthWarn;
  const xpLabel = `${(p.xp ?? 0) % ((p.level ?? 1) * 100)}/${(p.level ?? 1) * 100}`;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={S.cream} />

      {/* Kritik banner'lar */}
      {showHealthWarn && (
        <View style={[styles.critBanner, { backgroundColor: 'rgba(232,146,124,0.18)', borderColor: S.coral }]}>
          <Text style={[styles.critTxt, { color: S.coral }]}>🌡️  {p.name}'nin sağlığı kritik!</Text>
        </View>
      )}
      {showHungerWarn && (
        <View style={[styles.critBanner, { backgroundColor: 'rgba(244,162,97,0.16)', borderColor: '#F4A261' }]}>
          <Text style={[styles.critTxt, { color: '#C47A3A' }]}>🍴  {p.name} çok aç!</Text>
        </View>
      )}

      {/* Partner eylemi */}
      {p.lastActionBy && p.lastActionBy !== userId && (
        <View style={styles.partnerBanner}>
          <Text style={styles.partnerTxt}>
            🤝  Partnerin az önce{' '}
            {{ feed: 'besledi', play: 'oynadı', heal: 'ilaç verdi', touch: 'sevdi' }[p.lastActionType] ?? 'bir şeyler yaptı'}!
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>TamagoVibe</Text>
            <Text style={styles.greeting}>Merhaba, {displayName ?? 'Oyuncu'} 🌸</Text>
          </View>
          <Pressable
            style={styles.chatBtn}
            onPress={() => navigation.navigate('ChatList', { petId, userId, displayName })}
          >
            <Text style={{ fontSize: 20 }}>💬</Text>
          </Pressable>
        </View>

        {/* Karakter kartı */}
        <View style={cardStyle({ padding: 24, alignItems: 'center' })}>
          {/* PetAvatar — onTouch → touchPet (+5 mutluluk) */}
          <PetAvatar
            mood={p.mood       ?? 'HAPPY'}
            name={p.name       ?? 'Koko'}
            level={p.level     ?? 1}
            petType={p.petType ?? 'FOX'}
            onTouch={actions.touchPet}
          />
          {/* XP şeridi */}
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>LV {p.level ?? 1}</Text>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${Math.round((xpProgress ?? 0) * 100)}%` }]} />
            </View>
            <Text style={styles.xpLabel}>{xpLabel}</Text>
          </View>
        </View>

        {/* Stat kartı */}
        <View style={[cardStyle({ padding: 20 }), { marginTop: 14 }]}>
          <Text style={styles.sectionLabel}>Bugün nasıl? 🌿</Text>
          <StatBar label="Açlık"    value={p.hunger    ?? 100} color={COLORS.statHunger}    icon="🍖" />
          <StatBar label="Mutluluk" value={p.happiness ?? 100} color={COLORS.statHappiness} icon="🎀" />
          <StatBar label="Enerji"   value={p.energy    ?? 100} color={COLORS.statEnergy}    icon="✨" />
          <StatBar label="Sağlık"   value={p.health    ?? 100} color={COLORS.statHealth}    icon="🌿" />
        </View>

        {/* Aksiyon kartı */}
        <View style={[cardStyle({ padding: 18 }), { marginTop: 14 }]}>
          <Text style={styles.sectionLabel}>Bakım 🐾</Text>
          <View style={styles.actionGrid}>
            <ActionPill icon="🍱" label="Besle"
              onPress={() => setFoodVisible(true)}
              color={COLORS.statHunger}
              disabled={p.isSleeping} />
            <ActionPill icon="🎀" label="Oyna"
              onPress={actions.play}
              color={COLORS.statHappiness}
              disabled={p.isSleeping || (p.energy ?? 100) < 10} />
            <ActionPill
              icon={p.isSleeping ? '☀️' : '🌙'}
              label={p.isSleeping ? 'Uyandır' : 'Uyut'}
              onPress={actions.sleep}
              color={COLORS.statEnergy} />
            <ActionPill icon="🌿" label="İlaç"
              onPress={actions.heal}
              color={COLORS.statHealth}
              disabled={!p.isSick} />
          </View>
        </View>

        {/* Sosyal panel butonu */}
        <Pressable
          style={styles.socialBtn}
          onPress={() => navigation.navigate('Social', { petId, userId, displayName })}
        >
          <Text style={styles.socialBtnTxt}>🤝  Arkadaşlar & Sosyal Panel</Text>
        </Pressable>

        {/* Durum notları */}
        {p.isSleeping && (
          <View style={[styles.statusBanner, { backgroundColor: 'rgba(178,245,234,0.25)', borderColor: S.mint }]}>
            <Text style={[styles.statusTxt, { color: '#4D9B78' }]}>💤  {p.name} uyuyor...</Text>
          </View>
        )}
        {p.isSick && !p.isSleeping && (
          <View style={[styles.statusBanner, { backgroundColor: 'rgba(232,146,124,0.12)', borderColor: S.coral }]}>
            <Text style={[styles.statusTxt, { color: S.coral }]}>🌡️  {p.name} hasta! İlaç ver.</Text>
          </View>
        )}

        {/* Küçük ipucu */}
        <Text style={styles.hint}>💡 Karaktere dokunarak sevebilirsin!</Text>

      </ScrollView>

      {/* Modaller */}
      <FoodModal
        visible={foodVisible}
        onSelect={handleFeed}       // seçince otomatik kapanır
        onClose={() => setFoodVisible(false)}
      />
      <LevelUpModal
        visible={!!levelUpData}
        level={levelUpData?.level}
        onDismiss={actions.dismissLevelUp}
      />
    </SafeAreaView>
  );
};

// ─── Stiller ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: S.cream },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 52 },
  loadTxt:{ color: S.textSoft, marginTop: 10, fontSize: 13, fontStyle: 'italic' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 20,
    paddingTop: 14, paddingBottom: 8,
  },
  appName:  { fontSize: 21, fontWeight: '900', color: S.roseGold, letterSpacing: 0.4, fontStyle: 'italic' },
  greeting: { fontSize: 12, color: S.textSoft, marginTop: 2 },
  chatBtn:  { backgroundColor: '#F7D6D0', borderRadius: 20, padding: 10, borderWidth: 1, borderColor: S.border },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: S.textSoft,
    letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 14,
  },

  xpRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 8 },
  xpLabel: { fontSize: 10, color: S.roseGold, fontWeight: '700', minWidth: 34, textAlign: 'center' },
  xpTrack: { flex: 1, height: 5, backgroundColor: 'rgba(201,166,158,0.15)', borderRadius: 99, overflow: 'hidden' },
  xpFill:  { height: '100%', backgroundColor: S.roseGold, borderRadius: 99 },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pillWrap:   { flex: 1, minWidth: '44%' },
  pill: {
    alignItems: 'center', paddingVertical: 14,
    borderRadius: 18, borderWidth: 1.5,
    borderTopLeftRadius: 20, borderTopRightRadius: 16,
    borderBottomRightRadius: 20, borderBottomLeftRadius: 16,
  },
  pillOff:    { opacity: 0.35 },
  pillIcon:   { fontSize: 24, marginBottom: 5 },
  pillLabel:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },

  socialBtn: {
    marginTop: 14, backgroundColor: 'rgba(178,245,234,0.25)',
    borderRadius: 22, padding: 18, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(178,245,234,0.55)',
  },
  socialBtnTxt: { color: '#4D9B78', fontWeight: '700', fontSize: 14 },

  critBanner:   { paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 1 },
  critTxt:      { fontSize: 13, fontWeight: '700' },
  partnerBanner:{ backgroundColor: 'rgba(201,166,158,0.10)', paddingVertical: 9, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 1, borderColor: S.border },
  partnerTxt:   { color: S.roseGold, fontWeight: '600', fontSize: 12 },
  statusBanner: { borderRadius: 14, padding: 12, borderWidth: 1, alignItems: 'center', marginTop: 12 },
  statusTxt:    { fontSize: 13, fontWeight: '600' },

  hint: { textAlign: 'center', color: S.textSoft, fontSize: 11, fontStyle: 'italic', marginTop: 14 },

  // ── Veda ──────────────────────────────────────────────────────────────────
  farewellWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  farewellTitle: { fontSize: 23, fontWeight: '800', color: COLORS.text, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
  farewellSub:   { fontSize: 13, color: S.textSoft, marginTop: 6 },
  farewellHint:  { fontSize: 12, color: S.textSoft, marginTop: 14, fontStyle: 'italic' },
  divider:       { width: 150, height: 1, backgroundColor: 'rgba(201,166,158,0.28)', marginVertical: 20 },
  statsRow:      { flexDirection: 'row', gap: 24, justifyContent: 'center' },
  statChip:      { alignItems: 'center' },
  statChipVal:   { fontSize: 19, fontWeight: '800', color: COLORS.text },
  statChipLbl:   { fontSize: 10, color: S.textSoft, marginTop: 2 },
  rebirthBtn: {
    backgroundColor: '#F7D6D0', paddingHorizontal: 32, paddingVertical: 15,
    borderRadius: 99, borderWidth: 1.5, borderColor: S.roseGold,
    minWidth: 220, alignItems: 'center',
  },
  rebirthTxt: { color: S.roseGold, fontWeight: '800', fontSize: 15 },

  // ── Kuluçka ───────────────────────────────────────────────────────────────
  hatchWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  hatchEmoji:  { fontSize: 92, marginBottom: 6 },
  hatchTitle:  { fontSize: 20, fontWeight: '700', color: COLORS.text, fontStyle: 'italic' },
  timerPill:   { backgroundColor: '#F3EDE4', paddingHorizontal: 22, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: S.border, marginTop: 12 },
  timerTxt:    { fontSize: 22, fontWeight: '800', color: S.roseGold },
  nameInput:   { paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, color: COLORS.text, textAlign: 'center', fontStyle: 'italic' },
  hatchBtn:    { marginTop: 20, backgroundColor: S.mint, paddingHorizontal: 36, paddingVertical: 15, borderRadius: 99, borderWidth: 1.5, borderColor: 'rgba(100,180,140,0.45)', minWidth: 220, alignItems: 'center' },
  hatchBtnTxt: { color: '#2D6B4F', fontWeight: '700', fontSize: 15 },
  hatchHint:   { fontSize: 12, color: S.textSoft, marginTop: 12, fontStyle: 'italic' },
});

export default PetScreen;