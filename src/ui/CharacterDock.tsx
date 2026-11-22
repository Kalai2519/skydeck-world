import { CHARACTERS, ORDER } from '../characters/CharacterData'
import { useStore } from '../store'
import { converse } from '../ai/converse'
export function CharacterDock() {
  const active = useStore((s) => s.active), speaking = useStore((s) => s.speaking)
  return (
    <div className="flex gap-2">
      {ORDER.map((id) => (
        <button key={id} title={CHARACTERS[id].name + ' · ' + CHARACTERS[id].role}
          onClick={() => { const S = useStore.getState(); S.patch({ active: id, engagedUntil: { ...S.engagedUntil, [id]: performance.now() + 6000 } }); S.bump('wave', id) }}
          className={`glass h-11 w-11 rounded-full font-bold ${active === id ? 'ring-2 ring-sky-300' : ''} ${speaking[id] ? 'animate-pulse' : ''}`}>
          {CHARACTERS[id].name[0]}
        </button>))}
    </div>)
}
