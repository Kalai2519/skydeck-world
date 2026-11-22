import { CHARACTERS, CharData } from '../characters/CharacterData'
import { lipsync } from '../characters/LipSyncEngine'
import { CharId, useStore } from '../store'
const EL_KEY = import.meta.env.VITE_ELEVENLABS_KEY as string | undefined
class VoiceService {
  private pending: Record<CharId, number> = { kalai: 0, nova: 0, byte: 0 }
  private rec: any = null; private ctx: AudioContext | null = null; private chain: Promise<void> = Promise.resolve(); private src: AudioBufferSourceNode | null = null
  sttLang = 'en-IN'   // en-IN copes well with Tanglish; set 'ta-IN' for Tamil script

  speak(id: CharId, text: string) {
    text = text.trim(); if (!text) return
    const S = useStore.getState(), d = CHARACTERS[id]
    this.pending[id]++; S.setSpeaking(id, true)
    const done = () => { if (--this.pending[id] <= 0) { this.pending[id] = 0; useStore.getState().setSpeaking(id, false); lipsync.setAnalyser(null) } }
    if (S.muted || !('speechSynthesis' in window)) { setTimeout(done, Math.max(1200, text.length * 55)); return }
    if (EL_KEY && d.elevenVoiceId) { this.chain = this.chain.then(() => this.eleven(d, text)).catch(() => {}).then(done); return }
    const u = new SpeechSynthesisUtterance(text); u.pitch = d.pitch; u.rate = d.rate
    const ta = /[\u0B80-\u0BFF]/.test(text); if (ta) u.lang = 'ta-IN'
    const v = speechSynthesis.getVoices().find((v) => (ta ? v.lang.startsWith('ta') : d.voice.test(v.name))); if (v) u.voice = v
    u.onboundary = () => lipsync.pulse(1); u.onend = u.onerror = done
    speechSynthesis.speak(u)
  }
  private async eleven(d: CharData, text: string) {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${d.elevenVoiceId}`, { method: 'POST', headers: { 'xi-api-key': EL_KEY!, 'Content-Type': 'application/json' }, body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }) })
    if (!r.ok) throw new Error('ElevenLabs ' + r.status)
    const ctx = (this.ctx ||= new AudioContext()), buf = await ctx.decodeAudioData(await r.arrayBuffer())
    const an = ctx.createAnalyser(); an.fftSize = 512; const src = ctx.createBufferSource(); src.buffer = buf; src.connect(an); an.connect(ctx.destination)
    lipsync.setAnalyser(an); this.src = src
    await new Promise<void>((res) => { src.onended = () => res(); src.start() })
  }
  stop() {
    if ('speechSynthesis' in window) speechSynthesis.cancel()
    try { this.src?.stop() } catch {}
    this.pending = { kalai: 0, nova: 0, byte: 0 }; this.chain = Promise.resolve()
    const S = useStore.getState(); (['kalai', 'nova', 'byte'] as CharId[]).forEach((i) => S.setSpeaking(i, false))
  }
  listen(cb: (t: string) => void) {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!SR) return false
    this.stopListening(); const r = new SR(), P = useStore.getState().patch
    r.lang = this.sttLang; r.continuous = useStore.getState().handsFree; r.interimResults = false
    r.onresult = (e: any) => { if (Object.values(useStore.getState().speaking).some(Boolean)) return; cb(e.results[e.results.length - 1][0].transcript) }
    r.onend = () => {
      if (this.rec !== r) return
      const s = useStore.getState()
      if (s.handsFree && s.listening) { try { r.start() } catch {} } else { this.rec = null; P({ listening: false }) }
    }
    this.rec = r; P({ listening: true }); r.start(); return true
  }
  stopListening() { const r = this.rec; this.rec = null; useStore.getState().patch({ listening: false }); try { r?.stop() } catch {} }
}
export const voice = new VoiceService()
