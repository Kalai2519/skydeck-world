// Drives mouth/jaw. Uses a real AnalyserNode when audio is a stream (ElevenLabs/Gemini TTS),
// otherwise a synthetic envelope + word-boundary pulses (Web Speech gives no audio to analyse).
class LipSync {
  level = 0; speaking = false; analyser: AnalyserNode | null = null
  private data: Uint8Array<ArrayBuffer> | null = null; private t = 0; private pulseV = 0
  setAnalyser(a: AnalyserNode | null) { this.analyser = a; this.data = a ? new Uint8Array(new ArrayBuffer(a.fftSize)) : null }
  pulse(v = 1) { this.pulseV = Math.max(this.pulseV, v) }
  update(dt: number) {
    this.t += dt; let target = 0
    if (this.analyser && this.data) {
      this.analyser.getByteTimeDomainData(this.data); let s = 0
      for (const v of this.data) { const x = (v - 128) / 128; s += x * x }
      target = Math.min(1, Math.sqrt(s / this.data.length) * 4)
    } else if (this.speaking) target = Math.min(1, 0.2 + 0.35 * Math.abs(Math.sin(this.t * 14)) + 0.4 * this.pulseV)
    this.pulseV *= Math.exp(-dt * 8)
    this.level += (target - this.level) * (1 - Math.exp(-dt * 25))
    return this.level
  }
  /** Morph-target weights for Oculus visemes + ARKit jaw. Cycles vowels while talking. */
  weights(): Record<string, number> {
    const l = this.level, p = Math.floor(this.t * 9) % 4
    const w: Record<string, number> = { jawOpen: l * 0.8, mouthOpen: l * 0.8, viseme_aa: 0, viseme_O: 0, viseme_E: 0, viseme_I: 0 }
    w[['viseme_aa', 'viseme_O', 'viseme_E', 'viseme_I'][p]] = l
    return w
  }
}
export const lipsync = new LipSync()
