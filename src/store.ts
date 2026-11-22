import { create } from 'zustand'
export type CharId = 'kalai' | 'nova' | 'byte'
export type Mood = 'day' | 'sunset' | 'night'
export interface Holo { title: string; desc: string; link?: string }
export interface Msg { role: 'user' | 'model'; text: string }
interface State {
  active: CharId; mood: Mood; muted: boolean; listening: boolean; handsFree: boolean; briefOpen: boolean; busy: boolean
  caption: string; captionBy: CharId | null; holo: Holo | null
  speaking: Record<CharId, boolean>; engagedUntil: Record<CharId, number>; sit: Record<CharId, boolean>
  wave: Record<CharId, number>; poke: Record<CharId, number>; history: Record<CharId, Msg[]>
  patch: (p: Partial<State>) => void
  bump: (k: 'wave' | 'poke', id: CharId) => void
  toggleSit: (id: CharId) => void
  setSpeaking: (id: CharId, v: boolean) => void
  push: (id: CharId, m: Msg) => void
}
const r = <T>(f: () => T) => ({ kalai: f(), nova: f(), byte: f() })
export const useStore = create<State>((set) => ({
  active: 'kalai', mood: 'day', muted: false, listening: false, handsFree: false, briefOpen: false, busy: false,
  caption: '', captionBy: null, holo: null,
  speaking: r(() => false), engagedUntil: r(() => 0), sit: r(() => false), wave: r(() => 0), poke: r(() => 0), history: r<Msg[]>(() => []),
  patch: (p) => set(p),
  bump: (k, id) => set((s) => ({ [k]: { ...s[k], [id]: s[k][id] + 1 } } as any)),
  toggleSit: (id) => set((s) => ({ sit: { ...s.sit, [id]: !s.sit[id] } })),
  setSpeaking: (id, v) => set((s) => ({ speaking: { ...s.speaking, [id]: v } })),
  push: (id, m) => set((s) => ({ history: { ...s.history, [id]: [...s.history[id], m].slice(-20) } })),
}))
