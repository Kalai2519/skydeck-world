import { Suspense, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store'
import { LAMPS } from './Lighting'
import { useAssetExists } from '../characters/useAssetExists'
import { Safe } from './useErrorBoundary'
const MAP_URL = '/models/map.glb'   // DROP YOUR OUTDOOR MAP HERE: replaces the procedural terrace below

function MapGLB() { const { scene } = useGLTF(MAP_URL); return <primitive object={scene} /> }
type P = [number, number, number]
const Box = ({ s, p, m }: { s: P; p: P; m: THREE.Material }) => <mesh position={p} material={m} castShadow receiveShadow><boxGeometry args={s} /></mesh>

export function Terrace() {
  const hasMap = useAssetExists(MAP_URL)
  const M = useMemo(() => {
    const S = (c: number, o: any = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o })
    return { stone: S(0xb9b2a5), path: S(0xa0998c), plaza: S(0xd2cbbd), dark: S(0x555b66), wood: S(0x8a5a35), green: S(0x3f8f4a),
      glass: S(0x9fd8ff, { transparent: true, opacity: 0.28, roughness: 0.1, metalness: 0.3 }), kiosk: S(0x223355, { emissive: 0x2266ff, emissiveIntensity: 0.8 }),
      tower: S(0x2b3556), win: S(0x1a2238, { emissive: 0xffd27a, emissiveIntensity: 0 }), lamp: new THREE.MeshBasicMaterial({ color: 0xffe2a8 }) }
  }, [])
  const towers = useMemo(() => Array.from({ length: 22 }, (_, i) => { const h = 8 + Math.random() * 26; return { i, h, w: 4 + Math.random() * 3, z: -32 - Math.random() * 14 } }), [])
  useFrame((_, dt) => { const n = useStore.getState().mood === 'night' ? 0.8 : useStore.getState().mood === 'sunset' ? 0.25 : 0; M.win.emissiveIntensity = THREE.MathUtils.damp(M.win.emissiveIntensity, n, 2, dt) })
  const trees: [number, number, number][] = [[-16, -6, 1.2], [-17, 4, 1], [16, 4, 1.3], [17, -2, 1], [-8, 12, 1], [12, 12, 1.1]]
  return (<>
    {hasMap ? <Safe><Suspense fallback={null}><MapGLB /></Suspense></Safe> : (<>
      <Box s={[44, 0.5, 32]} p={[0, -0.25, 0]} m={M.stone} /><Box s={[44, 0.1, 6]} p={[0, 0.02, -1]} m={M.path} />
      <mesh position={[0, 0.04, 7]} material={M.plaza} receiveShadow><cylinderGeometry args={[6, 6, 0.1, 40]} /></mesh>
      <Box s={[44, 1.1, 0.1]} p={[0, 0.55, -14]} m={M.glass} />
      {Array.from({ length: 12 }, (_, i) => <Box key={i} s={[0.1, 1.2, 0.1]} p={[-22 + i * 4, 0.6, -14]} m={M.dark} />)}
      <Box s={[3.2, 0.5, 1]} p={[-10, 0.25, -11]} m={M.wood} /><Box s={[3.2, 0.9, 0.2]} p={[-10, 0.7, -11.6]} m={M.wood} />   {/* Kalai bench */}
      <Box s={[4, 0.3, 1]} p={[4, 0.15, 10.5]} m={M.stone} /><Box s={[4, 0.3, 1]} p={[4, 0.45, 11.5]} m={M.stone} />          {/* Byte steps */}
      <Box s={[0.8, 0.5, 0.8]} p={[7.5, 0.25, -6.5]} m={M.wood} />                                                           {/* Nova stool */}
      <Box s={[5, 3.2, 3]} p={[11, 1.6, -7]} m={M.glass} /><Box s={[5.4, 0.15, 3.4]} p={[11, 3.3, -7]} m={M.dark} />
      {[[8.5, -8.5], [13.5, -8.5], [8.5, -5.5], [13.5, -5.5]].map(([x, z], i) => <Box key={i} s={[0.15, 3.3, 0.15]} p={[x, 1.65, z]} m={M.dark} />)}
      <Box s={[1.2, 1.4, 0.5]} p={[11, 0.9, -7]} m={M.kiosk} />
      {trees.map(([x, z, s], i) => <group key={i} position={[x, 0, z]}><mesh position={[0, 0.75 * s, 0]} material={M.wood} castShadow><cylinderGeometry args={[0.15, 0.15, 1.5 * s, 6]} /></mesh><mesh position={[0, 2.3 * s, 0]} material={M.green} castShadow><sphereGeometry args={[1.2 * s, 12, 10]} /></mesh></group>)}
      {[-6, -2, 2, 6].map((x) => <group key={x} position={[x, 0, -3]}><Box s={[1.4, 0.6, 0.8]} p={[0, 0.3, 0]} m={M.dark} /><mesh position={[0, 0.8, 0]} material={M.green}><sphereGeometry args={[0.4, 8, 6]} /></mesh></group>)}
    </>)}
    {LAMPS.map(([x, z], i) => <mesh key={i} position={[x, 3, z]} material={M.lamp}><sphereGeometry args={[0.18, 8, 8]} /></mesh>)}
    {towers.map((t) => <mesh key={t.i} position={[-60 + t.i * 5.6, t.h / 2 - 2, t.z]} material={t.i % 3 ? M.tower : M.win}><boxGeometry args={[t.w, t.h, 4]} /></mesh>)}
  </>)
}
