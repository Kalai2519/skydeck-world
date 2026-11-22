import { useStore, CharId, Mood } from '../store'
export const TAG = /\[\[(.+?)\]\]/g
/** Text without action tags (and without a half-streamed "[[..." tail). */
export const visible = (raw: string) => raw.replace(TAG, '').replace(/\[\[[^\]]*$/, '').replace(/^\s+/, '').replace(/ {2,}/g, ' ')
export function applyAction(id: CharId, body: string) {
  const S = useStore.getState(), [k, ...rest] = body.split(':'), arg = rest.join(':')
  if (k === 'wave') S.bump('wave', id)
  else if (k === 'sit') S.patch({ sit: { ...S.sit, [id]: true } })
  else if (k === 'walk') S.patch({ sit: { ...S.sit, [id]: false } })
  else if (k === 'mood' && ['day', 'sunset', 'night'].includes(arg)) S.patch({ mood: arg as Mood })
  else if (k === 'holo') { const [title, desc, link] = arg.split('|'); S.patch({ holo: { title, desc: desc || '', link } }) }
}
