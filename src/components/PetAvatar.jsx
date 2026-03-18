// =============================================================================
// src/components/PetAvatar.jsx — FINAL
// Statik require() — her dosya sabit string ile tanımlı, hata vermez.
// Dokunma → zıplama + titreşim + '+5 Mutluluk' süzülür
// =============================================================================

import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import {
  View, Text, Image, Animated,
  StyleSheet, Pressable, Vibration,
} from 'react-native';
import { PET_TYPES, COLORS } from '../constants/gameConfig';

// ─── Statik require — her biri sabit string, dinamik kullanım YOK ─────────────
const PET_IMAGES = {
  FOX:      require('../assets/images/fox.jpg'),
  CAT:      require('../assets/images/cat.jpg'),
  PANDA:    require('../assets/images/panda.jpg'),
  RABBIT:   require('../assets/images/rabbit.jpg'),
  DOG:      require('../assets/images/fox.jpg'),      // henüz yok → fox göster
  KOALA:    require('../assets/images/panda.jpg'),    // henüz yok → panda göster
  CAPYBARA: require('../assets/images/rabbit.jpg'),   // henüz yok → rabbit göster
  LION:     require('../assets/images/fox.jpg'),      // henüz yok → fox göster
  FROG:     require('../assets/images/panda.jpg'),    // henüz yok → panda göster
};

// ─── Glow renk haritası ───────────────────────────────────────────────────────
const GLOW = {
  FOX:      { color: '#C9A69E', rgba: 'rgba(233,216,253,0.35)' },
  CAT:      { color: '#FFB3BA', rgba: 'rgba(255,179,186,0.30)' },
  PANDA:    { color: '#B2F5EA', rgba: 'rgba(178,245,234,0.35)' },
  RABBIT:   { color: '#FFD6C0', rgba: 'rgba(255,214,192,0.30)' },
  DOG:      { color: '#BEE3F8', rgba: 'rgba(190,227,248,0.35)' },
  KOALA:    { color: '#BEE3F8', rgba: 'rgba(190,227,248,0.30)' },
  CAPYBARA: { color: '#B2F5EA', rgba: 'rgba(178,245,234,0.30)' },
  LION:     { color: '#E9D8FD', rgba: 'rgba(233,216,253,0.30)' },
  FROG:     { color: '#B2F5EA', rgba: 'rgba(178,245,234,0.35)' },
};

// ─── Mood → overlay emoji ─────────────────────────────────────────────────────
const MOOD_OVERLAY = {
  HUNGRY:   '🍴',
  SAD:      '💧',
  TIRED:    '😪',
  SICK:     '🌡️',
  SLEEPING: '💤',
  DEAD:     '💀',
};

// ─── Floating '+5 Mutluluk' bileşeni ─────────────────────────────────────────
const FloatingText = memo(({ color }) => {
  const opacity    = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -65, duration: 950, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 0,   duration: 950, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.Text
      style={[styles.floatTxt, { color, opacity, transform: [{ translateY }] }]}
    >
      💖 +5 Mutluluk
    </Animated.Text>
  );
});

// =============================================================================
const PetAvatar = memo(({
  mood    = 'HAPPY',
  name    = 'Koko',
  level   = 1,
  petType = 'FOX',
  onTouch,           // PetScreen → actions.touchPet
}) => {
  const glow     = GLOW[petType]      ?? GLOW.FOX;
  const image    = PET_IMAGES[petType] ?? PET_IMAGES.FOX;
  const overlay  = MOOD_OVERLAY[mood] ?? null;

  const [floats, setFloats] = useState([]);

  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim  = useRef(new Animated.Value(0.65)).current;
  const jumpAnim  = useRef(new Animated.Value(0)).current;

  // ── Yüzme hareketi ────────────────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue:  0, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ── Glow nefesi ───────────────────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.0,  duration: 1600, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.55, duration: 1600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ── Mood değişiminde pop ──────────────────────────────────────────────
  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.86, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1,    friction: 4,  useNativeDriver: true }),
    ]).start();
  }, [mood]);

  // ── Dokunma: zıplama + titreşim + floating text ───────────────────────
  const handleTouch = useCallback(() => {
    Vibration.vibrate(15);

    Animated.sequence([
      Animated.spring(jumpAnim, { toValue: -24, friction: 3, tension: 120, useNativeDriver: true }),
      Animated.spring(jumpAnim, { toValue:   0, friction: 4, tension:  80, useNativeDriver: true }),
    ]).start();

    const id = Date.now();
    setFloats((prev) => [...prev, id]);
    setTimeout(() => setFloats((prev) => prev.filter((f) => f !== id)), 1000);

    onTouch?.();
  }, [onTouch, jumpAnim]);

  return (
    <View style={styles.wrapper}>

      {/* Glow halkası */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            backgroundColor: glow.rgba,
            shadowColor:     glow.color,
            opacity:         glowAnim,
            transform: [{
              scale: glowAnim.interpolate({
                inputRange:  [0.55, 1],
                outputRange: [1,    1.14],
              }),
            }],
          },
        ]}
      />

      {/* Floating metin */}
      {floats.map((id) => (
        <View key={id} style={styles.floatWrap} pointerEvents="none">
          <FloatingText color={glow.color} />
        </View>
      ))}

      {/* Karakter — dokunulabilir */}
      <Pressable onPress={handleTouch} activeOpacity={0.9}>
        <Animated.View
          style={[
            styles.characterWrap,
            {
              shadowColor: glow.color,
              transform: [
                { translateY: Animated.add(floatAnim, jumpAnim) },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <Image
            source={image}
            style={styles.petImage}
            resizeMode="contain"
          />

          {/* Mood overlay ikonu (üst-sağ köşe) */}
          {overlay && (
            <View style={styles.overlayBubble}>
              <Text style={styles.overlayTxt}>{overlay}</Text>
            </View>
          )}
        </Animated.View>
      </Pressable>

      {/* İsim + level */}
      <View style={styles.nameRow}>
        <Text style={styles.petName}>{name}</Text>
        <View style={[styles.levelPill, { borderColor: glow.color + '99' }]}>
          <Text style={[styles.levelTxt, { color: glow.color }]}>lv.{level}</Text>
        </View>
      </View>

    </View>
  );
});

// ─── Stiller ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 16,
  },
  glowRing: {
    position:     'absolute',
    width:         190,
    height:        190,
    borderRadius:  95,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius:  28,
    elevation:     0,
  },
  floatWrap: {
    position:      'absolute',
    top:            0,
    alignSelf:     'center',
    zIndex:         99,
  },
  floatTxt: {
    fontSize:   14,
    fontWeight: '700',
    fontStyle:  'italic',
  },
  characterWrap: {
    width:          160,
    height:         160,
    alignItems:     'center',
    justifyContent: 'center',
    shadowOffset:   { width: 0, height: 5 },
    shadowOpacity:  0.15,
    shadowRadius:   14,
    elevation:      5,
  },
  petImage: {
    width:        156,
    height:       156,
    borderRadius: 78,
  },
  overlayBubble: {
    position:        'absolute',
    top:             -4,
    right:           -4,
    backgroundColor: '#FFFBF5',
    borderRadius:    18,
    padding:         6,
    borderWidth:     1,
    borderColor:     'rgba(201,166,158,0.28)',
    shadowColor:     '#C9A69E',
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.2,
    shadowRadius:    4,
    elevation:       4,
  },
  overlayTxt: { fontSize: 16 },
  nameRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:             8,
    marginTop:       16,
  },
  petName: {
    fontSize:      20,
    fontWeight:    '700',
    color:         '#2D3748',
    letterSpacing: 0.2,
    fontStyle:     'italic',
  },
  levelPill: {
    backgroundColor:   'rgba(201,166,158,0.12)',
    paddingHorizontal: 10,
    paddingVertical:    4,
    borderRadius:       20,
    borderWidth:        1,
  },
  levelTxt: {
    fontSize:   11,
    fontWeight: '700',
  },
});

export default PetAvatar;