// =============================================================================
// App.js — TamagoVibe FINAL
// Tab: Pet / ChatList / Graveyard
// Stack (tab dışı): ChatDetail + Social
// =============================================================================

import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer }          from '@react-navigation/native';
import { createNativeStackNavigator }   from '@react-navigation/native-stack';
import { createBottomTabNavigator }     from '@react-navigation/bottom-tabs';
import { onAuthStateChanged }           from 'firebase/auth';
import { doc, getDoc }                  from 'firebase/firestore';

import { auth, db }                     from './src/api/firebaseConfig';
import { registerForPushNotifications } from './src/api/notificationService';

import LoginScreen      from './src/screens/LoginScreen';
import RegisterScreen   from './src/screens/RegisterScreen';
import PetScreen        from './src/screens/PetScreen';
import ChatListScreen   from './src/screens/ChatListScreen';
import ChatDetailScreen from './src/screens/ChatDetailScreen';
import GraveyardScreen  from './src/screens/GraveyardScreen';
import SocialScreen     from './src/screens/SocialScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const P = {
  cream:    '#FAF6F1',
  roseGold: '#C9A69E',
  textSoft: '#A08C89',
  text:     '#3D2C2C',
  border:   'rgba(201,166,158,0.22)',
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
        tabBarStyle: {
          backgroundColor: P.cream,
          borderTopColor:  P.border,
          borderTopWidth:  1,
          paddingBottom:   8,
          paddingTop:      6,
          height:          62,
        },
        tabBarActiveTintColor:   P.roseGold,
        tabBarInactiveTintColor: P.textSoft,
        tabBarLabel: ({ focused, color }) => (
          <Text style={{ color, fontSize: 10, fontWeight: focused ? '700' : '500', fontStyle: 'italic' }}>
            {cfg.label}
          </Text>
        ),
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{cfg.icon}</Text>
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
  const [user,      setUser]      = useState(null);
  const [petId,     setPetId]     = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid));
          const data = snap.exists() ? snap.data() : {};
          setPetId(data.petId ?? `pet_${fbUser.uid}`);
          registerForPushNotifications(fbUser.uid).catch(() => {});
        } catch {
          setPetId(`pet_${fbUser.uid}`);
        }
      } else {
        setUser(null);
        setPetId(null);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  if (!authReady) return <SplashScreen />;

  const sharedParams = user && petId
    ? { petId, userId: user.uid, displayName: user.displayName ?? 'Oyuncu' }
    : {};

  return (
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
            {/* Ana tab navigator */}
            <Stack.Screen name="Main">
              {() => <MainTabs sharedParams={sharedParams} />}
            </Stack.Screen>

            {/* Tab dışı ekranlar — slide from right */}
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
  );
}