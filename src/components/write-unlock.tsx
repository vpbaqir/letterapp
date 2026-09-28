import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Gamepad2,
  Home,
  Lock,
  Pencil,
  Play,
  RotateCcw,
  Settings2,
  Shuffle,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Undo2,
  UserRoundCog,
  Volume2,
  VolumeX,
} from "lucide-react";

import heroImage from "@/assets/write-unlock-hero.jpg";
import runnerImage from "@/assets/runner-game.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  LightsOut,
  PerfectStack,
  OneLine,
  StopAt100,
  NumberPath,
  OrbitTap,
  FlipFour,
  SlideToExit,
  ColorWheel,
  MakeTen,
  HigherLower,
  PlusOne,
  type MiniGameId,
} from "./mini-games";

let audioCtx: AudioContext | null = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

export function playSound(type: "success" | "retry" | "jump" | "collect" | "win", volume = 0.5) {
  try {
    const ctx = initAudio();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.05);

    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(554.37, t + 0.1);
      osc.frequency.setValueAtTime(659.25, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    } else if (type === "retry") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(200, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    } else if (type === "jump") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
    } else if (type === "collect") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.setValueAtTime(1108.73, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    } else if (type === "win") {
      osc.type = "square";
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(440, t + 0.1);
      osc.frequency.setValueAtTime(554.37, t + 0.15);
      osc.frequency.setValueAtTime(659.25, t + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
      osc.start(t);
      osc.stop(t + 0.6);
    }
  } catch (e) {
    console.error("Audio error", e);
  }
}

export function speak(text: string, lang: string = "english", soundEnabled: boolean) {
  if (!soundEnabled || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  if (lang === "malayalam") utterance.lang = "ml-IN";
  else if (lang === "arabic") utterance.lang = "ar-SA";
  else utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1.1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

type Screen =
  | "home"
  | "write"
  | "complete"
  | "games"
  | "parent"
  | "runner"
  | "cloud-flyer"
  | "space-dash"
  | "ocean-hop"
  | "number-merge"
  | MiniGameId;
type Order = "sequential" | "custom" | "random";
type GuideMode = "guided" | "semi" | "free";

type AppState = {
  childName: string;
  language: string;
  letters: string[];
  order: Order;
  target: number;
  targets: Record<string, number>;
  guide: GuideMode;
  currentIndex: number;
  progress: Record<string, number>;
  completed: string[];
  runnerUnlocked: boolean;
  totalWritten: number;
  sound: boolean;
  usageStats?: Record<string, { attempts: number; successes: number }>;
};

const DEFAULT_ALPHABET = { label: "English", letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("") };
const ALPHABETS: Record<string, { label: string; letters: string[] }> = {
  english: DEFAULT_ALPHABET,
  malayalam: { label: "Malayalam", letters: ["അ", "ആ", "ഇ", "ഈ", "ഉ", "ഊ", "ഋ", "എ", "ഏ", "ഐ", "ഒ", "ഓ", "ഔ", "അം", "അഃ", "ക", "ഖ", "ഗ", "ഘ", "ങ", "ച", "ഛ", "ജ", "ഝ", "ഞ", "ട", "ഠ", "ഡ", "ഢ", "ണ", "ത", "ഥ", "ദ", "ധ", "ന", "പ", "ഫ", "ബ", "ഭ", "മ", "യ", "ര", "ല", "വ", "ശ", "ഷ", "സ", "ഹ", "ള", "ഴ", "റ"] },
  arabic: { label: "Arabic", letters: ["ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي"] }
};

const STORAGE_KEY = "write-unlock-progress-v1";
const DEFAULT_STATE: AppState = {
  childName: "Adam",
  language: "english",
  letters: ["A", "B", "C"],
  order: "sequential",
  target: 5,
  targets: { A: 5, B: 5, C: 5 },
  guide: "guided",
  currentIndex: 0,
  progress: { A: 0, B: 0, C: 0 },
  completed: [],
  runnerUnlocked: false,
  totalWritten: 0,
  sound: true,
  usageStats: {},
};

function nextLetterIndex(state: AppState) {
  if (state.order === "random" && state.letters.length > 1) {
    let next = state.currentIndex;
    while (next === state.currentIndex) next = Math.floor(Math.random() * state.letters.length);
    return next;
  }
  return (state.currentIndex + 1) % state.letters.length;
}

export function WriteUnlockApp() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [screen, setScreen] = useState<Screen>("home");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setState({ ...DEFAULT_STATE, ...(JSON.parse(saved) as Partial<AppState>) });
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const currentLetter = state.letters[state.currentIndex] ?? "A";
  const currentProgress = state.progress[currentLetter] ?? 0;
  const currentTarget = state.targets?.[currentLetter] ?? state.target;

  const recordAttempt = () => {
    setState((previous) => {
      const stats = previous.usageStats?.[currentLetter] ?? { attempts: 0, successes: 0 };
      return {
        ...previous,
        usageStats: {
          ...(previous.usageStats ?? {}),
          [currentLetter]: {
            ...stats,
            attempts: stats.attempts + 1,
          },
        },
      };
    });
  };

  const acceptWriting = () => {
    const nextCount = Math.min(currentProgress + 1, currentTarget);
    const isComplete = nextCount >= currentTarget;
    setState((previous) => {
      const stats = previous.usageStats?.[currentLetter] ?? { attempts: 0, successes: 0 };
      return {
        ...previous,
        progress: { ...previous.progress, [currentLetter]: nextCount },
        completed: isComplete
          ? Array.from(new Set([...previous.completed, currentLetter]))
          : previous.completed,
        runnerUnlocked: isComplete || previous.runnerUnlocked,
        totalWritten: previous.totalWritten + 1,
        usageStats: {
          ...(previous.usageStats ?? {}),
          [currentLetter]: {
            attempts: Math.max(stats.attempts, 1),
            successes: stats.successes + 1,
          },
        },
      };
    });
    if (isComplete) setScreen("complete");
  };

  const continueJourney = () => {
    setState((previous) => ({ ...previous, currentIndex: nextLetterIndex(previous) }));
    setScreen("home");
  };

  if (!ready) return <div className="min-h-screen bg-background" />;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-28 pt-5 sm:px-7 lg:px-10 lg:pt-8">
        {screen === "home" && (
          <ChildHome
            state={state}
            currentLetter={currentLetter}
            target={currentTarget}
            onNavigate={setScreen}
            onSelectLetter={(index) => setState((prev) => ({ ...prev, currentIndex: index }))}
          />
        )}
        {screen === "write" && (
          <WritingScreen
            letter={currentLetter}
            progress={currentProgress}
            target={currentTarget}
            guide={state.guide}
            soundEnabled={state.sound}
            language={state.language}
            onBack={() => setScreen("home")}
            onAccepted={acceptWriting}
            onAttempt={recordAttempt}
          />
        )}
        {screen === "complete" && (
          <CompletionScreen
            letter={currentLetter}
            soundEnabled={state.sound}
            onPlay={() => setScreen("games")}
            onNextLetter={continueJourney}
          />
        )}
        {screen === "games" && (
          <GamesScreen state={state} onPlay={setScreen} />
        )}
        {screen === "parent" && <ParentScreen state={state} setState={setState} onDone={() => setScreen("home")} />}
        {screen === "runner" && <RunnerGame soundEnabled={state.sound} onDone={continueJourney} />}
        {screen === "cloud-flyer" && <CloudFlyerGame soundEnabled={state.sound} onDone={continueJourney} />}
        {screen === "space-dash" && <SpaceDashGame soundEnabled={state.sound} onDone={continueJourney} />}
        {screen === "ocean-hop" && <OceanHopGame soundEnabled={state.sound} onDone={continueJourney} />}
        {screen === "number-merge" && <NumberMergeGame soundEnabled={state.sound} onDone={continueJourney} />}

        {/* 12 Mini-Games */}
        {screen === "lights-out" && <LightsOut back={() => setScreen("games")} soundEnabled={state.sound} />}
        {screen === "perfect-stack" && <PerfectStack back={() => setScreen("games")} soundEnabled={state.sound} />}
        {screen === "one-line" && <OneLine back={() => setScreen("games")} soundEnabled={state.sound} />}
        {screen === "stop-at-100" && <StopAt100 back={() => setScreen("games")} soundEnabled={state.sound} />}
        {screen === "number-path" && <NumberPath back={() => setScreen("games")} soundEnabled={state.sound} />}
        {screen === "orbit-tap" && <OrbitTap back={() => setScreen("games")} soundEnabled={state.sound} />}
        {screen === "flip-four" && <FlipFour back={() => setScreen("games")} soundEnabled={state.sound} />}
        {screen === "slide-to-exit" && <SlideToExit back={() => setScreen("games")} soundEnabled={state.sound} />}
        {screen === "color-wheel" && <ColorWheel back={() => setScreen("games")} soundEnabled={state.sound} />}
        {screen === "make-ten" && <MakeTen back={() => setScreen("games")} soundEnabled={state.sound} />}
        {screen === "higher-lower" && <HigherLower back={() => setScreen("games")} soundEnabled={state.sound} />}
        {screen === "plus-one" && <PlusOne back={() => setScreen("games")} soundEnabled={state.sound} />}
      </div>

      {(screen === "home" || screen === "games") && (
        <ChildNav screen={screen} onNavigate={setScreen} />
      )}
    </main>
  );
}

function Brand({ parent = false }: { parent?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
        <Pencil className="size-5" aria-hidden="true" />
      </div>
      <div>
        <p className="font-display text-lg font-bold leading-none">Write & Unlock</p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">{parent ? "Parent space" : "Write it. Unlock it. Play it."}</p>
      </div>
    </div>
  );
}

function ChildHome({
  state,
  currentLetter,
  target,
  onNavigate,
  onSelectLetter,
}: {
  state: AppState;
  currentLetter: string;
  target: number;
  onNavigate: (screen: Screen) => void;
  onSelectLetter: (index: number) => void;
}) {
  const progress = state.progress[currentLetter] ?? 0;
  return (
    <>
      <header className="flex items-center justify-between">
        <Brand />
        <Button variant="ghost" size="icon" className="size-11 rounded-2xl" onClick={() => onNavigate("parent")} aria-label="Open parent space">
          <UserRoundCog className="size-5" />
        </Button>
      </header>

      <section className="mt-10 lg:mt-14">
        <p className="text-sm font-bold text-primary">Ready to write, {state.childName}?</p>
        <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Let&apos;s practice!</h1>
      </section>

      <section className="mt-7 grid gap-6 lg:grid-cols-[1.45fr_0.8fr]">
        <div className="relative min-h-[410px] overflow-hidden rounded-[2rem] bg-sky shadow-card sm:min-h-[460px]">
          <img src={heroImage} width={1200} height={900} alt="A cheerful pencil flying through soft clouds" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-hero-wash" />
          <div className="relative flex h-full min-h-[410px] flex-col justify-between p-7 sm:min-h-[460px] sm:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-ink-soft">Today&apos;s letter</p>
                <p className="mt-1 font-display text-[7.5rem] font-bold leading-none text-foreground sm:text-[9rem]">{currentLetter}</p>
              </div>
              <div className="rounded-full bg-glass px-4 py-2 text-sm font-bold backdrop-blur-md">{progress} / {target} written</div>
            </div>
            <Button className="h-14 w-full rounded-2xl text-base font-bold shadow-button sm:w-48 cursor-pointer" onClick={() => onNavigate("write")}>
              <Pencil /> Write {currentLetter}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <StatCard icon={<Pencil />} value={state.totalWritten} label="Written" tone="coral" />
          <StatCard icon={<Trophy />} value={state.completed.length} label="Letters" tone="mint" />
          <StatCard icon={<Gamepad2 />} value={state.runnerUnlocked ? 1 : 0} label="Games" tone="yellow" />
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-bold text-primary">Your journey</p>
            <h2 className="mt-1 font-display text-2xl font-bold">Letter trail</h2>
          </div>
          <span className="text-sm font-semibold text-muted-foreground">{state.completed.length} of {state.letters.length}</span>
        </div>
        <div className="mt-5 flex gap-3 overflow-x-auto pb-3">
          {state.letters.map((letter, index) => {
            const complete = state.completed.includes(letter);
            const current = index === state.currentIndex;
            return (
              <button 
                key={letter} 
                onClick={() => {
                  onSelectLetter(index);
                  speak(letter, state.language, state.sound);
                }}
                className={cn(
                  "grid size-16 shrink-0 place-items-center rounded-full border text-xl font-bold transition-all cursor-pointer",
                  complete ? "border-sun-soft bg-sun text-sun-foreground shadow-glow hover:scale-105 active:scale-95" : current ? "border-primary bg-primary text-primary-foreground shadow-glow hover:scale-105 active:scale-95" : "border-border bg-card text-muted-foreground hover:border-primary/50"
                )}
                aria-label={`Select letter ${letter}`}
              >
                {complete ? letter : current ? letter : <Lock className="size-4" aria-label={`${letter} locked`} />}
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}

function StatCard({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: "coral" | "mint" | "yellow" }) {
  return (
    <div className="flex min-h-32 items-center gap-4 rounded-[1.6rem] border border-border/60 bg-card p-5 shadow-soft lg:min-h-0 lg:flex-1">
      <div className={cn("grid size-12 place-items-center rounded-2xl", tone === "coral" && "bg-coral-soft text-coral", tone === "mint" && "bg-mint text-mint-foreground", tone === "yellow" && "bg-sun-soft text-sun-foreground")}>{icon}</div>
      <div><p className="font-display text-3xl font-bold">{value}</p><p className="text-sm font-semibold text-muted-foreground">{label}</p></div>
    </div>
  );
}

type Point = { x: number; y: number };
type Stroke = Point[];

function WritingScreen({ letter, progress, target, guide, soundEnabled, language, onBack, onAccepted, onAttempt }: { letter: string; progress: number; target: number; guide: GuideMode; soundEnabled: boolean; language: string; onBack: () => void; onAccepted: () => void; onAttempt: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [feedback, setFeedback] = useState<"nice" | "retry" | null>(null);

  const pronounce = useCallback(() => {
    let text = `Write the letter ${letter}`;
    if (language === "malayalam") text = `${letter} എഴുതുക`;
    if (language === "arabic") text = `اكتب الحرف ${letter}`;
    speak(text, language, soundEnabled);
  }, [letter, language, soundEnabled]);

  useEffect(() => {
    pronounce();
  }, [pronounce]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = window.devicePixelRatio || 1;
    
    const targetWidth = Math.floor(rect.width * ratio);
    const targetHeight = Math.floor(rect.height * ratio);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    const context = canvas.getContext("2d");
    if (!context) return;
    context.resetTransform?.();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.scale(ratio, ratio);

    const styleInk = getComputedStyle(document.documentElement).getPropertyValue("--canvas-ink").trim();
    const color = styleInk || "#1e293b";
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = Math.max(9, rect.width / 38);
    context.lineCap = "round";
    context.lineJoin = "round";

    strokesRef.current.forEach((stroke) => {
      if (stroke.length === 0) return;
      const firstPoint = stroke[0];
      if (!firstPoint) return;
      if (stroke.length === 1) {
        context.beginPath();
        context.arc(firstPoint.x * rect.width, firstPoint.y * rect.height, context.lineWidth / 2, 0, Math.PI * 2);
        context.fill();
        return;
      }
      context.beginPath();
      context.moveTo(firstPoint.x * rect.width, firstPoint.y * rect.height);
      for (let i = 1; i < stroke.length; i++) {
        const point = stroke[i];
        if (point) context.lineTo(point.x * rect.width, point.y * rect.height);
      }
      context.stroke();
    });
  }, []);

  const clear = useCallback(() => {
    strokesRef.current = [];
    setStrokeCount(0);
    setFeedback(null);
    render();
  }, [render]);

  useEffect(() => {
    clear();
  }, [letter, clear]);

  useEffect(() => {
    render();
    window.addEventListener("resize", render);
    return () => window.removeEventListener("resize", render);
  }, [render]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    strokesRef.current.push([pointFromEvent(event)]);
    setStrokeCount(strokesRef.current.length);
    render();
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    strokesRef.current.at(-1)?.push(pointFromEvent(event));
    render();
  };
  const end = () => {
    if (drawingRef.current) {
      drawingRef.current = false;
      setStrokeCount(strokesRef.current.length);
      render();
    }
  };
  const undo = () => { strokesRef.current.pop(); setStrokeCount(strokesRef.current.length); setFeedback(null); render(); };

  const submit = () => {
    if (!strokesRef.current.length) return;
    setFeedback("nice");
    onAttempt();
    if (soundEnabled) playSound("success");
    window.setTimeout(() => { onAccepted(); clear(); }, 650);
  };

  return (
    <section className="mx-auto max-w-3xl">
      <header className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="size-11 rounded-2xl" onClick={onBack} aria-label="Back home"><ArrowLeft /></Button>
        <div className="text-center"><p className="text-sm font-bold text-primary">Write the letter</p><p className="font-display text-4xl font-bold">{letter}</p></div>
        <Button variant="ghost" size="icon" className="size-11 rounded-2xl bg-sun-soft text-sun-foreground hover:bg-sun-soft/80" onClick={pronounce} aria-label="Pronounce letter"><Volume2 className="size-5" /></Button>
      </header>

      <div className="mt-7 text-center"><h1 className="font-display text-3xl font-bold">Write it your way</h1><p className="mt-2 text-sm font-semibold text-muted-foreground">Use your finger, mouse, or pencil</p></div>

      <div className="relative mt-6 h-[390px] overflow-hidden rounded-[2rem] border border-border/70 bg-canvas shadow-card sm:aspect-[4/3] sm:h-auto sm:max-h-[58vh] sm:min-h-[390px]">
        {guide !== "free" && <div className={cn("pointer-events-none absolute inset-0 grid place-items-center font-display text-[16rem] font-bold leading-none text-guide sm:text-[22rem]", guide === "guided" && "guide-animated")}>{letter}</div>}
        <canvas ref={canvasRef} className="absolute inset-0 size-full touch-none cursor-crosshair" aria-label={`Drawing area for letter ${letter}`} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} />
        {feedback && <div className={cn("pointer-events-none absolute inset-x-0 top-6 mx-auto w-fit rounded-full px-5 py-3 text-sm font-bold shadow-soft animate-pop", feedback === "nice" ? "bg-mint text-mint-foreground" : "bg-card text-foreground")}>{feedback === "nice" ? "✨ Nice writing!" : "Almost! Make your letter a little bigger."}</div>}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm font-bold"><span>{progress} / {target}</span><span className="text-muted-foreground">{target - progress} to unlock</span></div>
        <progress className="progress mt-3 h-2 w-full" value={progress} max={target}>Progress</progress>
      </div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button variant="secondary" size="icon" className="size-13 rounded-2xl" onClick={undo} disabled={!strokeCount} aria-label="Undo last stroke"><Undo2 /></Button>
        <Button variant="secondary" className="h-13 rounded-2xl px-5 font-bold" onClick={clear} disabled={!strokeCount}><Trash2 /> Clear</Button>
        <Button size="icon" className="size-16 rounded-full shadow-button cursor-pointer" onClick={submit} disabled={!strokeCount} aria-label="Check my writing"><Check className="size-7" /></Button>
      </div>
    </section>
  );
}

function CompletionScreen({ letter, soundEnabled, onPlay, onNextLetter }: { letter: string; soundEnabled: boolean; onPlay: () => void; onNextLetter: () => void }) {
  useEffect(() => {
    if (soundEnabled) playSound("win");
  }, [soundEnabled]);
  return (
    <section className="mx-auto flex min-h-[85vh] max-w-3xl flex-col items-center justify-center text-center">
      <div className="relative grid size-32 place-items-center rounded-full bg-sun-soft text-6xl font-bold text-sun-foreground shadow-glow animate-celebrate">{letter}<Check className="absolute -right-1 top-1 size-9 rounded-full bg-mint p-1.5 text-mint-foreground" /></div>
      <p className="mt-8 text-sm font-bold text-primary">LETTER COMPLETE</p>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Nicely written!</h1>
      <p className="mt-3 max-w-md font-semibold text-muted-foreground">Your writing unlocked something wonderful.</p>
      <div className="mt-8 w-full overflow-hidden rounded-[2rem] bg-card text-left shadow-card">
        <img src={runnerImage} width={1200} height={900} alt="Game garden" className="aspect-[2/1] w-full object-cover" />
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div><p className="flex items-center gap-2 text-sm font-bold text-primary"><Sparkles className="size-4" /> REWARD UNLOCKED</p><h2 className="mt-1 font-display text-2xl font-bold">Game Garden</h2></div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-13 rounded-2xl px-6 font-bold" onClick={onNextLetter}><Pencil /> Next letter</Button>
            <Button className="h-13 rounded-2xl px-7 font-bold shadow-button" onClick={onPlay}><Gamepad2 className="fill-current" /> Go to games</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function GamesScreen({ state, onPlay }: { state: AppState; onPlay: (screen: Screen) => void }) {
  const completedCount = state.completed.length;
  const [filter, setFilter] = useState<"all" | "action" | "puzzle" | "numbers">("all");
  
  const allGames: {
    id: Screen;
    name: string;
    icon: string;
    desc: string;
    req: number;
    category: "action" | "puzzle" | "numbers";
  }[] = [
    // Action & Arcades
    { id: "runner", name: "Endless Runner", icon: "🦊", desc: "Run, jump, and collect shiny stars!", req: 1, category: "action" },
    { id: "perfect-stack", name: "Perfect Stack", icon: "🧱", desc: "Stack the moving blocks to the sky.", req: 1, category: "action" },
    { id: "stop-at-100", name: "Stop at 100", icon: "💯", desc: "Test your timing to stop right on 100!", req: 1, category: "action" },
    { id: "orbit-tap", name: "Orbit Tap", icon: "🎯", desc: "Tap right when the orbiting ball hits the target.", req: 2, category: "action" },
    { id: "cloud-flyer", name: "Cloud Flyer", icon: "☁️", desc: "Float high through the clouds and dodge thunder.", req: 2, category: "action" },
    { id: "space-dash", name: "Space Dash", icon: "🚀", desc: "Rocket through space and blast asteroids.", req: 3, category: "action" },
    { id: "ocean-hop", name: "Ocean Hop", icon: "🐠", desc: "Leap across lily pads with the cheerful fish.", req: 4, category: "action" },

    // Puzzles & Brain Games
    { id: "lights-out", name: "Lights Out", icon: "💡", desc: "Turn off every light tile on the grid.", req: 1, category: "puzzle" },
    { id: "color-wheel", name: "Color Wheel", icon: "🎨", desc: "Tap matching colors as fast as you can.", req: 1, category: "puzzle" },
    { id: "one-line", name: "One Line", icon: "〰️", desc: "Connect every dot in a continuous loop.", req: 2, category: "puzzle" },
    { id: "flip-four", name: "Flip Four", icon: "🔲", desc: "Flip tiles until all 4 colors match.", req: 2, category: "puzzle" },
    { id: "slide-to-exit", name: "Slide to Exit", icon: "🚪", desc: "Slide the red block to escape through the door.", req: 3, category: "puzzle" },

    // Numbers & Math
    { id: "number-merge", name: "Number Merge 2048", icon: "🔢", desc: "Slide & combine numbers to build up to 2048!", req: 1, category: "numbers" },
    { id: "number-path", name: "Number Path", icon: "🔢", desc: "Tap shuffled numbers in order from 1 to 16.", req: 2, category: "numbers" },
    { id: "make-ten", name: "Make Ten", icon: "🔟", desc: "Find combinations that add up to 10.", req: 2, category: "numbers" },
    { id: "higher-lower", name: "Higher or Lower", icon: "⬆️", desc: "Guess if the next secret number is higher or lower.", req: 2, category: "numbers" },
    { id: "plus-one", name: "Plus One", icon: "➕", desc: "Tap tiles to add one until every number is 5.", req: 3, category: "numbers" },
  ];

  const displayedGames = filter === "all" ? allGames : allGames.filter((g) => g.category === filter);
  const unlockedTotal = allGames.filter((g) => completedCount >= g.req).length;

  return (
    <section>
      <header className="flex items-center justify-between">
        <Brand />
        <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-bold shadow-soft">
          <Sparkles className="size-4 text-primary" />
          <span>{unlockedTotal} of {allGames.length} unlocked</span>
        </div>
      </header>

      <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-primary">Your rewards</p>
          <h1 className="mt-1 font-display text-4xl font-bold">Game Garden</h1>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Play games unlocked by practicing your handwriting!</p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-secondary p-1 border border-border/80">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
              filter === "all"
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All ({allGames.length})
          </button>
          <button
            onClick={() => setFilter("action")}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
              filter === "action"
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Action
          </button>
          <button
            onClick={() => setFilter("puzzle")}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
              filter === "puzzle"
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Puzzles
          </button>
          <button
            onClick={() => setFilter("numbers")}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
              filter === "numbers"
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Numbers
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {displayedGames.map((game) => {
          const unlocked = completedCount >= game.req;
          return (
            <article
              key={game.id}
              className={cn(
                "group relative flex flex-col justify-between rounded-[2rem] border border-border bg-card p-6 shadow-soft transition-all hover:shadow-card hover:-translate-y-1",
                !unlocked && "opacity-75 grayscale-[40%]"
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="grid size-16 place-items-center rounded-2xl bg-secondary text-3xl transition-transform group-hover:scale-105">
                    {game.icon}
                  </div>
                  <span className="rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {game.category}
                  </span>
                </div>

                <div className="mt-4">
                  <h2 className="font-display text-lg font-bold leading-snug">{game.name}</h2>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground leading-relaxed">
                    {game.desc}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                {unlocked ? (
                  <>
                    <span className="text-xs font-bold text-mint-strong flex items-center gap-1">
                      <Sparkles className="size-3.5" /> Ready to play
                    </span>
                    <Button
                      size="sm"
                      className="h-10 rounded-xl px-4 font-bold shadow-button cursor-pointer flex items-center gap-1.5"
                      onClick={() => onPlay(game.id)}
                      aria-label={`Play ${game.name}`}
                    >
                      <span>Play</span>
                      <Play className="size-3.5 fill-current" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Lock className="size-3.5 shrink-0" />
                      <span>Need {game.req} {game.req === 1 ? "letter" : "letters"}</span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="h-10 rounded-xl px-3 text-xs font-bold opacity-60"
                    >
                      Locked
                    </Button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ParentScreen({ state, setState, onDone }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; onDone: () => void }) {
  const [tab, setTab] = useState<"overview" | "plan" | "analytics" | "settings">("overview");
  const currentLetter = state.letters[state.currentIndex] ?? state.letters[0] ?? "A";
  
  const toggleLetter = (letter: string) => {
    setState((previous) => {
      const selected = previous.letters.includes(letter);
      if (selected && previous.letters.length === 1) return previous;
      const letters = selected ? previous.letters.filter((item) => item !== letter) : [...previous.letters, letter].sort();
      return { ...previous, letters, currentIndex: 0, progress: { ...previous.progress, [letter]: previous.progress[letter] ?? 0 }, targets: { ...previous.targets, [letter]: previous.targets?.[letter] ?? previous.target } };
    });
  };

  const changeLanguage = (lang: string) => {
    if (lang === state.language) return;
    const alphabet = ALPHABETS[lang] ?? DEFAULT_ALPHABET;
    const newLetters = alphabet.letters.slice(0, 3);
    setState((prev) => ({
      ...prev,
      language: lang,
      letters: newLetters,
      currentIndex: 0,
      targets: Object.fromEntries(newLetters.map((l) => [l, prev.target])),
      progress: Object.fromEntries(newLetters.map((l) => [l, 0])),
    }));
  };

  const reset = () => setState((previous) => {
    const lang = previous.language ?? "english";
    const alphabet = ALPHABETS[lang] ?? DEFAULT_ALPHABET;
    const letters = alphabet.letters.slice(0, 3);
    return {
      ...DEFAULT_STATE,
      childName: previous.childName,
      sound: previous.sound,
      language: lang,
      letters,
      targets: Object.fromEntries(letters.map((l) => [l, DEFAULT_STATE.target])),
      progress: Object.fromEntries(letters.map((l) => [l, 0])),
    };
  });
  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-4"><Brand parent /><Button className="h-11 rounded-2xl px-5 font-bold" onClick={onDone}><Check /> Done</Button></header>
      <nav className="mt-8 flex gap-2 overflow-x-auto rounded-2xl bg-secondary p-1.5" aria-label="Parent sections">
        {(["overview", "plan", "analytics", "settings"] as const).map((item) => <Button key={item} variant={tab === item ? "default" : "ghost"} className="h-11 flex-1 rounded-xl capitalize" onClick={() => setTab(item)}>{item === "overview" ? <Home /> : item === "plan" ? <Pencil /> : item === "analytics" ? <Gamepad2 /> : <Settings2 />}{item}</Button>)}
      </nav>

      {tab === "overview" && <div className="mt-9"><p className="text-sm font-bold text-primary">Good morning</p><h1 className="mt-2 font-display text-4xl font-bold">{state.childName}&apos;s progress</h1><div className="mt-7 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]"><div className="rounded-[2rem] bg-ink p-7 text-ink-foreground shadow-card sm:p-9"><p className="text-sm font-bold text-ink-muted">Writing journey</p><div className="mt-4 flex items-end justify-between"><p className="font-display text-5xl font-bold">{state.completed.length}<span className="text-xl text-ink-muted"> / {state.letters.length}</span></p><Trophy className="size-9 text-sun" /></div><progress className="progress progress-light mt-7 h-2 w-full" value={state.completed.length} max={state.letters.length}>Letters complete</progress><div className="mt-8 border-t border-ink-line pt-6"><p className="text-sm font-semibold text-ink-muted">Current practice</p><p className="mt-2 text-xl font-bold">{currentLetter} · {state.progress[currentLetter] ?? 0} / {state.targets?.[currentLetter] ?? state.target}</p></div></div><div className="grid gap-4"><StatCard icon={<Pencil />} value={state.totalWritten} label="Total writings" tone="coral" /><StatCard icon={<Gamepad2 />} value={state.runnerUnlocked ? 1 : 0} label="Games unlocked" tone="yellow" /></div></div></div>}

      {tab === "plan" && <div className="mt-9"><p className="text-sm font-bold text-primary">Practice plan</p><h1 className="mt-2 font-display text-4xl font-bold">Choose the journey</h1><div className="mt-7 rounded-[2rem] bg-card p-6 shadow-soft sm:p-8 mb-5"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Language</h2></div><div className="mt-5 flex flex-wrap gap-2">{Object.entries(ALPHABETS).map(([key, info]) => <Button key={key} variant={(state.language ?? "english") === key ? "default" : "outline"} className="h-12 rounded-xl" onClick={() => changeLanguage(key)}>{info.label}</Button>)}</div></div><div className="rounded-[2rem] bg-card p-6 shadow-soft sm:p-8"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Choose letters</h2><span className="text-sm font-semibold text-muted-foreground">{state.letters.length} selected</span></div><div className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-9 md:grid-cols-13">{(ALPHABETS[state.language ?? "english"]?.letters ?? DEFAULT_ALPHABET.letters).map((letter) => <Button key={letter} variant={state.letters.includes(letter) ? "default" : "outline"} className="aspect-square h-auto rounded-xl p-0 text-base font-bold" onClick={() => toggleLetter(letter)}>{letter}</Button>)}</div></div><div className="mt-5 grid gap-5 md:grid-cols-2"><div className="rounded-[2rem] bg-card p-6 shadow-soft sm:p-8"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Default target</h2><span className="font-display text-3xl font-bold text-primary">{state.target}</span></div><Slider className="mt-7" min={3} max={20} step={1} value={[state.target]} onValueChange={(value) => { const target = value[0] ?? 5; setState((previous) => ({ ...previous, target, targets: Object.fromEntries(previous.letters.map((letter) => [letter, target])) })); }} aria-label="Writing target" /><div className="mt-6 flex gap-2">{[5, 10, 15, 20].map((value) => <Button key={value} size="sm" variant={state.target === value ? "default" : "outline"} className="flex-1 rounded-xl" onClick={() => setState((previous) => ({ ...previous, target: value, targets: Object.fromEntries(previous.letters.map((letter) => [letter, value])) }))}>{value}</Button>)}</div></div><div className="rounded-[2rem] bg-card p-6 shadow-soft sm:p-8"><h2 className="font-display text-xl font-bold">Letter order</h2><div className="mt-5 grid gap-2">{([{ key: "sequential", label: "Sequential", icon: <Target /> }, { key: "custom", label: "My selected order", icon: <Pencil /> }, { key: "random", label: "Mix it up", icon: <Shuffle /> }] as const).map((option) => <Button key={option.key} variant={state.order === option.key ? "default" : "outline"} className="h-12 justify-start rounded-xl" onClick={() => setState((previous) => ({ ...previous, order: option.key }))}>{option.icon}{option.label}</Button>)}</div></div></div><div className="mt-5 rounded-[2rem] bg-card p-6 shadow-soft sm:p-8"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Individual targets</h2><span className="text-sm font-semibold text-muted-foreground">Tap − or +</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{state.letters.map((letter) => { const value = state.targets?.[letter] ?? state.target; return <div key={letter} className="flex items-center justify-between rounded-2xl bg-secondary p-3"><span className="grid size-10 place-items-center rounded-xl bg-card font-display text-lg font-bold">{letter}</span><div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="size-9 rounded-xl" aria-label={`Decrease ${letter} target`} onClick={() => setState((previous) => ({ ...previous, targets: { ...previous.targets, [letter]: Math.max(1, value - 1) } }))}>−</Button><span className="w-7 text-center font-bold">{value}</span><Button variant="ghost" size="icon" className="size-9 rounded-xl" aria-label={`Increase ${letter} target`} onClick={() => setState((previous) => ({ ...previous, targets: { ...previous.targets, [letter]: Math.min(50, value + 1) } }))}>+</Button></div></div>; })}</div></div><div className="mt-5 rounded-[2rem] bg-card p-6 shadow-soft sm:p-8"><h2 className="font-display text-xl font-bold">Writing guide</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{(["guided", "semi", "free"] as GuideMode[]).map((mode) => <Button key={mode} variant={state.guide === mode ? "default" : "outline"} className="h-14 rounded-xl capitalize" onClick={() => setState((previous) => ({ ...previous, guide: mode }))}>{mode === "semi" ? "Semi-guided" : mode}</Button>)}</div></div></div>}

      {tab === "analytics" && <div className="mt-9"><p className="text-sm font-bold text-primary">Analytics</p><h1 className="mt-2 font-display text-4xl font-bold">Practice stats</h1><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(state.usageStats ?? {}).map(([letter, stats]: [string, { attempts: number; successes: number }]) => <div key={letter} className="flex items-center justify-between rounded-2xl bg-card border border-border p-5 shadow-soft"><div className="flex items-center gap-4"><div className="grid size-12 place-items-center rounded-xl bg-secondary font-display text-2xl font-bold">{letter}</div><div><p className="font-bold">Attempts: {stats.attempts}</p><p className="text-xs font-semibold text-muted-foreground">Successes: {stats.successes}</p></div></div><div className="text-right"><p className="font-display text-xl font-bold text-coral">{stats.attempts > 0 ? Math.round((stats.successes / stats.attempts) * 100) : 0}%</p><p className="text-xs font-semibold text-muted-foreground">Success Rate</p></div></div>)}</div></div>}

      {tab === "settings" && <div className="mt-9 max-w-2xl"><p className="text-sm font-bold text-primary">Settings</p><h1 className="mt-2 font-display text-4xl font-bold">Make it theirs</h1><div className="mt-7 space-y-4 rounded-[2rem] bg-card p-6 shadow-soft sm:p-8"><label className="block"><span className="text-sm font-bold">Child&apos;s name</span><Input className="mt-2 h-12 rounded-xl bg-background" value={state.childName} maxLength={20} onChange={(event) => setState((previous) => ({ ...previous, childName: event.target.value || "Writer" }))} /></label><div className="flex items-center justify-between rounded-2xl bg-secondary p-4"><div className="flex items-center gap-3">{state.sound ? <Volume2 /> : <VolumeX />}<div><p className="font-bold">Sounds</p><p className="text-sm text-muted-foreground">Celebration and game sounds</p></div></div><Button variant={state.sound ? "default" : "outline"} className="rounded-xl" onClick={() => setState((previous) => ({ ...previous, sound: !previous.sound }))}>{state.sound ? "On" : "Off"}</Button></div><Button variant="outline" className="h-12 w-full rounded-xl text-destructive" onClick={reset}><RotateCcw /> Reset progress</Button></div></div>}
    </section>
  );
}

function RunnerGame({ soundEnabled, onDone }: { soundEnabled: boolean; onDone: () => void }) {
  const [time, setTime] = useState(30);
  const [score, setScore] = useState(0);
  const [jumping, setJumping] = useState(false);
  const [finished, setFinished] = useState(false);

  const jump = useCallback(() => {
    if (jumping || finished) return;
    setJumping(true);
    setScore((value) => value + 1);
    if (soundEnabled) playSound("jump");
    window.setTimeout(() => setJumping(false), 650);
  }, [finished, jumping, soundEnabled]);

  useEffect(() => {
    if (finished) return;
    const timer = window.setInterval(() => setTime((value) => {
      if (value <= 1) { setFinished(true); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [finished]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => { if (event.code === "Space" || event.code === "ArrowUp") { event.preventDefault(); jump(); } };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [jump]);

  return (
    <section className="mx-auto max-w-5xl">
      <header className="flex items-center justify-between"><Button variant="ghost" size="icon" className="size-11 rounded-2xl" onClick={onDone} aria-label="Leave game"><ArrowLeft /></Button><div className="text-center"><p className="text-sm font-bold text-primary">WRITING REWARD</p><h1 className="font-display text-xl font-bold">Endless Runner</h1></div><div className="rounded-full bg-card px-4 py-2 text-sm font-bold shadow-soft">{time}s</div></header>
      <div className="runner-world relative mt-6 aspect-[16/10] min-h-[430px] overflow-hidden rounded-[2rem] shadow-card" onPointerDown={jump} role="button" tabIndex={0} aria-label="Runner game. Tap to jump.">
        <img src={runnerImage} width={1200} height={900} alt="Floating garden runner world" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-game-wash" />
        <div className="absolute left-5 top-5 flex gap-3"><div className="rounded-full bg-glass px-4 py-2 font-bold backdrop-blur">⭐ {score}</div><div className="rounded-full bg-glass px-4 py-2 text-sm font-bold backdrop-blur">Tap to jump</div></div>
        {!finished && <><div className={cn("runner-character absolute bottom-[18%] left-[18%] grid size-20 place-items-center rounded-full bg-coral-soft text-5xl shadow-card", jumping && "runner-jump")}>🦊</div><div className="runner-obstacle absolute bottom-[18%] grid h-16 w-20 place-items-center rounded-2xl bg-mint text-3xl shadow-soft">🌿</div><div className="runner-star absolute bottom-[43%] text-4xl">⭐</div></>}
        {finished && <div className="absolute inset-0 grid place-items-center bg-game-end p-6 text-center backdrop-blur-sm"><div className="max-w-sm rounded-[2rem] bg-card p-8 shadow-card"><Trophy className="mx-auto size-12 text-sun" /><p className="mt-4 text-sm font-bold text-primary">RUN COMPLETE</p><h2 className="mt-2 font-display text-4xl font-bold">{score} stars!</h2><p className="mt-3 text-sm font-semibold text-muted-foreground">Wonderful playing. Ready for your next letter?</p><Button className="mt-6 h-13 w-full rounded-2xl font-bold" onClick={onDone}>Keep writing <Pencil /></Button></div></div>}
      </div>
      {!finished && <Button className="mx-auto mt-5 flex h-14 w-full max-w-sm rounded-2xl text-base font-bold shadow-button" onClick={jump}>Jump <span aria-hidden="true">↑</span></Button>}
    </section>
  );
}

function ChildNav({ screen, onNavigate }: { screen: Screen; onNavigate: (screen: Screen) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-5 z-30 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center gap-1 rounded-[1.6rem] border border-border/60 bg-glass p-1.5 shadow-nav backdrop-blur-xl" aria-label="Child navigation">
      {([{ screen: "home", label: "Home", icon: <Home /> }, { screen: "write", label: "Practice", icon: <Pencil /> }, { screen: "games", label: "Games", icon: <Gamepad2 /> }] as const).map((item) => <Button key={item.screen} variant={screen === item.screen ? "default" : "ghost"} className="h-13 flex-1 rounded-[1.15rem]" onClick={() => onNavigate(item.screen)}>{item.icon}<span className="hidden text-xs min-[370px]:inline">{item.label}</span></Button>)}
    </nav>
  );
}

function CloudFlyerGame({ soundEnabled, onDone }: { soundEnabled: boolean; onDone: () => void }) {
  const [time, setTime] = useState(30);
  const [score, setScore] = useState(0);
  const [flying, setFlying] = useState(false);
  const [finished, setFinished] = useState(false);

  const fly = useCallback(() => {
    if (flying || finished) return;
    setFlying(true);
    setScore((value) => value + 1);
    if (soundEnabled) playSound("jump");
    window.setTimeout(() => setFlying(false), 500);
  }, [finished, flying, soundEnabled]);

  useEffect(() => {
    if (finished) return;
    const timer = window.setInterval(() => setTime((value) => {
      if (value <= 1) { setFinished(true); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [finished]);

  return (
    <section className="mx-auto max-w-5xl">
      <header className="flex items-center justify-between"><Button variant="ghost" size="icon" className="size-11 rounded-2xl" onClick={onDone} aria-label="Leave game"><ArrowLeft /></Button><div className="text-center"><p className="text-sm font-bold text-primary">WRITING REWARD</p><h1 className="font-display text-xl font-bold">Cloud Flyer</h1></div><div className="rounded-full bg-card px-4 py-2 text-sm font-bold shadow-soft">{time}s</div></header>
      <div className="runner-world relative mt-6 aspect-[16/10] min-h-[430px] overflow-hidden rounded-[2rem] bg-sky shadow-card" onPointerDown={fly} role="button" tabIndex={0} aria-label="Cloud Flyer game. Tap to fly.">
        <div className="absolute inset-0 bg-hero-wash" />
        <div className="absolute left-5 top-5 flex gap-3"><div className="rounded-full bg-glass px-4 py-2 font-bold backdrop-blur">☁️ {score}</div><div className="rounded-full bg-glass px-4 py-2 text-sm font-bold backdrop-blur">Tap to fly</div></div>
        {!finished && <><div className={cn("absolute bottom-[30%] left-[20%] grid size-20 place-items-center rounded-full bg-card text-5xl shadow-card transition-all", flying && "game-fly")}>🕊️</div><div className="game-cloud absolute top-[20%] grid h-16 w-24 place-items-center rounded-[2rem] bg-ink text-4xl shadow-soft">⛈️</div></>}
        {finished && <div className="absolute inset-0 grid place-items-center bg-game-end p-6 text-center backdrop-blur-sm"><div className="max-w-sm rounded-[2rem] bg-card p-8 shadow-card"><Trophy className="mx-auto size-12 text-sun" /><p className="mt-4 text-sm font-bold text-primary">RUN COMPLETE</p><h2 className="mt-2 font-display text-4xl font-bold">{score} clouds!</h2><Button className="mt-6 h-13 w-full rounded-2xl font-bold" onClick={onDone}>Keep writing <Pencil /></Button></div></div>}
      </div>
      {!finished && <Button className="mx-auto mt-5 flex h-14 w-full max-w-sm rounded-2xl text-base font-bold shadow-button" onClick={fly}>Fly <span aria-hidden="true">↑</span></Button>}
    </section>
  );
}

function SpaceDashGame({ soundEnabled, onDone }: { soundEnabled: boolean; onDone: () => void }) {
  const [time, setTime] = useState(30);
  const [score, setScore] = useState(0);
  const [shooting, setShooting] = useState(false);
  const [finished, setFinished] = useState(false);

  const shoot = useCallback(() => {
    if (shooting || finished) return;
    setShooting(true);
    setScore((value) => value + 10);
    if (soundEnabled) playSound("collect");
    window.setTimeout(() => setShooting(false), 400);
  }, [finished, shooting, soundEnabled]);

  useEffect(() => {
    if (finished) return;
    const timer = window.setInterval(() => setTime((value) => {
      if (value <= 1) { setFinished(true); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [finished]);

  return (
    <section className="mx-auto max-w-5xl">
      <header className="flex items-center justify-between"><Button variant="ghost" size="icon" className="size-11 rounded-2xl" onClick={onDone} aria-label="Leave game"><ArrowLeft /></Button><div className="text-center"><p className="text-sm font-bold text-primary">WRITING REWARD</p><h1 className="font-display text-xl font-bold">Space Dash</h1></div><div className="rounded-full bg-card px-4 py-2 text-sm font-bold shadow-soft">{time}s</div></header>
      <div className="runner-world relative mt-6 aspect-[16/10] min-h-[430px] overflow-hidden rounded-[2rem] bg-ink shadow-card" onPointerDown={shoot} role="button" tabIndex={0} aria-label="Space Dash game. Tap to shoot.">
        <div className="absolute inset-0 bg-game-wash" />
        <div className="absolute left-5 top-5 flex gap-3"><div className="rounded-full bg-glass px-4 py-2 font-bold text-foreground backdrop-blur">☄️ {score}</div><div className="rounded-full bg-glass px-4 py-2 text-sm font-bold text-foreground backdrop-blur">Tap to shoot</div></div>
        {!finished && <><div className="absolute bottom-[10%] left-[50%] -translate-x-1/2 text-6xl">🚀</div><div className="game-dash absolute left-[50%] top-[20%] -translate-x-1/2 text-5xl">☄️</div>{shooting && <div className="absolute bottom-[20%] left-[50%] w-2 h-32 -translate-x-1/2 rounded-full bg-sun shadow-glow" />}</>}
        {finished && <div className="absolute inset-0 grid place-items-center bg-game-end p-6 text-center backdrop-blur-sm"><div className="max-w-sm rounded-[2rem] bg-card p-8 shadow-card"><Trophy className="mx-auto size-12 text-sun" /><p className="mt-4 text-sm font-bold text-primary">RUN COMPLETE</p><h2 className="mt-2 font-display text-4xl font-bold">{score} points!</h2><Button className="mt-6 h-13 w-full rounded-2xl font-bold" onClick={onDone}>Keep writing <Pencil /></Button></div></div>}
      </div>
      {!finished && <Button className="mx-auto mt-5 flex h-14 w-full max-w-sm rounded-2xl text-base font-bold shadow-button" onClick={shoot}>Shoot <span aria-hidden="true">↑</span></Button>}
    </section>
  );
}

function OceanHopGame({ soundEnabled, onDone }: { soundEnabled: boolean; onDone: () => void }) {
  const [time, setTime] = useState(30);
  const [score, setScore] = useState(0);
  const [hopping, setHopping] = useState(false);
  const [finished, setFinished] = useState(false);

  const hop = useCallback(() => {
    if (hopping || finished) return;
    setHopping(true);
    setScore((value) => value + 5);
    if (soundEnabled) playSound("jump");
    window.setTimeout(() => setHopping(false), 400);
  }, [finished, hopping, soundEnabled]);

  useEffect(() => {
    if (finished) return;
    const timer = window.setInterval(() => setTime((value) => {
      if (value <= 1) { setFinished(true); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [finished]);

  return (
    <section className="mx-auto max-w-5xl">
      <header className="flex items-center justify-between"><Button variant="ghost" size="icon" className="size-11 rounded-2xl" onClick={onDone} aria-label="Leave game"><ArrowLeft /></Button><div className="text-center"><p className="text-sm font-bold text-primary">WRITING REWARD</p><h1 className="font-display text-xl font-bold">Ocean Hop</h1></div><div className="rounded-full bg-card px-4 py-2 text-sm font-bold shadow-soft">{time}s</div></header>
      <div className="runner-world relative mt-6 aspect-[16/10] min-h-[430px] overflow-hidden rounded-[2rem] bg-primary/20 shadow-card" onPointerDown={hop} role="button" tabIndex={0} aria-label="Ocean Hop game. Tap to hop.">
        <div className="absolute inset-0 bg-hero-wash" />
        <div className="absolute left-5 top-5 flex gap-3"><div className="rounded-full bg-glass px-4 py-2 font-bold backdrop-blur">💦 {score}</div><div className="rounded-full bg-glass px-4 py-2 text-sm font-bold backdrop-blur">Tap to hop</div></div>
        {!finished && <><div className="game-pad absolute bottom-[25%] left-[50%] -translate-x-1/2 grid h-12 w-32 place-items-center rounded-[50%] bg-mint shadow-soft">🌿</div><div className={cn("absolute bottom-[35%] left-[50%] -translate-x-1/2 text-6xl transition-all", hopping && "game-hop")}>🐸</div></>}
        {finished && <div className="absolute inset-0 grid place-items-center bg-game-end p-6 text-center backdrop-blur-sm"><div className="max-w-sm rounded-[2rem] bg-card p-8 shadow-card"><Trophy className="mx-auto size-12 text-sun" /><p className="mt-4 text-sm font-bold text-primary">RUN COMPLETE</p><h2 className="mt-2 font-display text-4xl font-bold">{score} hops!</h2><Button className="mt-6 h-13 w-full rounded-2xl font-bold" onClick={onDone}>Keep writing <Pencil /></Button></div></div>}
      </div>
      {!finished && <Button className="mx-auto mt-5 flex h-14 w-full max-w-sm rounded-2xl text-base font-bold shadow-button" onClick={hop}>Hop <span aria-hidden="true">↑</span></Button>}
    </section>
  );
}

function slideRow(row: number[]): { row: number[]; score: number; merged: boolean } {
  const nonZero = row.filter((x) => x !== 0);
  const result: number[] = [];
  let score = 0;
  let merged = false;

  for (let i = 0; i < nonZero.length; i++) {
    if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
      const val = nonZero[i]! * 2;
      result.push(val);
      score += val;
      merged = true;
      i++;
    } else {
      result.push(nonZero[i]!);
    }
  }

  while (result.length < row.length) {
    result.push(0);
  }

  return { row: result, score, merged };
}

function moveGrid(direction: "left" | "right" | "up" | "down", grid: number[][]): {
  grid: number[][];
  score: number;
  moved: boolean;
  merged: boolean;
} {
  const size = grid.length;
  let newGrid: number[][] = [];
  let totalScore = 0;
  let anyMerged = false;

  if (direction === "left") {
    newGrid = grid.map((row) => {
      const res = slideRow(row);
      totalScore += res.score;
      if (res.merged) anyMerged = true;
      return res.row;
    });
  } else if (direction === "right") {
    newGrid = grid.map((row) => {
      const reversed = [...row].reverse();
      const res = slideRow(reversed);
      totalScore += res.score;
      if (res.merged) anyMerged = true;
      return res.row.reverse();
    });
  } else if (direction === "up") {
    for (let c = 0; c < size; c++) {
      const col = grid.map((row) => row[c] ?? 0);
      const res = slideRow(col);
      totalScore += res.score;
      if (res.merged) anyMerged = true;
      for (let r = 0; r < size; r++) {
        if (!newGrid[r]) newGrid[r] = [];
        newGrid[r]![c] = res.row[r] ?? 0;
      }
    }
  } else if (direction === "down") {
    for (let c = 0; c < size; c++) {
      const col = grid.map((row) => row[c] ?? 0).reverse();
      const res = slideRow(col);
      totalScore += res.score;
      if (res.merged) anyMerged = true;
      const finalCol = res.row.reverse();
      for (let r = 0; r < size; r++) {
        if (!newGrid[r]) newGrid[r] = [];
        newGrid[r]![c] = finalCol[r] ?? 0;
      }
    }
  }

  const moved = grid.some((row, r) => row.some((val, c) => val !== newGrid[r]?.[c]));

  return { grid: newGrid, score: totalScore, moved, merged: anyMerged };
}

function spawnTile(grid: number[][]): number[][] {
  const empty: [number, number][] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r]!.length; c++) {
      if (grid[r]![c] === 0) empty.push([r, c]);
    }
  }
  if (!empty.length) return grid;
  const [randR, randC] = empty[Math.floor(Math.random() * empty.length)]!;
  const newGrid = grid.map((row) => [...row]);
  newGrid[randR]![randC] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
}

function createInitialGrid(size: 3 | 4): number[][] {
  let g: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  g = spawnTile(g);
  g = spawnTile(g);
  return g;
}

function canMove(grid: number[][]): boolean {
  const size = grid.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = grid[r]![c]!;
      if (val === 0) return true;
      if (r < size - 1 && grid[r + 1]![c] === val) return true;
      if (c < size - 1 && grid[r]![c + 1] === val) return true;
    }
  }
  return false;
}

function has2048(grid: number[][]): boolean {
  return grid.some((row) => row.some((val) => val >= 2048));
}

function getTileStyle(val: number) {
  switch (val) {
    case 2:
      return "bg-secondary text-foreground border-border/80 shadow-xs";
    case 4:
      return "bg-sky text-sky-foreground border-sky-soft shadow-xs";
    case 8:
      return "bg-sun-soft text-sun-foreground border-sun font-bold shadow-xs";
    case 16:
      return "bg-sun text-sun-foreground border-sun font-extrabold shadow-sm";
    case 32:
      return "bg-coral-soft text-coral border-coral font-extrabold shadow-sm";
    case 64:
      return "bg-coral text-white border-coral font-black shadow-soft";
    case 128:
      return "bg-mint text-mint-foreground border-mint font-black shadow-glow";
    case 256:
      return "bg-primary text-primary-foreground border-primary font-black shadow-glow";
    case 512:
      return "bg-indigo-600 text-white border-indigo-700 font-black shadow-glow";
    case 1024:
      return "bg-purple-600 text-white border-purple-700 font-black shadow-glow";
    case 2048:
      return "bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-500 text-ink border-amber-300 font-black shadow-glow animate-celebrate";
    default:
      if (val > 2048) {
        return "bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white font-black shadow-glow";
      }
      return "bg-card/40 border-border/40 text-transparent";
  }
}

function getFontSize(val: number, size: 3 | 4) {
  if (size === 3) {
    if (val >= 1000) return "text-2xl sm:text-3xl";
    if (val >= 100) return "text-3xl sm:text-4xl";
    return "text-4xl sm:text-5xl";
  } else {
    if (val >= 1000) return "text-lg sm:text-xl";
    if (val >= 100) return "text-xl sm:text-2xl";
    return "text-2xl sm:text-3xl";
  }
}

function NumberMergeGame({ soundEnabled, onDone }: { soundEnabled: boolean; onDone: () => void }) {
  const [gridSize, setGridSize] = useState<3 | 4>(4);
  const [grid, setGrid] = useState<number[][]>(() => createInitialGrid(4));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try {
      return Number(window.localStorage.getItem("merge-2048-best") || 0);
    } catch {
      return 0;
    }
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const startNewGame = useCallback((size: 3 | 4 = gridSize) => {
    setGrid(createInitialGrid(size));
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
  }, [gridSize]);

  const handleMove = useCallback((direction: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    setGrid((currentGrid) => {
      const res = moveGrid(direction, currentGrid);
      if (!res.moved) return currentGrid;

      const nextGrid = spawnTile(res.grid);
      const newScore = score + res.score;
      setScore(newScore);

      if (newScore > bestScore) {
        setBestScore(newScore);
        try {
          window.localStorage.setItem("merge-2048-best", String(newScore));
        } catch {}
      }

      if (res.merged && soundEnabled) {
        playSound("collect");
      }

      if (!won && !keepPlaying && has2048(nextGrid)) {
        setWon(true);
        if (soundEnabled) playSound("win");
      }

      if (!canMove(nextGrid)) {
        setGameOver(true);
        if (soundEnabled) playSound("retry");
      }

      return nextGrid;
    });
  }, [bestScore, gameOver, keepPlaying, score, soundEnabled, won]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") handleMove("up");
      else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") handleMove("down");
      else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") handleMove("left");
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") handleMove("right");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  const onPointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    pointerStartRef.current = null;

    if (Math.hypot(dx, dy) >= 30) {
      if (Math.abs(dx) > Math.abs(dy)) {
        handleMove(dx > 0 ? "right" : "left");
      } else {
        handleMove(dy > 0 ? "down" : "up");
      }
    }
  };

  const changeGridSize = (newSize: 3 | 4) => {
    if (newSize === gridSize) return;
    setGridSize(newSize);
    startNewGame(newSize);
  };

  return (
    <section className="mx-auto max-w-xl pb-12 select-none">
      <header className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="size-11 rounded-2xl" onClick={onDone} aria-label="Leave game">
          <ArrowLeft />
        </Button>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Number Puzzle</p>
          <h1 className="font-display text-xl font-bold sm:text-2xl">Number Merge 2048</h1>
        </div>
        <Button variant="outline" size="icon" className="size-11 rounded-2xl" onClick={() => startNewGame()} aria-label="Restart game">
          <RotateCcw className="size-5" />
        </Button>
      </header>

      {/* Mode Toggle & Score Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center rounded-2xl bg-secondary p-1 border border-border/70">
          <Button
            size="sm"
            variant={gridSize === 3 ? "default" : "ghost"}
            className="h-9 rounded-xl px-3 text-xs font-bold"
            onClick={() => changeGridSize(3)}
          >
            3×3 Quick
          </Button>
          <Button
            size="sm"
            variant={gridSize === 4 ? "default" : "ghost"}
            className="h-9 rounded-xl px-3 text-xs font-bold"
            onClick={() => changeGridSize(4)}
          >
            4×4 Classic
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-2xl border border-border/70 bg-card px-4 py-1.5 text-center shadow-soft">
            <span className="block text-[10px] font-bold uppercase text-muted-foreground">Score</span>
            <span className="font-display text-lg font-bold text-foreground leading-none">{score}</span>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card px-4 py-1.5 text-center shadow-soft">
            <span className="block text-[10px] font-bold uppercase text-primary">Best</span>
            <span className="font-display text-lg font-bold text-primary leading-none">{bestScore}</span>
          </div>
        </div>
      </div>

      {/* Game Board Container */}
      <div className="relative mt-5 rounded-[2.2rem] border border-border/80 bg-ink/5 p-4 sm:p-5 shadow-card dark:bg-ink/30">
        <div
          className={cn(
            "grid gap-3 touch-none mx-auto w-full aspect-square max-w-[420px] rounded-[1.8rem] bg-card p-3 sm:p-4 shadow-soft",
            gridSize === 3 ? "grid-cols-3" : "grid-cols-4"
          )}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { pointerStartRef.current = null; }}
          role="region"
          aria-label="2048 game board. Swipe or use buttons to merge numbers."
        >
          {grid.map((row, r) =>
            row.map((val, c) => (
              <div
                key={`${r}-${c}`}
                className={cn(
                  "grid place-items-center rounded-2xl border transition-all duration-150 select-none",
                  getTileStyle(val),
                  getFontSize(val, gridSize),
                  val > 0 && "animate-pop scale-100 shadow-sm"
                )}
              >
                {val > 0 ? val : ""}
              </div>
            ))
          )}
        </div>

        {/* Win overlay */}
        {won && !keepPlaying && (
          <div className="absolute inset-0 z-20 grid place-items-center rounded-[2.2rem] bg-game-end/90 p-6 text-center backdrop-blur-sm animate-pop">
            <div className="max-w-sm rounded-[2rem] bg-card p-8 shadow-card border border-border">
              <Trophy className="mx-auto size-14 text-sun animate-celebrate" />
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-primary">Magnificent!</p>
              <h2 className="mt-1 font-display text-3xl font-bold">You Made 2048!</h2>
              <p className="mt-2 text-sm text-muted-foreground">Score: {score}</p>
              <div className="mt-6 flex flex-col gap-2">
                <Button className="h-12 w-full rounded-2xl font-bold shadow-button" onClick={() => setKeepPlaying(true)}>
                  Keep Playing ⭐
                </Button>
                <Button variant="outline" className="h-12 w-full rounded-2xl font-bold" onClick={() => startNewGame()}>
                  Play Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Game over overlay */}
        {gameOver && (
          <div className="absolute inset-0 z-20 grid place-items-center rounded-[2.2rem] bg-game-end/90 p-6 text-center backdrop-blur-sm animate-pop">
            <div className="max-w-sm rounded-[2rem] bg-card p-8 shadow-card border border-border">
              <span className="text-5xl">🎲</span>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-primary">Game Over</p>
              <h2 className="mt-1 font-display text-3xl font-bold">No More Merges!</h2>
              <p className="mt-2 text-sm text-muted-foreground">Final Score: <strong className="text-foreground">{score}</strong></p>
              <div className="mt-6 flex flex-col gap-2">
                <Button className="h-12 w-full rounded-2xl font-bold shadow-button" onClick={() => startNewGame()}>
                  Try Again <RotateCcw className="size-4" />
                </Button>
                <Button variant="outline" className="h-12 w-full rounded-2xl font-bold" onClick={onDone}>
                  Keep Writing <Pencil className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls & Direction Pad */}
      <div className="mt-5 flex flex-col items-center gap-3">
        <p className="text-xs font-semibold text-muted-foreground text-center">
          Swipe on board, use <kbd className="rounded border px-1.5 py-0.5 bg-secondary text-xs">Arrow Keys</kbd>, or tap below:
        </p>

        {/* Intuitive D-Pad for clicking */}
        <div className="grid grid-cols-3 gap-2 w-48">
          <div />
          <Button
            variant="secondary"
            size="icon"
            className="size-13 rounded-2xl shadow-soft hover:bg-primary hover:text-primary-foreground active:scale-95 transition-transform cursor-pointer"
            onClick={() => handleMove("up")}
            aria-label="Slide Up"
          >
            <ChevronUp className="size-6" />
          </Button>
          <div />

          <Button
            variant="secondary"
            size="icon"
            className="size-13 rounded-2xl shadow-soft hover:bg-primary hover:text-primary-foreground active:scale-95 transition-transform cursor-pointer"
            onClick={() => handleMove("left")}
            aria-label="Slide Left"
          >
            <ChevronLeft className="size-6" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="size-13 rounded-2xl shadow-soft hover:bg-primary hover:text-primary-foreground active:scale-95 transition-transform cursor-pointer"
            onClick={() => handleMove("down")}
            aria-label="Slide Down"
          >
            <ChevronDown className="size-6" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="size-13 rounded-2xl shadow-soft hover:bg-primary hover:text-primary-foreground active:scale-95 transition-transform cursor-pointer"
            onClick={() => handleMove("right")}
            aria-label="Slide Right"
          >
            <ChevronRight className="size-6" />
          </Button>
        </div>
      </div>
    </section>
  );
}