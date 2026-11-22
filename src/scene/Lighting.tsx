import { Suspense, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import { Mood, useStore } from '../store'
import { Safe } from './useErrorBoundary'
const MOODS: Record<Mood, { sky: string; sun: string; si: number; hi: number; pos: [number, number, number]; lamp: number; hdri: 'park' | 'sunset' | 'night' }> = {
  day: { sky: '#8ecbff', sun: '#ffffff', si: 1.6, hi: 0.7, pos: [12, 20, 10], lamp: 0, hdri: 'park' },
  sunset: { sky: '#ff9a5c', sun: '#ffb070', si: 1.3, hi: 0.45, pos: [-18, 7, 10], lamp: 8, hdri: 'sunset' },
  night: { sky: '#0a1033', sun: '#7a8cff', si: 0.5, hi: 0.3, pos: [-8, 16, -8], lamp: 30, hdri: 'night' },
}
export const LAMPS: [number, number][] = [[-4, -2], [4, -2], [-14, -8], [12, -8], [0, 10]]
export function Lighting() {
  const mood = useStore((s) => s.mood)
  const { scene } = useThree()
  const sun = useRef<THREE.DirectionalLight>(null!), hemi = useRef<THREE.HemisphereLight>(null!), lamps = useRef<(THREE.PointLight | null)[]>([])
  const tc = useRef(new THREE.Color()), tv = useRef(new THREE.Vector3())
  useFrame((_, dt) => {
    const m = MOODS[useStore.getState().mood], k = 1 - Math.exp(-dt * 2.5)
    ;(scene.background as THREE.Color).lerp(tc.current.set(m.sky), k); (scene.fog as THREE.Fog).color.copy(scene.background as THREE.Color)
    sun.current.color.lerp(tc.current.set(m.sun), k); sun.current.intensity += (m.si - sun.current.intensity) * k
    sun.current.position.lerp(tv.current.set(...m.pos), k); hemi.current.intensity += (m.hi - hemi.current.intensity) * k
    lamps.current.forEach((l) => l && (l.intensity += (m.lamp - l.intensity) * k))
  })
  return (<>
    <color attach="background" args={[MOODS.day.sky]} /><fog attach="fog" args={[MOODS.day.sky, 40, 120]} />
    <hemisphereLight ref={hemi} args={['#ffffff', '#445566', 0.7]} />
    <directionalLight ref={sun} castShadow position={[12, 20, 10]} shadow-mapSize={[1024, 1024]} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={25} shadow-camera-bottom={-25} shadow-camera-far={80} />
    {LAMPS.map(([x, z], i) => <pointLight key={i} ref={(l) => (lamps.current[i] = l)} position={[x, 3, z]} color="#ffd9a0" intensity={0} distance={18} />)}
    {/* HDRI from drei presets (CDN). Drop your own: <Environment files="/hdri/sky.hdr" /> */}
    <Safe><Suspense fallback={null}><Environment preset={MOODS[mood].hdri} /></Suspense></Safe>
  </>)
}
