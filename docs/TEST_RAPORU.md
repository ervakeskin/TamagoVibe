# Test Raporu

**Tarih:** 2026-10-13 · **Ortam:** Expo web (telefon boyutu 400x820), Windows, Chrome tabanlı tarayıcı · **Sürüm:** 1.0.0 (yerel mod)

> Web testi 3D/WebGL'in Android davranışını, bildirimleri ve titreşimi **kapsamaz**. Bunlar en altta "cihazda doğrulanacak" listesindedir.

## 1. Otomatik testler (`npm test`)

**8 paket, 85 test, hepsi geçti.**

| Paket | Kapsam |
|-------|--------|
| `gameConfig.test.js` | XP/seviye, yemekler, rozet koşulları, ölüm sebebi, tür ağırlıkları ve nadirlik, başlangıç durumu |
| `decay.test.js` | Saatlik düşüş, uyku, kapalıyken telafi ve sağlık tabanı, ölüm, hız çarpanı, ruh hali önceliği, kuluçka sayacı, eski kayıt göçü, yaş biçimi |
| `authService.test.js` | Kayıt, e-posta tekrarı, giriş, yanlış şifre, çıkış, oturum kalıcılığı, abonelik |
| `localStore.test.js` | Pet oluşturma (yumurta), göç, kaydet/abone ol, mezarlık sırası, mesajlar (yeni referans), partnerler |
| `partnerService.test.js` | Mesaj gönderme, Elif'in cevabı, son mesaj izleme, partner listesi |
| `logger.test.js` | Kayıt, 100 kayıt sınırı, temizleme, bozuk depolamada hata fırlatmama |
| `passwordHash.test.js` | SHA-256 test vektörleri ve Node `crypto` ile karşılaştırma (Türkçe, emoji, sınır uzunlukları), tuzlu özet, doğrulama, düz metin saklanmaması, eski hesap göçü |
| `avatarConfig.test.js` | Her türün modeli var, model dosyaları ve lisans diskte, gerekli animasyon klipleri, eski türlerin varsayılana düşmesi |

Android paket derlemesi: `npx expo export --platform android` → **başarılı** (9.9 MB bundle, 4 model ve yeni ikonlar dahil). `npx expo config` yeni `app.json`'ı doğruladı.

## 2. Elle uçtan uca test (web)

| # | Özellik | Sonuç |
|---|---------|-------|
| 1 | Kayıt (yeni hesap) | Geçti |
| 2 | Yumurta ekranı çıkıyor, sallanıyor, süre geriye sayıyor | Geçti |
| 3 | Çatlaklar süreyle beliriyor | Geçti |
| 4 | İsim girmeden/süre dolmadan buton kilitli | Geçti |
| 5 | Çatlatma animasyonu → doğum sahnesi → **doğum belgesi** (tür, nadirlik, tarih, belge no) | Geçti |
| 6 | Cihaz arayüzü (kabuk, LCD, kalpler, butonlar), 3/4 açıda büyük model | Geçti |
| 7 | Animasyon oynuyor (zaman ilerliyor), `Idle` döngüsü | Geçti |
| 8 | Besle menüsü, 6 yemek, besleme (açlık/XP/rozet), `Eating` tepkisi sonra `Idle`'a dönüş | Geçti |
| 9 | Oyna (mutluluk +, enerji −), `Gallop_Jump` tepkisi | Geçti |
| 10 | Uyut / Uyandır: kafa eğik klip, koyu LCD, diğer butonlar kilitli | Geçti |
| 11 | Hasta durumu ve İlaç (sağlık +35, hasta bayrağı kalkıyor, sayaç artıyor) | Geçti |
| 12 | Seviye atlama penceresi (konfeti), XP/seviye, ilk rozet | Geçti |
| 13 | Mesajlar listesi, Elif ile sohbet, hızlı mesaj çipi, **Elif'in cevabı** | Geçti (hata #7 düzeltildikten sonra) |
| 14 | Sosyal Panel: pet kodu, partner ekle uyarısı, hata günlüğü görüntüleme | Geçti |
| 15 | Çıkış (onay penceresi) → giriş ekranı | Geçti (hata #10 düzeltildikten sonra) |
| 16 | Giriş: yanlış şifre hata kutusu, doğru şifreyle giriş, durumun korunması | Geçti |
| 17 | Sayfa yenileme: oturum ve pet durumu korunuyor | Geçti |
| 18 | Ölüm → veda ekranı (`Death` animasyonu) → **tek** mezarlık kaydı → yeni hayat | Geçti (hata #8 düzeltildikten sonra) |
| 19 | Anılar (mezarlık) sekmesi, kayıtlar | Geçti |
| 20 | Geniş ekranda hizalar (sekme çubuğu, 480 px çerçeve) | Geçti (hata #6 düzeltildikten sonra) |
| 21 | Konsolda hata/uyarı | Yok (yalnızca beklenen geliştirici bilgileri) |
| 22 | **Şifre göçü:** eski düz metin hesapla giriş → düz metin silindi, tuzlu özet yazıldı, depoda şifre yok | Geçti |
| 23 | **Rozet bildirimi** (üstten kayan kart) ve ana ekranda başarım listesi, kazanılan rozet vurgusu | Geçti |
| 24 | Efsanevi tür (Kurt) doğum belgesi, ★★★ Efsanevi | Geçti |

## 3. Bu turda bulunan ve düzeltilen hatalar
Ayrıntılar `ERROR_LOG.md` içinde: #7 (sohbet cevabı), #8 (çift mezarlık kaydı), #9 (web bildirim gürültüsü), #10 (web Alert), #6 (sekme hizası).

## 4. Cihazda (Android) doğrulanacaklar
- 3D modellerin Expo Go / APK'da yüklenmesi, boyut, animasyon akıcılığı (düşük cihaz performansı)
- Bildirim izni ve zamanlanmış hatırlatıcılar (uygulama kapalıyken)
- Titreşim paternleri
- Klavye açıkken sohbet giriş çubuğu
- Giriş/kayıt formlarının klavye ile kullanımı
- Uygulamayı uzun süre kapatıp açınca telafi hesabı (ör. gece boyu)
- 4 modelin (~12 MB) ilk açılış süresi

## 5. Bilinen eksikler
- Şifreler düz metin saklanıyor (yayından önce çözülmeli).
- Gerçek partner eşleşmesi yok (bilinçli).
- Rozetlerin `xpReward` değeri XP olarak verilmiyor (yalnızca kartta yazıyor).
- Uygulama ikonu ve açılış ekranı Android'de gerçek görünümüyle (adaptive ikon maskesi) cihazda kontrol edilmeli.
