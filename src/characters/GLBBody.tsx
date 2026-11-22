import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import type { CharData } from './CharacterData'
import type { AnimationStateMachine, AnimState } from './AnimationStateMachine'
import { lipsync } from './LipSyncEngine'
import { useStore } from '../store'
// Expects clips named: Idle, Walk, Sit_Down, Sitting_Idle, Talking_Gesture, Wave, Poke_Reaction (see AnimationStateMachine).
// Lip-sync needs morph targets named like Oculus visemes (viseme_aa...) or ARKit (jawOpen). Ready Player Me exports both.
export function GLBBody({ data, fsm }: { data: CharData; fsm: AnimationStateMachine }) {
  const { scene, animations } = useGLTF(data.glb)
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const ref = useRef<THREE.Group>(null!)
  const { actions } = useAnimations(animations, ref)
  const prev = useRef<AnimState | null>(null)
  const morphs = useMemo(() => { const a: THREE.Mesh[] = []; clone.traverse((o: any) => { o.castShadow = true; if (o.morphTargetDictionary) a.push(o) }); return a }, [clone])
  useEffect(() => { prev.current = null }, [actions])
  useFrame(() => {
    const s = fsm.state
    if (prev.current !== s) {
      const next = actions[s] ?? actions[s.toLowerCase()] ?? actions['Idle']
      if (prev.current) (actions[prev.current] ?? actions['Idle'])?.fadeOut(0.25)
      if (next) {
        next.reset().fadeIn(0.25)
        const once = s === 'Wave' || s === 'Poke_Reaction' || s === 'Sit_Down'
        next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); next.clampWhenFinished = once; next.play()
      }
      prev.current = s
    }
    if (useStore.getState().speaking[data.id]) {
      const w = lipsync.weights()
      for (const m of morphs) for (const k in w) { const i = (m as any).morphTargetDictionary[k]; if (i !== undefined) (m as any).morphTargetInfluences[i] = w[k] }
    }
  })
  return <group ref={ref} scale={data.scale}><primitive object={clone} /></group>
}
