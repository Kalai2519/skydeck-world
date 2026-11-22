import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { CharData } from './CharacterData'
import type { AnimationStateMachine } from './AnimationStateMachine'
import { lipsync } from './LipSyncEngine'
import { useStore } from '../store'
// Fallback body so the app runs with zero assets. Replaced automatically when /public/models/<id>.glb exists.
export function ProceduralBody({ data, fsm }: { data: CharData; fsm: AnimationStateMachine }) {
  const root = useRef<THREE.Group>(null!), torso = useRef<THREE.Mesh>(null!), head = useRef<THREE.Mesh>(null!), mouth = useRef<THREE.Mesh>(null!)
  const aL = useRef<THREE.Group>(null!), aR = useRef<THREE.Group>(null!), lL = useRef<THREE.Group>(null!), lR = useRef<THREE.Group>(null!)
  const m = useMemo(() => {
    const M = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })
    return { shirt: M(data.color), skin: M(0xf0c8a0), hair: M(data.hair), pants: M(0x2a2f45), eye: M(0x111111), mouth: M(0x7a1f2b) }
  }, [data])
  useFrame(({ clock }, dt) => {
    const T = clock.elapsedTime, s = fsm.state, sit = fsm.seated, walk = s === 'Walk', talk = useStore.getState().speaking[data.id]
    const sw = walk ? Math.sin(T * 7) : 0
    lL.current.rotation.x = sit ? -1.5 : sw * 0.6; lR.current.rotation.x = sit ? -1.5 : -sw * 0.6
    const g = talk ? Math.sin(T * 3) * 0.4 - 0.4 : 0
    aL.current.rotation.x = -sw * 0.5 + g
    aR.current.rotation.z = 0
    if (s === 'Wave') { aR.current.rotation.x = -2.7 + Math.sin(T * 10) * 0.5; aR.current.rotation.z = -0.3 }
    else if (s === 'Poke_Reaction') { aR.current.rotation.x = aL.current.rotation.x = -2.4 }
    else aR.current.rotation.x = sw * 0.5 + (talk ? Math.sin(T * 3 + 1) * 0.4 - 0.4 : 0)
    const p = s === 'Poke_Reaction' ? Math.min(1, fsm.since / 0.9) : 0
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, (sit ? -0.42 : 0) + Math.sin(p * Math.PI) * 0.35, 12, dt)
    const sq = 1 + Math.sin(p * Math.PI * 3) * 0.08 * (p > 0 ? 1 : 0)
    root.current.scale.set(1 / sq, sq, 1 / sq)
    torso.current.scale.y = 1 + Math.sin(T * 2) * 0.015
    head.current.rotation.y = Math.sin(T * 0.8) * 0.2
    mouth.current.scale.y = talk ? 0.5 + lipsync.level * 4 : s === 'Poke_Reaction' ? 3 : 1
  })
  const limb = (r: any, x: number, y: number, rad: number, len: number, mat: THREE.Material) => (
    <group ref={r} position={[x, y, 0]}><mesh castShadow position={[0, -len / 2, 0]} material={mat}><cylinderGeometry args={[rad, rad, len, 8]} /></mesh></group>)
  return (
    <group ref={root}>
      <mesh ref={torso} castShadow position={[0, 1.25, 0]} material={m.shirt}><cylinderGeometry args={[0.34, 0.3, 0.9, 12]} /></mesh>
      <mesh ref={head} castShadow position={[0, 2, 0]} material={m.skin}><sphereGeometry args={[0.3, 16, 14]} /></mesh>
      <mesh position={[0, 2.07, -0.04]} material={m.hair}><sphereGeometry args={[0.32, 12, 10]} /></mesh>
      {[-0.11, 0.11].map((x) => <mesh key={x} position={[x, 2.04, 0.27]} material={m.eye}><sphereGeometry args={[0.04, 8, 8]} /></mesh>)}
      <mesh ref={mouth} position={[0, 1.9, 0.29]} material={m.mouth}><boxGeometry args={[0.14, 0.05, 0.03]} /></mesh>
      {limb(aL, -0.46, 1.62, 0.09, 0.75, m.skin)}{limb(aR, 0.46, 1.62, 0.09, 0.75, m.skin)}
      {limb(lL, -0.17, 0.8, 0.12, 0.8, m.pants)}{limb(lR, 0.17, 0.8, 0.12, 0.8, m.pants)}
    </group>)
}
