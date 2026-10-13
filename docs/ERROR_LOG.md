# Hata Günlüğü (elle tutulan)

Bulunan her hata buraya kök nedeni ve çözümüyle eklenir. Uygulama içi çalışma zamanı günlüğü ayrıca vardır: **Sosyal Panel > Hata Günlüğü** (son 100 kayıt, `src/utils/logger.js`).

Biçim: `#numara · tarih · durum · başlık` → belirti, kök neden, çözüm, nerede doğrulandı.

---

### #1 · 2026-10-13 · Çözüldü · Yumurta ekranı atlanıyor
- **Belirti:** Yeni hesapta isimsiz bir hayvan doğrudan çıkıyor, kuluçka yok.
- **Kök neden:** `createUserWithPet` ve `ensurePet` `hatchStartedAt: null` bırakıyordu; `PetScreen` kuluçkayı sadece `hatchStartedAt` doluyken gösteriyordu.
- **Çözüm:** İkisinde de `hatchStartedAt: Date.now()`; eski kayıtlar için `needsHatchMigration` göçü.
- **Doğrulama:** `localStore.test.js`, web'de yeni hesap.

### #2 · 2026-10-13 · Çözüldü · 3D model küçük ve düz ön yüzden
- **Kök neden:** Kamera Charizard için ayarlıydı; sığdırma en uzun boyuta göre yapılıyordu, model dönünce kutu değişiyordu.
- **Çözüm:** Yatay izdüşüme göre sabit kamera mesafesi, 3/4 açı (`DEFAULT_ROTATION = 0.7`).
- **Doğrulama:** Web ekran görüntüsü. Cihazda ayrıca bakılacak.

### #3 · 2026-10-13 · Çözüldü · Oyun çok hızlı
- **Kök neden:** 5 sn'de bir tick, tick başına açlık −4.
- **Çözüm:** Saatlik oranlar (`DECAY_PER_HOUR`), `applyElapsed` saf fonksiyonu, kapalıyken telafi.
- **Doğrulama:** `decay.test.js`.

### #4 · 2026-10-13 · Çözüldü · Giriş açık, kayıt koyu tema
- **Kök neden:** Üç ayrı palet (`theme.js` koyu, `constants/gameConfig.js` açık, ekranlarda yerel `P`/`S`). Bazı ekranlar var olmayan `COLORS.text` anahtarını okuyordu.
- **Çözüm:** Tek `theme.js`, kök `constants/` bağımlılığı kaldırıldı.

### #5 · 2026-10-13 · Çözüldü · `useNativeDriver` uyarısı (web)
- **Çözüm:** `NATIVE_DRIVER = Platform.OS !== 'web'` (`utils/animation.js`).

### #6 · 2026-10-13 · Çözüldü · Sekme ikonu ile etiketi üst üste
- **Belirti:** Geniş ekranda "Hayvan" yazısının üstüne ikon biniyor.
- **Kök neden:** React Navigation geniş ekranda etiketi ikonun yanına koyuyor, `tabBarLabelPosition` bu sürümde işe yaramadı.
- **Çözüm:** İkon ve etiket tek dikey blokta (`tabBarIcon`), `tabBarShowLabel: false`. Web'de uygulama 480 px genişliğinde ortalanır.

### #7 · 2026-10-13 · Çözüldü · Sohbette Elif'in cevabı görünmüyor
- **Belirti:** İlk mesaj görünüyor, sonraki mesajlar (cevaplar dahil) yenilemeden görünmüyor.
- **Kök neden:** `appendMessage` abonelere her seferinde aynı dizi referansını veriyordu; React aynı referansta yeniden çizmiyor.
- **Çözüm:** `notify(..., [...list])`. Regresyon testi `localStore.test.js`.
- **Bulunma yolu:** Elle uçtan uca test.

### #8 · 2026-10-13 · Çözüldü · Aynı ölüm mezarlığa çok kez yazılıyor
- **Kök neden:** `deathHandled` yalnızca bellekteki bir bayraktı, ekran yenilenince sıfırlanıyordu.
- **Çözüm:** Pet üzerinde kalıcı `graveRecorded` bayrağı.

### #9 · 2026-10-13 · Çözüldü · Web'de bildirim hataları günlüğü dolduruyor
- **Belirti:** `Notifications.scheduleNotificationAsync is not available on web`.
- **Çözüm:** Web'de bildirim çağrıları atlanır (`SUPPORTED`).
- **Bulunma yolu:** Yeni hata günlüğü ilk gerçek hatayı yakaladı.

### #10 · 2026-10-13 · Çözüldü · Web'de `Alert.alert` çalışmıyor
- **Belirti:** Çıkış onayı ve "Partner eklendi" bilgisi hiç görünmüyor.
- **Çözüm:** `utils/dialog.js` (`showAlert`, `confirmDialog`); web'de tarayıcı penceresi.

### #11 · 2026-10-13 · Çözüldü · Yaş birimi
- **Belirti:** Mezarlıkta "31 gün" (aslında eski tick sayısı).
- **Çözüm:** Yaş saat cinsinden, `formatAge` ("2 gün 3 sa"). Eski kayıtlar eski değeri saat gibi gösterir (kabul edildi).

### #12 · 2026-10-13 · Çözüldü (kapsam dışı kaldı) · Google Drive indirme kotası
- Quaternius Drive klasöründen indirme "Quota exceeded" verdi; kullanıcı dosyaları elle indirdi. Kod hatası değil.

---

### #13 · 2026-10-13 · Çözüldü · Düz metin şifre
- **Belirti:** `accounts` kaydında şifre okunabilir saklanıyordu.
- **Çözüm:** `passwordHash.js` (tuzlu, 2000 tur SHA-256), `checkPassword`; eski hesaplar doğru şifreyle girişte yükseltilir ve düz metin silinir.
- **Doğrulama:** `passwordHash.test.js` (Node `crypto` ile birebir), gerçek uygulamada göç.

### #14 · 2026-10-13 · Çözüldü · Rozet bildirimi hiç görünmüyordu
- **Belirti:** `newBadges` üretiliyordu ama hiçbir ekran göstermiyordu.
- **Çözüm:** `BadgeToast` + ana ekranda `BadgeList`.
- **Not:** İlk elle testte "bildirim yok" sanıldı; başlık CSS ile büyük harfe çevrildiği için `innerText` araması yanlış negatif verdi. Arama Türkçe küçük harfe çevrilerek düzeltildi.

## Açık / izlenecek
- **Bildirimler ve 3D/WebGL Android'de doğrulanmadı.**
- Geniş ekranda 3D yükleme yer tutucusu (“Maskot yükleniyor”) ilk açılışta birkaç saniye görünüyor (4 modelin her biri ~3 MB, GLB'ye çevrilip küçültülebilir).
