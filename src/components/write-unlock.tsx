import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
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

type Screen = "home" | "write" | "complete" | "games" | "parent" | "runner";
type Order = "sequential" | "custom" | "random";
type GuideMode = "guided" | "semi" | "free";

type AppState = {
  childName: string;
  letters: string[];
  order: Order;
  target: number;
  guide: GuideMode;
  currentIndex: number;
  progress: Record<string, number>;
  completed: string[];
  runnerUnlocked: boolean;
  totalWritten: number;
  sound: boolean;
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const STORAGE_KEY = "write-unlock-progress-v1";
const DEFAULT_STATE: AppState = {
  childName: "Adam",
  letters: ["A", "B", "C"],
  order: "sequential",
  target: 5,
  guide: "guided",
  currentIndex: 0,
  progress: { A: 0, B: 0, C: 0 },
  completed: [],
  runnerUnlocked: false,
  totalWritten: 0,
  sound: true,
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

  const acceptWriting = () => {
    const nextCount = Math.min(currentProgress + 1, state.target);
    const isComplete = nextCount >= state.target;
    setState((previous) => ({
      ...previous,
      progress: { ...previous.progress, [currentLetter]: nextCount },
      completed: isComplete
        ? Array.from(new Set([...previous.completed, currentLetter]))
        : previous.completed,
      runnerUnlocked: isComplete || previous.runnerUnlocked,
      totalWritten: previous.totalWritten + 1,
    }));
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
          <ChildHome state={state} currentLetter={currentLetter} onNavigate={setScreen} />
        )}
        {screen === "write" && (
          <WritingScreen
            letter={currentLetter}
            progress={currentProgress}
            target={state.target}
            guide={state.guide}
            onBack={() => setScreen("home")}
            onAccepted={acceptWriting}
          />
        )}
        {screen === "complete" && (
          <CompletionScreen letter={currentLetter} onPlay={() => setScreen("runner")} />
        )}
        {screen === "games" && (
          <GamesScreen unlocked={state.runnerUnlocked} onPlay={() => setScreen("runner")} />
        )}
        {screen === "parent" && <ParentScreen state={state} setState={setState} onDone={() => setScreen("home")} />}
        {screen === "runner" && <RunnerGame onDone={continueJourney} />}
      </div>

      {screen !== "write" && screen !== "complete" && screen !== "runner" && screen !== "parent" && (
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
  onNavigate,
}: {
  state: AppState;
  currentLetter: string;
  onNavigate: (screen: Screen) => void;
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
              <div className="rounded-full bg-glass px-4 py-2 text-sm font-bold backdrop-blur-md">{progress} / {state.target} written</div>
            </div>
            <Button className="h-14 w-full rounded-2xl text-base font-bold shadow-button sm:w-48" onClick={() => onNavigate("write")}>
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
              <div key={letter} className={cn("grid size-16 shrink-0 place-items-center rounded-full border text-xl font-bold transition-transform", complete && "border-mint-strong bg-mint text-mint-foreground", current && !complete && "border-primary bg-primary text-primary-foreground shadow-glow", !complete && !current && "border-border bg-card text-muted-foreground")}>
                {complete ? <Check aria-label={`${letter} complete`} /> : current ? letter : <Lock className="size-4" aria-label={`${letter} locked`} />}
              </div>
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

function WritingScreen({ letter, progress, target, guide, onBack, onAccepted }: { letter: string; progress: number; target: number; guide: GuideMode; onBack: () => void; onAccepted: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [feedback, setFeedback] = useState<"nice" | "retry" | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    const color = getComputedStyle(document.documentElement).getPropertyValue("--canvas-ink").trim();
    context.strokeStyle = color;
    context.lineWidth = Math.max(9, rect.width / 38);
    context.lineCap = "round";
    context.lineJoin = "round";
    strokesRef.current.forEach((stroke) => {
      if (stroke.length < 2) return;
      const firstPoint = stroke[0];
      if (!firstPoint) return;
      context.beginPath();
      context.moveTo(firstPoint.x * rect.width, firstPoint.y * rect.height);
      stroke.slice(1).forEach((point) => context.lineTo(point.x * rect.width, point.y * rect.height));
      context.stroke();
    });
  }, []);

  useEffect(() => {
    render();
    window.addEventListener("resize", render);
    return () => window.removeEventListener("resize", render);
  }, [render]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    strokesRef.current.push([pointFromEvent(event)]);
  };
  const move = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    strokesRef.current.at(-1)?.push(pointFromEvent(event));
    render();
  };
  const end = () => {
    drawingRef.current = false;
    setStrokeCount(strokesRef.current.length);
  };
  const clear = () => { strokesRef.current = []; setStrokeCount(0); setFeedback(null); render(); };
  const undo = () => { strokesRef.current.pop(); setStrokeCount(strokesRef.current.length); setFeedback(null); render(); };

  const submit = () => {
    const points = strokesRef.current.flat();
    let distance = 0;
    strokesRef.current.forEach((stroke) => stroke.slice(1).forEach((point, index) => {
      const previous = stroke[index];
      if (!previous) return;
      distance += Math.hypot(point.x - previous.x, point.y - previous.y);
    }));
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const width = points.length ? Math.max(...xs) - Math.min(...xs) : 0;
    const height = points.length ? Math.max(...ys) - Math.min(...ys) : 0;
    const meaningful = points.length > 12 && distance > 0.55 && width > 0.18 && height > 0.25;
    if (!meaningful) { setFeedback("retry"); return; }
    setFeedback("nice");
    window.setTimeout(() => { onAccepted(); clear(); }, 650);
  };

  return (
    <section className="mx-auto max-w-3xl">
      <header className="flex items-center justify-between">
        <Button variant="ghost" size="icon" className="size-11 rounded-2xl" onClick={onBack} aria-label="Back home"><ArrowLeft /></Button>
        <div className="text-center"><p className="text-sm font-bold text-primary">Write the letter</p><p className="font-display text-4xl font-bold">{letter}</p></div>
        <div className="grid size-11 place-items-center rounded-2xl bg-sun-soft text-sun-foreground"><Sparkles className="size-5" /></div>
      </header>

      <div className="mt-7 text-center"><h1 className="font-display text-3xl font-bold">Write it your way</h1><p className="mt-2 text-sm font-semibold text-muted-foreground">Use your finger, mouse, or pencil</p></div>

      <div className="relative mt-6 aspect-[4/3] max-h-[58vh] min-h-[390px] overflow-hidden rounded-[2rem] border border-border/70 bg-canvas shadow-card">
        {guide !== "free" && <div className={cn("pointer-events-none absolute inset-0 grid place-items-center font-display text-[16rem] font-bold leading-none text-guide sm:text-[22rem]", guide === "guided" && "guide-dotted")}>{letter}</div>}
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
        <Button size="icon" className="size-16 rounded-full shadow-button" onClick={submit} disabled={!strokeCount} aria-label="Check my writing"><Check className="size-7" /></Button>
      </div>
    </section>
  );
}

function CompletionScreen({ letter, onPlay }: { letter: string; onPlay: () => void }) {
  return (
    <section className="mx-auto flex min-h-[85vh] max-w-3xl flex-col items-center justify-center text-center">
      <div className="relative grid size-32 place-items-center rounded-full bg-sun-soft text-6xl font-bold text-sun-foreground shadow-glow animate-celebrate">{letter}<Check className="absolute -right-1 top-1 size-9 rounded-full bg-mint p-1.5 text-mint-foreground" /></div>
      <p className="mt-8 text-sm font-bold text-primary">LETTER COMPLETE</p>
      <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">Nicely written!</h1>
      <p className="mt-3 max-w-md font-semibold text-muted-foreground">Your writing unlocked something wonderful.</p>
      <div className="mt-8 w-full overflow-hidden rounded-[2rem] bg-card text-left shadow-card">
        <img src={runnerImage} width={1200} height={900} alt="Red panda running through a floating garden" className="aspect-[2/1] w-full object-cover" />
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div><p className="flex items-center gap-2 text-sm font-bold text-primary"><Sparkles className="size-4" /> NEW GAME</p><h2 className="mt-1 font-display text-2xl font-bold">Endless Runner</h2></div>
          <Button className="h-13 rounded-2xl px-7 font-bold shadow-button" onClick={onPlay}><Play className="fill-current" /> Play now</Button>
        </div>
      </div>
    </section>
  );
}

function GamesScreen({ unlocked, onPlay }: { unlocked: boolean; onPlay: () => void }) {
  const future = [{ name: "Cloud Flyer", icon: "☁️" }, { name: "Space Dash", icon: "🚀" }, { name: "Ocean Hop", icon: "🐠" }];
  return (
    <section>
      <header className="flex items-center justify-between"><Brand /><div className="rounded-full bg-card px-4 py-2 text-sm font-bold shadow-soft">{unlocked ? 1 : 0} unlocked</div></header>
      <div className="mt-12"><p className="text-sm font-bold text-primary">Your rewards</p><h1 className="mt-2 font-display text-4xl font-bold">Game garden</h1></div>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <article className="overflow-hidden rounded-[2rem] bg-card shadow-card">
          <div className="relative"><img src={runnerImage} width={1200} height={900} loading="lazy" alt="Endless Runner game" className={cn("aspect-[16/10] w-full object-cover", !unlocked && "grayscale")} />{!unlocked && <div className="absolute inset-0 grid place-items-center bg-locked-overlay"><div className="rounded-full bg-glass p-4 backdrop-blur"><Lock /></div></div>}</div>
          <div className="flex items-center justify-between p-6"><div><p className="font-display text-xl font-bold">Endless Runner</p><p className="mt-1 text-sm font-semibold text-muted-foreground">{unlocked ? "Run, jump, collect stars" : "Complete a letter to unlock"}</p></div>{unlocked && <Button size="icon" className="size-12 rounded-full" onClick={onPlay} aria-label="Play Endless Runner"><Play className="fill-current" /></Button>}</div>
        </article>
        {future.map((game) => <article key={game.name} className="flex min-h-48 items-center gap-5 rounded-[2rem] border border-border bg-card p-7 opacity-70"><div className="grid size-20 place-items-center rounded-[1.5rem] bg-secondary text-4xl">{game.icon}</div><div><Lock className="mb-3 size-4 text-muted-foreground" /><h2 className="font-display text-xl font-bold">{game.name}</h2><p className="mt-1 text-sm font-semibold text-muted-foreground">A future writing reward</p></div></article>)}
      </div>
    </section>
  );
}

function ParentScreen({ state, setState, onDone }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; onDone: () => void }) {
  const [tab, setTab] = useState<"overview" | "plan" | "settings">("overview");
  const currentLetter = state.letters[state.currentIndex] ?? state.letters[0] ?? "A";
  const toggleLetter = (letter: string) => {
    setState((previous) => {
      const selected = previous.letters.includes(letter);
      if (selected && previous.letters.length === 1) return previous;
      const letters = selected ? previous.letters.filter((item) => item !== letter) : [...previous.letters, letter].sort();
      return { ...previous, letters, currentIndex: 0, progress: { ...previous.progress, [letter]: previous.progress[letter] ?? 0 } };
    });
  };
  const reset = () => setState((previous) => ({ ...DEFAULT_STATE, childName: previous.childName, sound: previous.sound }));
  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-4"><Brand parent /><Button className="h-11 rounded-2xl px-5 font-bold" onClick={onDone}><Check /> Done</Button></header>
      <nav className="mt-8 flex gap-2 overflow-x-auto rounded-2xl bg-secondary p-1.5" aria-label="Parent sections">
        {(["overview", "plan", "settings"] as const).map((item) => <Button key={item} variant={tab === item ? "default" : "ghost"} className="h-11 flex-1 rounded-xl capitalize" onClick={() => setTab(item)}>{item === "overview" ? <Home /> : item === "plan" ? <Pencil /> : <Settings2 />}{item}</Button>)}
      </nav>

      {tab === "overview" && <div className="mt-9"><p className="text-sm font-bold text-primary">Good morning</p><h1 className="mt-2 font-display text-4xl font-bold">{state.childName}&apos;s progress</h1><div className="mt-7 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]"><div className="rounded-[2rem] bg-ink p-7 text-ink-foreground shadow-card sm:p-9"><p className="text-sm font-bold text-ink-muted">Writing journey</p><div className="mt-4 flex items-end justify-between"><p className="font-display text-5xl font-bold">{state.completed.length}<span className="text-xl text-ink-muted"> / {state.letters.length}</span></p><Trophy className="size-9 text-sun" /></div><progress className="progress progress-light mt-7 h-2 w-full" value={state.completed.length} max={state.letters.length}>Letters complete</progress><div className="mt-8 border-t border-ink-line pt-6"><p className="text-sm font-semibold text-ink-muted">Current practice</p><p className="mt-2 text-xl font-bold">{currentLetter} · {state.progress[currentLetter] ?? 0} / {state.target}</p></div></div><div className="grid gap-4"><StatCard icon={<Pencil />} value={state.totalWritten} label="Total writings" tone="coral" /><StatCard icon={<Gamepad2 />} value={state.runnerUnlocked ? 1 : 0} label="Games unlocked" tone="yellow" /></div></div></div>}

      {tab === "plan" && <div className="mt-9"><p className="text-sm font-bold text-primary">Practice plan</p><h1 className="mt-2 font-display text-4xl font-bold">Choose the journey</h1><div className="mt-7 rounded-[2rem] bg-card p-6 shadow-soft sm:p-8"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Choose letters</h2><span className="text-sm font-semibold text-muted-foreground">{state.letters.length} selected</span></div><div className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-9 md:grid-cols-13">{ALPHABET.map((letter) => <Button key={letter} variant={state.letters.includes(letter) ? "default" : "outline"} className="aspect-square h-auto rounded-xl p-0 text-base font-bold" onClick={() => toggleLetter(letter)}>{letter}</Button>)}</div></div><div className="mt-5 grid gap-5 md:grid-cols-2"><div className="rounded-[2rem] bg-card p-6 shadow-soft sm:p-8"><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">How many times?</h2><span className="font-display text-3xl font-bold text-primary">{state.target}</span></div><Slider className="mt-7" min={3} max={20} step={1} value={[state.target]} onValueChange={(value) => setState((previous) => ({ ...previous, target: value[0] ?? 5 }))} aria-label="Writing target" /><div className="mt-6 flex gap-2">{[5, 10, 15, 20].map((value) => <Button key={value} size="sm" variant={state.target === value ? "default" : "outline"} className="flex-1 rounded-xl" onClick={() => setState((previous) => ({ ...previous, target: value }))}>{value}</Button>)}</div></div><div className="rounded-[2rem] bg-card p-6 shadow-soft sm:p-8"><h2 className="font-display text-xl font-bold">Letter order</h2><div className="mt-5 grid gap-2">{([{ key: "sequential", label: "Sequential", icon: <Target /> }, { key: "custom", label: "My selected order", icon: <Pencil /> }, { key: "random", label: "Mix it up", icon: <Shuffle /> }] as const).map((option) => <Button key={option.key} variant={state.order === option.key ? "default" : "outline"} className="h-12 justify-start rounded-xl" onClick={() => setState((previous) => ({ ...previous, order: option.key }))}>{option.icon}{option.label}</Button>)}</div></div></div><div className="mt-5 rounded-[2rem] bg-card p-6 shadow-soft sm:p-8"><h2 className="font-display text-xl font-bold">Writing guide</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{(["guided", "semi", "free"] as GuideMode[]).map((mode) => <Button key={mode} variant={state.guide === mode ? "default" : "outline"} className="h-14 rounded-xl capitalize" onClick={() => setState((previous) => ({ ...previous, guide: mode }))}>{mode === "semi" ? "Semi-guided" : mode}</Button>)}</div></div><div className="mt-5 overflow-hidden rounded-[2rem] bg-card shadow-soft"><div className="grid md:grid-cols-[180px_1fr]"><img src={runnerImage} width={1200} height={900} loading="lazy" alt="Endless Runner reward" className="h-44 w-full object-cover md:h-full" /><div className="p-6"><p className="text-sm font-bold text-primary">WRITING REWARD</p><h2 className="mt-1 font-display text-2xl font-bold">Endless Runner</h2><p className="mt-2 text-sm font-semibold text-muted-foreground">Completing each letter unlocks one cheerful 30-second run.</p></div></div></div></div>}

      {tab === "settings" && <div className="mt-9 max-w-2xl"><p className="text-sm font-bold text-primary">Settings</p><h1 className="mt-2 font-display text-4xl font-bold">Make it theirs</h1><div className="mt-7 space-y-4 rounded-[2rem] bg-card p-6 shadow-soft sm:p-8"><label className="block"><span className="text-sm font-bold">Child&apos;s name</span><Input className="mt-2 h-12 rounded-xl bg-background" value={state.childName} maxLength={20} onChange={(event) => setState((previous) => ({ ...previous, childName: event.target.value || "Writer" }))} /></label><div className="flex items-center justify-between rounded-2xl bg-secondary p-4"><div className="flex items-center gap-3">{state.sound ? <Volume2 /> : <VolumeX />}<div><p className="font-bold">Sounds</p><p className="text-sm text-muted-foreground">Celebration and game sounds</p></div></div><Button variant={state.sound ? "default" : "outline"} className="rounded-xl" onClick={() => setState((previous) => ({ ...previous, sound: !previous.sound }))}>{state.sound ? "On" : "Off"}</Button></div><Button variant="outline" className="h-12 w-full rounded-xl text-destructive" onClick={reset}><RotateCcw /> Reset progress</Button></div></div>}
    </section>
  );
}

function RunnerGame({ onDone }: { onDone: () => void }) {
  const [time, setTime] = useState(30);
  const [score, setScore] = useState(0);
  const [jumping, setJumping] = useState(false);
  const [finished, setFinished] = useState(false);

  const jump = useCallback(() => {
    if (jumping || finished) return;
    setJumping(true);
    setScore((value) => value + 1);
    window.setTimeout(() => setJumping(false), 650);
  }, [finished, jumping]);

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