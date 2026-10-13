const { fresh } = require('./helpers');

let logger;
beforeEach(async () => {
  [logger] = await fresh(['../src/utils/logger']);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('hata günlüğü', () => {
  test('hata kaydedilir ve okunur', async () => {
    await logger.logError('test.kapsam', new Error('patladı'));
    const list = await logger.getErrorLog();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ scope: 'test.kapsam', message: 'patladı' });
    expect(list[0].at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('düz metin hata da kaydedilir', async () => {
    await logger.logError('x', 'sadece yazı');
    expect((await logger.getErrorLog())[0].message).toBe('sadece yazı');
  });

  test('son 100 kayıt tutulur', async () => {
    for (let i = 0; i < logger.MAX_LOG_ENTRIES + 5; i++) logger.logError('s', `hata ${i}`);
    await logger.logError('s', 'son');
    const list = await logger.getErrorLog();
    expect(list).toHaveLength(logger.MAX_LOG_ENTRIES);
    expect(list[list.length - 1].message).toBe('son');
  });

  test('temizle günlüğü boşaltır', async () => {
    await logger.logError('s', 'a');
    await logger.clearErrorLog();
    expect(await logger.getErrorLog()).toEqual([]);
  });

  test('biçimlendirme boş ve dolu durumda çalışır', () => {
    expect(logger.formatErrorLog([])).toMatch(/boş/);
    const text = logger.formatErrorLog([{ at: '2026-01-01T00:00:00Z', scope: 'a', message: 'b' }]);
    expect(text).toContain('[a] b');
  });

  test('logError asla hata fırlatmaz (bozuk depolama)', async () => {
    const storage = require('@react-native-async-storage/async-storage');
    jest.spyOn(storage, 'setItem').mockRejectedValueOnce(new Error('disk dolu'));
    await expect(logger.logError('s', 'x')).resolves.toBeUndefined();
  });
});
