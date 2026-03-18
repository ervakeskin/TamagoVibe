// =============================================================================
// src/screens/LoginScreen.jsx — Platinum Edition (Fix & Style)
// =============================================================================

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, Animated,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../api/firebaseConfig'; // Sadece bir kez tanımlı olmalı!
import { COLORS } from '../constants/gameConfig';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('LOGIN SCREEN AKTİF');
  }, []);

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('E-posta ve şifre gerekli.');
      shake();
      return;
    }
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      const msgs = {
        'auth/invalid-credential': 'E-posta veya şifre hatalı.',
        'auth/user-not-found': 'Bu hesap bulunamadı.',
        'auth/wrong-password': 'Şifre hatalı.',
        'auth/network-request-failed': 'İnternet bağlantını kontrol et.',
      };
      setError(msgs[e.code] ?? 'Giriş başarısız, lütfen tekrar dene.');
      shake();
    } finally {
      setLoading(false);
    }
  }, [email, password, shake]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        
        <View style={styles.header}>
          <Text style={styles.logo}>🎨</Text>
          <Text style={styles.appName}>TamagoVibe</Text>
          <Text style={styles.tagline}>Minimalist lüks bir dostluk</Text>
        </View>

        <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.cardTitle}>Giriş Yap</Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="E-posta"
            placeholderTextColor="#A0AEC0"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor="#A0AEC0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <Pressable
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Giriş Yap</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.linkBtn}
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              Hesabın yok mu? <Text style={styles.linkAccent}>Kayıt Ol</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFBF5' }, // Kağıt beyazı arka plan
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 25 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 60, marginBottom: 10 },
  appName: { fontSize: 32, fontWeight: '900', color: '#FF4D6D' },
  tagline: { fontSize: 14, color: '#A0AEC0', marginTop: 5 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 35,
    padding: 30,
    elevation: 10,
    shadowColor: '#FF4D6D',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#2D3748', marginBottom: 25, textAlign: 'center' },
  errorBox: { backgroundColor: '#FFF5F5', padding: 12, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#FED7D7' },
  errorText: { color: '#C53030', fontSize: 13, textAlign: 'center' },
  input: {
    backgroundColor: '#F7FAFC',
    borderRadius: 20,
    padding: 18,
    color: '#2D3748',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btn: { backgroundColor: '#FF4D6D', borderRadius: 20, padding: 18, alignItems: 'center', marginTop: 10 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkBtn: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#718096', fontSize: 14 },
  linkAccent: { color: '#FF4D6D', fontWeight: 'bold' },
});

export default LoginScreen;