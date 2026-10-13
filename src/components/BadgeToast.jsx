// =============================================================================
// BadgeToast.jsx — Yeni rozet kazanılınca üstten kayan bildirim
// =============================================================================

import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { ACHIEVEMENTS, COLORS, SHADOWS } from '../constants/gameConfig';
import { NATIVE_DRIVER } from '../utils/animation';

const SHOW_MS = 3500;

const BadgeToast = ({ badgeIds = [], onDone }) => {
  const slide = useRef(new Animated.Value(0)).current;
  const badges = badgeIds
    .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
    .filter(Boolean);
  const key = badgeIds.join(',');

  useEffect(() => {
    if (!badges.length) return undefined;
    slide.setValue(0);
    Animated.spring(slide, { toValue: 1, friction: 7, tension: 70, useNativeDriver: NATIVE_DRIVER }).start();
    const t = setTimeout(() => {
      Animated.timing(slide, { toValue: 0, duration: 250, useNativeDriver: NATIVE_DRIVER })
        .start(() => onDone?.());
    }, SHOW_MS);
    return () => clearTimeout(t);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!badges.length) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          opacity: slide,
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
        },
      ]}
    >
      {badges.map((b) => (
        <View key={b.id} style={[styles.toast, { borderColor: b.color }]}>
          <Text style={styles.icon}>{b.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.head}>Yeni rozet!</Text>
            <Text style={styles.title}>{b.title}</Text>
            <Text style={styles.desc}>{b.description}</Text>
          </View>
        </View>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap:  { position: 'absolute', top: 10, left: 14, right: 14, zIndex: 50, gap: 8 },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFDF8', borderRadius: 20, borderWidth: 2,
    paddingVertical: 12, paddingHorizontal: 16, ...SHADOWS.lg,
  },
  icon:  { fontSize: 34 },
  head:  { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: COLORS.textSoft, textTransform: 'uppercase' },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  desc:  { fontSize: 12, color: COLORS.textSecond, marginTop: 1 },
});

export default BadgeToast;
