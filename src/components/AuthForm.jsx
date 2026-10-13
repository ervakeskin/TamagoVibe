// =============================================================================
// AuthForm.jsx — Giriş / Kayıt ekranları için ortak pastel arayüz
// =============================================================================

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Animated,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { NATIVE_DRIVER } from '../utils/animation';

/**
 * @param {Array}  fields   [{ key, placeholder, value, onChange, secure, keyboard, cap }]
 * @param {number} errorTick hata her yenilendiğinde artar, kartı sallar
 */
const AuthForm = ({
  logo, tagline, title, fields, submitLabel, loading, error, errorTick = 0,
  onSubmit, footerText, footerLink, onFooter,
}) => {
  const shake = useRef(new Animated.Value(0)).current;
  const bob   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!errorTick) return;
    Animated.sequence([
      Animated.timing(shake, { toValue:  10, duration: 60, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(shake, { toValue:   6, duration: 50, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(shake, { toValue:   0, duration: 50, useNativeDriver: NATIVE_DRIVER }),
    ]).start();
  }, [errorTick, shake]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 1300, useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(bob, { toValue: 0, duration: 1300, useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [bob]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Animated.Text
            style={[
              styles.logo,
              { transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }] },
            ]}
          >
            {logo}
          </Animated.Text>
          <Text style={styles.appName}>TamagoVibe</Text>
          <Text style={styles.tagline}>{tagline}</Text>
        </View>

        <Animated.View style={[styles.card, { transform: [{ translateX: shake }] }]}>
          <Text style={styles.cardTitle}>{title}</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {fields.map((f, i) => (
            <TextInput
              key={f.key}
              style={styles.input}
              placeholder={f.placeholder}
              placeholderTextColor={COLORS.textSoft}
              value={f.value}
              onChangeText={f.onChange}
              secureTextEntry={!!f.secure}
              keyboardType={f.keyboard ?? 'default'}
              autoCapitalize={f.cap ?? 'none'}
              autoCorrect={false}
              returnKeyType={i === fields.length - 1 ? 'done' : 'next'}
              onSubmitEditing={i === fields.length - 1 ? onSubmit : undefined}
              accessibilityLabel={f.placeholder}
            />
          ))}

          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
            onPress={onSubmit}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnTxt}>{submitLabel}</Text>}
          </Pressable>

          <Pressable onPress={onFooter} style={styles.footer}>
            <Text style={styles.footerTxt}>
              {footerText} <Text style={styles.footerLink}>{footerLink}</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 40 },

  header:  { alignItems: 'center', marginBottom: 26 },
  logo:    { fontSize: 72, marginBottom: 6 },
  appName: { fontSize: 30, fontWeight: '900', color: COLORS.roseGold, fontStyle: 'italic', letterSpacing: 0.5 },
  tagline: { fontSize: 13, color: COLORS.textSoft, marginTop: 4, fontStyle: 'italic' },

  card: {
    backgroundColor: COLORS.shell,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: COLORS.shellDeep,
    padding: 22,
    ...SHADOWS.lg,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#8C6F68', textAlign: 'center', marginBottom: 16, letterSpacing: 1 },

  errorBox: {
    backgroundColor: 'rgba(232,146,124,0.18)', borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: COLORS.danger, marginBottom: 12,
  },
  errorText: { color: '#B45A45', fontSize: 13, textAlign: 'center', fontWeight: '600' },

  input: {
    backgroundColor: COLORS.lcd,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.lcdDeep,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.lcdInk,
    marginBottom: 12,
  },

  btn: {
    backgroundColor: COLORS.roseGold,
    borderRadius: 99,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    ...SHADOWS.md,
  },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },

  footer:     { alignItems: 'center', marginTop: 16 },
  footerTxt:  { fontSize: 13, color: '#A57B73' },
  footerLink: { fontWeight: '800', color: '#8C6F68' },
});

export default AuthForm;
