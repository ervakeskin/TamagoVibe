import { Platform } from 'react-native';
import { Asset } from 'expo-asset';

/**
 * GLB modülünü platformda çalışan dosya/HTTP URI'sine çevirir.
 */
export async function resolveGlbUri(moduleId) {
  const asset = Asset.fromModule(moduleId);

  if (!asset.downloaded) {
    await asset.downloadAsync();
  }

  let uri = Platform.OS === 'web'
    ? (asset.uri || asset.localUri)
    : (asset.localUri || asset.uri);

  if (!uri) {
    throw new Error('GLB URI alınamadı');
  }

  if (Platform.OS === 'android' && uri.startsWith('/') && !uri.startsWith('file://')) {
    uri = `file://${uri}`;
  }

  return uri;
}
