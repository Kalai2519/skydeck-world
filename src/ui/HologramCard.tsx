import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store'
import { registry } from '../characters/registry'
/** 3D glass panel floating beside the active character. Triggered by [[holo:...]] tags or the Showcase button. */
export function HologramCard() {
  const holo = useStore((s) => s.holo), ref = useRef<THREE.Group>(null!)
  useEffect(() => { if (!holo) return; const t = setTimeout(() => useStore.getState().patch({ holo: null }), 14000); return () => clearTimeout(t) }, [holo])
  useFrame(({ clock, size }) => {
    const g = registry[useStore.getState().active]; if (!g || !ref.current) return
    ref.current.position.set(g.position.x + (size.width < size.height ? 0.2 : 2.3), 2.6 + Math.sin(clock.elapsedTime * 2) * 0.05, g.position.z + 0.3)
  })
  return (
    <group ref={ref}>
      {holo && (
        <Html transform sprite distanceFactor={3.2}>
          <div className="w-64 rounded-2xl border border-cyan-300/60 bg-cyan-900/40 p-4 text-white shadow-[0_0_30px_#22d3ee66] backdrop-blur-md">
            <div className="text-[10px] tracking-widest text-cyan-200">◈ HOLOGRAM</div>
            <div className="mt-1 text-lg font-bold">{holo.title}</div>
            <div className="mt-1 text-sm text-white/90">{holo.desc}</div>
            <div className="mt-3 flex gap-2">
              {holo.link && <a href={holo.link} target="_blank" rel="noreferrer" className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-semibold text-black">Open</a>}
              <button onClick={() => useStore.getState().patch({ holo: null })} className="rounded-full border border-white/40 px-3 py-1 text-xs">Close</button>
            </div>
          </div>
        </Html>)}
    </group>)
}
