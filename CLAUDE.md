# TamagoVibe — çalışma kuralları

Expo (React Native) tamagotchi oyunu, hedef Android, ilk sürüm tek oyunculu ve yerel (AsyncStorage). Dil: Türkçe arayüz ve yorumlar.

## Her özellik / düzeltme sonrası (unutma)
1. `docs/CHANGELOG.md` içine tarihli kayıt ekle.
2. `README.md` özellik ve yapı bölümlerini güncel tut.
3. `docs/PROJE_DURUMU.md` içinde YAPILDI / EKSİK listesini güncelle.
4. Hata bulunduysa `docs/ERROR_LOG.md`'ye kök neden ve çözümle ekle; regresyon testi yaz.
5. `npm test` çalıştır, sonuç `docs/TEST_RAPORU.md` ile uyumlu olsun.

## Kodlama
- Renk, boşluk, tipografi **yalnızca** `src/constants/theme.js` içinden. Yerel palet tanımlama.
- Oyun sabitleri `src/constants/gameConfig.js`. Hız/denge ayarı orada.
- Oyun hesabı saf fonksiyon olarak `src/utils/decay.js` içinde; UI'dan ayrı ve testli kalmalı.
- Hata yakalarken `console.error` yerine `logError(kapsam, err)` (`src/utils/logger.js`).
- `useNativeDriver` için `NATIVE_DRIVER` (`src/utils/animation.js`). WebGL canvas'ı `Animated.View` transform içine koyma.
- `Alert.alert` yerine `showAlert` / `confirmDialog` (`src/utils/dialog.js`), web uyumlu.
- Abonelere (listener) her seferinde yeni dizi/nesne referansı gönder, aksi halde React yeniden çizmez.
- Yeni 3D tür eklerken: GLB/glTF'i `assets/animals/` altına koy, `avatarConfig.js` ve `PET_TYPES` (nadirlik + weight, toplam 100) güncelle, lisansı belgele.

## Güvenlik / dış etkili işlemler
- GitHub'a push, paylaşım, mağaza işlemleri için kullanıcıdan açık onay al.
- Düz metin şifre sorunu bilinen açık madde (`docs/PROJE_DURUMU.md` P0).

## Komutlar
```bash
npm start      # Expo
npm test       # jest (75 test)
npx expo export --platform android --output-dir "$TEMP/tv-export"   # bundle doğrulama
```
