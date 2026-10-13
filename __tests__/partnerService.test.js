const { fresh } = require('./helpers');

let store;
let partner;
beforeEach(async () => {
  jest.useFakeTimers();
  [store, partner] = await fresh([
    '../src/services/localStore',
    '../src/services/partnerService',
  ]);
  await store.createUserWithPet({ uid: 'u1', email: 'u1@t.com', displayName: 'Ali', password: 'pw' });
});
afterEach(() => jest.useRealTimers());

describe('mesajlaşma', () => {
  test('gönderilen mesaj kaydedilir', async () => {
    const row = await partner.sendMessage({
      petId: 'pet_u1', userId: 'u1', partnerId: 'partner_demo', displayName: 'Ali', text: '  selam  ',
    });
    expect(row.text).toBe('selam');             // kırpılır
    expect(row.senderId).toBe('u1');
  });

  test('demo partner kısa süre sonra cevap verir', async () => {
    await partner.sendMessage({
      petId: 'pet_u1', userId: 'u1', partnerId: 'partner_demo', displayName: 'Ali', text: 'hey',
    });
    jest.advanceTimersByTime(1000);
    await Promise.resolve(); await Promise.resolve();
    jest.useRealTimers();
    await new Promise((r) => setTimeout(r, 20));
    const msgs = await store.getMessages('pet_u1', 'partner_demo_u1');
    expect(msgs.some((m) => m.senderId === 'partner_demo' && m.senderName === 'Elif')).toBe(true);
  });

  test('son mesaj izlenir', async () => {
    jest.useRealTimers();
    const seen = [];
    const unsub = partner.watchLastMessage('pet_u1', 'u1', 'partner_demo', (m) => seen.push(m));
    await new Promise((r) => setTimeout(r, 20));
    expect(seen[0]).toBeTruthy();                // hoş geldin mesajı
    unsub();
  });
});

describe('partner listesi', () => {
  test('demo partner Elif görünür', async () => {
    const list = await partner.listPartners('pet_u1', 'u1');
    expect(list[0]).toMatchObject({ uid: 'partner_demo', displayName: 'Elif' });
  });

  test('kodla partner ekleme henüz desteklenmez', async () => {
    await expect(partner.addPartnerByCode('abc'))
      .rejects.toMatchObject({ code: 'partner/not-available' });
  });
});
