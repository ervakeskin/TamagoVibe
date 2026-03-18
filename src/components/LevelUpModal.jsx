// =============================================================================
// src/components/LevelUpModal.jsx — Level Up Kutlaması
// Konfeti yağmuru (28 Animated.View) + özellik mesajı
// =============================================================================

import React, { useEffect, useRef, useMemo, memo } from 'react';
import {
  Modal, View, Text, Pressable,
  Animated, StyleSheet, Dimensions,
} from 'react-native';
import { COLORS, NEON, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { LEVEL_REWARDS, DEFAULT_LEVEL_REWARD } from '../constants/gameConfig';

const { width: W, height: H } = Dimensions.get('window');
const CONFETTI_COLORS = [NEON.gold, NEON.magenta, NEON.blue, NEON.green, NEON.coral, NEON.rose];
const COUNT = 28;

const Particle = memo(({ color, startX, delay }) => {
  const y      = useRef(new Animated.Value(-20)).current;
  const x      = useRef(new Animated.Value(0)).current;
  const op     = useRef(new Animated.Value(1)).current;
  const rot    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 80;
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(y,   { toValue: H * 0.75, duration: 2200, useNativeDriver: true }),
        Animated.timing(x,   { toValue: drift,    duration: 2200, useNativeDriver: true }),
        Animated.timing(rot, { toValue: 1,        duration: 2200, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(1400),
          Animated.timing(op, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  }, []);

  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${Math.random() > 0.5 ? 360 : -360}deg`] });
  const size = 6 + Math.random() * 8;

  return (
    <Animated.View
      style={{
        position: 'absolute', left: startX, top: 0,
        width: size, height: size,
        borderRadius: Math.random() > 0.5 ? size / 2 : 2,
        backgroundColor: color,
        transform: [{ translateY: y }, { translateX: x }, { rotate: spin }],
        opacity: op,
      }}
    />
  );
});

const LevelUpModal = memo(({ visible, level, onDismiss }) => {
  const reward   = level ? (LEVEL_REWARDS[level] ?? DEFAULT_LEVEL_REWARD(level)) : null;
  const scale    = useRef(new Animated.Value(0.5)).current;
  const opacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200,            useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.5);
      opacity.setValue(0);
    }
  }, [visible]);

  const particles = useMemo(
    () => Array.from({ length: COUNT }, (_, i) => ({
      id:     i,
      color:  CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      startX: Math.random() * W,
      delay:  Math.random() * 600,
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible]
  );

  if (!visible || !reward) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {particles.map((p) => <Particle key={p.id} {...p} />)}
        </View>

        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.title}>{reward.title}</Text>
          <Text style={styles.levelNum}>{level}</Text>
          <View style={styles.divider} />
          <Text style={styles.featureLabel}>YENİ ÖZELLİK</Text>
          <Text style={styles.feature}>{reward.feature}</Text>
          <Pressable style={styles.btn} onPress={onDismiss}>
            <Text style={styles.btnText}>✨ Harika!</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    width:           300,
    backgroundColor: COLORS.bgCard,
    borderRadius:    RADIUS['3xl'],
    padding:         SPACING['2xl'],
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     `${NEON.gold}44`,
    ...SHADOWS.neon(NEON.gold),
  },
  crown:        { fontSize: 52, marginBottom: SPACING.sm },
  title:        { fontSize: FONTS.xl, fontWeight: FONTS.black, color: COLORS.textPrimary, textAlign: 'center' },
  levelNum:     { fontSize: FONTS['5xl'], fontWeight: FONTS.black, color: NEON.gold, lineHeight: 80, marginVertical: SPACING.xs },
  divider:      { width: 180, height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.base },
  featureLabel: { fontSize: FONTS.xs, fontWeight: FONTS.extrabold, color: COLORS.textMuted, letterSpacing: 2, marginBottom: SPACING.xs },
  feature:      { fontSize: FONTS.base, fontWeight: FONTS.semibold, color: NEON.magenta, textAlign: 'center', marginBottom: SPACING.xl },
  btn: {
    backgroundColor:   `${NEON.gold}22`,
    paddingHorizontal: SPACING['2xl'],
    paddingVertical:   SPACING.md,
    borderRadius:      RADIUS.full,
    borderWidth:       1,
    borderColor:       `${NEON.gold}55`,
  },
  btnText: { color: NEON.gold, fontWeight: FONTS.extrabold, fontSize: FONTS.md },
});

export default LevelUpModal;
