"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, Environment, useGLTF } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  N8AO,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { scrollProgressRef } from "@/lib/scroll-progress";

useGLTF.preload("/bust.glb");

/**
 * Double bust of Thucydides and Herodotus — high-res museum scan from
 * threedscans.com (Institut für Klassische Archäologie), STL → GLB via
 * scripts/stl-to-glb.mjs, then decimated to 4% and Draco-compressed
 * with gltf-transform (163 MB → 6.54 MB). PBR marble material applied
 * in-scene. Cursor-driven spring rotation; back never shows.
 */
function Bust() {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/bust.glb");
  const { size } = useThree();
  const isMobile = size.width < 768;
  const rot = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  // Damped scroll-driven deltas layered on top of cursor & idle sway.
  const scrollRotX = useRef(0);
  const scrollPosZ = useRef(0);

  useEffect(() => {
    const marble = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#ece2c8"),
      roughness: 0.42,
      metalness: 0,
      sheen: 0.6,
      sheenColor: new THREE.Color("#b48e5a"),
      sheenRoughness: 0.38,
      clearcoat: 0.12,
      clearcoatRoughness: 0.55,
    });
    scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (m.isMesh) {
        m.material = marble;
        m.castShadow = true;
        m.receiveShadow = true;
        m.geometry.computeVertexNormals();
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const { pointer } = state;

    // Cursor-driven rotation — tighter bounds because the double-bust is wider.
    rot.current.tx = pointer.x * 0.35;
    rot.current.ty = -pointer.y * 0.15;
    rot.current.x += (rot.current.ty - rot.current.x) * 0.055;
    rot.current.y += (rot.current.tx - rot.current.y) * 0.055;

    // Scroll choreography — lerp toward targets so motion is silky on both
    // fast scrolls and reverse scrolls. 0.08 per frame ≈ ~1/8 remaining per
    // 16 ms frame → settles in ~15 frames (250 ms) for each step change.
    const p = scrollProgressRef.current;
    scrollRotX.current = THREE.MathUtils.lerp(scrollRotX.current, -0.14 * p, 0.08);
    scrollPosZ.current = THREE.MathUtils.lerp(scrollPosZ.current, -0.6 * p, 0.08);

    group.current.rotation.y = rot.current.y + Math.sin(t * 0.2) * 0.04;
    group.current.rotation.x =
      rot.current.x + Math.cos(t * 0.13) * 0.02 + scrollRotX.current;
    group.current.position.y = Math.sin(t * 0.25) * 0.04;
    group.current.position.z = scrollPosZ.current;
  });

  return (
    <group
      ref={group}
      // Double bust is wider than a single head — reduce offset, reduce scale,
      // tighten rotation range so neither figure leaves frame.
      position={[isMobile ? 0 : 0.55, -0.05, 0]}
      scale={isMobile ? 1.35 : 1.7}
    >
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

/** Golden dust motes drifting in the warm light. */
function Dust() {
  const ref = useRef<THREE.Points>(null);

  const { positions, count } = useMemo(() => {
    const n = 160;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 9;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 3 + 0.8;
    }
    return { positions: arr, count: n };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.014;
    ref.current.rotation.x = t * 0.007;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#c9a372"
        size={0.012}
        opacity={0.42}
        transparent
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export function FrontispieceBust() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
    >
      {/* Warm halo behind the bust */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 42% at 55% 48%, rgba(180,142,90,0.22) 0%, rgba(139,107,63,0.06) 50%, transparent 75%)",
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 4.6], fov: 40 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Museum lighting — HDRI provides IBL, directionals carry the drama */}
        <ambientLight intensity={0.4} color="#f5efe3" />
        <directionalLight
          position={[4, 5, 4]}
          intensity={2.2}
          color="#fff2dc"
        />
        <directionalLight
          position={[-4, 1, 2]}
          intensity={0.7}
          color="#b48e5a"
        />
        <pointLight position={[0, -3, 3]} intensity={0.5} color="#8b6b3f" />

        {/* Museum HDRI — Adams Place Bridge (Poly Haven, CC0) — IBL only, no skybox */}
        <Environment
          files="/hdri/adams_place_bridge_1k.hdr"
          background={false}
        />

        <Suspense fallback={null}>
          <Bust />
          <Dust />
        </Suspense>

        {/* Post pipeline — N8AO settles the bust into space, Bloom kisses
            highlights, Vignette frames, Noise kills banding on the gradient. */}
        <EffectComposer multisampling={0} enableNormalPass>
          <N8AO aoRadius={0.5} intensity={2} />
          <Bloom
            intensity={0.18}
            luminanceThreshold={0.82}
            mipmapBlur
          />
          <Vignette offset={0.35} darkness={0.6} eskil={false} />
          <Noise opacity={0.025} premultiply={false} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
