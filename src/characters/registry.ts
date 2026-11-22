import type * as THREE from 'three'
import type { CharId } from '../store'
export const registry: Record<CharId, THREE.Group | null> = { kalai: null, nova: null, byte: null }
