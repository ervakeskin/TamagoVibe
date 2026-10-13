// =============================================================================
// PetModel3D.jsx — tür bazlı animasyonlu hayvan modeli
// =============================================================================

import React, {
  Component, Suspense, useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect,
} from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Pressable, Platform,
} from 'react-native';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { getAvatarModel, normalizePetType } from '../constants/avatarConfig';
import { resolveGlbUri } from '../utils/resolveGlbUri';
import { Canvas, useThree, useGLTF, useFrame } from '../utils/r3f';
import { logError } from '../utils/logger';

const MOOD_SCALE = {
  SLEEPING: 0.82,
  SAD:      0.92,
  DEAD:     0.88,
};

const TARGET_HEIGHT = 2.45;
const FIT_MARGIN = 1.04;
const CAMERA_LIFT = 0.16;
const DEFAULT_STAGE = { width: 320, height: 320 };
const IS_WEB = Platform.OS === 'web';

function prepareMeshes(root) {
  root.traverse((child) => {
    child.frustumCulled = false;
    if (!child.isMesh || !child.geometry) return;
    if (!child.geometry.boundingBox) {
      child.geometry.computeBoundingBox();
    }
    if (!child.geometry.boundingSphere) {
      child.geometry.computeBoundingSphere();
    }
    if (child.geometry.boundingSphere) {
      child.geometry.boundingSphere.radius *= 1.2;
    }
  });
}

/** Skinned/çok parçalı GLB için mesh bazlı dünya kutusu */
function computeAccurateBox(root) {
  const box = new THREE.Box3();
  let has = false;
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    if (!obj.isMesh || !obj.geometry?.boundingBox) return;
    const geomBox = obj.geometry.boundingBox.clone();
    geomBox.applyMatrix4(obj.matrixWorld);
    if (!has) {
      box.copy(geomBox);
      has = true;
    } else {
      box.union(geomBox);
    }
  });
  if (!has) box.setFromObject(root);
  return box;
}

function normalizeScene(scene) {
  // Skinned mesh için SkeletonUtils.clone şart (scene.clone iskeleti bozar)
  const clone = cloneSkinned(scene);
  prepareMeshes(clone);

  const box = computeAccurateBox(clone);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  clone.position.sub(center);
  clone.updateMatrixWorld(true);

  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  const normScale = TARGET_HEIGHT / maxDim;

  return { model: clone, normScale, modelSize: size };
}

/**
 * Kamerayı modelin yatay izdüşümüne göre sabitle (dönerken zıplamasın).
 * size: ölçeklenmiş modelin kutu boyutu (merkez 0,0,0).
 */
function fitPerspectiveCamera(camera, size, viewportW, viewportH) {
  if (!viewportW || !viewportH) return;

  const vFov = (camera.fov * Math.PI) / 180;
  const aspect = viewportW / viewportH;
  const horizontal = Math.hypot(size.x, size.z) * 0.82;
  const fitHeight = (size.y * FIT_MARGIN) / (2 * Math.tan(vFov / 2));
  const fitWidth = (horizontal * FIT_MARGIN) / (2 * Math.tan(vFov / 2) * aspect);
  const distance = Math.max(fitHeight, fitWidth) + horizontal * 0.5;

  camera.position.set(0, size.y * CAMERA_LIFT, distance);
  camera.near = 0.01;
  camera.far = Math.max(500, distance * 100);
  camera.lookAt(0, -size.y * 0.04, 0);
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
}

function FitCamera({ size, viewportW, viewportH, deps = [] }) {
  const { camera, invalidate } = useThree();

  const applyFit = useCallback(() => {
    if (!size || !viewportW || !viewportH) return;
    fitPerspectiveCamera(camera, size, viewportW, viewportH);
    invalidate();
  }, [camera, size, viewportW, viewportH, invalidate]);

  useLayoutEffect(() => {
    applyFit();
  }, [applyFit, ...deps]);

  return null;
}

/** Web: R3F size gecikmesi / yarım viewport — birkaç kare zorla senkron */
function ForceViewport({ viewportW, viewportH }) {
  const { gl, camera, invalidate } = useThree();
  const frames = useRef(0);

  useLayoutEffect(() => {
    frames.current = 0;
    syncGlViewport(gl, camera, viewportW, viewportH);
    invalidate();
  }, [gl, camera, viewportW, viewportH, invalidate]);

  useFrame(() => {
    if (frames.current >= 20) return;
    frames.current += 1;
    syncGlViewport(gl, camera, viewportW, viewportH);
    invalidate();
  });

  return null;
}

function syncGlViewport(gl, camera, w, h) {
  if (!w || !h) return;
  if (typeof gl.setPixelRatio === 'function' && IS_WEB) {
    gl.setPixelRatio(1);
  }
  if (typeof gl.setScissorTest === 'function') {
    gl.setScissorTest(false);
  }
  if (typeof gl.setSize === 'function') {
    gl.setSize(w, h, false);
  }
  const canvas = gl.domElement;
  if (canvas?.style && IS_WEB) {
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.style.display = 'block';
    canvas.style.maxWidth = 'none';
  }
  if (camera?.isPerspectiveCamera) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

/** Ruh haline göre Quaternius klibi seç */
const MOOD_CLIP = {
  HAPPY:    'Idle',
  NEUTRAL:  'Idle',
  HUNGRY:   'Idle_2',
  SAD:      'Idle_2_HeadLow',
  TIRED:    'Idle_2_HeadLow',
  SLEEPING: 'Idle_2_HeadLow',
  SICK:     'Idle_HitReact1',
  DEAD:     'Death',
};

/** Eylem tepkileri (tek seferlik) */
const REACTION_CLIP = {
  feed:  'Eating',
  play:  'Gallop_Jump',
  touch: 'Idle_HitReact2',
  heal:  'Idle_HitReact1',
};

const findClip = (animations, name) =>
  THREE.AnimationClip.findByName(animations, name)
  ?? THREE.AnimationClip.findByName(animations, 'Idle');

function useMoodAnimation(model, animations, mood, reaction) {
  const mixerRef    = useRef(null);
  const currentRef  = useRef(null);
  const reactingRef = useRef(false);
  const moodRef     = useRef(mood);
  moodRef.current = mood;

  const fadeTo = useCallback((next, fade = 0.25) => {
    const prev = currentRef.current;
    next.reset().play();
    if (prev && prev !== next) prev.crossFadeTo(next, fade, false);
    currentRef.current = next;
  }, []);

  const playMood = useCallback(() => {
    const mixer = mixerRef.current;
    if (!mixer || !animations?.length) return;
    const clip = findClip(animations, MOOD_CLIP[moodRef.current] ?? 'Idle');
    if (!clip) return;
    const action = mixer.clipAction(clip);
    const dead = moodRef.current === 'DEAD';
    action.setLoop(dead ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    action.clampWhenFinished = dead;
    fadeTo(action);
  }, [animations, fadeTo]);

  useEffect(() => {
    if (!model || !animations?.length) return undefined;
    const mixer = new THREE.AnimationMixer(model);
    mixerRef.current = mixer;
    const onFinished = (e) => {
      if (reactingRef.current && e.action === currentRef.current) {
        reactingRef.current = false;
        playMood();
      }
    };
    mixer.addEventListener('finished', onFinished);
    playMood();
    return () => {
      mixer.removeEventListener('finished', onFinished);
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      mixerRef.current = null;
      currentRef.current = null;
    };
  }, [model, animations, playMood]);

  useEffect(() => {
    if (!reactingRef.current) playMood();
  }, [mood, playMood]);

  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer || !reaction?.id || !animations?.length || mood === 'DEAD') return;
    const name = REACTION_CLIP[reaction.type];
    if (!name) return;
    const clip = findClip(animations, name);
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = false;
    reactingRef.current = true;
    fadeTo(action, 0.15);
  }, [reaction?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
    if (IS_WEB && __DEV__ && typeof window !== 'undefined') {
      const cur = currentRef.current;
      window.__tamagoAnim = cur
        ? { clip: cur.getClip().name, time: Number(cur.time.toFixed(3)), reacting: reactingRef.current }
        : null;
    }
  });
}

function CharacterMesh({ uri, mood, reaction, rotationY, viewportW, viewportH }) {
  const rootRef = useRef();
  const { scene, animations } = useGLTF(uri, false);

  const { model, normScale, modelSize } = useMemo(() => normalizeScene(scene), [scene]);
  useMoodAnimation(model, animations, mood, reaction);
  const moodScale = MOOD_SCALE[mood] ?? 1;
  const scale = normScale * moodScale;
  const size = useMemo(() => modelSize.clone().multiplyScalar(scale), [modelSize, scale]);

  useLayoutEffect(() => {
    if (!rootRef.current) return;
    rootRef.current.rotation.y = rotationY;
    rootRef.current.scale.setScalar(scale);
    rootRef.current.updateMatrixWorld(true);
  }, [rotationY, scale]);

  return (
    <>
      <ForceViewport viewportW={viewportW} viewportH={viewportH} />
      <FitCamera
        size={size}
        viewportW={viewportW}
        viewportH={viewportH}
        deps={[uri]}
      />
      <group ref={rootRef} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
        <primitive object={model} />
      </group>
    </>
  );
}

class ModelErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(err) {
    logError('PetModel3D.render', err);
    setTimeout(() => this.props.onFailed?.(err), 0);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

const PetModel3DCanvas = ({
  uri, mood, reaction, rotationY, canvasW, canvasH, mountKey,
}) => (
  <View
    style={[styles.canvasWrap, { width: canvasW, height: canvasH }]}
    collapsable={false}
  >
    <Canvas
      key={mountKey}
      style={{ width: canvasW, height: canvasH, display: IS_WEB ? 'block' : undefined }}
      frameloop="always"
      dpr={IS_WEB ? 1 : undefined}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
      camera={{ fov: 38, near: 0.01, far: 500, position: [0, 0.5, 5] }}
      gl={
        IS_WEB
          ? { preserveDrawingBuffer: true, antialias: true, alpha: true }
          : undefined
      }
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
        syncGlViewport(gl, camera, canvasW, canvasH);
      }}
    >
      <ambientLight intensity={1.45} />
      <directionalLight position={[5, 8, 6]} intensity={1.55} />
      <directionalLight position={[-4, 3, -3]} intensity={0.4} />
      <Suspense fallback={null}>
        <CharacterMesh
          uri={uri}
          mood={mood}
          reaction={reaction}
          rotationY={rotationY}
          viewportW={canvasW}
          viewportH={canvasH}
        />
      </Suspense>
    </Canvas>
  </View>
);

const PetModel3D = ({
  petType    = 'FOX',
  mood       = 'HAPPY',
  reaction   = null,
  rotationY  = 0,
  size       = DEFAULT_STAGE,
}) => {
  const [uri, setUri]           = useState(null);
  const [status, setStatus]     = useState('loading');
  const [retryKey, setRetryKey] = useState(0);
  const [errMsg, setErrMsg]     = useState('');
  const uriRef                  = useRef(null);
  const modelType               = normalizePetType(petType);

  const stageW = size?.width  ?? DEFAULT_STAGE.width;
  const stageH = size?.height ?? DEFAULT_STAGE.height;
  const stageStyle = useMemo(
    () => ({ width: stageW, height: stageH }),
    [stageW, stageH],
  );

  const loadAsset = useCallback(async () => {
    setStatus('loading');
    setErrMsg('');
    setUri(null);
    try {
      if (uriRef.current && useGLTF.clear) useGLTF.clear(uriRef.current);
      const resolved = await resolveGlbUri(getAvatarModel(modelType));
      uriRef.current = resolved;
      setUri(resolved);
      setStatus('ready');
    } catch (err) {
      logError('PetModel3D.loadAsset', err);
      setErrMsg(err?.message ?? 'Bilinmeyen hata');
      setStatus('error');
    }
  }, [modelType]);

  useEffect(() => {
    loadAsset();
  }, [loadAsset, retryKey]);

  const handleRenderFailed = useCallback((err) => {
    setErrMsg(err?.message ?? '3D sahne hatası');
    setStatus('error');
  }, []);

  if (status === 'loading') {
    return (
      <View style={[styles.placeholder, stageStyle]}>
        <ActivityIndicator size="large" color="#C9A69E" />
        <Text style={styles.hint}>Maskot yükleniyor...</Text>
      </View>
    );
  }

  if (status === 'error' || !uri) {
    return (
      <View style={[styles.placeholder, stageStyle]}>
        <Text style={styles.errTitle}>3D maskot yüklenemedi</Text>
        {!!errMsg && (
          <Text style={styles.errDetail} numberOfLines={3}>{errMsg}</Text>
        )}
        <Pressable style={styles.retryBtn} onPress={() => setRetryKey((k) => k + 1)}>
          <Text style={styles.retryTxt}>Tekrar dene</Text>
        </Pressable>
      </View>
    );
  }

  const mountKey = `${retryKey}-${uri}-${stageW}x${stageH}`;

  return (
    <ModelErrorBoundary key={mountKey} onFailed={handleRenderFailed}>
      <PetModel3DCanvas
        uri={uri}
        mood={mood}
        reaction={reaction}
        rotationY={rotationY}
        canvasW={stageW}
        canvasH={stageH}
        mountKey={mountKey}
      />
    </ModelErrorBoundary>
  );
};

const styles = StyleSheet.create({
  canvasWrap: {
    overflow:        'visible',
    alignSelf:       'center',
    backgroundColor: 'transparent',
    ...(IS_WEB ? { position: 'relative', zIndex: 2 } : {}),
  },
  placeholder: {
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,251,245,0.6)',
  },
  hint: {
    marginTop:  10,
    fontSize:   11,
    color:      '#A08C89',
    fontStyle:  'italic',
  },
  errTitle: {
    fontSize:   12,
    color:      '#C53030',
    textAlign:  'center',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  errDetail: {
    fontSize:   10,
    color:      '#A08C89',
    textAlign:  'center',
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  retryBtn: {
    backgroundColor: '#C9A69E',
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      12,
  },
  retryTxt: {
    color:      '#fff',
    fontWeight: '700',
    fontSize:   12,
  },
});

export default PetModel3D;
