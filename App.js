// =============================================================================
// App.js — TamagoVibe FINAL
// Tab: Pet / ChatList / Graveyard
// Stack (tab dışı): ChatDetail + Social
// =============================================================================

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, Platform } from 'react-native';
import { NavigationContainer }          from '@react-navigation/native';
import { createNativeStackNavigator }   from '@react-navigation/native-stack';
import { createBottomTabNavigator }     from '@react-navigation/bottom-tabs';

import { subscribeSession } from './src/services/authService';
import { registerForPushNotifications } from './src/api/notificationService';
import { COLORS } from './src/constants/theme';
import { installGlobalErrorHandler, logError } from './src/utils/logger';

import LoginScreen      from './src/screens/LoginScreen';
import RegisterScreen   from './src/screens/RegisterScreen';
import PetScreen        from './src/screens/PetScreen';
import ChatListScreen   from './src/screens/ChatListScreen';
import ChatDetailScreen from './src/screens/ChatDetailScreen';
import GraveyardScreen  from './src/screens/GraveyardScreen';
import SocialScreen     from './src/screens/SocialScreen';

installGlobalErrorHandler();

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const P = {
  cream:    COLORS.bg,
  roseGold: COLORS.roseGold,
  textSoft: COLORS.textSoft,
  text:     COLORS.text,
  border:   COLORS.border,
};

// Web'de uygulama telefon genişliğinde ortalanır (Android'de etkisiz)
const webFrame = {
  outer: { flex: 1, backgroundColor: COLORS.bgDeep },
  inner: {
    flex: 1, width: '100%', alignSelf: 'center',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    backgroundColor: COLORS.bg,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 0 40px rgba(201,166,158,0.25)' }
      : {}),
  },
};

const SplashScreen = () => (
  <View style={{ flex: 1, backgroundColor: P.cream, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 72, marginBottom: 16 }}>🥚</Text>
    <ActivityIndicator size="large" color={P.roseGold} />
    <Text style={{ color: P.textSoft, marginTop: 12, fontSize: 14, fontStyle: 'italic' }}>
      Yükleniyor...
    </Text>
  </View>
);

const TAB_CFG = {
  Pet:       { icon: '🐾', label: 'Hayvan'   },
  ChatList:  { icon: '💬', label: 'Mesajlar' },
  Graveyard: { icon: '🪦', label: 'Anılar'   },
};

const MainTabs = ({ sharedParams }) => (
  <Tab.Navigator
    screenOptions={({ route }) => {
      const cfg = TAB_CFG[route.name] ?? { icon: '•', label: route.name };
      return {
        headerShown: false,
        // Etiket + ikon tek dikey blokta: her ekran genişliğinde hizalı kalır
        tabBarShowLabel: false,
        tabBarItemStyle: { alignItems: 'center', justifyContent: 'center' },
        tabBarStyle: {
          backgroundColor: P.cream,
          borderTopColor:  P.border,
          borderTopWidth:  1,
          paddingBottom:   8,
          paddingTop:      6,
          height:          64,
        },
        tabBarActiveTintColor:   P.roseGold,
        tabBarInactiveTintColor: P.textSoft,
        tabBarIcon: ({ focused, color }) => (
          <View style={{ alignItems: 'center', justifyContent: 'center', width: 80 }}>
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{cfg.icon}</Text>
            <Text
              numberOfLines={1}
              style={{ color, fontSize: 10, marginTop: 2, fontWeight: focused ? '700' : '500', fontStyle: 'italic' }}
            >
              {cfg.label}
            </Text>
          </View>
        ),
      };
    }}
  >
    <Tab.Screen name="Pet"       component={PetScreen}       initialParams={sharedParams} />
    <Tab.Screen name="ChatList"  component={ChatListScreen}  initialParams={sharedParams} />
    <Tab.Screen name="Graveyard" component={GraveyardScreen} initialParams={sharedParams} />
  </Tab.Navigator>
);

export default function App() {
  const [session,   setSession]   = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let ready = false;
    const markReady = () => {
      if (!ready) {
        ready = true;
        setAuthReady(true);
      }
    };

    const unsub = subscribeSession((s) => {
      setSession(s);
      markReady();
      if (s?.uid) {
        setTimeout(() => registerForPushNotifications().catch((e) => logError('app.push', e)), 500);
      }
    });
    const timer = setTimeout(markReady, 8000);

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  if (!authReady) return <SplashScreen />;

  const user = session;
  const petId = session?.petId ?? null;

  const sharedParams = user && petId
    ? { petId, userId: user.uid, displayName: user.displayName ?? 'Oyuncu' }
    : {};

  return (
    <View style={webFrame.outer}>
    <View style={webFrame.inner}>
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown:  false,
          animation:    'fade_from_bottom',
          contentStyle: { backgroundColor: P.cream },
        }}
      >
        {user && petId ? (
          <>
            <Stack.Screen name="Main">
              {() => <MainTabs sharedParams={sharedParams} />}
            </Stack.Screen>
            <Stack.Screen
              name="ChatDetail"
              component={ChatDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Social"
              component={SocialScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login"    component={LoginScreen}    />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </View>
    </View>
  );
}
