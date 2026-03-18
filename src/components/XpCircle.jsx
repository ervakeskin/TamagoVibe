// =============================================================================
// src/components/XpCircle.jsx — SVG'siz Dairesel XP İlerleme Göstergesi
// İki yarı-daire yöntemi: clip + rotate animasyonu
// =============================================================================

import React, { useEffect, useRef, memo } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

const SIZE   = 110;
const STROKE = 8;
const INNER  = SIZE - STROKE * 2;

const XpCircle = memo(({ progress = 0, level = 1, xpLabel = '' }) => {
  const animProgress = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.spring(animProgress, {
      toValue:         progress,
      friction:        8,
      tension:         40,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const rightRotate = animProgress.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '180deg'],
  });
  const leftRotate = animProgress.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: ['0deg', '0deg', '180deg'],
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        {/* Sağ yarı */}
        <View style={[styles.halfClip, styles.rightClip]}>
          <Animated.View style={[styles.halfCircle, styles.rightHalf, { transform: [{ rotate: rightRotate }] }]} />
        </View>
        {/* Sol yarı */}
        <View style={[styles.halfClip, styles.leftClip]}>
          <Animated.View style={[styles.halfCircle, styles.leftHalf, { transform: [{ rotate: leftRotate }] }]} />
        </View>
        {/* Merkez */}
        <View style={styles.inner}>
          <Text style={styles.lvLabel}>LV</Text>
          <Text style={styles.lvNum}>{level}</Text>
          <Text style={styles.xpText}>{xpLabel}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  track: {
    width:           SIZE, height: SIZE,
    borderRadius:    SIZE / 2,
    backgroundColor: COLORS.glassMed,
    alignItems:      'center',
    justifyContent:  'center',
    position:        'relative',
  },
  halfClip: { width: SIZE / 2, height: SIZE, overflow: 'hidden', position: 'absolute', top: 0 },
  rightClip: { right: 0 },
  leftClip:  { left:  0 },
  halfCircle: {
    width:        SIZE, height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth:  STROKE,
    borderColor:  COLORS.xp,
    position:     'absolute',
    top:          0,
  },
  rightHalf: { left: 0, borderTopColor: 'transparent', borderLeftColor: 'transparent' },
  leftHalf:  { right: 0, left: undefined, borderBottomColor: 'transparent', borderRightColor: 'transparent' },
  inner: {
    width:           INNER, height: INNER,
    borderRadius:    INNER / 2,
    backgroundColor: COLORS.bgCard,
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          10,
  },
  lvLabel: { fontSize: FONTS.xs, color: COLORS.textMuted, fontWeight: FONTS.bold, letterSpacing: 1.5, marginBottom: -2 },
  lvNum:   { fontSize: FONTS['2xl'], fontWeight: FONTS.black, color: COLORS.xp, lineHeight: 32 },
  xpText:  { fontSize: 9, color: COLORS.textMuted, fontWeight: FONTS.semibold, marginTop: 2 },
});

export default XpCircle;
