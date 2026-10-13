// Grup sohbeti kaldırıldı — bireysel DM için ChatList / ChatDetail kullanın.

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

const ChatScreen = ({ navigation }) => (
  <SafeAreaView style={styles.safe}>
    <Text style={styles.txt}>Grup sohbeti yerel modda kullanılmıyor.</Text>
    <Text style={styles.sub} onPress={() => navigation?.goBack?.()}>Geri dön</Text>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF6F1' },
  txt:  { fontSize: 16, color: '#3D2C2C' },
  sub:  { marginTop: 12, color: '#C9A69E' },
});

export default ChatScreen;
