import type { CharId, Msg } from '../store'
import { PROJECTS } from '../characters/CharacterData'

export const hasGemini = true

/** Requests a text reply from the server-side Gemini proxy. */
export async function* streamReply(system: string, history: Msg[]): AsyncGenerator<string> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemini-2.5-flash',
      systemInstruction: { parts: [{ text: system }] },
      contents: history.map((message) => ({
        role: message.role,
        parts: [{ text: message.text }],
      })),
      generationConfig: { temperature: 0.9, maxOutputTokens: 400 },
    }),
  })

  if (!res.ok) throw new Error('Gemini ' + res.status)

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('')
  if (text) yield text
}

export const detectLang = (s: string) => /[\u0B80-\u0BFF]/.test(s) ? 'ta' : /\b(enna|epdi|bro|machan|da|nanba|sema|vanakkam|illa|venum|pannu|sollu)\b/i.test(s) ? 'tg' : 'en'
const L: Record<CharId, { greet: Record<string, string>; def: Record<string, string>; who: string; roast: string }> = {
  kalai: { greet: { en: 'Hey, I’m Kalai. Ask me about my work.', tg: 'Hey bro, naan Kalai. Enna build pannanum?', ta: 'வணக்கம்! நான் கலை. என் படைப்புகளை கேளுங்கள்.' }, def: { en: 'Good question. Tell me more and I’ll dig in.', tg: 'Nalla question bro, konjam detail-a sollunga.', ta: 'நல்ல கேள்வி. இன்னும் விவரம் சொல்லுங்கள்.' }, who: 'I built this world, code and characters included.', roast: 'Bold idea. Who is the first paying customer?' },
  nova: { greet: { en: 'Hello, I’m Nova. I break systems down until they’re simple.', tg: 'Hi, naan Nova. Architecture pathi kelunga.', ta: 'வணக்கம், நான் நோவா. கட்டமைப்பை விளக்குவேன்.' }, def: { en: 'Let’s sketch that as inputs, a model, and outputs.', tg: 'Idha inputs, model, outputs nu pirichu paapom.', ta: 'இதை உள்ளீடு, மாதிரி, வெளியீடு என பிரிப்போம்.' }, who: 'Kalai designed the system; I keep the architecture honest.', roast: 'Interesting. Where does the data come from, and who owns it?' },
  byte: { greet: { en: 'YO! I’m Byte! Poke me. Seriously!', tg: 'Machan! Naan Byte! Ennai poke pannu da!', ta: 'ஹே! நான் பைட்! என்னை தொடு!' }, def: { en: 'Ha! No idea, but I’ll say it confidently.', tg: 'Sema da! Theriyala, aana confident-a solluven.', ta: 'ஹா! தெரியாது, ஆனால் தைரியமாக சொல்வேன்!' }, who: 'A very smart human built me. I did the dramatic parts.', roast: 'A subscription for socks? Okay, I’d actually buy that.' },
}
/** Offline fallback so the world works without an API key. Returns text with action tags. */
export function localReply(id: CharId, t: string) {
  const l = detectLang(t), R = L[id], p = PROJECTS[Math.floor(Math.random() * PROJECTS.length)]
  if (/night|dark|இரவு/i.test(t)) return '[[mood:night]] Night mode on. Lights up!'
  if (/sunset|golden/i.test(t)) return '[[mood:sunset]] Golden hour. Perfect.'
  if (/\bday\b|bright|daylight/i.test(t)) return '[[mood:day]] Crisp daylight, back on.'
  if (/who built|who made/i.test(t)) return R.who
  if (/project|pitch|showcase|demo/i.test(t)) return `[[holo:${p.title}|${p.desc}|${p.link}]] Here is one worth seeing: ${p.title}.`
  if (/roast|startup|idea/i.test(t)) return R.roast
  if (/\b(hi|hello|hey|vanakkam)\b|வணக்கம்/i.test(t)) return '[[wave]] ' + R.greet[l]
  return R.def[l]
}
