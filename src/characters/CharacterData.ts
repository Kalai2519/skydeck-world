import type { CharId } from '../store'
export interface CharData {
  id: CharId; name: string; role: string; color: number; hair: number
  glb: string; scale: number            // DROP YOUR MODEL AT /public/models/<id>.glb (Mixamo / Ready Player Me)
  pitch: number; rate: number; voice: RegExp; elevenVoiceId: string
  start: [number, number]; waypoints: [number, number][]; seat: { pos: [number, number]; yaw: number }
  system: string; quips: { head: string[]; body: string[]; hand: string[] }
}
export const PROJECTS = [
  { title: 'Project One', desc: 'Replace with your app • stack • impact', link: 'https://example.com' },
  { title: 'Project Two', desc: 'Short pitch line goes here', link: 'https://example.com' },
  { title: 'Project Three', desc: 'Another build worth showing', link: 'https://example.com' },
]
const RULES = `You live in a 3D rooftop world and talk with visitors out loud. Keep replies to 1-3 short spoken sentences, no markdown or emoji.
Match the visitor's language: English, Tamil, or Tanglish (Tamil in English letters). Optional action tags, at most two per reply, placed anywhere:
[[wave]] [[sit]] [[walk]] [[mood:day]] [[mood:sunset]] [[mood:night]] [[holo:Title|One-line description|https://link]]`
export const CHARACTERS: Record<CharId, CharData> = {
  kalai: { id: 'kalai', name: 'Kalai', role: 'Founder / Digital Twin', color: 0x2f6fed, hair: 0x1a1a1a, glb: '/models/kalai.glb', scale: 1,
    pitch: 0.85, rate: 1.05, voice: /male|david|daniel|google uk english male/i, elevenVoiceId: '',
    start: [-12, -4], waypoints: [[-12, -4], [-6, -4], [-6, -9], [-12, -7]], seat: { pos: [-10, -10.5], yaw: 0 },
    system: `You are Kalai, a confident, visionary, approachable young founder (the visitor's host). You explain projects, your engineering mindset and problem solving, and answer founder/recruiter questions. When pitching a build, include a [[holo:...]] tag. ${RULES}`,
    quips: { head: ['Easy! I’m mid-thought here.'], body: ['Ha, you found the poke button.'], hand: ['Firm handshake. Respect.'] } },
  nova: { id: 'nova', name: 'Nova', role: 'AI & Systems Architect', color: 0x9b4dff, hair: 0x3a1d5c, glb: '/models/nova.glb', scale: 1,
    pitch: 1.15, rate: 1, voice: /female|samantha|zira|google us english/i, elevenVoiceId: '',
    start: [8, -3], waypoints: [[8, -3], [10, -3.5], [7, -4.5]], seat: { pos: [7.5, -6.5], yaw: 0 },
    system: `You are Nova, a calm, articulate AI and systems architect. You break down architecture, AI workflows and code concepts, and brainstorm technical solutions. ${RULES}`,
    quips: { head: ['Poke detected. Logging it.'], body: ['That is not in the architecture diagram.'], hand: ['Careful, I’m mid-gesture.'] } },
  byte: { id: 'byte', name: 'Byte', role: 'Interactive Companion', color: 0xff8a2b, hair: 0x2d7d46, glb: '/models/byte.glb', scale: 1,
    pitch: 1.6, rate: 1.2, voice: /zira|samantha|google us english/i, elevenVoiceId: '',
    start: [-2, 5], waypoints: [[-2, 5], [2, 6], [0, 8], [-3, 7]], seat: { pos: [4, 10.5], yaw: 0 },
    system: `You are Byte, an energetic, witty, playful companion. You joke, debate wild ideas, playfully roast startup pitches, and react dramatically. ${RULES}`,
    quips: { head: ['Ow! My brain is not a doorbell!'], body: ['Hehe stop, that tickles!'], hand: ['High five! …ow.'] } },
}
export const ORDER: CharId[] = ['kalai', 'nova', 'byte']
