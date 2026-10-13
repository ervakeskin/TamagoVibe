> **ARŞİV (2026-10-13):** Bu belge eski Charizard modeli dönemine aittir. Model Quaternius CC0 hayvanlarıyla değiştirildi; güncel 3D mantığı için `src/components/PetModel3D.jsx` ve `docs/ERROR_LOG.md` #2'ye bakın. `character.glb`, `inspect-glb.mjs` ve bazı bayraklar artık yok.

# 3D maskot kesilme / yükleme — hata günlüğü ve düzeltmeler

Son güncelleme: 2026-06-03 (v4)

## Belirti

- Karakterin **sol yarısı dikey çizgiyle kesik** (iç yüzeyler görünüyor).
- Model küçük olsa bile kesik devam ediyor.
- Ara sıra **「3D maskot yüklenemedi」** + Tekrar dene.

## Teşhis (kök nedenler)

| # | Neden | Kanıt | Öncelik |
|---|--------|--------|---------|
| 1 | **Animated.View + `useNativeDriver: true`** ile 3D Canvas sarmalanması | Web/React Native Web’de WebGL katmanı transform ile bozulur; yarım viewport veya kırpılma | **Kritik** |
| 2 | **drei `Bounds` + `clip`** | `clip()` → `camera.near = distance/100`; yanlış/küçük bbox → near plane modeli keser | Yüksek |
| 3 | **Frustum culling + hatalı geometry bbox** | GLB mesh’lerinde varsayılan `frustumCulled=true`; bbox kayıksa yarım mesh çizilmez | Yüksek |
| 4 | **WebGL viewport ≠ CSS boyutu** | `gl.setSize` senkron değilse sadece canvas’ın bir bölümü çizilir | Orta (web) |
| 5 | `overflow: hidden` + `borderRadius` | UI kırpma (dikey “iç yüzey” görüntüsüne daha az uygun) | Düşük |

## Hata logları (Metro / konsol)

```
[PetModel3D] loadAsset <Error> GLB URI alınamadı | resolveGlbUri fail
[PetModel3D] render <Error> useGLTF / expo-gl / Bounds
```

Web’de platform uyumsuzluğu (eski):

```
Unable to resolve expo-constants (expo-font) — bundle fail, maskot hiç yüklenmez
```

GLB inceleme scripti (Node):

```
GLB parse failed: ReferenceError: self is not defined
→ three GLTFLoader texture path; Node’da `globalThis.self = globalThis` gerekir
```

## Web favicon hatası (ENOENT)

```
Error: ENOENT: open '.../assets/favicon.png'
```

**Çözüm:** [`app.json`](../app.json) içinden `web.favicon` kaldırıldı (dosya yoktu). Web artık favicon middleware hatası vermemeli.

---

## Uygulanan düzeltmeler (v4 — 2026-06-03)

### [`src/components/PetModel3D.jsx`](../src/components/PetModel3D.jsx)

- **`computeAccurateBox`**: mesh bazlı dünya kutusu (16 parçalı GLB).
- **`ForceViewport`**: 20 kare `gl.setSize` + DOM canvas `style.width/height` (web yarım buffer).
- **`gl.setScissorTest(false)`**, `setPixelRatio(1)` web.
- **`frameloop="always"`** (demand yarım kare bırakabiliyordu).
- **`resize` debounce 0** — layout ile senkron.
- FitCamera artık **`useThree().size` değil** prop `viewportW/H` kullanıyor.
- `TARGET_HEIGHT = 2.45`, tüm sahne `frustumCulled = false`.

### [`app.json`](../app.json)

- Eksik `favicon.png` referansı kaldırıldı.

---

## Uygulanan düzeltmeler (v3 — 2026-06-03)

### 1. [`src/components/PetAvatar.jsx`](../src/components/PetAvatar.jsx)

- **PetModel3D artık `Animated.View` transform içinde değil** (scale/translateY native driver canvas’a uygulanmıyor).
- Yüzme/zıplama için boş `Animated.View` overlay (pointerEvents none).
- Mood `scaleAnim` canvas üzerinden kaldırıldı.

### 2. [`src/components/PetModel3D.jsx`](../src/components/PetModel3D.jsx)

- **`Bounds` + `clip` kaldırıldı** → özel `FitCamera` (drei formülü, `FIT_MARGIN=1.12`).
- **`frustumCulled = false`** + `computeBoundingBox/Sphere` + sphere radius %5 genişletme.
- **`GlViewportSync`**: her layout’ta `gl.setSize(w,h)` + `camera.aspect`.
- **`canvasWrap.overflow: visible`**.
- Web: **`dpr={1}`**, `frameloop="demand"` + fit sonrası invalidate.
- `TARGET_HEIGHT = 2.2` — sahneyi dolduran boyut (aşırı DISPLAY_SCALE kaldırıldı).

### 3. Korunan

- [`src/utils/resolveGlbUri.js`](../src/utils/resolveGlbUri.js) — platform URI
- [`src/utils/r3f.js`](../src/utils/r3f.js) — web/native R3F ayrımı

## Testler

| Test | Komut | Beklenen |
|------|--------|----------|
| Web bundle | `npx expo export --platform web` | Exit 0, `character.glb` asset listed |
| Android bundle | `npx expo export --platform android` | Exit 0 |
| GLB bbox (opsiyonel) | `node scripts/inspect-glb.mjs` | Merkez/size log (Node’da `self` polyfill gerekebilir) |
| Manuel | `npx expo start --clear` → web + Expo Go | Tam Charizard, kesik yok, ~sahne %70+ dolu |

### GLB asset incelemesi (`node scripts/inspect-glb.mjs`)

```
meshes: 16 (brazo, alas, cola, ...)
bbox size: 1.012 x 1.544 x 2.835
bbox center (ham): 0.273, 0.693, -0.477  → merkez kayık
```

Kodda `clone.position.sub(center)` ile merkezleniyor. Ham model off-center; export öncesi Blender Origin to Geometry önerilir.

### Test sonucu (otomatik bundle — agent)

- `npx expo export --platform web` → **BAŞARILI** (2026-06-03)
- `npx expo export --platform android` → **BAŞARILI** (2026-06-03)
- Görsel doğrulama → kullanıcı cihazında `expo start --clear` gerekir

## Hâlâ kesikse

1. Metro cache: `npx expo start --clear`
2. Blender: `character.glb` → Apply Scale, Origin to Geometry, yeniden export
3. Konsoldaki `[PetModel3D]` satırını bu dosyaya ekleyin

## Geçmiş denemeler (özet)

| Deneme | Sonuç |
|--------|--------|
| `useGLTF(require)` doğrudan | Expo Go’da yükleme hatası |
| expo-asset URI + useGLTF | Yükleme OK |
| AutoCamera z=1.85 | Near-plane kesik |
| AutoCamera z=3.8 | Daha iyi, kesik sürebiliyor |
| Bounds fit clip observe | clip + bbox → kesik riski |
| DISPLAY_SCALE 2.35 | Büyük ama kesik devam |
| frustumCulled false | Kısmen |
| v3: Canvas transform kaldır + FitCamera + GlViewportSync | **Beklenen kalıcı çözüm** |
