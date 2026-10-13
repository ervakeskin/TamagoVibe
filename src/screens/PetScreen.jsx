// =============================================================================
// src/screens/PetScreen.jsx — v6 (Tamagotchi cihaz arayüzü)
// Akış: yükleme → hata → veda → kuluçka (EggHatch) → cihaz dashboard
// =============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  Pressable, ActivityIndicator, StatusBar,
} from 'react-native';
import { useSocialPet }  from '../hooks/useSocialPet';
import PetAvatar         from '../components/PetAvatar';
import DeviceFrame       from '../components/DeviceFrame';
import EggHatch          from '../components/EggHatch';
import FoodModal         from '../components/FoodModal';
import LevelUpModal      from '../components/LevelUpModal';
import BadgeToast        from '../components/BadgeToast';
import BadgeList         from '../components/BadgeList';
import { COLORS, SHADOWS } from '../constants/theme';
import { HATCH_SECONDS } from '../constants/gameConfig';
import { hatchSecondsLeft, formatAge } from '../utils/decay';

const REACTION_WINDOW_MS = 3000;

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
    xpProgress, levelUpData, newBadges,
    showRebirth, actions,
  } = useSocialPet({ petId, userId, displayName });

  const [secondsLeft, setSecondsLeft] = useState(HATCH_SECONDS);
  const [foodVisible, setFoodVisible] = useState(false);

  // ── Kuluçka geri sayımı (Date.now tabanlı) ────────────────────────────────
  useEffect(() => {
    if (!pet?.hatchStartedAt) return undefined;
    const calc = () => setSecondsLeft(hatchSecondsLeft(pet.hatchStartedAt, HATCH_SECONDS));
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [pet?.hatchStartedAt]);

  const handleFeed = useCallback((foodType) => {
    actions.feed(foodType);
    setFoodVisible(false);
  }, [actions]);

  // Yalnızca az önce yapılan eylem için tepki animasyonu (açılışta eski eylem oynamasın)
  const lastActionAt = pet?.lastActionAt;
  const lastActionType = pet?.lastActionType;
  const reaction = useMemo(
    () => (lastActionAt && Date.now() - lastActionAt < REACTION_WINDOW_MS
      ? { id: lastActionAt, type: lastActionType }
      : null),
    [lastActionAt, lastActionType],
  );

  // ── Yükleme ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={{ fontSize: 52 }}>🥚</Text>
          <ActivityIndicator color={COLORS.roseGold} style={{ marginTop: 16 }} />
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
          <Text style={[styles.loadTxt, { color: COLORS.danger, marginTop: 12 }]}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Veda ekranı ───────────────────────────────────────────────────────────
  if (pet?.isDead || showRebirth) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <View style={styles.farewellWrap}>
          <View style={{ opacity: 0.4 }}>
            <PetAvatar mood="DEAD" name={pet?.name ?? ''} level={pet?.level ?? 1} petType={pet?.petType ?? 'FOX'} />
          </View>
          <Text style={styles.farewellTitle}>
            {pet?.name ? `${pet.name} veda etti` : 'Dostumuz veda etti'}
          </Text>
          <Text style={styles.farewellSub}>
            Lv.{pet?.level ?? 1} • {formatAge(pet?.age)} 🌸
          </Text>
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

  // ── Kuluçka ───────────────────────────────────────────────────────────────
  if (pet && !pet.name && pet.hatchStartedAt) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
        <EggHatch
          secondsLeft={secondsLeft}
          totalSeconds={HATCH_SECONDS}
          petType={pet.petType}
          ownerName={displayName ?? 'Bakıcı'}
          certNo={`TV-${String(petId ?? '').slice(-6).toUpperCase()}`}
          onDone={actions.hatchPet}
        />
      </SafeAreaView>
    );
  }

  // ── Cihaz dashboard ───────────────────────────────────────────────────────
  const p = pet ?? {};
  const showHealthWarn = (p.health ?? 100) < 20 && !p.isDead;
  const showHungerWarn = (p.hunger ?? 100) < 15 && !p.isDead && !showHealthWarn;
  const xpLabel = `${(p.xp ?? 0) % ((p.level ?? 1) * 100)}/${(p.level ?? 1) * 100}`;

  const meters = [
    { icon: '🍖', label: 'Açlık',    value: p.hunger    ?? 100, color: COLORS.statHunger },
    { icon: '🎀', label: 'Mutluluk', value: p.happiness ?? 100, color: COLORS.statHappiness },
    { icon: '⚡', label: 'Enerji',   value: p.energy    ?? 100, color: COLORS.statEnergy },
    { icon: '🌿', label: 'Sağlık',   value: p.health    ?? 100, color: COLORS.statHealth },
  ];

  const buttons = [
    { icon: '🍱', label: 'BESLE', color: '#F6B7A5', onPress: () => setFoodVisible(true), disabled: p.isSleeping },
    { icon: '🎮', label: 'OYNA',  color: '#E3B7D6', onPress: actions.play, disabled: p.isSleeping || (p.energy ?? 100) < 10 },
    { icon: p.isSleeping ? '☀️' : '🌙', label: p.isSleeping ? 'UYANDIR' : 'UYUT', color: '#B7CFF0', onPress: actions.sleep },
    { icon: '💊', label: 'İLAÇ',  color: '#BFDDB6', onPress: actions.heal, disabled: !p.isSick },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {showHealthWarn && (
        <View style={[styles.critBanner, { backgroundColor: 'rgba(232,146,124,0.18)', borderColor: COLORS.danger }]}>
          <Text style={[styles.critTxt, { color: COLORS.danger }]}>🌡️  {p.name}'nin sağlığı kritik!</Text>
        </View>
      )}
      {showHungerWarn && (
        <View style={[styles.critBanner, { backgroundColor: 'rgba(244,162,97,0.16)', borderColor: COLORS.warning }]}>
          <Text style={[styles.critTxt, { color: '#C47A3A' }]}>🍴  {p.name} çok aç!</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>TamagoVibe</Text>
            <Text style={styles.greeting}>Merhaba, {displayName ?? 'Oyuncu'} 🌸</Text>
          </View>
          <Pressable
            style={styles.chatBtn}
            onPress={() => navigation.navigate('ChatList', { petId, userId, displayName })}
            accessibilityLabel="Mesajlar"
          >
            <Text style={{ fontSize: 20 }}>💬</Text>
          </Pressable>
        </View>

        <DeviceFrame
          meters={meters}
          buttons={buttons}
          sleeping={!!p.isSleeping}
          footer={(
            <View style={styles.xpRow}>
              <Text style={styles.xpLabel}>LV {p.level ?? 1}</Text>
              <View style={styles.xpTrack}>
                <View style={[styles.xpFill, { width: `${Math.round((xpProgress ?? 0) * 100)}%` }]} />
              </View>
              <Text style={styles.xpLabel}>{xpLabel}</Text>
            </View>
          )}
        >
          <PetAvatar
            mood={p.mood       ?? 'HAPPY'}
            name={p.name       ?? ''}
            level={p.level     ?? 1}
            petType={p.petType ?? 'FOX'}
            reaction={reaction}
            onTouch={actions.touchPet}
          />
        </DeviceFrame>

        {p.isSleeping && (
          <View style={[styles.statusBanner, { backgroundColor: 'rgba(178,245,234,0.25)', borderColor: COLORS.mint }]}>
            <Text style={[styles.statusTxt, { color: '#4D9B78' }]}>💤  {p.name} uyuyor...</Text>
          </View>
        )}
        {p.isSick && !p.isSleeping && (
          <View style={[styles.statusBanner, { backgroundColor: 'rgba(232,146,124,0.12)', borderColor: COLORS.danger }]}>
            <Text style={[styles.statusTxt, { color: COLORS.danger }]}>🌡️  {p.name} hasta! İlaç ver.</Text>
          </View>
        )}

        <Pressable
          style={styles.socialBtn}
          onPress={() => navigation.navigate('Social', { petId, userId, displayName })}
        >
          <Text style={styles.socialBtnTxt}>🤝  Arkadaşlar & Sosyal Panel</Text>
        </Pressable>

        <View style={styles.badgeBox}>
          <BadgeList unlockedBadges={p.unlockedBadges ?? []} newBadges={newBadges} />
        </View>

        <Text style={styles.hint}>💡 Sürükleyerek çevir, dokunarak sev!</Text>
      </ScrollView>

      <BadgeToast badgeIds={newBadges} onDone={actions.dismissBadges} />

      <FoodModal
        visible={foodVisible}
        onSelect={handleFeed}
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

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  loadTxt:{ color: COLORS.textSoft, marginTop: 10, fontSize: 13, fontStyle: 'italic' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 6,
    paddingTop: 6, paddingBottom: 14,
  },
  appName:  { fontSize: 21, fontWeight: '900', color: COLORS.roseGold, letterSpacing: 0.4, fontStyle: 'italic' },
  greeting: { fontSize: 12, color: COLORS.textSoft, marginTop: 2 },
  chatBtn:  { backgroundColor: COLORS.shell, borderRadius: 20, padding: 10, borderWidth: 1, borderColor: COLORS.border },

  xpRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  xpLabel: { fontSize: 10, color: COLORS.lcdInk, fontWeight: '800', minWidth: 34, textAlign: 'center' },
  xpTrack: { flex: 1, height: 6, backgroundColor: 'rgba(74,90,58,0.18)', borderRadius: 99, overflow: 'hidden' },
  xpFill:  { height: '100%', backgroundColor: COLORS.lcdInk, borderRadius: 99 },

  socialBtn: {
    marginTop: 18, backgroundColor: 'rgba(178,245,234,0.25)',
    borderRadius: 22, padding: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(178,245,234,0.55)',
  },
  socialBtnTxt: { color: '#4D9B78', fontWeight: '700', fontSize: 14 },
  badgeBox: { marginTop: 22 },

  critBanner:   { paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 1 },
  critTxt:      { fontSize: 13, fontWeight: '700' },
  statusBanner: { borderRadius: 14, padding: 12, borderWidth: 1, alignItems: 'center', marginTop: 14 },
  statusTxt:    { fontSize: 13, fontWeight: '600' },

  hint: { textAlign: 'center', color: COLORS.textSoft, fontSize: 11, fontStyle: 'italic', marginTop: 14 },

  // ── Veda ──────────────────────────────────────────────────────────────────
  farewellWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  farewellTitle: { fontSize: 23, fontWeight: '800', color: COLORS.text, fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
  farewellSub:   { fontSize: 13, color: COLORS.textSoft, marginTop: 6 },
  farewellHint:  { fontSize: 12, color: COLORS.textSoft, marginTop: 14, fontStyle: 'italic' },
  divider:       { width: 150, height: 1, backgroundColor: 'rgba(201,166,158,0.28)', marginVertical: 20 },
  statsRow:      { flexDirection: 'row', gap: 24, justifyContent: 'center' },
  statChip:      { alignItems: 'center' },
  statChipVal:   { fontSize: 19, fontWeight: '800', color: COLORS.text },
  statChipLbl:   { fontSize: 10, color: COLORS.textSoft, marginTop: 2 },
  rebirthBtn: {
    backgroundColor: COLORS.shell, paddingHorizontal: 32, paddingVertical: 15,
    borderRadius: 99, borderWidth: 1.5, borderColor: COLORS.roseGold,
    minWidth: 220, alignItems: 'center', ...SHADOWS.sm,
  },
  rebirthTxt: { color: COLORS.roseGold, fontWeight: '800', fontSize: 15 },
});

export default PetScreen;
