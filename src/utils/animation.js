import { Platform } from 'react-native';

/** Web'de native animasyon modülü yok; uyarıyı önlemek için sadece cihazda true */
export const NATIVE_DRIVER = Platform.OS !== 'web';
