import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CharData, CHARACTERS } from './CharacterData'
import { AnimationStateMachine } from './AnimationStateMachine'
import { ProceduralBody } from './ProceduralBody'
import { GLBBody } from './GLBBody'
import { useAssetExists } from './useAssetExists'
import { registry } from './registry'
import { useStore } from '../store'
import { voice } from '../ai/VoiceService'

const lerpAngle = (a: number, b: number, t: number) => { const d = ((((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI; return a + d * t }

export function CharacterController({ data }: { data: CharData }) {
  const id = data.id, g = useRef<THREE.Group>(null!)
  const fsm = useMemo(() => new AnimationStateMachine(), [])
  const st = useRef({ wi: 0, wait: 1 + Math.random() * 3, yaw: 0, seated: false, lastWave: 0, lastPoke: 0 })
  const hasGLB = useAssetExists(data.glb)
  useEffect(() => { g.current.position.set(data.start[0], 0, data.start[1]); registry[id] = g.current; return () => { registry[id] = null } }, [])
  useFrame(({ camera }, dt) => {
    const S = useStore.getState(), s = st.current, pos = g.current.position
    fsm.update(dt)
    if (S.wave[id] !== s.lastWave) { s.lastWave = S.wave[id]; fsm.play('Wave') }
    if (S.poke[id] !== s.lastPoke) { s.lastPoke = S.poke[id]; fsm.play('Poke_Reaction') }
    const engaged = S.active === id && (S.engagedUntil[id] > performance.now() || S.speaking[id])
    const face = (x: number, z: number, k = 6) => { s.yaw = lerpAngle(s.yaw, Math.atan2(x - pos.x, z - pos.z), 1 - Math.exp(-dt * k)) }
    const moveTo = (x: number, z: number, sp = 1.5) => {
      const dx = x - pos.x, dz = z - pos.z, d = Math.hypot(dx, dz)
      if (d > 0.08) { const k = Math.min(1, (sp * dt) / d); pos.x += dx * k; pos.z += dz * k; face(x, z, 8); return false }
      return true
    }
    let moving = false
    if (S.sit[id]) {                                    // walk to bench/steps, sit with a lerped transition
      if (!s.seated) { if (!fsm.locked) { if (moveTo(...data.seat.pos)) { s.seated = true; fsm.seated = true; fsm.play('Sit_Down') } else moving = true } }
      else if (S.active === id) face(camera.position.x, camera.position.z, 3)   // seated: lean toward the camera
      else s.yaw = lerpAngle(s.yaw, data.seat.yaw, 1 - Math.exp(-dt * 3))
    } else {
      if (s.seated) { s.seated = false; fsm.seated = false }
      if (fsm.locked || engaged) { if (S.active === id) face(camera.position.x, camera.position.z, 5) }   // Active_Conversation
      else if (s.wait > 0) { s.wait -= dt; s.yaw = lerpAngle(s.yaw, Math.PI, 1 - Math.exp(-dt * 1.5)) }    // pause, look at skyline
      else {
        const w = data.waypoints[s.wi]
        if (moveTo(w[0], w[1])) { s.wi = (s.wi + 1) % data.waypoints.length; s.wait = 2 + Math.random() * 4 } else moving = true
      }
    }
    fsm.setBase(s.seated ? 'Sitting_Idle' : moving ? 'Walk' : S.speaking[id] ? 'Talking_Gesture' : 'Idle')
    g.current.rotation.y = s.yaw
  })
  const onPoke = (e: any) => {
    e.stopPropagation()
    const S = useStore.getState(), local = g.current.worldToLocal(e.point.clone())
    const part = local.y > 1.75 ? 'head' : Math.abs(local.x) > 0.38 ? 'hand' : 'body'
    const q = CHARACTERS[id].quips[part]
    S.patch({ active: id, engagedUntil: { ...S.engagedUntil, [id]: performance.now() + 6000 }, captionBy: id, caption: q[0] })
    S.bump('poke', id); voice.speak(id, q[Math.floor(Math.random() * q.length)])
  }
  return (
    <group ref={g} onPointerDown={onPoke} onPointerOver={() => (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
      <Suspense fallback={<ProceduralBody data={data} fsm={fsm} />}>
        {hasGLB ? <GLBBody data={data} fsm={fsm} /> : <ProceduralBody data={data} fsm={fsm} />}
      </Suspense>
    </group>)
}
