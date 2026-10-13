# Android Yayın Adımları (senin yapacakların)

Kod tarafı hazır: `app.json` (paket adı `com.ervakeskin.tamagovibe`, `versionCode 1`, ikon, açılış ekranı, izinler) ve `eas.json` ayarlı. Aşağıdakiler hesap/ödeme gerektirdiği için sende kalır.

1. **Paket adını onayla.** Başka bir ad istersen `app.json` içinde `android.package` ve `ios.bundleIdentifier` değerlerini değiştir. Yayınlandıktan sonra değiştirilemez.
2. **Expo hesabı ve EAS:**
   ```bash
   npm install -g eas-cli
   eas login
   eas init
   ```
   `eas init` `app.json`'a `extra.eas.projectId` ekler.
3. **Test APK'sı (telefonda dene):**
   ```bash
   eas build --platform android --profile preview
   ```
   Çıkan bağlantıdan APK'yı telefona kur. `docs/TEST_RAPORU.md` bölüm 4'teki maddeleri dene.
4. **Google Play Console hesabı** ($25 tek seferlik), yeni uygulama oluştur.
5. **Gizlilik politikasını yayınla.** `docs/GIZLILIK_POLITIKASI.md` içindeki iletişim e-postasını doldur, herkese açık bir adrese koy (ör. GitHub Pages) ve adresi Play Console'a gir.
6. **Mağaza kaydı:** `docs/MAGAZA_METNI.md` metinlerini kullan, ekran görüntülerini Android cihazdan al.
7. **Yayın paketi (AAB):**
   ```bash
   eas build --platform android --profile production
   eas submit --platform android
   ```
   `eas submit` ilk seferde Google servis hesabı anahtarı ister; ilk yüklemeyi Play Console'dan elle de yapabilirsin. Önce **iç test** kanalına yükle.
8. **Sürüm artırma:** Her yeni yüklemede `app.json` içinde `android.versionCode` değerini 1 artır.

## Bilinen kısıtlar
- 3D modeller ve bildirimler Android cihazda henüz doğrulanmadı (adım 3).
- Hesaplar ve oyun verisi cihaza bağlıdır; telefon değişince veri taşınmaz.
