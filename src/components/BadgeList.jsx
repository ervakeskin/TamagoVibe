// =============================================================================
// src/components/BadgeList.jsx — Rozet Motoru
// Kazanılmış: renkli + glow | Kazanılmamış: gri + mat
// =============================================================================

import React, { useRef, useEffect, memo } from 'react';
import { View, Text, Animated, ScrollView, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { ACHIEVEMENTS } from '../constants/gameConfig';

// ─── Tek Rozet Kartı ──────────────────────────────────────────────────────────
const BadgeCard = memo(({ achievement, unlocked, isNew = false }) => {
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(unlocked ? 1 : 0.92)).current;

  useEffect(() => {
    if (isNew) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim,  { toValue: 1,   duration: 600, useNativeDriver: true }),
          Animated.timing(glowAnim,  { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      ).start();
      Animated.spring(scaleAnim, { toValue: 1.06, friction: 4, useNativeDriver: true }).start();
    }
  }, [isNew]);

  return (
    <Animated.View
      style={[
        styles.card,
        unlocked ? { borderColor: achievement.color + '55' } : styles.lockedCard,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {isNew && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: achievement.color, opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }), borderRadius: RADIUS.lg },
          ]}
        />
      )}

      <View style={[styles.iconBg, { backgroundColor: unlocked ? achievement.color + '22' : COLORS.glass }]}>
        <Text style={[styles.icon, !unlocked && styles.lockedIcon]}>
          {unlocked ? achievement.icon : '🔒'}
        </Text>
      </View>

      <Text style={[styles.title, !unlocked && styles.lockedTitle]} numberOfLines={1}>
        {achievement.title}
      </Text>
      <Text style={styles.desc} numberOfLines={2}>
        {achievement.description}
      </Text>

      {unlocked && (
        <View style={[styles.xpBadge, { borderColor: achievement.color }]}>
          <Text style={[styles.xpText, { color: achievement.color }]}>
            +{achievement.xpReward} XP
          </Text>
        </View>
      )}
    </Animated.View>
  );
});

// ─── Liste ────────────────────────────────────────────────────────────────────
const BadgeList = memo(({ unlockedBadges = [], newBadges = [] }) => (
  <View>
    <Text style={styles.sectionTitle}>🏆 Başarımlar</Text>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {ACHIEVEMENTS.map((a) => (
        <BadgeCard
          key={a.id}
          achievement={a}
          unlocked={unlockedBadges.includes(a.id)}
          isNew={newBadges.includes(a.id)}
        />
      ))}
    </ScrollView>
  </View>
));

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize:      FONTS.xs,
    fontWeight:    FONTS.bold,
    color:         COLORS.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom:  SPACING.md,
  },
  scroll: { paddingRight: SPACING.sm },
  card: {
    width:           110,
    backgroundColor: COLORS.glass,
    borderRadius:    RADIUS.lg,
    borderWidth:     1,
    padding:         SPACING.sm,
    marginRight:     SPACING.sm,
    alignItems:      'center',
    overflow:        'hidden',
  },
  lockedCard: { borderColor: COLORS.border, opacity: 0.5 },
  iconBg: {
    width:          52, height: 52,
    borderRadius:   RADIUS.md,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   SPACING.sm,
  },
  icon:        { fontSize: 26 },
  lockedIcon:  { opacity: 0.4 },
  title: {
    fontSize:     FONTS.xs,
    fontWeight:   FONTS.bold,
    color:        COLORS.textPrimary,
    textAlign:    'center',
    marginBottom: SPACING.xs,
  },
  lockedTitle: { color: COLORS.textSubtle },
  desc: {
    fontSize:  FONTS.xs,
    color:     COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  xpBadge: {
    marginTop:         SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical:   2,
    borderRadius:      RADIUS.full,
    borderWidth:       1,
  },
  xpText: { fontSize: FONTS.xs, fontWeight: FONTS.bold },
});

export default BadgeList;
