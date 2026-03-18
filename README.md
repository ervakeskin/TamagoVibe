🐾 TamagoVibe — Platinum Signature Edition
Apple Dog Style | Sosyal Etkileşimli | Minimalist Lüks | Firebase Tabanlı

TamagoVibe, iki partnerin aynı dijital evcil hayvana minimalist bir estetikle baktığı, gerçek zamanlı senkronize bir mobil deneyimdir.

🎨 Tasarım Felsefesi (The "Signature" Look)
Görsel Stil: "Apple Dog" estetiği; el çizimi (hand-drawn), titrek hatlar ve suluboya dokusu.

Renk Paleti: #FFFBF5 (Kağıt Beyazı), #FF4D6D (Pastel Pembe), #48CAE4 (Pastel Mavi).

Lüks Detaylar: Minimalist Rose Gold aksesuarlar ve inci dokunuşları.

📁 Proje Yapısı
Plaintext
TamagoVibe/
├── App.js                   # Navigasyon (Auth Guard + Stack/Tab)
└── src/
    ├── api/
    │   ├── firebaseConfig.js    # Firestore & Auth Bağlantısı
    │   └── notificationService.js
    ├── hooks/
    │   └── useSocialPet.js      # Platinum Oyun Motoru (Hatch/Death Mantığı)
    ├── screens/
    │   ├── PetScreen.jsx        # Lüks Dashboard (Ana Ekran)
    │   ├── SocialScreen.jsx     # Arkadaş Ekleme & Sosyal Panel
    │   ├── ChatListScreen.jsx   # WhatsApp Tarzı Mesaj Listesi
    │   ├── ChatDetailScreen.jsx # Bireysel DM Odası
    │   └── GraveyardScreen.jsx  # Anıt Salonu (Mezarlık)
    ├── components/
    │   ├── PetAvatar.jsx        # Karakter Gösterimi (Glow & Rose Gold)
    │   ├── StatBar.jsx          # Pastel İlerleme Çubukları
    │   └── LevelUpModal.jsx     # Seviye Atlama Kutlaması
    ├── constants/
    │   └── gameConfig.js        # XP, Renk Paleti ve Hayvan Türleri
    └── assets/
        └── images/              # Leonardo.ai El Çizimi Görselleri
🎮 Platinum Özellikler
💬 Bireysel DM: Grup odası yerine partnerler arası WhatsApp tarzı özel mesajlaşma.

🥚 Garantili Hatch: Date.now() bazlı, cihazlar arası senkronize 2 dakikalık kuluçka süreci.

💀 Yaşam Döngüsü: Ölen hayvanlar için lüks veda ekranı ve anında "Yeni Hayat Başlat" butonu.

🤝 Sosyal Panel: Partner kodu kopyalama ve anında eşleşme desteği.

🏆 XP & Level: level × 100 dinamik eşik ve konfeti animasyonları.

🔑 Firestore Veri Modeli
/users/{uid}: Profil bilgileri, bağlı petId ve toplam miras (legacyCount).

/pets/{petId}: Açlık, Mutluluk, Sağlık, XP, isDead durumu ve partnerIds.

/pets/{petId}/messages: Bireysel DM kayıtları (senderId, receiverId).

/graveyard/{id}: Ölen dostların anıt bilgileri.

🚀 Kurulum ve Çalıştırma
Bash
# 1. Bağımlılıkları Yükle
npm install

# 2. Gerekli Paketleri Kur
npx expo install expo-notifications expo-device
npm install firebase @react-native-async-storage/async-storage @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context

# 3. Firestore Kurallarını Yayınla
firebase deploy --only firestore:rules

# 4. Uygulamayı Başlat
npx expo start
🚨 Önemli Notlar
Uygulamanın çalışması için Leonardo.ai'den üretilen görsellerin src/assets/images altına ilgili hayvan isimleriyle (örneğin rabbit.png) eklenmesi gerekir.

Siyah ekran hatalarını önlemek için isLoading durumları PetScreen içinde kontrol edilmiştir.