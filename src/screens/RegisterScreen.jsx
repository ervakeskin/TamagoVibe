// =============================================================================
// src/screens/RegisterScreen.jsx — Güncellenmiş Kayıt Ekranı
// Sadece temel kullanıcı bilgileriyle kayıt; Pet seçimi içeride yapılacak.
// =============================================================================

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp }                  from 'firebase/firestore';
import { auth, db }                                      from '../api/firebaseConfig';
import { INITIAL_PET_STATE }                             from '../constants/gameConfig';
import { COLORS, NEON, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

const RegisterScreen = ({ navigation }) => {
  const [form,    setForm]    = useState({ displayName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:   0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const setField = useCallback((key) => (val) => setForm((prev) => ({ ...prev, [key]: val })), []);

  const handleRegister = useCallback(async () => {
    const { displayName, email, password } = form;

    if (!displayName.trim() || !email.trim() || !password) {
      setError('Lütfen tüm alanları doldurun.');
      shake();
      return;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      shake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Firebase Auth kaydı
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: displayName.trim() });

      const uid   = cred.user.uid;
      const petId = `pet_${uid}`; // Her kullanıcı kendi petiyle başlar

      // 2. Kullanıcı profili oluşturma
      await setDoc(doc(db, 'users', uid), {
        displayName:      displayName.trim(),
        email:            email.trim(),
        petId,
        leaderboardLevel: 1,
        leaderboardName:  displayName.trim(),
        legacyCount:      0,
        totalBadges:      0,
        createdAt:        serverTimestamp(),
      });

      // 3. Başlangıç Pet dökümanı (İsimsiz ve tür seçilmemiş halde)
      await setDoc(doc(db, 'pets', petId), {
        ...INITIAL_PET_STATE,
        name:      '',    // İlk yumurta açılışında istenecek
        petType:   null,  // Rastgele atanacak
        ownerId:   uid,
        createdAt: serverTimestamp()
      });

    } catch (e) {
      const msgs = {
        'auth/email-already-in-use': 'Bu e-posta zaten kullanılıyor.',
        'auth/weak-password':        'Şifre çok zayıf.',
        'auth/invalid-email':        'Geçersiz e-posta adresi.',
      };
      setError(msgs[e.code] ?? 'Kayıt başarısız, tekrar dene.');
      shake();
    } finally {
      setLoading(false);
    }
  }, [form, shake]);

  const fields = [
    { key: 'displayName', ph: 'Adın ve Soyadın *',    keyboard: 'default',      secure: false, cap: 'words' },
    { key: 'email',       ph: 'E-posta Adresin *',    keyboard: 'email-address', secure: false, cap: 'none'  },
    { key: 'password',    ph: 'Şifren (en az 6 hane) *', keyboard: 'default', secure: true,  cap: 'none'  },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <Text style={styles.logo}>🥚</Text>
          <Text style={styles.appName}>TamagoVibe</Text>
          <Text style={styles.tagline}>Yumurta çatlatmaya hazır mısın?</Text>
        </View>

        <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.cardTitle}>Yeni Hesap Oluştur</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {fields.map((f) => (
            <TextInput
              key={f.key}
              style={styles.input}
              placeholder={f.ph}
              placeholderTextColor={COLORS.textSubtle}
              value={form[f.key]}
              onChangeText={setField(f.key)}
              keyboardType={f.keyboard}
              autoCapitalize={f.cap}
              secureTextEntry={f.secure}
              editable={!loading}
            />
          ))}

          <Pressable
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Hesabımı Oluştur ✨</Text>
            }
          </Pressable>

          <Pressable
            style={styles.linkBtn}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Zaten hesabın var mı? <Text style={styles.linkAccent}>Giriş Yap</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
  header: { alignItems: 'center', marginBottom: SPACING['2xl'] },
  logo:   { fontSize: 80, marginBottom: SPACING.xs },
  appName: { fontSize: FONTS.xl + 4, fontWeight: FONTS.black, color: COLORS.textPrimary, letterSpacing: 2 },
  tagline: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: SPACING.xs },
  card: {
    backgroundColor: COLORS.glass,
    borderRadius:    RADIUS['3xl'],
    padding:         SPACING.xl,
    borderWidth:     1,
    borderColor:     COLORS.glassBorder,
    ...SHADOWS.lg
  },
  cardTitle: { fontSize: FONTS.lg, fontWeight: FONTS.extrabold, color: COLORS.textPrimary, marginBottom: SPACING.lg, textAlign: 'center' },
  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.15)',
    borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)',
  },
  errorText: { color: COLORS.danger, fontSize: FONTS.sm, textAlign: 'center' },
  input: {
    backgroundColor:   COLORS.surface,
    borderRadius:      RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical:   SPACING.md,
    color:             COLORS.textPrimary,
    fontSize:          FONTS.base,
    marginBottom:      SPACING.sm,
    borderWidth:       1,
    borderColor:       COLORS.border,
  },
  btn: {
    backgroundColor: NEON.violet, borderRadius: RADIUS.lg,
    paddingVertical: SPACING.base, alignItems: 'center', marginTop: SPACING.sm,
    ...SHADOWS.neon(NEON.violet),
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontWeight: FONTS.extrabold, fontSize: FONTS.md },
  linkBtn:    { marginTop: SPACING.lg, alignItems: 'center' },
  linkText:   { color: COLORS.textMuted, fontSize: FONTS.sm },
  linkAccent: { color: NEON.purple, fontWeight: FONTS.bold },
});

export default RegisterScreen;