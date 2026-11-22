import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'
import { registry } from '../characters/registry'
/** Cinematic director: eased glide to a medium-close, rule-of-thirds framing of the active character. */
export function CameraRig() {
  const look = useRef(new THREE.Vector3(0, 1.5, 0)), tp = useRef(new THREE.Vector3()), tl = useRef(new THREE.Vector3())
  useFrame(({ camera, size, clock }, dt) => {
    const S = useStore.getState(), g = registry[S.active]; if (!g) return
    const narrow = size.width < size.height, off = narrow ? 0.5 : 1.1, p = g.position
    tp.current.set(p.x + off, S.sit[S.active] ? 1.8 : 2.1, p.z + (narrow ? 7 : 4.6))     // camera sits right of subject -> subject falls left of centre
    tl.current.set(p.x + off * 0.9, 1.5, p.z)
    const k = 1 - Math.exp(-dt * 2.2)
    camera.position.lerp(tp.current, k); look.current.lerp(tl.current, k)
    camera.position.x += Math.sin(clock.elapsedTime * 0.3) * 0.002
    camera.lookAt(look.current)
  })
  return null
}
