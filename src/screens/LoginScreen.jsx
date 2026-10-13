// =============================================================================
// src/screens/LoginScreen.jsx — Giriş (ortak AuthForm arayüzü)
// =============================================================================

import React, { useState, useCallback } from 'react';
import AuthForm from '../components/AuthForm';
import { login } from '../services/authService';

export const LOGIN_ERRORS = {
  'auth/invalid-credential':     'E-posta veya şifre hatalı.',
  'auth/user-not-found':         'Bu hesap bulunamadı.',
  'auth/wrong-password':         'Şifre hatalı.',
  'auth/network-request-failed': 'İnternet bağlantını kontrol et.',
};

const LoginScreen = ({ navigation }) => {
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [errorTick, setErrorTick] = useState(0);

  const fail = useCallback((msg) => {
    setError(msg);
    setErrorTick((t) => t + 1);
  }, []);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password) {
      fail('E-posta ve şifre gerekli.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login({ email, password });
    } catch (e) {
      fail(LOGIN_ERRORS[e.code] ?? 'Giriş başarısız, lütfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  }, [email, password, fail]);

  return (
    <AuthForm
      logo="🥚"
      tagline="Dijital dostunu büyütmeye devam et"
      title="GİRİŞ YAP"
      fields={[
        { key: 'email',    placeholder: 'E-posta', value: email,    onChange: setEmail,    keyboard: 'email-address' },
        { key: 'password', placeholder: 'Şifre',   value: password, onChange: setPassword, secure: true },
      ]}
      submitLabel="Giriş Yap"
      loading={loading}
      error={error}
      errorTick={errorTick}
      onSubmit={handleLogin}
      footerText="Hesabın yok mu?"
      footerLink="Kayıt Ol"
      onFooter={() => navigation.navigate('Register')}
    />
  );
};

export default LoginScreen;
