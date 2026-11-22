import React, { useEffect, useRef, useState } from 'react';

type Mood = 'day' | 'sunset' | 'night';
type CharacterId = 'kalai' | 'nova' | 'byte';

interface CharacterProfile {
  id: CharacterId;
  name: string;
  role: string;
  zone: string;
  accent: string;
  greeting: string;
  pokeQuips: string[];
  projectTitle: string;
  projectSummary: string;
}

const CHARACTERS: Record<CharacterId, CharacterProfile> = {
  kalai: {
    id: 'kalai',
    name: 'Kalai',
    role: 'Founder & Digital Twin',
    zone: 'Scenic Terrace Overlook',
    accent: '#f59e0b',
    greeting:
      'Welcome to the skydeck. Ask me about the engineering build, product vision, or how we wired multi-agent 3D worlds.',
    pokeQuips: [
      'Whoa—easy on the founder! Still shipping features in real time.',
      'Careful, poking the digital twin might trigger a live product pitch!',
    ],
    projectTitle: 'Skydeck Multi-Agent 3D Platform',
    projectSummary:
      'Combines real-time 3D spatial presence, character state machines, and structured AI actions for interactive pitches.',
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    role: 'AI & Systems Architect',
    zone: 'Glass Pavilion & Tech Kiosk',
    accent: '#38bdf8',
    greeting:
      'Systems nominal. We can break down state machines, lip-sync timing, camera framing, or conversational pipelines.',
    pokeQuips: [
      'Latency check passed—my reflex loop responded in under 16ms.',
      'Tapping the architect detected. Want to inspect the state graph next?',
    ],
    projectTitle: 'Event-Driven Agent & Lip-Sync Pipeline',
    projectSummary:
      'Coordinates streaming AI responses, action triggers, and speech amplitude/viseme animation without frame drops.',
  },
  byte: {
    id: 'byte',
    name: 'Byte',
    role: 'Interactive Companion',
    zone: 'Courtyard Plaza Steps',
    accent: '#a855f7',
    greeting:
      'Heyyy! Finally someone showed up! Poke me, pitch a wild idea, or flip the sky to night mode!',
    pokeQuips: [
      'BOING! Hey! My personal space bar has a cooldown, you know!',
      'Oof! That felt like a 404 error straight to my ribs!',
    ],
    projectTitle: 'Reactive Companion & Roast Engine',
    projectSummary:
      'High-energy character reactions, exaggerated motion states, and playful pitch critiques built for viral replayability.',
  },
};

const MOOD_THEMES: Record<
  Mood,
  {
    label: string;
    skyGradient: string;
    fogTint: string;
    deckTint: string;
    glowColor: string;
  }
> = {
  day: {
    label: 'Day',
    skyGradient: 'from-sky-300 via-cyan-100 to-amber-100',
    fogTint: 'rgba(224, 242, 254, 0.72)',
    deckTint: 'from-slate-200/90 via-stone-100/90 to-sky-100/90',
    glowColor: 'rgba(56, 189, 248, 0.28)',
  },
  sunset: {
    label: 'Sunset',
    skyGradient: 'from-indigo-950 via-rose-500 to-amber-300',
    fogTint: 'rgba(251, 146, 60, 0.35)',
    deckTint: 'from-amber-950/85 via-stone-900/90 to-rose-950/85',
    glowColor: 'rgba(251, 146, 60, 0.35)',
  },
  night: {
    label: 'Night',
    skyGradient: 'from-slate-950 via-indigo-950 to-cyan-950',
    fogTint: 'rgba(15, 23, 42, 0.65)',
    deckTint: 'from-slate-950/95 via-slate-900/95 to-indigo-950/95',
    glowColor: 'rgba(168, 85, 247, 0.32)',
  },
};

const STARTER_PROMPTS = [
  'Who built this world?',
  'Pitch me your best project',
  'Roast my startup idea',
  'Switch to night mode',
  'Vanakkam! Enna epadi irukka?',
  'Konnichiwa! Introduce yourself',
];

const LANGUAGE_OPTIONS = [
  { value: 'auto', label: 'Auto-Detect' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'tanglish', label: 'Tanglish' },
  { value: 'en-IN', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'ar-SA', label: 'Arabic' },
];

function detectSpeechLanguage(text: string) {
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN';
  if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
  if (/[\u3040-\u30FF]/.test(text)) return 'ja-JP';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko-KR';
  if (/[¿¡\u00F1]/.test(text)) return 'es-ES';
  if (/[\u0600-\u06FF]/.test(text)) return 'ar-SA';
  return 'en-IN';
}

export default function App() {
  const [activeId, setActiveId] = useState<CharacterId>('kalai');
  const [mood, setMood] = useState<Mood>('sunset');
  const [muted, setMuted] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [showHologram, setShowHologram] = useState(true);
  const [isSeated, setIsSeated] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pokeBounce, setPokeBounce] = useState(false);
  const [subtitle, setSubtitle] = useState(CHARACTERS.kalai.greeting);
  const [promptText, setPromptText] = useState('');
  const [listening, setListening] = useState(false);
  const [liveLoop, setLiveLoop] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState('auto');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [cameraShift, setCameraShift] = useState<'left' | 'center' | 'right'>('left');

  const recognitionRef = useRef<any>(null);
  const liveLoopRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const activeChar = CHARACTERS[activeId];
  const theme = MOOD_THEMES[mood];

  useEffect(() => {
    liveLoopRef.current = liveLoop;
  }, [liveLoop]);

  const startRecognition = () => {
    if (typeof window === 'undefined') return false;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speakText('Voice recognition is not supported in this browser—type a prompt below anytime!', 2600);
      return false;
    }
    if (recognitionRef.current) return true;

    const recognition = new SpeechRecognition();
    recognition.lang = speechLanguage === 'auto' || speechLanguage === 'tanglish' ? 'en-IN' : speechLanguage;
    recognition.continuous = liveLoopRef.current;
    recognition.interimResults = true;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      setInterimTranscript('');
      if (liveLoopRef.current && !isSpeakingRef.current) {
        window.setTimeout(() => startRecognition(), 350);
      }
    };
    recognition.onerror = (event: any) => {
      if (event?.error === 'no-speech' && liveLoopRef.current) return;
      setListening(false);
    };
    recognition.onresult = (event: any) => {
      let interim = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const phrase = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += phrase;
        else interim += phrase;
      }
      setInterimTranscript(interim || finalTranscript);
      if (finalTranscript.trim()) {
        setPromptText(finalTranscript.trim());
        setInterimTranscript('');
        if (recognition.continuous) recognition.stop();
        handleSendPrompt(finalTranscript.trim());
      }
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      return true;
    } catch {
      recognitionRef.current = null;
      setListening(false);
      return false;
    }
  };

  const speakText = (text: string, durationMs = 2600) => {
    setSubtitle(text);
    setIsSpeaking(true);
    isSpeakingRef.current = true;

    if (!muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = activeId === 'byte' ? 1.15 : 1.0;
      utterance.pitch = activeId === 'nova' ? 1.15 : activeId === 'byte' ? 1.25 : 0.95;
      utterance.lang = speechLanguage === 'auto'
        ? detectSpeechLanguage(text)
        : (speechLanguage === 'tanglish' ? 'en-IN' : speechLanguage);
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith(utterance.lang.toLowerCase().slice(0, 2)));
      if (matchingVoice) utterance.voice = matchingVoice;
      utterance.onend = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
        if (liveLoopRef.current) window.setTimeout(() => startRecognition(), 350);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      };
      window.speechSynthesis.speak(utterance);
    }

    window.setTimeout(() => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }, durationMs);
  };

  useEffect(() => {
    setSubtitle(CHARACTERS[activeId].greeting);
    setCameraShift(activeId === 'kalai' ? 'left' : activeId === 'nova' ? 'center' : 'right');
  }, [activeId]);

  const handlePoke = () => {
    setPokeBounce(true);
    window.setTimeout(() => setPokeBounce(false), 450);
    const quips = activeChar.pokeQuips;
    const nextQuip = quips[Math.floor(Math.random() * quips.length)];
    speakText(nextQuip, 2400);
  };

  const handleSendPrompt = (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;
    setPromptText('');

    const lower = trimmed.toLowerCase();
    if (lower.includes('night')) {
      setMood('night');
      speakText('Shifting the rooftop plaza into Neon Twilight. Plaza lights are live.', 2600);
      return;
    }
    if (lower.includes('sunset') || lower.includes('golden')) {
      setMood('sunset');
      speakText('Dialing in Golden Hour across the skyline and glass terrace.', 2500);
      return;
    }
    if (lower.includes('day')) {
      setMood('day');
      speakText('Switching to Crisp Daylight for full architectural clarity.', 2400);
      return;
    }
    if (lower.includes('project') || lower.includes('pitch')) {
      setShowHologram(true);
      speakText(`${activeChar.projectTitle}: ${activeChar.projectSummary}`, 3600);
      return;
    }
    if (lower.includes('roast')) {
      speakText(
        'Bold move calling it a revolution before anyone clicks Save—let us sharpen the wedge and prove real user pull!',
        3400
      );
      return;
    }

    speakText(
      `${activeChar.name} here: "${trimmed}"—let us turn that into an interactive live demo right here on the deck.`,
      3200
    );
  };

  const toggleVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListening(false);
      setInterimTranscript('');
      return;
    }
    startRecognition();
  };

  const toggleLiveLoop = () => {
    setLiveLoop((current) => {
      const next = !current;
      liveLoopRef.current = next;
      if (next) {
        if (!recognitionRef.current && !isSpeakingRef.current) startRecognition();
        speakText('Hands-free live conversation enabled. Talk to me anytime.', 2200);
      } else {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
        setListening(false);
        setInterimTranscript('');
      }
      return next;
    });
  };

  const stageAlignmentClass =
    cameraShift === 'left'
      ? 'md:items-start md:pl-[18%]'
      : cameraShift === 'right'
        ? 'md:items-end md:pr-[18%]'
        : 'md:items-center';

  return (
    <div className="relative h-screen w-screen overflow-hidden select-none bg-slate-950 text-white font-sans">
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.skyGradient} transition-all duration-700`} />

      <div className="pointer-events-none absolute inset-x-0 bottom-[26%] flex items-end justify-around gap-2 px-6 opacity-35">
        <div className="h-28 w-14 rounded-t bg-slate-900" />
        <div className="h-44 w-20 rounded-t bg-slate-900" />
        <div className="h-36 w-16 rounded-t bg-slate-900" />
        <div className="h-52 w-24 rounded-t bg-slate-900" />
        <div className="h-32 w-16 rounded-t bg-slate-900" />
        <div className="h-48 w-20 rounded-t bg-slate-900" />
        <div className="h-24 w-14 rounded-t bg-slate-900" />
      </div>

      <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t ${theme.deckTint} border-t border-white/20 backdrop-blur-sm transition-all duration-700`} />

      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3 rounded-full border border-white/15 bg-slate-950/60 px-4 py-2 backdrop-blur-md">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: activeChar.accent }} />
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-white/90">Skydeck 3D World</span>
          <span className="hidden sm:inline text-xs text-white/50">• {activeChar.zone}</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={speechLanguage}
            onChange={(event) => setSpeechLanguage(event.target.value)}
            aria-label="Voice and reply language"
            className="rounded-full border border-white/15 bg-slate-950/70 px-3 py-2 text-xs font-medium text-white backdrop-blur-md outline-none"
          >
            {LANGUAGE_OPTIONS.map((language) => (
              <option key={language.value} value={language.value} className="bg-slate-950">
                {language.label}
              </option>
            ))}
          </select>

          <div className="flex items-center rounded-full border border-white/15 bg-slate-950/60 p-1 backdrop-blur-md">
            {(['day', 'sunset', 'night'] as Mood[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  mood === m ? 'bg-white text-slate-950 shadow' : 'text-white/75 hover:text-white'
                }`}
              >
                {MOOD_THEMES[m].label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMuted((prev) => !prev)}
            className="rounded-full border border-white/15 bg-slate-950/60 px-3.5 py-2 text-xs font-medium text-white/90 backdrop-blur-md transition hover:bg-slate-900"
          >
            {muted ? 'Muted' : 'Audio On'}
          </button>

          <button
            type="button"
            onClick={() => setShowBrief((prev) => !prev)}
            className="rounded-full border border-white/20 bg-white/15 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/25"
          >
            Quick Pitch Brief
          </button>
        </div>
      </header>

      {showBrief && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight">Quick Pitch Brief</h2>
              <button
                type="button"
                onClick={() => setShowBrief(false)}
                className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Switch between <strong>Kalai</strong>, <strong>Nova</strong>, and <strong>Byte</strong> across a dynamic rooftop terrace.
              Poke characters for instant reactions, toggle lighting moods, speak or type prompts, and summon floating project cards.
            </p>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {Object.values(CHARACTERS).map((char) => (
                <div key={char.id} className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                  <div className="font-semibold" style={{ color: char.accent }}>{char.name}</div>
                  <div className="mt-0.5 text-white/60">{char.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className={`relative z-10 flex h-[calc(100%-190px)] w-full items-center justify-center px-6 transition-all duration-700 ${stageAlignmentClass}`}>
        <div className="relative flex flex-col items-center md:flex-row md:items-end gap-6">
          <button
            type="button"
            onClick={handlePoke}
            style={{ boxShadow: `0 20px 60px -15px ${theme.glowColor}` }}
            className={`group relative flex flex-col items-center rounded-3xl border border-white/20 bg-slate-950/45 px-8 py-6 backdrop-blur-md transition-all duration-300 ${
              pokeBounce ? '-translate-y-4 scale-105' : 'hover:-translate-y-1'
            } ${isSeated ? 'translate-y-3' : ''}`}
          >
            <span className="mb-3 rounded-full border border-white/15 bg-white/10 px-3 py-0.5 text-[11px] font-medium text-white/80">
              Click / Poke Character • {isSeated ? 'Seated' : 'Active'}
            </span>

            <div className="relative flex flex-col items-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/40 text-2xl font-bold text-slate-950 shadow-lg transition-transform duration-200"
                style={{ backgroundColor: activeChar.accent }}
              >
                {activeChar.name[0]}
              </div>
              <div className={`mt-2 h-3 rounded-full bg-white/70 transition-all duration-150 ${isSpeaking ? 'w-10 h-4 animate-pulse' : 'w-6'}`} />
              <div className={`mt-2 w-24 rounded-2xl border border-white/20 bg-white/10 transition-all duration-300 ${isSeated ? 'h-12' : 'h-20'}`} />
            </div>

            <div className="mt-4 text-center">
              <div className="text-base font-bold tracking-tight">{activeChar.name}</div>
              <div className="text-xs text-white/70">{activeChar.role}</div>
            </div>
          </button>

          {showHologram && (
            <div className="w-72 rounded-2xl border border-cyan-300/30 bg-slate-950/70 p-4 text-left shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
                <span>Hologram Pitch</span>
                <button type="button" onClick={() => setShowHologram(false)} className="text-white/50 hover:text-white">Hide</button>
              </div>
              <div className="mt-1.5 text-sm font-bold text-white">{activeChar.projectTitle}</div>
              <p className="mt-1 text-xs leading-relaxed text-white/75">{activeChar.projectSummary}</p>
            </div>
          )}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2.5 px-3 pb-3 md:px-6 md:pb-5">
        <div className="max-w-2xl rounded-2xl border border-white/15 bg-slate-950/75 px-4 py-2 text-center text-xs sm:text-sm text-white/95 shadow-lg backdrop-blur-md">
          <span className="mr-2 font-semibold" style={{ color: activeChar.accent }}>{activeChar.name}:</span>
          <span>{subtitle}</span>
        </div>
        {interimTranscript && (
          <div className="max-w-xl rounded-full border border-rose-400/30 bg-rose-500/20 px-4 py-1.5 text-xs text-rose-100 backdrop-blur-md">
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-rose-400" />
            Listening: {interimTranscript}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {STARTER_PROMPTS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => handleSendPrompt(chip)}
              className="rounded-full border border-white/15 bg-slate-950/60 px-3 py-1 text-[11px] font-medium text-white/85 backdrop-blur-md transition hover:border-white/35 hover:bg-slate-900"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="flex w-full max-w-4xl flex-wrap items-center justify-between gap-2.5 rounded-3xl border border-white/15 bg-slate-950/75 p-2.5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-1.5">
            {Object.values(CHARACTERS).map((char) => {
              const selected = char.id === activeId;
              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => setActiveId(char.id)}
                  className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                    selected ? 'bg-white text-slate-950 shadow' : 'bg-white/5 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: char.accent }} />
                  <span>{char.name}</span>
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(promptText);
            }}
            className="flex flex-1 min-w-[200px] items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`rounded-2xl px-3.5 py-2 text-xs font-semibold transition ${
                listening ? 'animate-pulse bg-rose-500 text-white' : 'border border-white/15 bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {listening ? 'Listening...' : 'Mic'}
            </button>
            <button
              type="button"
              onClick={toggleLiveLoop}
              className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                liveLoop
                  ? 'border border-emerald-400/50 bg-emerald-500/25 text-emerald-100'
                  : 'border border-white/15 bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {liveLoop ? 'Live On' : 'Live Loop'}
            </button>
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={`Ask ${activeChar.name} anything...`}
              className="w-full rounded-2xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs text-white placeholder-white/45 outline-none focus:border-white/40"
            />
            <button type="submit" className="rounded-2xl bg-white/90 px-3.5 py-2 text-xs font-semibold text-slate-950 transition hover:bg-white">Send</button>
          </form>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => speakText(`${activeChar.name} waves across the rooftop plaza! Hey there!`, 2200)}
              className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-2 text-xs font-medium text-white/85 hover:bg-white/15"
            >
              Wave
            </button>
            <button
              type="button"
              onClick={() => setIsSeated((prev) => !prev)}
              className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-2 text-xs font-medium text-white/85 hover:bg-white/15"
            >
              {isSeated ? 'Stand' : 'Sit'}
            </button>
            <button
              type="button"
              onClick={() => setShowHologram((prev) => !prev)}
              className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-2 text-xs font-medium text-white/85 hover:bg-white/15"
            >
              Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
