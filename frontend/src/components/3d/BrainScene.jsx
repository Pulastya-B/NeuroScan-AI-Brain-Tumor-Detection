import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, useGLTF, Center } from '@react-three/drei'
import * as THREE from 'three'

/* ------------------------------------------------------------------ */
/*  GLB Brain model                                                    */
/* ------------------------------------------------------------------ */
function BrainModel() {
  const groupRef = useRef()
  const { scene } = useGLTF('/brain.glb')
  const { camera } = useThree()

  // Clone so we don't mutate the cached original
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true)
    // Ensure all meshes receive lights & cast shadows
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        // If the model has no material or the material is too dark,
        // enhance it slightly while keeping the original textures
        if (child.material) {
          child.material = child.material.clone()
          child.material.roughness = Math.min(child.material.roughness ?? 0.5, 0.65)
          child.material.metalness = Math.max(child.material.metalness ?? 0, 0.05)
          child.material.envMapIntensity = 0.8
          child.material.needsUpdate = true
        }
      }
    })
    return clone
  }, [scene])

  // Auto-scale & center the model to fit nicely in the viewport
  useEffect(() => {
    if (!groupRef.current) return
    const box = new THREE.Box3().setFromObject(groupRef.current)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)

    const maxDim = Math.max(size.x, size.y, size.z)
    const desiredSize = 2.8 // how big the brain should appear
    const scale = desiredSize / maxDim
    groupRef.current.scale.setScalar(scale)

    // Re-center after scaling
    box.setFromObject(groupRef.current)
    box.getCenter(center)
    groupRef.current.position.sub(center)
  }, [clonedScene])

  // Gentle idle rotation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  )
}

// Preload the model so it starts downloading immediately
useGLTF.preload('/brain.glb')

/* ------------------------------------------------------------------ */
/*  Subtle floating particles around the brain                         */
/* ------------------------------------------------------------------ */
function NeuralParticles() {
  const pointsRef = useRef()
  const count = 500

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 2.0 + Math.random() * 1.8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [])

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.018} color="#22d3ee" transparent opacity={0.45} sizeAttenuation />
    </points>
  )
}

/* ------------------------------------------------------------------ */
/*  Scene                                                              */
/* ------------------------------------------------------------------ */
export default function BrainScene() {
  const containerRef = useRef()
  const [isVisible, setIsVisible] = useState(true)

  // Pause Three.js rendering when the canvas scrolls out of view
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [0, 0.6, 4.5], fov: 42 }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}  /* cap pixel ratio to avoid rendering 4x pixels on retina */
        frameloop={isVisible ? 'always' : 'never'}  /* stop rendering when off-screen */
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        {/* Lighting rig */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 6, 4]} intensity={1.8} color="#ffffff" />
        <directionalLight position={[-4, 3, -3]} intensity={0.7} color="#a5b4fc" />
        <pointLight position={[0, -3, 3]} intensity={0.6} color="#22d3ee" />
        <hemisphereLight skyColor="#c7d2fe" groundColor="#1e1b4b" intensity={0.5} />

        {/* Subtle starfield – reduced count */}
        <Stars radius={60} depth={50} count={800} factor={2.5} fade speed={0.3} />

        {/* Brain GLB model */}
        <Center>
          <BrainModel />
        </Center>
        <NeuralParticles />

        {/* Interactive orbit controls – drag to rotate, scroll to zoom */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2.5}
          maxDistance={8}
          autoRotate={false}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  )
}
