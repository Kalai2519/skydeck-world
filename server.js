import dotenv from 'dotenv'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const directory = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(directory, '.env') })

const app = express()
const port = Number(process.env.PORT || 3000)
const apiKey = process.env.GEMINI_API_KEY?.trim()
const model = 'gemini-3.8-flash'

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.')
}

app.disable('x-powered-by')
app.use(express.json({ limit: '2mb' }))
app.use(express.static(path.join(directory, 'public')))
app.use(express.static(path.join(directory, 'dist')))

app.post('/api/gemini', async (req, res) => {
  if (!apiKey) {
    return res.status(503).json({ error: 'Server is missing GEMINI_API_KEY in .env.' })
  }

  const body = req.body
  const { contents, systemInstruction, generationConfig, model: requestedModel } = body || {}
  const validContents =
    Array.isArray(contents) &&
    contents.length > 0 &&
    contents.length <= 20 &&
    contents.every(
      (item) =>
        item &&
        (item.role === 'user' || item.role === 'model') &&
        Array.isArray(item.parts) &&
        item.parts.length > 0 &&
        item.parts.length <= 20 &&
        item.parts.every((part) => part && typeof part.text === 'string'),
    )
  const validSystemInstruction =
    systemInstruction &&
    Array.isArray(systemInstruction.parts) &&
    systemInstruction.parts.length > 0 &&
    systemInstruction.parts.length <= 10 &&
    systemInstruction.parts.every((part) => part && typeof part.text === 'string')

  if (!validContents || !validSystemInstruction) {
    return res.status(400).json({ error: 'Invalid Gemini request contents or system instruction.' })
  }
  if (requestedModel && requestedModel !== model) {
    return res.status(400).json({ error: `Only the ${model} model is enabled.` })
  }

  const inputSize =
    contents.flatMap((item) => item.parts).reduce((total, part) => total + part.text.length, 0) +
    systemInstruction.parts.reduce((total, part) => total + part.text.length, 0)
  if (inputSize > 50000) {
    return res.status(413).json({ error: 'Gemini prompt is too large.' })
  }

  const requestedTemperature = generationConfig?.temperature
  const temperature =
    typeof requestedTemperature === 'number' &&
    Number.isFinite(requestedTemperature) &&
    requestedTemperature >= 0 &&
    requestedTemperature <= 1
      ? requestedTemperature
      : 0.7
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
  )
  url.searchParams.set('key', apiKey)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: contents.map((item) => ({
          role: item.role,
          parts: item.parts.map((part) => ({ text: part.text })),
        })),
        systemInstruction: {
          parts: systemInstruction.parts.map((part) => ({ text: part.text })),
        },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature,
          maxOutputTokens: 512,
        },
      }),
    })

    let data
    try {
      data = await upstream.json()
    } catch {
      return res.status(502).json({ error: 'Gemini returned an invalid response.' })
    }

    return res.status(upstream.status).json(data)
  } catch (error) {
    if (controller.signal.aborted) {
      return res.status(504).json({ error: 'Gemini request timed out.' })
    }
    console.error('Gemini upstream request failed:', error instanceof Error ? error.name : 'UnknownError')
    return res.status(502).json({ error: 'Failed to reach Gemini API.' })
  } finally {
    clearTimeout(timeout)
  }
})

// Fallback for React client-side routing.
app.use((req, res, next) => {
  if (req.method !== 'GET') return next()
  res.sendFile(path.join(directory, 'dist', 'index.html'), (error) => {
    if (error) next(error)
  })
})

app.use((error, _req, res, _next) => {
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON.' })
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large.' })
  }
  console.error('Unhandled Aetheria server error:', error instanceof Error ? error.name : 'UnknownError')
  return res.status(500).json({ error: 'Internal server error.' })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Aetheria server running at http://0.0.0.0:${port}`)
})
