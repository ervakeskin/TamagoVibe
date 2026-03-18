# 🚀 TamagoVibe — Play Store & App Store Deploy Checklist

---

## 📋 1. Proje Hazırlık

### Uygulama Kimliği
- [ ] **Bundle ID / App ID** belirlendi: `com.yourcompany.tamagovibe`
- [ ] **EAS Project** oluşturuldu: `eas init`
- [ ] `app.json` / `app.config.js` güncellendi:
  ```json
  {
    "expo": {
      "name":    "TamagoVibe",
      "slug":    "tamagovibe",
      "version": "1.0.0",
      "ios":     { "bundleIdentifier": "com.yourcompany.tamagovibe" },
      "android": { "package": "com.yourcompany.tamagovibe" }
    }
  }
  ```

### Versiyon & Build Numarası
- [ ] `version`: `1.0.0`
- [ ] `ios.buildNumber`: `1`
- [ ] `android.versionCode`: `1`

---

## 🎨 2. Görsel Varlıklar (Assets)

### Uygulama İkonu
| Platform   | Boyut         | Format  | Notlar               |
|------------|---------------|---------|----------------------|
| iOS        | 1024×1024 px  | PNG     | Şeffaflık yok        |
| Android    | 512×512 px    | PNG     | Adaptive icon        |
| Expo icon  | 1024×1024 px  | PNG     | `assets/icon.png`    |

- [ ] `assets/icon.png` (1024×1024)
- [ ] `assets/adaptive-icon.png` (1024×1024, Android)
- [ ] `assets/splash.png` (1284×2778 önerilen)

### Store Görselleri
**Google Play:**
- [ ] Öne Çıkan Grafik: 1024×500 px (JPG/PNG)
- [ ] Ekran Görüntüleri: min 2, maks 8 (Phone: 1080×1920 veya 1080×2340)
- [ ] Uygulama İkonu: 512×512 px

**App Store:**
- [ ] Ekran Görüntüleri: iPhone 6.7" (1290×2796), 6.5" (1242×2688)
- [ ] iPad ekran görüntüleri (opsiyonel ama önerilen)

---

## 🔧 3. Firebase Yapılandırması

- [ ] **Firebase Console** → Proje ayarları → Android/iOS uygulaması eklendi
- [ ] **`google-services.json`** indirilip `android/app/` klasörüne koyuldu
- [ ] **`GoogleService-Info.plist`** indirilip `ios/` klasörüne koyuldu
- [ ] **Firestore Rules** deploy edildi: `firebase deploy --only firestore:rules`
- [ ] **Firestore Indexes** oluşturuldu:
  - `graveyard` koleksiyonu: `ownerId ASC, diedAt DESC`
  - `users` koleksiyonu: `leaderboardLevel DESC`
- [ ] **Authentication** → Email/Password sağlayıcısı aktif

---

## 🔔 4. Bildirim Yapılandırması

- [ ] **expo-notifications** kuruldu
- [ ] `app.json` → `plugins: ["expo-notifications"]` eklendi
- [ ] Android: `AndroidManifest.xml`'de izin tanımları kontrol edildi
- [ ] iOS: `Info.plist`'e `NSUserNotificationsUsageDescription` eklendi
- [ ] Test: Gerçek cihazda bildirim testi yapıldı

---

## ⚙️ 5. EAS Build Kurulumu

```bash
# EAS CLI kurulumu
npm install -g eas-cli
eas login

# Proje başlatma
eas init

# Build profilleri
eas build:configure
```

### `eas.json` Yapılandırması
```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Build Komutları
```bash
# Android APK (test)
eas build --platform android --profile preview

# Android AAB (store)
eas build --platform android --profile production

# iOS (store)
eas build --platform ios --profile production
```

---

## 📱 6. Android (Google Play) Adımları

- [ ] **Google Play Console** hesabı açıldı ($25 tek seferlik ücret)
- [ ] **Yeni Uygulama** oluşturuldu
- [ ] **AAB dosyası** EAS ile build edildi
- [ ] **İçerik Derecelendirmesi** anketi dolduruldu
- [ ] **Gizlilik Politikası** URL'si eklendi
- [ ] **Veri Güvenliği** formu dolduruldu
- [ ] Store listeleme bilgileri:
  - [ ] Kısa açıklama (80 karakter maks)
  - [ ] Tam açıklama (4000 karakter maks)
  - [ ] Ekran görüntüleri yüklendi
  - [ ] Öne çıkan grafik yüklendi
- [ ] **Kapalı Test (Internal)** → APK test edildi
- [ ] **Açık Test (Alpha/Beta)** → Geri bildirim toplandı
- [ ] **Prodüksiyon** → İncelemeye gönderildi

---

## 🍎 7. iOS (App Store) Adımları

- [ ] **Apple Developer** hesabı ($99/yıl)
- [ ] **App Store Connect**'te yeni uygulama oluşturuldu
- [ ] **Bundle ID** Apple Developer Portal'da kayıtlı
- [ ] **Provisioning Profile** & Sertifikalar EAS tarafından yönetiliyor
- [ ] **TestFlight**'a yüklendi → İç test yapıldı
- [ ] Store listeleme bilgileri dolduruldu
- [ ] **App Privacy** bölümü tamamlandı
- [ ] İncelemeye gönderildi

---

## 🔒 8. Güvenlik Kontrolleri

- [ ] `firebaseConfig.js`'deki API key'ler **gerçek** ve production için doğru
- [ ] Firestore Rules production'da test edildi (Simulator değil, gerçek kurallar)
- [ ] **AsyncStorage** hassas veri saklamıyor (şifre vb.)
- [ ] `.env` dosyası `.gitignore`'a eklendi
- [ ] Debug logları production build'den kaldırıldı

---

## ⚡ 9. Performans Kontrolleri

- [ ] `console.log` ifadeleri production'da kaldırıldı veya devre dışı bırakıldı
- [ ] `memo` / `useCallback` ile gereksiz re-render'lar minimize edildi
- [ ] Büyük listeler `FlatList` kullanıyor (ScrollView değil)
- [ ] `useNativeDriver: true` animasyonlarda kullanılıyor
- [ ] Uygulama açılış süresi < 3 saniye

---

## 🧪 10. Son Test Kontrol Listesi

- [ ] **Android** fiziksel cihaz testi (min Android 10)
- [ ] **iOS** fiziksel cihaz testi (min iOS 15)
- [ ] Yavaş internet bağlantısında test
- [ ] Bildirim izni reddedildiğinde uygulama çökmüyor
- [ ] Firebase offline durumunda uygulama çökmüyor
- [ ] Uygulama arka plana alınıp geri gelindiğinde state korunuyor
- [ ] Partner senkronizasyonu 2 farklı cihazda test edildi
- [ ] Level-up modal ve konfeti animasyonu test edildi
- [ ] Mezarlık ekranı dolu ve boş durumda test edildi

---

## 📊 11. Store Optimizasyon (ASO)

- [ ] **Başlık**: "TamagoVibe - Dijital Evcil Hayvan"
- [ ] **Anahtar Kelimeler**: tamagotchi, evcil hayvan oyunu, dijital pet, bakım oyunu
- [ ] **Açıklama** ilk 2 cümle dikkat çekici (kullanıcılar genellikle sadece bunu okur)
- [ ] Ekran görüntüleri **başlık metin bindirmesi** içeriyor
- [ ] Uygulama kategorisi: **Games → Simulation** veya **Entertainment**

---

## 🎯 Deploy Özet Komutu Sırası

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Firebase kurallarını deploy et
firebase deploy --only firestore:rules

# 3. Android build
eas build --platform android --profile production

# 4. iOS build
eas build --platform ios --profile production

# 5. Store'a gönder
eas submit --platform android
eas submit --platform ios
```

---

*TamagoVibe v1.0.0 — Hazırlayan: Senior Dev Checklist*
