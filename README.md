# Skydeck – Interactive 3D AI World

React + Vite + TypeScript + Tailwind, `@react-three/fiber` / `drei` / `postprocessing`, Gemini streaming, Web Speech (or ElevenLabs).

## Run
```bash
npm install
npm run dev
```
Open `http://localhost:5173/` for Skydeck. Start `server.js` on port 3000 and set `GEMINI_API_KEY` server-side so Gemini requests stay out of browser code.

## Aetheria 3D demo
The standalone Aetheria companion is served by the Node.js backend at `http://localhost:3000/aetheria.html`.

1. Set `GEMINI_API_KEY` to your Google AI Studio key and `PORT=3000` in `.env` (create it from `.env.example` only if it doesn't exist). `.env` is ignored by Git; restart the server after changing it.
2. Run `npm install`, then `npm run start:aetheria` and open `http://localhost:3000/aetheria.html`. Microphone access requires `localhost` or HTTPS.
3. Generate and download a `.glb` model from [Meshy.ai](https://www.meshy.ai/), then drag it onto the Aetheria page to load it into the 3D stage. The page also supports `.gltf` uploads.

Both the React app and Aetheria page send prompts to the local `/api/gemini` endpoint. Vite proxies `/api` to port 3000 during development, and the key stays in the server's outbound request.

## Drop in real assets (no code changes needed)
| File | What |
|---|---|
| `public/models/kalai.glb`, `nova.glb`, `byte.glb` | Rigged humanoids. Auto-detected; procedural fallback is used until they exist. |
| `public/models/map.glb` | Outdoor map. Replaces the procedural terrace. Waypoints/seats live in `CharacterData.ts` (match them to your map). |
| `public/hdri/*.hdr` | Optional: swap the `<Environment preset>` in `Lighting.tsx` for `files="/hdri/x.hdr"` (Poly Haven). |

**Animations (Mixamo):** download each clip *with skin* for one character (or "without skin" and merge in Blender), convert FBX → GLB, and name the clips exactly: `Idle, Walk, Sit_Down, Sitting_Idle, Talking_Gesture, Wave, Poke_Reaction` (or edit `AnimationStateMachine.ts`). Tune `scale` per character in `CharacterData.ts`.
**Lip-sync:** needs morph targets named like Oculus visemes (`viseme_aa`, `viseme_O`…) or ARKit `jawOpen`. Ready Player Me avatars export these (request `morphTargets=ARKit,Oculus Visemes`). Mixamo models have none, so use RPM or add shape keys in Blender.
**ElevenLabs:** set `VITE_ELEVENLABS_KEY` and each character's `elevenVoiceId`; the audio's amplitude then drives the mouth.

## Map of the code
- `src/scene`: World (Canvas, post-FX), Environment, Lighting (Day/Sunset/Night), CameraRig
- `src/characters`: CharacterController (waypoints, sitting, poke), AnimationStateMachine, LipSyncEngine, ProceduralBody, GLBBody, CharacterData
- `src/ai`: GeminiService (streaming + offline fallback), VoiceService (STT/TTS/ElevenLabs), ActionParser, converse
- `src/ui`: HUD, CharacterDock, HologramCard

## Action tags (Gemini can emit these in its replies)
`[[wave]] [[sit]] [[walk]] [[mood:night]] [[holo:Title|Description|https://link]]`

## Performance notes
Shadows are 1024² on one light, materials are memoized, MSAA is off with Bloom/Vignette on, DepthOfField is desktop-only, DPR is capped at 2. Keep GLBs small (Draco/meshopt, textures ≤1024).
