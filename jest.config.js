module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  // GLTF/GLB modellerini asset olarak say (Metro assetExts ile aynı)
  transform: {
    '\\.(gltf|glb)$': '<rootDir>/node_modules/jest-expo/src/preset/assetFileTransformer.js',
  },
};
