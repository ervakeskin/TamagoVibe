import { Platform } from 'react-native';

/** Web: DOM Canvas; mobil: expo-gl */
const fiber = Platform.OS === 'web'
  ? require('@react-three/fiber')
  : require('@react-three/fiber/native');

const drei = Platform.OS === 'web'
  ? require('@react-three/drei')
  : require('@react-three/drei/native');

export const Canvas = fiber.Canvas;
export const useFrame = fiber.useFrame;
export const useThree = fiber.useThree;
export const useGLTF = drei.useGLTF;
export const Bounds = drei.Bounds;
