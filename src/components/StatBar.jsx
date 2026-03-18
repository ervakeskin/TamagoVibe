// =============================================================================
// src/components/StatBar.jsx
// Kawaii pastel stat çubuğu — soft track, spring animasyonu, kritik pulse
// =============================================================================

import React, { useEffect, useRef, memo } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

const StatBar = memo(({ label, value, maxValue = 100, color = '#C9A69E', icon = '✨' }) => {
  const animWidth  = useRef(new Animated.Value(value / maxValue)).current;
  const critPulse  = useRef(new Animated.Value(1)).current;
  const isCritical = value < 20;

  // Bar genişliği — spring geçiş
  useEffect(() => {
    Animated.spring(animWidth, {
      toValue:         value / maxValue,
      friction:        7,
      tension:         50,
      useNativeDriver: false,
    }).start();
  }, [value, maxValue]);

  // Kritik eşikte sayaç yanıp söner
  useEffect(() => {
    if (isCritical) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(critPulse, { toValue: 0.35, duration: 500, useNativeDriver: true }),
          Animated.timing(critPulse, { toValue: 1.0,  duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      critPulse.setValue(1);
    }
  }, [isCritical]);

  const fillColor = isCritical ? '#E8927C' : color;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
        <Animated.Text
          style={[
            styles.value,
            isCritical && { color: '#E8927C', opacity: critPulse },
          ]}
        >
          {Math.round(value)}
        </Animated.Text>
      </View>

      {/* Track */}
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: fillColor,
              shadowColor:     fillColor,
              width: animWidth.interpolate({
                inputRange:  [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container:  { marginBottom: 16 },

  row: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  7,
  },
  icon: {
    fontSize:    13,
    marginRight: 7,
  },
  label: {
    flex:          1,
    fontSize:      12,
    fontWeight:    '600',
    color:         '#A08C89',
    letterSpacing: 0.4,
  },
  value: {
    fontSize:   12,
    fontWeight: '700',
    color:      '#A08C89',
    minWidth:   26,
    textAlign:  'right',
  },

  track: {
    height:          8,
    backgroundColor: 'rgba(201,166,158,0.15)',
    borderRadius:    99,
    overflow:        'hidden',
  },
  fill: {
    height:         '100%',
    borderRadius:   99,
    shadowOffset:   { width: 0, height: 0 },
    shadowOpacity:  0.4,
    shadowRadius:   6,
    elevation:      2,
    opacity:        0.9,
  },
});

export default StatBar;