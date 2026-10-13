// =============================================================================
// DeviceFrame.jsx — Tamagotchi tarzı cihaz kabuğu + LCD ekran + fiziksel butonlar
// =============================================================================

import React, { memo, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { NATIVE_DRIVER } from '../utils/animation';

// ─── Kalp / nokta ölçer (Tamagotchi stat göstergesi) ─────────────────────────
const PIPS = 5;

export const PipMeter = memo(({ icon, label, value = 100, color }) => {
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * PIPS);
  const critical = value < 20;
  return (
    <View style={styles.meter} accessibilityLabel={`${label} ${Math.round(value)}`}>
      <Text style={styles.meterIcon}>{icon}</Text>
      <View style={styles.pips}>
        {Array.from({ length: PIPS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.pip,
              i < filled
                ? { backgroundColor: critical ? COLORS.danger : color }
                : { backgroundColor: 'rgba(74,90,58,0.18)' },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.meterVal, critical && { color: COLORS.danger }]}>
        {Math.round(value)}
      </Text>
    </View>
  );
});

// ─── Fiziksel buton ──────────────────────────────────────────────────────────
const DeviceButton = memo(({ icon, label, color, disabled, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.88, friction: 5, useNativeDriver: NATIVE_DRIVER }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 90, useNativeDriver: NATIVE_DRIVER }).start();

  return (
    <View style={styles.btnCol}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          disabled={disabled}
          onPress={onPress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={[
            styles.btn,
            { backgroundColor: color },
            disabled && styles.btnOff,
          ]}
        >
          <View style={styles.btnShine} />
          <Text style={styles.btnIcon}>{icon}</Text>
        </Pressable>
      </Animated.View>
      <Text style={[styles.btnLabel, disabled && { opacity: 0.4 }]}>{label}</Text>
    </View>
  );
});

// ─── Cihaz ───────────────────────────────────────────────────────────────────
/**
 * @param {Array}  meters   [{ icon, label, value, color }] LCD üst satırı
 * @param {Array}  buttons  [{ icon, label, color, onPress, disabled }]
 * @param {node}   children LCD içeriği (3D hayvan)
 * @param {node}   footer   LCD alt şeridi (XP vb.)
 */
const DeviceFrame = ({ meters = [], buttons = [], children, footer, sleeping = false }) => (
  <View style={styles.shell}>
    <View style={styles.shellShine} />
    <View style={styles.brandRow}>
      <View style={styles.brandDot} />
      <Text style={styles.brand}>TamagoVibe</Text>
      <View style={styles.brandDot} />
    </View>

    <View style={styles.bezel}>
      <View style={[styles.lcd, sleeping && styles.lcdNight]}>
        <View style={styles.meterRow}>
          {meters.map((m) => <PipMeter key={m.label} {...m} />)}
        </View>
        <View style={styles.lcdBody}>{children}</View>
        {footer ? <View style={styles.lcdFooter}>{footer}</View> : null}
        <View style={styles.lcdGlare} pointerEvents="none" />
      </View>
    </View>

    <View style={styles.buttonRow}>
      {buttons.map((b) => <DeviceButton key={b.label} {...b} />)}
    </View>
  </View>
);

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: COLORS.shell,
    borderRadius: 56,
    borderWidth: 4,
    borderColor: COLORS.shellDeep,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 20,
    ...SHADOWS.lg,
  },
  shellShine: {
    position: 'absolute', top: 10, left: 34, right: 34, height: 18,
    borderRadius: 9, backgroundColor: COLORS.shellShine, opacity: 0.55,
  },

  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, marginBottom: 10 },
  brand: { fontSize: 12, fontWeight: '800', color: '#B98A82', letterSpacing: 3, textTransform: 'uppercase' },
  brandDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E2A9A0' },

  bezel: {
    backgroundColor: '#8F7F7B',
    borderRadius: 30,
    padding: 8,
    ...SHADOWS.sm,
  },
  lcd: {
    backgroundColor: COLORS.lcd,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.lcdDeep,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  lcdNight: { backgroundColor: '#C5D0B2' },
  lcdBody: { alignItems: 'center', justifyContent: 'center', minHeight: 250 },
  lcdFooter: { paddingHorizontal: 14 },
  lcdGlare: {
    position: 'absolute', top: -30, left: -30, width: 150, height: 90,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 60,
    transform: [{ rotate: '-18deg' }],
  },

  meterRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 10, paddingTop: 10, paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: 'rgba(74,90,58,0.15)',
  },
  meter: { alignItems: 'center', flex: 1 },
  meterIcon: { fontSize: 18 },
  pips: { flexDirection: 'row', gap: 2, marginTop: 4 },
  pip: { width: 7, height: 9, borderRadius: 2 },
  meterVal: { fontSize: 10, fontWeight: '800', color: COLORS.lcdInk, marginTop: 2 },

  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 18, paddingHorizontal: 4 },
  btnCol: { alignItems: 'center', width: 70 },
  btn: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  btnOff: { opacity: 0.35 },
  btnShine: {
    position: 'absolute', top: 5, left: 10, width: 20, height: 9,
    borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.55)',
  },
  btnIcon: { fontSize: 24 },
  btnLabel: { marginTop: 6, fontSize: 10, fontWeight: '800', color: '#A57B73', letterSpacing: 0.6 },
});

export default DeviceFrame;
