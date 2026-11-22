import { useEffect, useState } from 'react'
const cache = new Map<string, Promise<boolean>>()
/** Vite serves index.html for missing files (200 + text/html), so check the content type too. */
export function useAssetExists(url: string) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    let on = true
    if (!cache.has(url)) cache.set(url, fetch(url, { method: 'HEAD' }).then((r) => r.ok && !(r.headers.get('content-type') || '').includes('text/html')).catch(() => false))
    cache.get(url)!.then((v) => on && setOk(v))
    return () => { on = false }
  }, [url])
  return ok
}
