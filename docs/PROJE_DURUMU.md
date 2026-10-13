# TamagoVibe — Proje Durumu ve Yayın Yol Haritası

**Son güncelleme:** 2026-10-13 (ikinci tur) · Hedef: Android, ilk sürüm tek oyunculu · Çalışma `feature/tamagotchi-ui` dalında GitHub'da.

## Mimari özet

Expo SDK 51 + React Native 0.74, React Navigation (stack + 3 sekme). Firebase yok; veri AsyncStorage'da (`localStore`, `authService`, `partnerService`). 3D: `@react-three/fiber` + `expo-gl`, Quaternius CC0 modelleri (`assets/animals`). Oyun hesabı saf fonksiyonlarda (`utils/decay.js`), testli.

## YAPILDI

**Çekirdek oyun**
- Kayıt/giriş/çıkış (yerel), oturum kalıcılığı
- Gerçek zamanlı oyun hızı, uygulama kapalıyken telafi, sağlık tabanı (kapalıyken ölüm yok)
- 6 yemek, oyna, uyut, ilaç, dokunma; XP, seviye, rozetler (koşullar çalışıyor)
- Ölüm, Anılar (mezarlık), yeni hayat; çift kayıt önleme
- Demo partner Elif: mesajlaşma, hızlı mesajlar, otomatik cevap
- Yerel bildirimler: açlık ve kritik sağlık (zamanlanmış, cihazda doğrulanacak)

**Yumurta ve doğum**
- Kuluçka ekranı, sallanma, çatlaklar, çatlama animasyonu
- **Doğum belgesi** + nadirlik (Yaygın / Nadir / Efsanevi), ağırlıklı çıkma şansı

**3D ve arayüz**
- 4 tür (Tilki, Shiba, Husky, Kurt), ruh haline ve eyleme göre animasyon
- Tamagotchi cihaz arayüzü, tek tasarım sistemi (`theme.js`), ortak giriş/kayıt formu
- Web'de telefon genişliğinde çerçeve

**Yayın hazırlığı (kod tarafı tamam)**
- Şifreler tuzlu özet (eski hesaplar otomatik yükseltilir)
- `app.json` kimlikleri, ikon, açılış ekranı, izinler, `allowBackup: false`; `eas.json`
- Rozet bildirimi + başarım listesi
- Gizlilik politikası, mağaza metni ve yayın adımları taslakları

**Kalite**
- 85 birim testi, hata günlüğü (uygulama içi + `docs/ERROR_LOG.md`), test raporu
- README ve CHANGELOG güncel

## YAPILMADI / EKSİK

### Yayını engelleyenler (P0)
1. **`main`'e birleştirme:** çalışma `feature/tamagotchi-ui` dalında; `main` hâlâ ilk commit'te.
2. **EAS projesi:** `eas login` ve `eas init` (hesap gerekir), `app.json`'a `projectId` eklenir. Adımlar `docs/YAYIN_ADIMLARI.md`'de. Paket adı `com.ervakeskin.tamagovibe` onaylanmalı (yayından sonra değişmez).
3. **Android cihaz testi yapılmadı:** 3D/WebGL, bildirimler, titreşim, klavye. (`docs/TEST_RAPORU.md` bölüm 4) Önce `eas build --profile preview` ile APK.
4. **Gizlilik politikasını yayınla:** taslağın iletişim e-postası doldurulup herkese açık adrese konmalı.
5. **Mağaza varlıkları:** ekran görüntüleri (Android'den), öne çıkan grafik 1024x500, Play Console hesabı ($25).
6. **Şifre özeti istemci tarafında:** cihaz içi hesap için yeterli; sunucu tabanlı hesap gelirse doğrulama sunucuya taşınmalı.

### Oyun / özellik (P1)
7. Rozet bildirimi yapıldı. Rozetlerin `xpReward` değeri henüz XP olarak verilmiyor (yalnızca kartta görünüyor).
8. **Gerçek partner eşleşmesi yok:** `addPartnerByCode` bilerek hata fırlatır. (Ayrı backend gerekir, ilk sürüm kapsamı dışı.)
9. **Eski modelden gelen türler:** kayıtlı CAT/PANDA vb. pet'ler Tilki olarak görünür.
10. **Model boyutu:** 4 x ~3 MB `.gltf`. GLB'ye çevirip sıkıştırmak ilk açılışı hızlandırır.
11. Denge: yemek/oyun değerleri yeni saatlik hızla ince ayar bekliyor (örn. XP eğrisi).
12. Ölü pet için "yeni hayat" sonrası eski rozetler (`unlockedBadges`) sıfırlanıyor; kalıcı koleksiyon yok.

### Teknik borç (P2)
13. Eski GLOW girdileri ve ölü bileşenler temizlendi.
15. Test kapsamı: ekran bileşenleri ve `useSocialPet` için render testi yok (yalnızca mantık katmanı testli).
16. SDK 51 → güncel SDK'ya yükseltme planı yok.
17. CI yok.

## Önerilen sıra

1. **Android'de dene** (Expo Go ya da preview APK): 3D, bildirim, klavye
2. **EAS + Play Console** (`docs/YAYIN_ADIMLARI.md`), gizlilik politikasını yayınla
3. **Model sıkıştırma** (GLB), rozet XP ödülü, denge ayarı
5. **Gerçek partner** (ayrı backend)

## Açık kararlar
- Paket adı `com.ervakeskin.tamagovibe` uygun mu?
- Kedi ve tavşan için ek CC0 model aranacak mı (şu an yalnızca 4 tür)?
