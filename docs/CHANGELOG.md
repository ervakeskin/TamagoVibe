# Değişiklik Kaydı

Yeni özellik veya düzeltme sonrası bu dosyaya, `README.md` ve `docs/PROJE_DURUMU.md` dosyalarına kayıt eklenir.

## 2026-10-13

### Eklendi
- Yumurta kuluçka ekranı: sallanma, süreyle büyüyen çatlaklar, çatlama animasyonu, doğum sahnesi.
- **Doğum belgesi:** tür, nadirlik (Yaygın / Nadir / Efsanevi), doğum zamanı, bakıcı, belge numarası.
- Nadirlik sistemi: türlere çıkma şansı (`weight`); `pickPetType` ağırlıklı seçim yapar.
- Tamagotchi cihaz arayüzü (`DeviceFrame`): kabuk, LCD, kalp göstergeleri, 4 fiziksel buton.
- Tek tasarım sistemi (`theme.js`, krem/pastel); giriş ve kayıt ekranları ortak `AuthForm` ile yenilendi.
- Quaternius CC0 3D modelleri (Tilki, Shiba, Husky, Kurt); her tür kendi modelini yükler.
- Ruh haline ve eyleme göre animasyon (Idle, Eating, Gallop_Jump, Death, ...).
- Gerçek zamanlı oyun hızı, uygulama kapalıyken geçen süre için telafi hesabı (`utils/decay.js`).
- Açlık ve kritik sağlık için yerel zamanlanmış bildirimler.
- Hata günlüğü (`utils/logger.js`) ve Sosyal Panel'de günlük görüntüleyici.
- Jest test altyapısı ve 75 birim testi (`__tests__/`).
- `docs/` altında PROJE_DURUMU, ERROR_LOG, TEST_RAPORU, CHANGELOG.

### Değişti
- Oyun hızı: 5 saniyelik tick yerine saatlik oranlar (yaklaşık 8 saatte aç).
- Yaş birimi gün/tick yerine saat; mezarlık ve veda ekranı yeni biçimi gösterir.
- Web'de uygulama telefon genişliğinde ortalanır; sekme çubuğu ikon ve etiketi dikey gösterir.
- Charizard modeli ve eski debug dosyaları kaldırıldı.

### Düzeltildi
- Yeni hesapta yumurta ekranı atlanıyordu (`hatchStartedAt` boştu).
- Model küçük ve düz ön yüzden görünüyordu (kamera ve 3/4 açı).
- Aynı ölüm mezarlığa birden fazla kez yazılıyordu.
- Sohbette ikinci ve sonraki mesajlar (Elif'in cevapları) ekrana düşmüyordu.
- Web'de `Alert.alert` çalışmıyordu (çıkış onayı dahil).
- Web'de bildirim API'leri hata günlüğünü dolduruyordu.
- `useNativeDriver` uyarısı web'de çıkıyordu.
- Geniş ekranda sekme ikonu ile etiketi üst üste biniyordu.
- İki ayrı `gameConfig` ve iki ayrı renk paleti birleştirildi.

## 2026-06-03 ve öncesi
- Firebase kaldırıldı, tüm veri AsyncStorage'a taşındı (yerel mod).
- Demo partner Elif, mezarlık, rozetler, seviye sistemi.
- 3D maskot kesilme hataları (bkz. `3D_MASCOT_FIX_LOG.md`).
