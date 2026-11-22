import { Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, DepthOfField, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Terrace } from './Environment'
import { Lighting } from './Lighting'
import { CameraRig } from './CameraRig'
import { CharacterController } from '../characters/CharacterController'
import { CHARACTERS, ORDER } from '../characters/CharacterData'
import { lipsync } from '../characters/LipSyncEngine'
import { HologramCard } from '../ui/HologramCard'
import { useStore } from '../store'
function LipSyncTicker() {
  useFrame((_, dt) => { lipsync.speaking = Object.values(useStore.getState().speaking).some(Boolean); lipsync.update(dt) })
  return null
}
const desktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches
export function World() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 50, near: 0.1, far: 300, position: [0, 6, 22] }} gl={{ antialias: false, powerPreference: 'high-performance' }} style={{ position: 'fixed', inset: 0 }}>
      <Lighting /><CameraRig /><LipSyncTicker />
      <Suspense fallback={null}>
        <Terrace />
        {ORDER.map((id) => <CharacterController key={id} data={CHARACTERS[id]} />)}
        <HologramCard />
      </Suspense>
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.6} luminanceThreshold={0.85} mipmapBlur />
        {desktop ? <DepthOfField worldFocusDistance={5} worldFocusRange={8} bokehScale={2} /> : <></>}
        <Vignette darkness={0.4} />
      </EffectComposer>
    </Canvas>)
}
