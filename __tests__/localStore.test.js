const { fresh } = require('./helpers');

let store;
beforeEach(async () => {
  [store] = await fresh(['../src/services/localStore']);
});

const mkUser = (uid = 'u1') =>
  store.createUserWithPet({ uid, email: `${uid}@t.com`, displayName: 'Ali', password: 'pw' });

describe('hesap + pet oluşturma', () => {
  test('yeni pet yumurta halinde doğar (kuluçka başlamış, isimsiz, türü belli)', async () => {
    const { petId } = await mkUser();
    const pet = await store.getPet(petId);
    expect(pet.name).toBe('');
    expect(pet.hatchStartedAt).toBeGreaterThan(0);
    expect(['FOX', 'DOG', 'HUSKY', 'WOLF']).toContain(pet.petType);
    expect(pet.partnerIds).toContain('partner_demo');
  });

  test('hesap e-posta ile bulunur', async () => {
    await mkUser();
    expect(await store.findAccountByEmail('U1@T.com')).toMatchObject({ uid: 'u1' });
    expect(await store.findAccountByEmail('yok@t.com')).toBeNull();
  });

  test('kullanıcı kaydı oluşur', async () => {
    await mkUser();
    expect(await store.getUser('u1')).toMatchObject({ displayName: 'Ali', petId: 'pet_u1' });
  });

  test('demo partner için hoş geldin mesajları eklenir', async () => {
    const { petId } = await mkUser();
    const msgs = await store.getMessages(petId, 'partner_demo_u1');
    expect(msgs.length).toBeGreaterThan(0);
    expect(msgs[0].senderId).toBe('partner_demo');
  });
});

describe('ensurePet göçü', () => {
  test('isimsiz ve kuluçkasız eski pet yumurtaya çevrilir', async () => {
    const { petId } = await mkUser();
    const pet = await store.getPet(petId);
    await store.savePet(petId, { ...pet, hatchStartedAt: null });
    const fixed = await store.ensurePet(petId, 'u1');
    expect(fixed.hatchStartedAt).toBeGreaterThan(0);
  });

  test('pet yoksa oluşturulur', async () => {
    const pet = await store.ensurePet('pet_yeni', 'u9');
    expect(pet.hatchStartedAt).toBeGreaterThan(0);
    expect(pet.petType).toBeTruthy();
  });

  test('isimli pet olduğu gibi kalır', async () => {
    const { petId } = await mkUser();
    const pet = await store.getPet(petId);
    await store.savePet(petId, { ...pet, name: 'Koko', hatchStartedAt: null });
    const same = await store.ensurePet(petId, 'u1');
    expect(same.hatchStartedAt).toBeNull();
    expect(same.name).toBe('Koko');
  });
});

describe('pet kaydet / abone ol', () => {
  test('savePet abonelere haber verir', async () => {
    const { petId } = await mkUser();
    const seen = [];
    const unsub = store.subscribePet(petId, (p) => seen.push(p));
    await new Promise((r) => setTimeout(r, 10));
    const pet = await store.getPet(petId);
    await store.savePet(petId, { ...pet, name: 'Pofuduk' });
    expect(seen[seen.length - 1].name).toBe('Pofuduk');
    unsub();
  });
});

describe('mezarlık', () => {
  test('kayıtlar kullanıcıya göre ayrılır, yeniden eskiye sıralanır', async () => {
    await store.addGraveyardEntry({ name: 'A', ownerId: 'u1' });
    await new Promise((r) => setTimeout(r, 5));
    await store.addGraveyardEntry({ name: 'B', ownerId: 'u1' });
    await store.addGraveyardEntry({ name: 'C', ownerId: 'u2' });
    const list = await store.getGraveyard('u1');
    expect(list.map((e) => e.name)).toEqual(['B', 'A']);
    expect(await store.getGraveyard('u2')).toHaveLength(1);
  });

  test('legacy sayacı artar', async () => {
    await mkUser();
    await store.incrementLegacy('u1');
    await store.incrementLegacy('u1');
    expect((await store.getUser('u1')).legacyCount).toBe(2);
  });
});

describe('mesajlar', () => {
  test('mesaj eklenir ve zamana göre okunur', async () => {
    await store.appendMessage('p', 'c', { text: 'ilk', senderId: 'a' });
    await store.appendMessage('p', 'c', { text: 'ikinci', senderId: 'b' });
    const msgs = await store.getMessages('p', 'c');
    expect(msgs.map((m) => m.text)).toEqual(['ilk', 'ikinci']);
    expect((await store.getLastMessage('p', 'c')).text).toBe('ikinci');
  });

  test('farklı sohbetler karışmaz', async () => {
    await store.appendMessage('p', 'c1', { text: 'x' });
    expect(await store.getMessages('p', 'c2')).toEqual([]);
    expect(await store.getLastMessage('p', 'c2')).toBeNull();
  });

  test('her bildirimde yeni dizi referansı gelir (React yeniden çizsin)', async () => {
    const refs = [];
    const unsub = store.subscribeMessages('p', 'c', (m) => refs.push(m));
    await new Promise((r) => setTimeout(r, 10));
    await store.appendMessage('p', 'c', { text: 'bir' });
    await store.appendMessage('p', 'c', { text: 'iki' });
    const last = refs[refs.length - 1];
    const prev = refs[refs.length - 2];
    expect(last).not.toBe(prev);
    expect(last.map((m) => m.text)).toEqual(['bir', 'iki']);
    unsub();
  });

  test('abone yeni mesajı alır', async () => {
    const seen = [];
    const unsub = store.subscribeMessages('p', 'c', (m) => seen.push(m.length));
    await new Promise((r) => setTimeout(r, 10));
    await store.appendMessage('p', 'c', { text: 'merhaba' });
    expect(seen[seen.length - 1]).toBe(1);
    unsub();
  });
});

describe('partnerler', () => {
  test('demo partner listelenir, kendisi listelenmez', async () => {
    const { petId } = await mkUser();
    const list = await store.getPartnersForPet(petId, 'u1');
    expect(list.map((p) => p.uid)).toEqual(['partner_demo']);
    expect(list[0].isDemo).toBe(true);
  });

  test('olmayan pet için boş liste', async () => {
    expect(await store.getPartnersForPet('yok', 'u1')).toEqual([]);
  });
});
