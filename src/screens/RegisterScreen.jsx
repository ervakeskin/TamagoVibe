// =============================================================================
// src/screens/RegisterScreen.jsx — Kayıt (ortak AuthForm arayüzü)
// Pet türü yumurtadan çıkınca belli olur; burada yalnızca hesap bilgisi alınır.
// =============================================================================

import React, { useState, useCallback } from 'react';
import AuthForm from '../components/AuthForm';
import { register } from '../services/authService';

export const REGISTER_ERRORS = {
  'auth/email-already-in-use': 'Bu e-posta zaten kullanılıyor.',
  'auth/weak-password':        'Şifre çok zayıf.',
  'auth/invalid-email':        'Geçersiz e-posta adresi.',
};

const RegisterScreen = ({ navigation }) => {
  const [form,      setForm]      = useState({ displayName: '', email: '', password: '' });
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [errorTick, setErrorTick] = useState(0);

  const fail = useCallback((msg) => {
    setError(msg);
    setErrorTick((t) => t + 1);
  }, []);

  const setField = useCallback((key) => (val) => setForm((prev) => ({ ...prev, [key]: val })), []);

  const handleRegister = useCallback(async () => {
    const { displayName, email, password } = form;
    if (!displayName.trim() || !email.trim() || !password) {
      fail('Lütfen tüm alanları doldurun.');
      return;
    }
    if (password.length < 6) {
      fail('Şifre en az 6 karakter olmalı.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register({ displayName, email, password });
    } catch (e) {
      fail(REGISTER_ERRORS[e.code] ?? 'Kayıt başarısız, tekrar dene.');
    } finally {
      setLoading(false);
    }
  }, [form, fail]);

  return (
    <AuthForm
      logo="🥚"
      tagline="Yumurta çatlatmaya hazır mısın?"
      title="YENİ HESAP"
      fields={[
        { key: 'displayName', placeholder: 'Adın ve Soyadın *',       value: form.displayName, onChange: setField('displayName'), cap: 'words' },
        { key: 'email',       placeholder: 'E-posta Adresin *',        value: form.email,       onChange: setField('email'),       keyboard: 'email-address' },
        { key: 'password',    placeholder: 'Şifren (en az 6 hane) *',  value: form.password,    onChange: setField('password'),    secure: true },
      ]}
      submitLabel="Hesabımı Oluştur ✨"
      loading={loading}
      error={error}
      errorTick={errorTick}
      onSubmit={handleRegister}
      footerText="Zaten hesabın var mı?"
      footerLink="Giriş Yap"
      onFooter={() => navigation.navigate('Login')}
    />
  );
};

export default RegisterScreen;
