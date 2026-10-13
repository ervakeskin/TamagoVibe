// =============================================================================
// src/hooks/useSocialPet.js — Yerel depolama (AsyncStorage) + gerçek zamanlı döngü
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { Vibration, AppState } from 'react-native';
import {
  subscribePet,
  savePet,
  ensurePet,
  addGraveyardEntry,
  incrementLegacy,
} from '../services/localStore';
import {
  INITIAL_PET_STATE,
  FOOD_TYPES,
  VIBRATION,
  TICK_MS,
  DECAY_PER_HOUR,
  deriveDeathReason,
  deriveLevelFromXp,
  xpProgressInLevel,
  pickPetType,
  ACHIEVEMENTS,
} from '../constants/gameConfig';
import { clamp, deriveMood, applyElapsed } from '../utils/decay';
import { logError } from '../utils/logger';
import {
  notifyHunger,
  notifyCriticalHealth,
  notifyPetDeath,
  notifyLevelUp,
  scheduleReminder,
  cancelReminders,
} from '../api/notificationService';

const checkAchievements = (pet, ctx = {}) =>
  ACHIEVEMENTS
    .filter((a) => !(pet.unlockedBadges ?? []).includes(a.id) && a.check(pet, ctx))
    .map((a) => a.id);

const updateFoodStats = (prev, foodType) => {
  const counts   = { ...(prev._foodCounts ?? {}), [foodType]: ((prev._foodCounts ?? {})[foodType] ?? 0) + 1 };
  const favorite = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? foodType;
  return { _foodCounts: counts, favoriteFood: favorite };
};

/** Uygulama arka plana alınınca kurulacak hatırlatıcılar */
const scheduleBackgroundReminders = (pet) => {
  if (!pet?.name || pet.isDead) return;
  const awakeHunger = DECAY_PER_HOUR.hunger * (pet.isSleeping ? DECAY_PER_HOUR.sleepHungerMul : 1);
  const hoursToHungry = ((pet.hunger ?? 100) - 20) / awakeHunger;
  if (hoursToHungry > 0) {
    scheduleReminder('Acıktı!', `${pet.name} acıkmaya başladı 🍖`, hoursToHungry * 3600, 'hunger');
  }
  const hoursToStarve = ((pet.hunger ?? 100) - 5) / awakeHunger;
  if (hoursToStarve > 0) {
    scheduleReminder('Kritik Durum!', `${pet.name}'nin sağlığı tehlikede! 🌡️`, hoursToStarve * 3600, 'critical');
  }
};

export const useSocialPet = ({ petId, userId, displayName = 'Oyuncu' }) => {
  const [pet,          setPet]          = useState(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [levelUpData,  setLevelUpData]  = useState(null);
  const [newBadges,    setNewBadges]    = useState([]);
  const [showRebirth,  setShowRebirth]  = useState(false);
  const [error,        setError]        = useState(null);

  const tickRef      = useRef(null);
  const localPet     = useRef(null);
  const deathHandled = useRef(false);
  const caughtUp     = useRef(false);
  const warned       = useRef({ hunger: false, health: false });

  const persist = useCallback(async (updates, { action = false } = {}) => {
    if (!petId) return;
    const merged = {
      ...localPet.current,
      ...updates,
      lastActionBy:    userId,
      lastPartnerName: displayName,
      updatedAt:       Date.now(),
      ...(action ? { lastActionAt: Date.now() } : {}),
    };
    localPet.current = merged;
    try {
      await savePet(petId, merged);
    } catch (e) { logError('useSocialPet.persist', e); }
  }, [petId, userId, displayName]);

  const handleDeath = useCallback(async (dead) => {
    if (!petId || !userId || dead.graveRecorded) return;   // aynı ölüm tek kez kaydedilir
    Vibration.vibrate(VIBRATION.death);
    notifyPetDeath(dead.name || 'Dostumuz');
    try {
      await addGraveyardEntry({
        name:           dead.name     || 'İsimsiz',
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
      });
      await incrementLegacy(userId);
      await persist({ graveRecorded: true });
    } catch (e) { logError('useSocialPet.graveyard', e); }
    setTimeout(() => setShowRebirth(true), 1500);
  }, [petId, userId, persist]);

  /** Son kayıttan bu yana geçen süreyi uygula (ekran açıkken ve uygulama kapalıyken) */
  const catchUp = useCallback(async () => {
    const prev = localPet.current;
    if (!prev || prev.isDead || !prev.name) return;   // yumurta / ölü: düşüş yok

    const now  = Date.now();
    const last = prev.lastTickAt ?? prev.updatedAt ?? now;
    const next = applyElapsed(prev, now - last);
    next.lastTickAt = now;

    // Uyarı bildirimleri (eşik başına bir kez)
    if (next.hunger < 20 && !warned.current.hunger) {
      warned.current.hunger = true;
      notifyHunger(next.name);
    } else if (next.hunger >= 30) warned.current.hunger = false;
    if (next.health < 30 && !warned.current.health) {
      warned.current.health = true;
      notifyCriticalHealth(next.name);
    } else if (next.health >= 50) warned.current.health = false;

    await persist(next);
  }, [persist]);

  useEffect(() => {
    if (!petId) return undefined;
    deathHandled.current = false;
    caughtUp.current = false;
    setIsLoading(true);
    setError(null);

    ensurePet(petId, userId).catch((e) => {
      logError('useSocialPet.ensurePet', e);
      setError(e.message ?? 'Pet yüklenemedi');
      setIsLoading(false);
    });

    const unsub = subscribePet(petId, async (raw) => {
      const data = { ...INITIAL_PET_STATE, ...raw };
      data.mood = deriveMood(data);
      setPet(data);
      localPet.current = data;
      setIsLoading(false);

      if (!caughtUp.current) {            // açılışta kapalıyken geçen süreyi uygula
        caughtUp.current = true;
        await catchUp();
        return;
      }
      if (data.isDead && !deathHandled.current) {
        deathHandled.current = true;
        await handleDeath(data);
      }
    });

    const loadTimeout = setTimeout(() => setIsLoading(false), 10000);

    return () => {
      clearTimeout(loadTimeout);
      unsub();
    };
  }, [petId, userId, handleDeath, catchUp]);

  // ── Gerçek zamanlı tick + arka plana geçiş / geri dönüş ────────────────────
  useEffect(() => {
    if (isLoading || !petId) return undefined;
    tickRef.current = setInterval(catchUp, TICK_MS);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        cancelReminders();
        catchUp();
      } else {
        scheduleBackgroundReminders(localPet.current);
      }
    });

    return () => {
      clearInterval(tickRef.current);
      sub?.remove?.();
    };
  }, [isLoading, petId, catchUp]);

  const applyXp = useCallback(async (current, gained, ctx = {}) => {
    const newXp    = (current.xp ?? 0) + gained;
    const newLevel = deriveLevelFromXp(newXp);

    if (newLevel > (current.level ?? 1)) {
      Vibration.vibrate(VIBRATION.levelUp);
      notifyLevelUp(current.name || 'Dostumuz', newLevel);
      setTimeout(() => setLevelUpData({ level: newLevel }), 60);
    }

    const draft    = { ...current, xp: newXp, level: newLevel };
    const unlocked = checkAchievements(draft, ctx);
    if (unlocked.length) {
      setTimeout(() => setNewBadges(unlocked), 100);
      return { xp: newXp, level: newLevel, unlockedBadges: [...(current.unlockedBadges ?? []), ...unlocked] };
    }
    return { xp: newXp, level: newLevel };
  }, []);

  const feed = useCallback(async (foodType = 'meal') => {
    const prev = localPet.current;
    if (!prev || prev.isDead || prev.isSleeping) return;
    const food = FOOD_TYPES[foodType];
    if (!food) return;
    Vibration.vibrate(VIBRATION.action);

    const newFeedings = (prev.totalFeedings ?? 0) + 1;
    const xpPatch = await applyXp(
      { ...prev, totalFeedings: newFeedings },
      food.xp,
      { feedHour: new Date().getHours() },
    );

    const next = {
      ...prev,
      hunger:        clamp((prev.hunger    ?? 100) + food.hunger),
      happiness:     clamp((prev.happiness ?? 100) + (food.happiness ?? 3)),
      health:        clamp((prev.health    ?? 100) + (food.health    ?? 0)),
      totalFeedings: newFeedings,
      lastFed:       foodType,
      lastActionType:'feed',
      ...updateFoodStats(prev, foodType),
      ...xpPatch,
    };
    next.mood = deriveMood(next);
    await persist(next, { action: true });
  }, [applyXp, persist]);

  const play = useCallback(async () => {
    const prev = localPet.current;
    if (!prev || prev.isDead || prev.isSleeping || (prev.energy ?? 100) < 10) return;
    Vibration.vibrate(VIBRATION.action);

    const xpPatch = await applyXp(prev, 35);
    const next = {
      ...prev,
      happiness: clamp((prev.happiness ?? 100) + 25),
      energy:    clamp((prev.energy ?? 100) - 15),
      hunger:    clamp((prev.hunger ?? 100) - 8),
      lastActionType: 'play',
      ...xpPatch,
    };
    next.mood = deriveMood(next);
    await persist(next, { action: true });
  }, [applyXp, persist]);

  const sleep = useCallback(async () => {
    const prev = localPet.current;
    if (!prev || prev.isDead) return;
    Vibration.vibrate(VIBRATION.button);

    const next = { ...prev, isSleeping: !prev.isSleeping, lastActionType: 'sleep' };
    next.mood = deriveMood(next);
    await persist(next, { action: true });
  }, [persist]);

  const heal = useCallback(async () => {
    const prev = localPet.current;
    if (!prev || !prev.isSick || prev.isDead) return;
    Vibration.vibrate(VIBRATION.action);

    const newHealings = (prev.totalHealings ?? 0) + 1;
    const xpPatch = await applyXp({ ...prev, totalHealings: newHealings }, 15);
    const next = {
      ...prev,
      health:        clamp((prev.health ?? 0) + 35),
      isSick:        false,
      totalHealings: newHealings,
      lastActionType:'heal',
      ...xpPatch,
    };
    next.mood = deriveMood(next);
    await persist(next, { action: true });
  }, [applyXp, persist]);

  const touchPet = useCallback(async () => {
    const prev = localPet.current;
    if (!prev || prev.isDead || prev.isSleeping) return;

    const next = {
      ...prev,
      happiness: clamp((prev.happiness ?? 100) + 5),
      lastActionType: 'touch',
    };
    next.mood = deriveMood(next);
    await persist(next, { action: true });
  }, [persist]);

  const startNewLife = useCallback(async () => {
    if (!petId) return;
    Vibration.vibrate(VIBRATION.rebirth);
    const legacyCount = (localPet.current?.legacyCount ?? 0) + 1;
    deathHandled.current = false;
    warned.current = { hunger: false, health: false };
    try {
      await persist({
        ...INITIAL_PET_STATE,
        name:           '',
        petType:        pickPetType(),
        isDead:         false,
        hatchStartedAt: Date.now(),
        bornAt:         null,
        lastTickAt:     null,
        legacyCount,
        ownerId:        userId,
        partnerIds:     localPet.current?.partnerIds ?? [],
      });
      setShowRebirth(false);
    } catch (e) { logError('useSocialPet.startNewLife', e); }
  }, [petId, userId, persist]);

  const hatchPet = useCallback(async (name) => {
    if (!name?.trim() || !petId) return;
    Vibration.vibrate(VIBRATION.levelUp);

    await persist({
      name:           name.trim(),
      petType:        localPet.current?.petType ?? pickPetType(),
      hatchStartedAt: null,
      bornAt:         Date.now(),
      lastTickAt:     Date.now(),
      hunger:         100,
      happiness:      100,
      energy:         100,
      health:         100,
      isDead:         false,
      isSick:         false,
      mood:           'HAPPY',
    });
  }, [petId, persist]);

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
