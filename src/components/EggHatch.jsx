// =============================================================================
// EggHatch.jsx — Kuluçka ekranı: sallanan yumurta, çatlaklar, çatlama animasyonu
// Akış: incubating → ready (isim gir) → cracking → born → onDone(name)
// =============================================================================

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, Animated, Easing, StyleSheet, Vibration,
} from 'react-native';
import { COLORS, SHADOWS, VIBRATION, PET_TYPES, RARITIES } from '../constants/gameConfig';
import { NATIVE_DRIVER } from '../utils/animation';

const EGG_W = 150;
const EGG_H = 190;
const CRACK_MS = 1500;
const CERT_DELAY_MS = 1700;   // doğum sahnesi → belge

const fmt = (s) =>
  `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

// ─── Yumurta gövdesi ──────────────────────────────────────────────────────────
const Spot = ({ x, y, size, color }) => (
  <View
    style={{
      position: 'absolute', left: x, top: y,
      width: size, height: size, borderRadius: size / 2, backgroundColor: color,
    }}
  />
);

const Crack = ({ x, y, rotate, len, visible }) => (
  <View
    style={{
      position: 'absolute', left: x, top: y,
      width: len, height: 3, borderRadius: 2,
      backgroundColor: '#8C6F68',
      opacity: visible ? 0.75 : 0,
      transform: [{ rotate: `${rotate}deg` }],
    }}
  />
);

const EggBody = ({ progress }) => (
  <View style={styles.egg}>
    <View style={styles.eggShine} />
    <Spot x={26}  y={58}  size={22} color="#F4C9C0" />
    <Spot x={92}  y={40}  size={16} color="#BFE3D6" />
    <Spot x={100} y={104} size={26} color="#F4C9C0" />
    <Spot x={38}  y={128} size={18} color="#CFC3EE" />
    <Crack x={42}  y={86}  rotate={20}  len={34} visible={progress > 0.25} />
    <Crack x={66}  y={92}  rotate={-35} len={30} visible={progress > 0.25} />
    <Crack x={76}  y={70}  rotate={55}  len={36} visible={progress > 0.55} />
    <Crack x={30}  y={110} rotate={-15} len={40} visible={progress > 0.55} />
    <Crack x={60}  y={50}  rotate={-60} len={34} visible={progress > 0.85} />
    <Crack x={90}  y={130} rotate={40}  len={30} visible={progress > 0.85} />
  </View>
);

const EggHalf = ({ top, progress }) => (
  <View style={{ width: EGG_W, height: EGG_H / 2, overflow: 'hidden' }}>
    <View style={{ marginTop: top ? 0 : -EGG_H / 2 }}>
      <EggBody progress={progress} />
    </View>
  </View>
);

// ─── Ana bileşen ──────────────────────────────────────────────────────────────
const EggHatch = ({
  secondsLeft,
  totalSeconds,
  petType,
  ownerName = 'Bakıcı',
  certNo = 'TV-000000',
  onDone,
  startPhase = 'incubating',
}) => {
  const ready    = secondsLeft <= 0;
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 1;

  const [phase, setPhase] = useState(startPhase);   // incubating | cracking | born | certificate
  const bornAt = useRef(new Date()).current;
  const certAnim = useRef(new Animated.Value(0)).current;
  const [name,  setName]  = useState('');

  const wobble   = useRef(new Animated.Value(0)).current;
  const bounce   = useRef(new Animated.Value(0)).current;
  const split    = useRef(new Animated.Value(0)).current;
  const flash    = useRef(new Animated.Value(0)).current;
  const bornPop  = useRef(new Animated.Value(0)).current;
  const doneRef  = useRef(false);

  const meta   = PET_TYPES[petType] ?? PET_TYPES.FOX;
  const rarity = RARITIES[meta.rarity] ?? RARITIES.common;

  // Sallanma: hazır olduğunda daha sık ve güçlü
  useEffect(() => {
    if (phase !== 'incubating') return undefined;
    const amp = ready ? 1 : 0.35 + progress * 0.4;
    const gap = ready ? 350 : 1800 - progress * 900;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, { toValue: amp,  duration: 140, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(wobble, { toValue: -amp, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(wobble, { toValue: 0,    duration: 140, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER }),
        Animated.delay(gap),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, ready, progress, wobble]);

  // Yumurta nefes alır
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 1400, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(bounce, { toValue: 0, duration: 1400, useNativeDriver: NATIVE_DRIVER }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bounce]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone?.(name.trim());
  }, [onDone, name]);

  const startHatch = useCallback(() => {
    if (!ready || !name.trim() || phase !== 'incubating') return;
    Vibration.vibrate(VIBRATION.levelUp);
    setPhase('cracking');
    wobble.setValue(0);

    Animated.sequence([
      // Şiddetli sallanma
      Animated.loop(
        Animated.sequence([
          Animated.timing(wobble, { toValue: 1.6,  duration: 70, useNativeDriver: NATIVE_DRIVER }),
          Animated.timing(wobble, { toValue: -1.6, duration: 70, useNativeDriver: NATIVE_DRIVER }),
        ]),
        { iterations: 9 },
      ),
      Animated.timing(wobble, { toValue: 0, duration: 40, useNativeDriver: NATIVE_DRIVER }),
    ]).start(() => {
      // Parlama + yarılma
      Vibration.vibrate(VIBRATION.rebirth);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(flash, { toValue: 1, duration: 120, useNativeDriver: NATIVE_DRIVER }),
          Animated.timing(flash, { toValue: 0, duration: 520, useNativeDriver: NATIVE_DRIVER }),
        ]),
        Animated.timing(split, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE_DRIVER }),
      ]).start();
      setPhase('born');
      Animated.spring(bornPop, { toValue: 1, friction: 4, tension: 70, useNativeDriver: NATIVE_DRIVER }).start();
      setTimeout(() => {
        setPhase('certificate');
        Vibration.vibrate(VIBRATION.levelUp);
        Animated.spring(certAnim, { toValue: 1, friction: 7, tension: 60, useNativeDriver: NATIVE_DRIVER }).start();
      }, CERT_DELAY_MS);
    });
  }, [ready, name, phase, wobble, flash, split, bornPop, certAnim]);

  const rotate = wobble.interpolate({ inputRange: [-2, 2], outputRange: ['-24deg', '24deg'] });
  const lift   = bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const topY   = split.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });
  const topRot = split.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-28deg'] });
  const botY   = split.interpolate({ inputRange: [0, 1], outputRange: [0, 28] });
  const botRot = split.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '14deg'] });
  const fade   = split.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
  const popScale = bornPop.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });

  const sparkles = useMemo(() => ['✨', '⭐', '✨', '💖'], []);

  return (
    <View style={styles.wrap}>
      {phase !== 'certificate' && (
        <Text style={styles.title}>
          {phase === 'born'
            ? `Merhaba ${name.trim() || 'dostum'}!`
            : ready ? 'Yumurta çatlamak üzere!' : 'Kuluçka süreci…'}
        </Text>
      )}

      {phase === 'certificate' && (
        <Animated.View
          style={[
            styles.cert,
            {
              borderColor: rarity.color,
              opacity: certAnim,
              transform: [{ scale: certAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
            },
          ]}
        >
          <Text style={styles.certHead}>DOĞUM BELGESİ</Text>
          <Text style={styles.certNo}>{certNo}</Text>
          <View style={[styles.certDivider, { backgroundColor: rarity.color }]} />

          <Text style={styles.certEmoji}>{meta.emoji}</Text>
          <Text style={styles.certName}>{name.trim()}</Text>
          <Text style={styles.certSpecies}>{meta.label}</Text>

          <View style={[styles.rarityPill, { backgroundColor: rarity.color + '33', borderColor: rarity.color }]}>
            <Text style={[styles.rarityTxt, { color: rarity.color }]}>
              {'★'.repeat(rarity.stars)}{'☆'.repeat(3 - rarity.stars)}  {rarity.label}
            </Text>
          </View>
          <Text style={styles.certAbout}>{meta.about}</Text>

          <View style={styles.certMeta}>
            <Text style={styles.certMetaTxt}>Doğum: {bornAt.toLocaleDateString('tr-TR')} {bornAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text>
            <Text style={styles.certMetaTxt}>Bakıcı: {ownerName}</Text>
          </View>

          <Pressable style={styles.certBtn} onPress={finish}>
            <Text style={styles.certBtnTxt}>🐾  Maceraya Başla</Text>
          </Pressable>
        </Animated.View>
      )}

      {phase !== 'certificate' && <View style={styles.stage}>
        <Animated.View style={[styles.flash, { opacity: flash }]} pointerEvents="none" />

        {phase !== 'born' ? (
          <Animated.View style={{ transform: [{ translateY: lift }, { rotate }] }}>
            <View>
              <Animated.View style={{ opacity: fade, transform: [{ translateY: topY }, { rotate: topRot }] }}>
                <EggHalf top progress={progress} />
              </Animated.View>
              <Animated.View style={{ opacity: fade, transform: [{ translateY: botY }, { rotate: botRot }] }}>
                <EggHalf top={false} progress={progress} />
              </Animated.View>
            </View>
          </Animated.View>
        ) : (
          <View style={styles.bornWrap}>
            <Animated.Text style={[styles.bornEmoji, { transform: [{ scale: popScale }] }]}>
              {meta.emoji}
            </Animated.Text>
            {sparkles.map((s, i) => (
              <Animated.Text
                key={i}
                style={[
                  styles.sparkle,
                  {
                    left: 20 + i * 52, top: i % 2 ? 10 : 150,
                    opacity: bornPop,
                    transform: [{ scale: popScale }],
                  },
                ]}
              >
                {s}
              </Animated.Text>
            ))}
            <Text style={styles.bornType}>{meta.label} doğdu!</Text>
          </View>
        )}
      </View>}

      {phase === 'incubating' && (
        <>
          {!ready && (
            <View style={styles.timerPill}>
              <Text style={styles.timerTxt}>{fmt(secondsLeft)}</Text>
            </View>
          )}
          <View style={styles.inputCard}>
            <TextInput
              style={styles.nameInput}
              placeholder="Dostuna bir isim ver…"
              placeholderTextColor={COLORS.textSoft}
              value={name}
              onChangeText={setName}
              maxLength={14}
              autoCapitalize="words"
            />
          </View>
          <Pressable
            style={[styles.hatchBtn, (!ready || !name.trim()) && { opacity: 0.45 }]}
            onPress={startHatch}
            disabled={!ready || !name.trim()}
          >
            <Text style={styles.hatchBtnTxt}>
              {ready ? '🐣  Yumurtayı Çatlat' : '⏳  Bekliyoruz…'}
            </Text>
          </Pressable>
          <Text style={styles.hint}>
            {ready
              ? (name.trim() ? 'Hazırsın, çatlat!' : 'Bir isim yaz ve çatlat 🌸')
              : 'Beklerken isim düşünebilirsin 🌸'}
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, fontStyle: 'italic', marginBottom: 10, textAlign: 'center' },

  stage: { width: 260, height: 280, alignItems: 'center', justifyContent: 'center' },
  flash: {
    position: 'absolute', left: -80, top: -70, width: 420, height: 420, borderRadius: 210,
    backgroundColor: '#FFFFFF',
  },

  egg: {
    width: EGG_W, height: EGG_H, borderRadius: EGG_W / 2,
    backgroundColor: '#FFF7EA',
    borderWidth: 3, borderColor: '#EAD7C2',
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  eggShine: {
    position: 'absolute', left: 20, top: 22, width: 22, height: 54,
    borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.85)',
    transform: [{ rotate: '18deg' }],
  },

  bornWrap:  { alignItems: 'center', justifyContent: 'center', width: 260, height: 280 },
  bornEmoji: { fontSize: 120 },
  bornType:  { marginTop: 6, fontSize: 15, fontWeight: '700', color: COLORS.roseGold },
  sparkle:   { position: 'absolute', fontSize: 26 },

  timerPill: {
    backgroundColor: COLORS.bgDeep, paddingHorizontal: 22, paddingVertical: 8,
    borderRadius: 99, borderWidth: 1, borderColor: COLORS.border, marginTop: 6,
  },
  timerTxt:  { fontSize: 22, fontWeight: '800', color: COLORS.roseGold },
  inputCard: {
    width: '100%', marginTop: 18, padding: 4, backgroundColor: COLORS.bgCard,
    borderRadius: 22, borderWidth: 1.5, borderColor: COLORS.border, ...SHADOWS.sm,
  },
  nameInput: {
    paddingHorizontal: 18, paddingVertical: 14, fontSize: 16,
    color: COLORS.text, textAlign: 'center', fontStyle: 'italic',
  },
  hatchBtn: {
    marginTop: 18, backgroundColor: COLORS.mint, paddingHorizontal: 36, paddingVertical: 15,
    borderRadius: 99, borderWidth: 1.5, borderColor: 'rgba(100,180,140,0.45)',
    minWidth: 220, alignItems: 'center',
  },
  hatchBtnTxt: { color: '#2D6B4F', fontWeight: '700', fontSize: 15 },
  hint: { fontSize: 12, color: COLORS.textSoft, marginTop: 12, fontStyle: 'italic' },

  cert: {
    width: '100%', maxWidth: 340, alignItems: 'center',
    backgroundColor: '#FFFDF8', borderRadius: 26, borderWidth: 3,
    paddingVertical: 22, paddingHorizontal: 20, ...SHADOWS.lg,
  },
  certHead:    { fontSize: 14, fontWeight: '900', letterSpacing: 4, color: '#8C6F68' },
  certNo:      { fontSize: 10, color: COLORS.textSoft, marginTop: 4, letterSpacing: 1 },
  certDivider: { width: 120, height: 2, borderRadius: 1, marginVertical: 12, opacity: 0.7 },
  certEmoji:   { fontSize: 64 },
  certName:    { fontSize: 26, fontWeight: '800', color: COLORS.text, fontStyle: 'italic', marginTop: 4 },
  certSpecies: { fontSize: 14, color: COLORS.textSoft, marginTop: 2, fontWeight: '600' },
  rarityPill:  { marginTop: 12, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 99, borderWidth: 1.5 },
  rarityTxt:   { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  certAbout:   { marginTop: 12, fontSize: 12, color: COLORS.textSecond, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },
  certMeta:    { marginTop: 14, alignItems: 'center', gap: 2 },
  certMetaTxt: { fontSize: 11, color: COLORS.textSoft },
  certBtn: {
    marginTop: 18, backgroundColor: COLORS.mint, paddingHorizontal: 30, paddingVertical: 13,
    borderRadius: 99, borderWidth: 1.5, borderColor: 'rgba(100,180,140,0.45)',
  },
  certBtnTxt: { color: '#2D6B4F', fontWeight: '800', fontSize: 14 },
});

export default EggHatch;
