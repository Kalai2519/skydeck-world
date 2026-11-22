import { useStore, CharId } from '../store'
import { CHARACTERS, PROJECTS } from '../characters/CharacterData'
import { hasGemini, streamReply, localReply } from './GeminiService'
import { TAG, applyAction, visible } from './ActionParser'
import { voice } from './VoiceService'
let n = 0
async function* fake(t: string) { for (const w of t.split(/(?<=\s)/)) { yield w; await new Promise((r) => setTimeout(r, 35)) } }

/** One conversational turn: stream reply -> captions + sentence-by-sentence TTS + action tags. */
export async function converse(id: CharId, text: string) {
  text = text.trim(); if (!text) return
  const S = useStore.getState(), d = CHARACTERS[id]; voice.stop()
  S.push(id, { role: 'user', text }); S.patch({ busy: true, active: id, captionBy: id, caption: '…', engagedUntil: { ...S.engagedUntil, [id]: performance.now() + 12000 } })
  let buf = '', applied = 0, spoken = 0
  const flush = (final: boolean) => {
    for (const m of buf.matchAll(TAG)) { const end = m.index! + m[0].length; if (end > applied) { applied = end; applyAction(id, m[1]) } }
    const clean = visible(buf); useStore.getState().patch({ caption: clean || '…' })
    for (;;) {
      const m = clean.slice(spoken).match(/^[\s\S]*?[.!?।…]+(?=\s|$)/); if (!m) break
      spoken += m[0].length; voice.speak(id, m[0])
    }
    if (final && clean.slice(spoken).trim()) { voice.speak(id, clean.slice(spoken)); spoken = clean.length }
  }
  const run = async (src: AsyncGenerator<string>) => { for await (const c of src) { buf += c; flush(false) } }
  try {
    if (hasGemini) await run(streamReply(d.system, useStore.getState().history[id]))
    else await run(fake(localReply(id, text)))
  } catch (e) { if (!buf) { buf = localReply(id, text) } }
  flush(true)
  const s2 = useStore.getState(); s2.push(id, { role: 'model', text: buf }); s2.patch({ busy: false })
  if (id === 'kalai' && s2.history.kalai.length >= 8 && !s2.sit.kalai) s2.patch({ sit: { ...s2.sit, kalai: true } })   // extended chat: sit on the bench
}
export function showcase(id: CharId) {
  const p = PROJECTS[n++ % PROJECTS.length]; useStore.getState().patch({ holo: p, captionBy: id, caption: `Let me show you ${p.title}.` })
  voice.speak(id, `Let me show you ${p.title}. ${p.desc}`)
}
