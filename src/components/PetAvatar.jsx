// =============================================================================
// src/components/PetAvatar.jsx
// Büyük 3D sahne; sürükleyerek döndür, kısa dokunuşla sev
// =============================================================================

import React, {
  useEffect, useRef, useState, memo, useCallback, useMemo,
} from 'react';
import {
  View, Text, Animated, PanResponder,
  StyleSheet, Vibration, useWindowDimensions, Platform,
} from 'react-native';
import PetModel3D from './PetModel3D';
import { NATIVE_DRIVER } from '../utils/animation';

const MAX_STAGE_W = 400;
const STAGE_MIN_H = 280;
const STAGE_MAX_H = 340;
const FLOAT_PAD_TOP = 28;
const TAP_MOVE_THRESHOLD = 8;
const DEFAULT_ROTATION = 0.7;   // 3/4 görünüm
const ROTATE_SENSITIVITY = 0.012;

/** Kart içi gerçek genişliğe göre sahne (web'de tam ekran %90 taşmasın) */
function computeStageSize(containerW, screenW) {
  const fallback = Math.min(
    Math.round(screenW * 0.78),
    MAX_STAGE_W,
    Math.max(260, screenW - 72),
  );
  const available = containerW > 0 ? containerW : fallback;
  const stageW = Math.min(Math.floor(available), MAX_STAGE_W);
  const stageH = Math.round(
    Math.min(STAGE_MAX_H, Math.max(STAGE_MIN_H, stageW * 0.88)),
  );
  return { width: Math.max(stageW, 240), height: stageH };
}

// ─── Glow renk haritası ───────────────────────────────────────────────────────
const GLOW = {
  FOX:      { color: '#C9A69E', rgba: 'rgba(233,216,253,0.35)' },
  CAT:      { color: '#FFB3BA', rgba: 'rgba(255,179,186,0.30)' },
  PANDA:    { color: '#B2F5EA', rgba: 'rgba(178,245,234,0.35)' },
  RABBIT:   { color: '#FFD6C0', rgba: 'rgba(255,214,192,0.30)' },
  DOG:      { color: '#BEE3F8', rgba: 'rgba(190,227,248,0.35)' },
  HUSKY:    { color: '#BEE3F8', rgba: 'rgba(190,227,248,0.35)' },
  WOLF:     { color: '#E2E8F0', rgba: 'rgba(160,174,192,0.30)' },
  KOALA:    { color: '#BEE3F8', rgba: 'rgba(190,227,248,0.30)' },
  CAPYBARA: { color: '#B2F5EA', rgba: 'rgba(178,245,234,0.30)' },
  LION:     { color: '#E9D8FD', rgba: 'rgba(233,216,253,0.30)' },
  FROG:     { color: '#B2F5EA', rgba: 'rgba(178,245,234,0.35)' },
};

const MOOD_OVERLAY = {
  HUNGRY:   '🍴',
  SAD:      '💧',
  TIRED:    '😪',
  SICK:     '🌡️',
  SLEEPING: '💤',
  DEAD:     '💀',
};

const FloatingText = memo(({ color }) => {
  const opacity    = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
        Animated.timing(translateY, { toValue: -65, duration: 950, useNativeDriver: false }),
      Animated.timing(opacity,    { toValue: 0,   duration: 950, useNativeDriver: NATIVE_DRIVER }),
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

const PetAvatar = memo(({
  mood    = 'HAPPY',
  name    = 'Koko',
  level   = 1,
  petType = 'FOX',
  onTouch,
  reaction = null,
}) => {
  const { width: screenW } = useWindowDimensions();
  const [containerW, setContainerW] = useState(0);

  const { width: stageW, height: stageH } = useMemo(
    () => computeStageSize(containerW, screenW),
    [containerW, screenW],
  );
  const stageSize = useMemo(() => ({ width: stageW, height: stageH }), [stageW, stageH]);

  const onContainerLayout = useCallback((e) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - containerW) > 1) setContainerW(w);
  }, [containerW]);

  const typeKey  = petType ? String(petType).toUpperCase() : 'FOX';
  const glow     = GLOW[typeKey]      ?? GLOW.FOX;
  const overlay  = MOOD_OVERLAY[mood] ?? null;

  const [floats, setFloats]       = useState([]);
  const [rotationY, setRotationY] = useState(DEFAULT_ROTATION);

  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0.65)).current;
  const jumpAnim  = useRef(new Animated.Value(0)).current;

  const rotationRef      = useRef(0);
  const baseRotationRef  = useRef(0);
  const dragActiveRef    = useRef(false);
  const totalMoveRef     = useRef(0);

  useEffect(() => {
    rotationRef.current = rotationY;
  }, [rotationY]);

  const handleTouch = useCallback(() => {
    Vibration.vibrate(15);

    Animated.sequence([
      Animated.spring(jumpAnim, { toValue: -24, friction: 3, tension: 120, useNativeDriver: false }),
      Animated.spring(jumpAnim, { toValue:   0, friction: 4, tension:  80, useNativeDriver: false }),
    ]).start();

    const id = Date.now();
    setFloats((prev) => [...prev, id]);
    setTimeout(() => setFloats((prev) => prev.filter((f) => f !== id)), 1000);

    onTouch?.();
  }, [onTouch, jumpAnim]);

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  (_, g) => (
        Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4
      ),
      onPanResponderGrant: () => {
        dragActiveRef.current = false;
        totalMoveRef.current = 0;
        baseRotationRef.current = rotationRef.current;
      },
      onPanResponderMove: (_, g) => {
        const moved = Math.abs(g.dx) + Math.abs(g.dy);
        totalMoveRef.current = Math.max(totalMoveRef.current, moved);
        if (moved > TAP_MOVE_THRESHOLD) {
          dragActiveRef.current = true;
        }
        if (dragActiveRef.current) {
          const next = baseRotationRef.current + g.dx * ROTATE_SENSITIVITY;
          rotationRef.current = next;
          setRotationY(next);
        }
      },
      onPanResponderRelease: () => {
        if (!dragActiveRef.current && totalMoveRef.current < TAP_MOVE_THRESHOLD) {
          handleTouch();
        }
        dragActiveRef.current = false;
        totalMoveRef.current = 0;
      },
      onPanResponderTerminate: () => {
        dragActiveRef.current = false;
        totalMoveRef.current = 0;
      },
    }),
    [handleTouch],
  );

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 1800, useNativeDriver: false }),
        Animated.timing(floatAnim, { toValue:  0, duration: 1800, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1.0,  duration: 1600, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(glowAnim, { toValue: 0.55, duration: 1600, useNativeDriver: NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const glowSize = Math.min(stageW + 20, stageH + 40);

  return (
    <View
      style={[styles.wrapper, { minHeight: stageH + FLOAT_PAD_TOP + 56 }]}
      onLayout={onContainerLayout}
    >

      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowRing,
          {
            width:           glowSize,
            height:          glowSize,
            borderRadius:    glowSize / 2,
            top:             FLOAT_PAD_TOP + stageH * 0.5 - glowSize * 0.5,
            backgroundColor: glow.rgba,
            shadowColor:     glow.color,
            opacity:         glowAnim,
            transform: [{
              scale: glowAnim.interpolate({
                inputRange:  [0.55, 1],
                outputRange: [1,    1.08],
              }),
            }],
          },
        ]}
      />

      {floats.map((id) => (
        <View key={id} style={styles.floatWrap} pointerEvents="none">
          <FloatingText color={glow.color} />
        </View>
      ))}

      <View
        style={[styles.stageOuter, { width: stageW, marginTop: FLOAT_PAD_TOP }]}
        {...panResponder.panHandlers}
      >
        {/* translateY: useNativeDriver false — WebGL canvas kırılmasın */}
        <Animated.View
          style={[
            styles.modelStage,
            {
              width:  stageW,
              height: stageH,
              transform: [{ translateY: Animated.add(floatAnim, jumpAnim) }],
            },
          ]}
        >
          <PetModel3D
            key={`${stageW}x${stageH}`}
            petType={typeKey}
            reaction={reaction}
            mood={mood}
            rotationY={rotationY}
            size={stageSize}
          />
          {overlay && (
            <View style={styles.overlayBubble} pointerEvents="none">
              <Text style={styles.overlayTxt}>{overlay}</Text>
            </View>
          )}
        </Animated.View>
      </View>

      <View style={styles.nameRow}>
        <Text style={styles.petName}>{name}</Text>
        <View style={[styles.levelPill, { borderColor: 'rgba(74,90,58,0.35)' }]}>
          <Text style={[styles.levelTxt, { color: '#4A5A3A' }]}>lv.{level}</Text>
        </View>
      </View>

    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    alignItems:      'center',
    justifyContent:  'flex-start',
    paddingVertical: 8,
    width:           '100%',
    maxWidth:        '100%',
    overflow:        'visible',
    ...(Platform.OS === 'web' ? { alignSelf: 'center' } : {}),
  },
  glowRing: {
    position:     'absolute',
    alignSelf:    'center',
    zIndex:       0,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius:  32,
    elevation:     0,
  },
  stageOuter: {
    zIndex:       2,
    overflow:     'visible',
    alignItems:   'center',
  },
  floatWrap: {
    position:  'absolute',
    top:       40,
    alignSelf: 'center',
    zIndex:    99,
  },
  floatTxt: {
    fontSize:   14,
    fontWeight: '700',
    fontStyle:  'italic',
  },
  modelStage: {
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'visible',
    position:       'relative',
  },
  overlayBubble: {
    position:        'absolute',
    top:             8,
    right:           8,
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
    marginTop:       14,
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
