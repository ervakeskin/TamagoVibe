// =============================================================================
// src/components/FoodModal.jsx — Yemek Seçimi Bottom Sheet
// Slide-up animasyonu + her kart için spring press efekti
// =============================================================================

import React, { useEffect, useRef, memo } from 'react';
import { NATIVE_DRIVER } from '../utils/animation';
import {
  Modal, View, Text, Pressable,
  Animated, StyleSheet, Vibration,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { FOOD_TYPES } from '../constants/gameConfig';

// ─── Tek Yemek Kartı ──────────────────────────────────────────────────────────
const FoodCard = memo(({ food, onSelect }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn  = () =>
    Animated.spring(scale, { toValue: 0.93, friction: 5, useNativeDriver: NATIVE_DRIVER }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1,    friction: 4, useNativeDriver: NATIVE_DRIVER }).start();

  const handlePress = () => {
    Vibration.vibrate(30);
    onSelect(food.id);
  };

  const effects = [
    food.hunger    > 0 && `+${food.hunger} Açlık`,
    food.health    > 0 && `+${food.health} Sağlık`,
    food.happiness > 0 && `+${food.happiness} Mutluluk`,
    `+${food.xp} XP`,
  ].filter(Boolean);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.foodCard, { borderColor: food.color + '55' }]}
      >
        <View style={[styles.iconBg, { backgroundColor: food.color + '22' }]}>
          <Text style={styles.foodIcon}>{food.icon}</Text>
        </View>

        <View style={styles.foodInfo}>
          <Text style={styles.foodLabel}>{food.label}</Text>
          <Text style={styles.foodDesc}>{food.description}</Text>
          <Text style={styles.foodEffects}>{effects.join('  •  ')}</Text>
        </View>

        <Text style={[styles.arrow, { color: food.color }]}>›</Text>
      </Pressable>
    </Animated.View>
  );
});

// ─── Ana Modal ────────────────────────────────────────────────────────────────
const FoodModal = ({ visible, onSelect, onClose }) => {
  const slideY  = useRef(new Animated.Value(400)).current;
  const fadeOp  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeOp, { toValue: 1, duration: 220, useNativeDriver: NATIVE_DRIVER }),
        Animated.spring(slideY,  { toValue: 0, friction: 8,   useNativeDriver: NATIVE_DRIVER }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeOp, { toValue: 0, duration: 160, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(slideY,  { toValue: 400, duration: 200, useNativeDriver: NATIVE_DRIVER }),
      ]).start();
    }
  }, [visible]);

  const handleSelect = (foodType) => {
    onSelect(foodType);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: fadeOp }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>🍽️ Ne yiyelim?</Text>
        <Text style={styles.subtitle}>Evcil hayvanın için bir şeyler seç</Text>

        {Object.values(FOOD_TYPES).map((food) => (
          <FoodCard key={food.id} food={food} onSelect={handleSelect} />
        ))}

        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>Vazgeç</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position:             'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor:      COLORS.bgCard,
    borderTopLeftRadius:  RADIUS['3xl'],
    borderTopRightRadius: RADIUS['3xl'],
    padding:              SPACING.xl,
    paddingBottom:        SPACING['3xl'],
    borderTopWidth:       1,
    borderColor:          COLORS.glassBorder,
    ...SHADOWS.lg,
  },
  handle: {
    width:           48, height: 4,
    borderRadius:    RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf:       'center',
    marginBottom:    SPACING.lg,
  },
  title:    { fontSize: FONTS.lg, fontWeight: FONTS.extrabold, color: COLORS.textPrimary, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: SPACING.lg },

  foodCard: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: COLORS.glass,
    borderRadius:    RADIUS.lg,
    borderWidth:     1,
    padding:         SPACING.md,
    marginBottom:    SPACING.sm,
  },
  iconBg: {
    width:          52, height: 52,
    borderRadius:   RADIUS.md,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    SPACING.md,
  },
  foodIcon:    { fontSize: 26 },
  foodInfo:    { flex: 1 },
  foodLabel:   { fontSize: FONTS.md, fontWeight: FONTS.bold, color: COLORS.textPrimary, marginBottom: 2 },
  foodDesc:    { fontSize: FONTS.xs, color: COLORS.textMuted, marginBottom: 4 },
  foodEffects: { fontSize: FONTS.xs, color: COLORS.textSubtle },
  arrow:       { fontSize: 24, fontWeight: FONTS.regular, marginLeft: SPACING.sm },

  cancelBtn:   { marginTop: SPACING.sm, paddingVertical: SPACING.md, alignItems: 'center' },
  cancelText:  { color: COLORS.textSubtle, fontWeight: FONTS.semibold, fontSize: FONTS.base },
});

export default FoodModal;
