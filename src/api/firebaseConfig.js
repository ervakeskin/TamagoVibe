// =============================================================================
// src/api/firebaseConfig.js — TamagoVibe Firebase Başlatma
// Auth (AsyncStorage kalıcılığı) ve Firestore exportları
// =============================================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Proje Konfigürasyonu ─────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            'AIzaSyDUgVVaaT_M0TC4-ORnWekeRPkr3x36qFc',
  authDomain:        'tamagovibe.firebaseapp.com',
  projectId:         'tamagovibe',
  storageBucket:     'tamagovibe.firebasestorage.app',
  messagingSenderId: '160835663388',
  appId:             '1:160835663388:web:6714d03b9558c3592b11d9',
  measurementId:     'G-FMX6NDGC27',
};

// ─── Singleton App (hot-reload güvenli) ──────────────────────────────────────
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

// ─── Auth — AsyncStorage ile kalıcı oturum ───────────────────────────────────
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Zaten başlatılmışsa mevcut instance
  auth = getAuth(app);
}

// ─── Firestore ────────────────────────────────────────────────────────────────
const db = getFirestore(app);

export { app, auth, db };
