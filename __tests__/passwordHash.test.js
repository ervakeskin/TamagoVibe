const {
  sha256, hashPassword, createSalt, makeCredentials, verifyPassword, HASH_ROUNDS,
} = require('../src/utils/passwordHash');
const { fresh } = require('./helpers');

describe('sha256', () => {
  test('bilinen test vektörleri', () => {
    expect(sha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'))
      .toBe('248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  });

  test('Node crypto ile aynı sonucu verir (Türkçe karakter, emoji, uzun metin)', () => {
    const { createHash } = require('crypto');
    ['Şifre-İğüçö', 'merhaba 🌸 dünya', 'x'.repeat(1000), 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64)]
      .forEach((s) => {
        expect(sha256(s)).toBe(createHash('sha256').update(s, 'utf8').digest('hex'));
      });
  });
});

describe('şifre özeti', () => {
  test('aynı tuz ve şifre aynı özeti verir', () => {
    expect(hashPassword('gizli123', 'tuz')).toBe(hashPassword('gizli123', 'tuz'));
  });

  test('farklı tuz veya şifre farklı özet verir', () => {
    const a = hashPassword('gizli123', 'tuz1');
    expect(hashPassword('gizli123', 'tuz2')).not.toBe(a);
    expect(hashPassword('gizli124', 'tuz1')).not.toBe(a);
  });

  test('özet 64 hex karakter, düz metni içermez', () => {
    const h = hashPassword('gizli123', 'tuz');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toContain('gizli123');
  });

  test('tuzlar rastgele ve 32 karakter', () => {
    const a = createSalt();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(createSalt()).not.toBe(a);
  });

  test('doğrulama doğru ve yanlış şifreyi ayırır', () => {
    const cred = makeCredentials('sifre-1');
    expect(verifyPassword('sifre-1', cred)).toBe(true);
    expect(verifyPassword('sifre-2', cred)).toBe(false);
    expect(verifyPassword('sifre-1', {})).toBe(false);
    expect(verifyPassword('sifre-1', null)).toBe(false);
  });

  test('tekrar sayısı makul (kaba kuvveti yavaşlatır, arayüzü dondurmaz)', () => {
    expect(HASH_ROUNDS).toBeGreaterThanOrEqual(1000);
    const t = Date.now();
    hashPassword('x', 'y');
    expect(Date.now() - t).toBeLessThan(1500);
  });
});

describe('hesap depolama', () => {
  test('yeni hesapta düz metin şifre saklanmaz', async () => {
    const [store] = await fresh(['../src/services/localStore']);
    await store.createUserWithPet({ uid: 'u1', email: 'a@b.com', displayName: 'A', password: 'cokgizli' });
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const raw = await AsyncStorage.getItem('@tamago/data');
    expect(raw).not.toContain('cokgizli');
    const acct = JSON.parse(raw).accounts[0];
    expect(acct.password).toBeUndefined();
    expect(acct.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(acct.salt).toBeTruthy();
  });

  test('eski düz metin hesap girişte özete yükseltilir', async () => {
    const [store, auth] = await fresh(['../src/services/localStore', '../src/services/authService']);
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem('@tamago/data', JSON.stringify({
      users: { u9: { displayName: 'Eski', petId: 'pet_u9' } },
      pets: {}, graveyard: [], chats: {},
      accounts: [{ email: 'eski@t.com', password: 'eskisifre', uid: 'u9' }],
    }));

    await expect(auth.login({ email: 'eski@t.com', password: 'yanlis' }))
      .rejects.toMatchObject({ code: 'auth/invalid-credential' });
    const raw1 = JSON.parse(await AsyncStorage.getItem('@tamago/data'));
    expect(raw1.accounts[0].password).toBe('eskisifre');   // yanlış girişte dokunulmaz

    const s = await auth.login({ email: 'eski@t.com', password: 'eskisifre' });
    expect(s.uid).toBe('u9');
    const raw2 = await AsyncStorage.getItem('@tamago/data');
    expect(raw2).not.toContain('eskisifre');
    expect(JSON.parse(raw2).accounts[0].hash).toBeTruthy();

    await auth.logout();
    await expect(auth.login({ email: 'eski@t.com', password: 'eskisifre' })).resolves.toBeTruthy();
    await expect(auth.login({ email: 'eski@t.com', password: 'yanlis' }))
      .rejects.toMatchObject({ code: 'auth/invalid-credential' });
    expect(store).toBeDefined();
  });
});
