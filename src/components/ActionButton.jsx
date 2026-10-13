// =============================================================================
// src/components/ActionButton.jsx — Spring-Press Aksiyon Butonu
// Scale-down + Vibration haptik geri bildirimi
// =============================================================================

import React, { useRef, memo } from 'react';
import { NATIVE_DRIVER } from '../utils/animation';
import { Animated, Pressable, Text, StyleSheet, Vibration } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, VIBRATION as VIB } from '../constants/theme';

const ActionButton = memo(({
  icon,
  label,
  onPress,
  color        = 'rgba(124,106,255,0.2)',
  disabled     = false,
  vibrationMs  = 25,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.87, friction: 5, useNativeDriver: NATIVE_DRIVER }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: NATIVE_DRIVER }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    Vibration.vibrate(vibrationMs);
    onPress?.();
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={disabled ? null : handlePressIn}
        onPressOut={disabled ? null : handlePressOut}
        style={[styles.button, { backgroundColor: color }, disabled && styles.disabled]}
      >
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.label, disabled && styles.disabledText]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: { flex: 1, margin: 6 },
  button: {
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: SPACING.base,
    borderRadius:    RADIUS.xl,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.10)',
    ...SHADOWS.md,
  },
  icon:         { fontSize: 28, marginBottom: 6 },
  label: {
    fontSize:      FONTS.xs,
    fontWeight:    FONTS.bold,
    color:         COLORS.textPrimary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  disabled:     { opacity: 0.35 },
  disabledText: { color: COLORS.textSubtle },
});

export default ActionButton;
