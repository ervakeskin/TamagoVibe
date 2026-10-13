import { Alert, Platform } from 'react-native';

// react-native-web Alert.alert'i desteklemez; web'de tarayıcı penceresine düşer.

export const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
};

export const confirmDialog = (title, message, confirmText, onConfirm) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'İptal', style: 'cancel' },
    { text: confirmText, style: 'destructive', onPress: onConfirm },
  ]);
};
