# TamagoVibe — Proje Durumu ve Yayın Yol Haritası

**Son güncelleme:** 2026-10-13 · Hedef: Android, ilk sürüm tek oyunculu · GitHub'da yalnızca Mart'taki ilk commit var, sonraki çalışma **commit edilmedi**.

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

**Kalite**
- 75 birim testi, hata günlüğü (uygulama içi + `docs/ERROR_LOG.md`), test raporu
- README ve CHANGELOG güncel

## YAPILMADI / EKSİK

### Yayını engelleyenler (P0)
1. **Commit edilmedi.** Şablon artıkları silindi, yeni dosyalar eklendi; hepsi yerelde. (GitHub'a göndermek kullanıcı onayı ister.)
2. **Mağaza kimlikleri yok:** `app.json`'da `android.package`, `versionCode`, ikon (adaptive), splash, `expo-notifications` eklentisi; `eas.json` yok, EAS projesi başlatılmadı.
3. **Şifreler düz metin** (`authService`, `localStore.accounts`). Hash'lenmeli ya da hesap sistemi sadeleştirilmeli.
4. **Android cihaz testi yapılmadı:** 3D/WebGL, bildirimler, titreşim, klavye. (`docs/TEST_RAPORU.md` bölüm 4)
5. **Gizlilik politikası, mağaza metni, ekran görüntüleri** yok (`DEPLOY_CHECKLIST.md`).
6. **Kök `constants/gameConfig.js` kaldı:** şablondan kalan, artık hiçbir yerden import edilmiyor. Silinebilir (bu oturumda silme izni verilmedi).

### Oyun / özellik (P1)
7. **Rozet kazanma bildirimi yok:** `newBadges` üretiliyor ama hiçbir ekran göstermiyor; `BadgeList` bileşeni kullanılmıyor.
8. **Gerçek partner eşleşmesi yok:** `addPartnerByCode` bilerek hata fırlatır. (Ayrı backend gerekir, ilk sürüm kapsamı dışı.)
9. **Eski modelden gelen türler:** kayıtlı CAT/PANDA vb. pet'ler Tilki olarak görünür.
10. **Model boyutu:** 4 x ~3 MB `.gltf`. GLB'ye çevirip sıkıştırmak ilk açılışı hızlandırır.
11. Denge: yemek/oyun değerleri yeni saatlik hızla ince ayar bekliyor (örn. XP eğrisi).
12. Ölü pet için "yeni hayat" sonrası eski rozetler (`unlockedBadges`) sıfırlanıyor; kalıcı koleksiyon yok.

### Teknik borç (P2)
13. `PetAvatar` içinde `GLOW` tablosunda eski türler (CAT, PANDA...) duruyor.
14. `ChatScreen.jsx` ölü dosya; `ActionButton`, `XpCircle`, `StatBar`, `BadgeList` kullanılmıyor olabilir (tek tek doğrulanmalı).
15. Test kapsamı: ekran bileşenleri ve `useSocialPet` için render testi yok (yalnızca mantık katmanı testli).
16. SDK 51 → güncel SDK'ya yükseltme planı yok.
17. CI yok.

## Önerilen sıra

1. **Commit** (yerel) → kullanıcı onayıyla GitHub'a push
2. **Android'de dene** (Expo Go): 3D, bildirim, klavye
3. **Yayın hazırlığı:** `app.json` kimlikleri, ikon/splash, `eas.json`, şifre hash'leme, gizlilik politikası
4. **Rozet bildirimi**, model sıkıştırma, denge ayarı
5. **Gerçek partner** (ayrı backend)

## Açık kararlar
- Şifre: hash'lemek mi, yoksa ilk sürümde hesap sistemini kaldırıp tek profil mi?
- Kedi ve tavşan için ek CC0 model aranacak mı (şu an yalnızca 4 tür)?
