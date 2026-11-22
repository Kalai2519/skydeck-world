import { useEffect, useRef, useState } from 'react'
import { CHARACTERS } from '../characters/CharacterData'
import { Mood, useStore } from '../store'
import { converse, showcase } from '../ai/converse'
import { voice } from '../ai/VoiceService'
import { CharacterDock } from './CharacterDock'
const CHIPS = ['Who built this world?', 'Pitch me your best project', 'Roast my startup idea', 'Switch to night mode']
export function HUD() {
  const S = useStore(), [text, setText] = useState(''), t0 = useRef(0)
  const any = Object.values(S.speaking).some(Boolean) || S.busy
  useEffect(() => { if (any || !S.caption) return; const t = setTimeout(() => useStore.getState().patch({ caption: '' }), 3500); return () => clearTimeout(t) }, [any, S.caption])
  const send = (t: string) => { if (t.trim()) converse(useStore.getState().active, t) }
  const btn = 'rounded-full px-3 py-1.5 text-sm'
  return (
    <div className="pointer-events-none fixed inset-0 select-none" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="pointer-events-auto absolute left-0 right-0 top-0 flex flex-wrap items-center justify-between gap-2 p-3">
        <div className="glass rounded-full px-4 py-2 font-bold">◐ SKYDECK</div>
        <div className="glass flex gap-1 rounded-full p-1">
          {(['day', 'sunset', 'night'] as Mood[]).map((m) => <button key={m} onClick={() => S.patch({ mood: m })} className={`${btn} capitalize ${S.mood === m ? 'bg-white/30' : ''}`}>{m}</button>)}
        </div>
        <div className="glass flex gap-1 rounded-full p-1">
          <button className={btn} onClick={() => { S.patch({ muted: !S.muted }); if (!S.muted) voice.stop() }}>{S.muted ? '🔇' : '🔊'}</button>
          <button className={btn} onClick={() => S.patch({ briefOpen: true })}>Quick Pitch Brief</button>
        </div>
      </div>
      {S.caption && S.captionBy && (
        <div className="glass pointer-events-none absolute bottom-40 left-1/2 max-w-[92vw] -translate-x-1/2 rounded-2xl px-5 py-2.5 text-center text-[15px] md:max-w-2xl">
          <b>{CHARACTERS[S.captionBy].name}:</b> {S.caption.slice(-220)}
        </div>)}
      <div className="pointer-events-auto absolute bottom-[104px] left-0 right-0 flex justify-center gap-2 overflow-x-auto px-3">
        {CHIPS.map((c) => <button key={c} onClick={() => send(c)} className="glass whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px]">{c}</button>)}
      </div>
      <div className="glass pointer-events-auto absolute bottom-3 left-1/2 flex max-w-[96vw] -translate-x-1/2 flex-wrap items-center justify-center gap-2.5 rounded-3xl px-3 py-2" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
        <CharacterDock />
        <button title="Hold to talk, or tap to toggle" onPointerDown={() => { t0.current = performance.now(); S.listening ? voice.stopListening() : voice.listen(send) }}
          onPointerUp={() => { if (performance.now() - t0.current > 450) voice.stopListening() }}
          className={`h-14 w-14 rounded-full text-xl ${S.listening ? 'animate-pulse bg-rose-500 shadow-[0_0_0_8px_#f43f5e55]' : 'bg-blue-500'}`}>🎤</button>
        <button title="Hands-free" onClick={() => { const on = !S.handsFree; S.patch({ handsFree: on }); on ? voice.listen(send) : voice.stopListening() }} className={`glass ${btn} ${S.handsFree ? 'bg-white/30' : ''}`}>∞</button>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { send(text); setText('') } }} placeholder="Say something…"
          className="w-[min(240px,40vw)] rounded-full border border-white/30 bg-black/25 px-4 py-2.5 text-white placeholder-white/60 outline-none" />
        <div className="flex gap-1">
          <button className={`glass ${btn}`} onClick={() => S.bump('wave', S.active)}>👋 Wave</button>
          <button className={`glass ${btn}`} onClick={() => S.toggleSit(S.active)}>🪑 Sit/Walk</button>
          <button className={`glass ${btn}`} onClick={() => showcase(S.active)}>✨ Showcase</button>
        </div>
      </div>
      {S.briefOpen && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/55" onClick={() => S.patch({ briefOpen: false })}>
          <div className="m-4 max-w-md rounded-2xl border border-white/30 bg-[#141b34] p-6 leading-relaxed" onClick={(e) => e.stopPropagation()}>
            <b>Quick Pitch Brief</b>
            <p className="mt-2">Edit this text in HUD.tsx: who you are, what you build, and how to reach you.</p>
            <button className="glass mt-3 rounded-full px-5 py-2" onClick={() => S.patch({ briefOpen: false })}>Close</button>
          </div>
        </div>)}
    </div>)
}
