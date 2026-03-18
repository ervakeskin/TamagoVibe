// =============================================================================
// src/hooks/useSocialPet.js — v5
// • Otomatik mood takibi: hunger < 30 → SAD, > 70 → HAPPY
// • feed(foodType) → stats günceller, modal kapanma sinyali verir
// • Firestore realtime sync (onSnapshot)
// • Hatch, Death → Graveyard → Rebirth akışı
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { Vibration } from 'react-native';
import {
  doc, onSnapshot, updateDoc, addDoc,
  collection, serverTimestamp, increment,
} from 'firebase/firestore';
import { db }                   from '../api/firebaseConfig';
import {
  INITIAL_PET_STATE,
  FOOD_TYPES,
  VIBRATION,
  deriveDeathReason,
  deriveLevelFromXp,
  xpProgressInLevel,
  ACHIEVEMENTS,
} from '../constants/gameConfig';

// ─── Sabitler ────────────────────────────────────────────────────────────────
const TICK_MS = 5000; // 5 saniyede bir stat düşer

// ─── Mood otomatik türetme ────────────────────────────────────────────────────
// Kural önceliği (üstteki kazanır):
//   DEAD > SICK > SLEEPING > TIRED > HUNGRY > SAD > HAPPY > NEUTRAL
const deriveMood = (s) => {
  if (s.isDead)               return 'DEAD';
  if (s.isSick)               return 'SICK';
  if (s.isSleeping)           return 'SLEEPING';
  if ((s.energy    ?? 100) < 20) return 'TIRED';
  if ((s.hunger    ?? 100) < 30) return 'HUNGRY';   // %30 altı → HUNGRY/SAD
  if ((s.happiness ?? 100) < 30) return 'SAD';
  if (
    (s.hunger    ?? 100) > 70 &&
    (s.happiness ?? 100) > 70 &&
    (s.energy    ?? 100) > 50
  )                           return 'HAPPY';
  return 'NEUTRAL';
};

// ─── Rozet kontrolü ──────────────────────────────────────────────────────────
const checkAchievements = (pet, ctx = {}) =>
  ACHIEVEMENTS
    .filter((a) => !(pet.unlockedBadges ?? []).includes(a.id) && a.check(pet, ctx))
    .map((a) => a.id);

// ─── Yardımcılar ─────────────────────────────────────────────────────────────
const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));

const updateFoodStats = (prev, foodType) => {
  const counts   = { ...(prev._foodCounts ?? {}), [foodType]: ((prev._foodCounts ?? {})[foodType] ?? 0) + 1 };
  const favorite = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? foodType;
  return { _foodCounts: counts, favoriteFood: favorite };
};

// =============================================================================
export const useSocialPet = ({ petId, userId, displayName = 'Oyuncu' }) => {
  const [pet,          setPet]          = useState(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [levelUpData,  setLevelUpData]  = useState(null);
  const [newBadges,    setNewBadges]    = useState([]);
  const [showRebirth,  setShowRebirth]  = useState(false);
  const [error,        setError]        = useState(null);

  const tickRef    = useRef(null);
  const petDocRef  = useRef(null);
  const localPet   = useRef(null);  // tick için en güncel kopya
  const notifLock  = useRef({ health: false, hunger: false });

  // ── Firestore ref ────────────────────────────────────────────────────────
  useEffect(() => {
    if (petId) petDocRef.current = doc(db, 'pets', petId);
  }, [petId]);

  // ── onSnapshot ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!petId) return;

    const ref   = doc(db, 'pets', petId);
    const unsub = onSnapshot(ref,
      async (snap) => {
        if (!snap.exists()) {
          // İlk kez oluştur
          const { setDoc } = await import('firebase/firestore');
          await setDoc(ref, { ...INITIAL_PET_STATE, createdAt: serverTimestamp() });
          return;
        }
        const data = { ...INITIAL_PET_STATE, ...snap.data() };
        // Mood'u otomatik türet (Firestore'daki ham veriden)
        data.mood = deriveMood(data);
        setPet(data);
        localPet.current = data;

        if (data.isDead) await handleDeath(data);
        setIsLoading(false);
      },
      (err) => {
        console.error('[useSocialPet] snapshot:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  // ── Firestore'a yaz ──────────────────────────────────────────────────────
  const sync = useCallback(async (updates) => {
    if (!petDocRef.current) return;
    try {
      await updateDoc(petDocRef.current, {
        ...updates,
        lastActionBy:    userId,
        lastPartnerName: displayName,
        updatedAt:       serverTimestamp(),
      });
    } catch (e) { console.error('[useSocialPet] sync:', e); }
  }, [userId, displayName]);

  // ── XP + level-up ────────────────────────────────────────────────────────
  const applyXp = useCallback(async (current, gained, ctx = {}) => {
    const newXp    = (current.xp ?? 0) + gained;
    const newLevel = deriveLevelFromXp(newXp);

    if (newLevel > (current.level ?? 1)) {
      Vibration.vibrate(VIBRATION.levelUp);
      setTimeout(() => setLevelUpData({ level: newLevel }), 60);
    }

    const draft      = { ...current, xp: newXp, level: newLevel };
    const unlocked   = checkAchievements(draft, ctx);
    if (unlocked.length) {
      setTimeout(() => setNewBadges(unlocked), 100);
      return { xp: newXp, level: newLevel, unlockedBadges: [...(current.unlockedBadges ?? []), ...unlocked] };
    }
    return { xp: newXp, level: newLevel };
  }, []);

  // ── Tick ─────────────────────────────────────────────────────────────────
  const runTick = useCallback(async () => {
    const prev = localPet.current;
    if (!prev || prev.isDead) return;

    let next;
    if (prev.isSleeping) {
      next = { ...prev, energy: clamp(prev.energy + 8), age: (prev.age ?? 0) + 1 };
    } else {
      const newHunger    = clamp((prev.hunger    ?? 100) - 4);
      const newHappiness = clamp((prev.happiness ?? 100) - 3);
      const newEnergy    = clamp((prev.energy    ?? 100) - 3);
      let   newHealth    = prev.health ?? 100;
      if (newHunger < 10 || newHappiness < 10) newHealth = clamp(newHealth - 6);

      next = {
        ...prev,
        hunger: newHunger, happiness: newHappiness,
        energy: newEnergy, health:    newHealth,
        isSick: newHealth < 30,
        isDead: newHealth <= 0,
        age:    (prev.age ?? 0) + 1,
      };
    }

    // Mood otomatik güncelle
    next.mood = deriveMood(next);
    await sync(next);
  }, [sync]);

  useEffect(() => {
    if (isLoading || !petId) return;
    tickRef.current = setInterval(runTick, TICK_MS);
    return () => clearInterval(tickRef.current);
  }, [isLoading, petId, runTick]);

  // ── Ölüm → Graveyard ─────────────────────────────────────────────────────
  const handleDeath = useCallback(async (dead) => {
    if (!petId || !userId) return;
    Vibration.vibrate(VIBRATION.death);
    try {
      await addDoc(collection(db, 'graveyard'), {
        name:           dead.name     ?? 'İsimsiz',
        age:            dead.age      ?? 0,
        level:          dead.level    ?? 1,
        xp:             dead.xp       ?? 0,
        petType:        dead.petType  ?? 'FOX',
        favoriteFood:   dead.favoriteFood ?? 'Bilinmiyor',
        totalFeedings:  dead.totalFeedings ?? 0,
        deathReason:    deriveDeathReason(dead),
        unlockedBadges: dead.unlockedBadges ?? [],
        ownerId:        userId,
        petId,
        diedAt:         serverTimestamp(),
      });
      await updateDoc(doc(db, 'users', userId), { legacyCount: increment(1) });
    } catch (e) { console.error('[useSocialPet] graveyard:', e); }
    setTimeout(() => setShowRebirth(true), 1500);
  }, [petId, userId]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Aksiyonlar
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Besle ─────────────────────────────────────────────────────────────────
  const feed = useCallback(async (foodType = 'meal') => {
    const prev = localPet.current;
    if (!prev || prev.isDead || prev.isSleeping) return;
    Vibration.vibrate(VIBRATION.action ?? [0, 25, 50, 25]);

    const food = FOOD_TYPES[foodType];
    if (!food) return;

    const newFeedings  = (prev.totalFeedings ?? 0) + 1;
    const newHunger    = clamp((prev.hunger    ?? 100) + food.hunger);
    const newHappiness = clamp((prev.happiness ?? 100) + (food.happiness ?? 3));
    const newHealth    = clamp((prev.health    ?? 100) + (food.health    ?? 0));
    const foodStats    = updateFoodStats(prev, foodType);
    const xpPatch      = await applyXp(
      { ...prev, totalFeedings: newFeedings },
      food.xp,
      { feedHour: new Date().getHours() }
    );

    const next = {
      ...prev,
      hunger:        newHunger,
      happiness:     newHappiness,
      health:        newHealth,
      totalFeedings: newFeedings,
      lastFed:       foodType,
      lastActionType:'feed',
      ...foodStats,
      ...xpPatch,
    };
    next.mood = deriveMood(next);
    await sync(next);

    // Eylem logu
    addDoc(collection(db, 'pets', petId, 'actions'), {
      type: 'feed', userId, foodType, createdAt: serverTimestamp(),
    }).catch(() => {});
  }, [applyXp, sync, petId, userId]);

  // ── Oyna ──────────────────────────────────────────────────────────────────
  const play = useCallback(async () => {
    const prev = localPet.current;
    if (!prev || prev.isDead || prev.isSleeping || (prev.energy ?? 100) < 10) return;
    Vibration.vibrate(VIBRATION.action ?? [0, 25, 50, 25]);

    const newHappiness = clamp((prev.happiness ?? 100) + 25);
    const xpPatch      = await applyXp(prev, 35);
    const next = {
      ...prev,
      happiness: newHappiness,
      energy:    clamp((prev.energy ?? 100) - 20),
      hunger:    clamp((prev.hunger ?? 100) - 12),
      lastActionType: 'play',
      ...xpPatch,
    };
    next.mood = deriveMood(next);
    await sync(next);
  }, [applyXp, sync]);

  // ── Uyut/Uyandır ──────────────────────────────────────────────────────────
  const sleep = useCallback(async () => {
    const prev = localPet.current;
    if (!prev || prev.isDead) return;
    Vibration.vibrate(VIBRATION.button ?? 10);

    const isSleeping = !prev.isSleeping;
    const next = {
      ...prev,
      isSleeping,
      energy: isSleeping ? clamp((prev.energy ?? 100) + 15) : (prev.energy ?? 100),
      lastActionType: 'sleep',
    };
    next.mood = deriveMood(next);
    await sync(next);
  }, [sync]);

  // ── İyileştir ─────────────────────────────────────────────────────────────
  const heal = useCallback(async () => {
    const prev = localPet.current;
    if (!prev || !prev.isSick || prev.isDead) return;
    Vibration.vibrate(VIBRATION.action ?? [0, 25, 50, 25]);

    const newHealings = (prev.totalHealings ?? 0) + 1;
    const xpPatch     = await applyXp({ ...prev, totalHealings: newHealings }, 15);
    const next = {
      ...prev,
      health:        clamp((prev.health ?? 0) + 35),
      isSick:        false,
      totalHealings: newHealings,
      lastActionType:'heal',
      ...xpPatch,
    };
    next.mood = deriveMood(next);
    await sync(next);
  }, [applyXp, sync]);

  // ── Dokunma (+5 mutluluk) ─────────────────────────────────────────────────
  const touchPet = useCallback(async () => {
    const prev = localPet.current;
    if (!prev || prev.isDead || prev.isSleeping) return;

    const next = {
      ...prev,
      happiness: clamp((prev.happiness ?? 100) + 5),
      lastActionType: 'touch',
    };
    next.mood = deriveMood(next);
    await sync(next);
  }, [sync]);

  // ── Yeni Hayat Başlat ─────────────────────────────────────────────────────
  const startNewLife = useCallback(async () => {
    if (!petDocRef.current) return;
    Vibration.vibrate(VIBRATION.rebirth ?? 30);
    const legacyCount = (localPet.current?.legacyCount ?? 0) + 1;
    try {
      await updateDoc(petDocRef.current, {
        ...INITIAL_PET_STATE,
        name:           '',
        isDead:         false,
        hatchStartedAt: Date.now(),
        legacyCount,
        updatedAt:      serverTimestamp(),
      });
      setShowRebirth(false);
    } catch (e) { console.error('[useSocialPet] startNewLife:', e); }
  }, []);

  // ── Yumurtayı Çatlat ─────────────────────────────────────────────────────
  const hatchPet = useCallback(async (name) => {
    if (!name?.trim() || !petDocRef.current) return;
    const types    = ['FOX', 'CAT', 'PANDA', 'RABBIT', 'DOG', 'KOALA'];
    const petType  = types[Math.floor(Math.random() * types.length)];
    Vibration.vibrate(VIBRATION.levelUp ?? [0, 50, 20, 50]);

    await updateDoc(petDocRef.current, {
      name:           name.trim(),
      petType,
      hatchStartedAt: null,
      hunger:         100,
      happiness:      100,
      energy:         100,
      health:         100,
      isDead:         false,
      isSick:         false,
      mood:           'HAPPY',
      updatedAt:      serverTimestamp(),
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return {
    pet,
    isLoading,
    error,
    xpProgress:  pet ? xpProgressInLevel(pet.xp ?? 0) : 0,
    levelUpData,
    newBadges,
    showRebirth,
    actions: {
      feed,
      play,
      sleep,
      heal,
      touchPet,
      startNewLife,
      hatchPet,
      dismissLevelUp: () => setLevelUpData(null),
      dismissBadges:  () => setNewBadges([]),
    },
  };
};