// Her test için temiz modül önbelleği + boş AsyncStorage
const AsyncStorage = require('@react-native-async-storage/async-storage');

const fresh = async (names) => {
  jest.resetModules();
  const storage = require('@react-native-async-storage/async-storage');
  await storage.clear();
  return names.map((n) => require(n));
};

module.exports = { fresh, AsyncStorage };
