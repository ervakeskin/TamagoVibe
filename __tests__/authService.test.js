const { fresh } = require('./helpers');

let auth;
beforeEach(async () => {
  [auth] = await fresh(['../src/services/authService']);
});

const acct = { displayName: 'Ayşe', email: 'Ayse@Test.com', password: 'sifre123' };

describe('kayıt', () => {
  test('yeni hesap oturum ve pet kimliği döner', async () => {
    const s = await auth.register(acct);
    expect(s.uid).toMatch(/^user_/);
    expect(s.petId).toBe(`pet_${s.uid}`);
    expect(s.email).toBe('ayse@test.com');       // küçük harfe çevrilir
    expect(s.displayName).toBe('Ayşe');
  });

  test('oturum kalıcıdır', async () => {
    const s = await auth.register(acct);
    expect(await auth.getSession()).toEqual(s);
  });

  test('aynı e-posta ikinci kez kullanılamaz (büyük/küçük harf fark etmez)', async () => {
    await auth.register(acct);
    await expect(auth.register({ ...acct, email: 'AYSE@test.com' }))
      .rejects.toMatchObject({ code: 'auth/email-already-in-use' });
  });

  test('abone oturum değişimini haber alır', async () => {
    const seen = [];
    const unsub = auth.subscribeSession((s) => seen.push(s));
    await new Promise((r) => setTimeout(r, 10));
    await auth.register(acct);
    expect(seen[0]).toBeNull();
    expect(seen[seen.length - 1].email).toBe('ayse@test.com');
    unsub();
  });
});

describe('giriş / çıkış', () => {
  test('doğru şifreyle giriş yapılır', async () => {
    const reg = await auth.register(acct);
    await auth.logout();
    const s = await auth.login({ email: ' ayse@test.com ', password: 'sifre123' });
    expect(s.uid).toBe(reg.uid);
    expect(s.petId).toBe(reg.petId);
  });

  test('yanlış şifre reddedilir', async () => {
    await auth.register(acct);
    await auth.logout();
    await expect(auth.login({ email: 'ayse@test.com', password: 'yanlis' }))
      .rejects.toMatchObject({ code: 'auth/invalid-credential' });
  });

  test('olmayan hesap reddedilir', async () => {
    await expect(auth.login({ email: 'yok@test.com', password: 'x' }))
      .rejects.toMatchObject({ code: 'auth/invalid-credential' });
  });

  test('çıkış oturumu siler', async () => {
    await auth.register(acct);
    await auth.logout();
    expect(await auth.getSession()).toBeNull();
  });
});
