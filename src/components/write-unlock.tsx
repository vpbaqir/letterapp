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
  ShieldCheck,
  Shuffle,
  Sparkles,
  Star,
  Target,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Trophy,
  Undo2,
  UserRoundCog,
  Volume2,
  VolumeX,
  X,
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

export type VerificationRecord = {
  id: string;
  letter: string;
  timestamp: number;
  isTrue: boolean;
  starsChange: number;
};

export type AppGame = {
  id: Screen;
  name: string;
  icon: string;
  desc: string;
  reqStars: number;
  category: "action" | "puzzle" | "numbers";
};

export const ALL_GAMES: AppGame[] = [
  // Novice Milestones (15 to 140 Stars)
  { id: "runner", name: "Endless Runner", icon: "🦊", desc: "Run, jump, and collect shiny stars!", reqStars: 15, category: "action" },
  { id: "color-wheel", name: "Color Wheel", icon: "🎨", desc: "Tap matching colors as fast as you can.", reqStars: 30, category: "puzzle" },
  { id: "stop-at-100", name: "Stop at 100", icon: "💯", desc: "Test your timing to stop right on 100!", reqStars: 50, category: "action" },
  { id: "lights-out", name: "Lights Out", icon: "💡", desc: "Turn off every light tile on the grid.", reqStars: 75, category: "puzzle" },
  { id: "perfect-stack", name: "Perfect Stack", icon: "🧱", desc: "Stack the moving blocks to the sky.", reqStars: 105, category: "action" },
  { id: "number-merge", name: "Number Merge 2048", icon: "🔢", desc: "Slide & combine numbers to build up to 2048!", reqStars: 140, category: "numbers" },

  // Explorer Milestones (180 to 455 Stars)
  { id: "cloud-flyer", name: "Cloud Flyer", icon: "☁️", desc: "Float high through the clouds and dodge thunder.", reqStars: 180, category: "action" },
  { id: "orbit-tap", name: "Orbit Tap", icon: "🎯", desc: "Tap right when the orbiting ball hits the target.", reqStars: 225, category: "action" },
  { id: "one-line", name: "One Line", icon: "〰️", desc: "Connect every dot in a continuous loop.", reqStars: 275, category: "puzzle" },
  { id: "number-path", name: "Number Path", icon: "🔢", desc: "Tap shuffled numbers in order from 1 to 16.", reqStars: 330, category: "numbers" },
  { id: "flip-four", name: "Flip Four", icon: "🔲", desc: "Flip tiles until all 4 colors match.", reqStars: 390, category: "puzzle" },
  { id: "make-ten", name: "Make Ten", icon: "🔟", desc: "Find combinations that add up to 10.", reqStars: 455, category: "numbers" },

  // Master Milestones (525 to 850 Stars)
  { id: "ocean-hop", name: "Ocean Hop", icon: "🐠", desc: "Leap across lily pads with the cheerful fish.", reqStars: 525, category: "action" },
  { id: "higher-lower", name: "Higher or Lower", icon: "⬆️", desc: "Guess if the next secret number is higher or lower.", reqStars: 600, category: "numbers" },
  { id: "plus-one", name: "Plus One", icon: "➕", desc: "Tap tiles to add one until every number is 5.", reqStars: 680, category: "numbers" },
  { id: "slide-to-exit", name: "Slide to Exit", icon: "🚪", desc: "Slide the red block to escape through the door.", reqStars: 765, category: "puzzle" },
  { id: "space-dash", name: "Space Dash", icon: "🚀", desc: "Rocket through space and blast asteroids.", reqStars: 850, category: "action" },
];

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
  stars: number;
  parentVerificationEnabled: boolean;
  verificationHistory?: VerificationRecord[];
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
  stars: 0,
  parentVerificationEnabled: true,
  verificationHistory: [],
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
        const parsed = JSON.parse(saved) as Partial<AppState>;
        setState({
          ...DEFAULT_STATE,
          ...parsed,
          stars: typeof parsed.stars === "number" ? parsed.stars : 0,
          parentVerificationEnabled:
            typeof parsed.parentVerificationEnabled === "boolean"
              ? parsed.parentVerificationEnabled
              : true,
          verificationHistory: Array.isArray(parsed.verificationHistory)
            ? parsed.verificationHistory
            : [],
        });
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
  const unlockedGamesCount = ALL_GAMES.filter((g) => (state.stars ?? 0) >= g.reqStars).length;

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

  const handleVerifyWriting = (isTrue: boolean): { starsChange: number; isComplete: boolean } => {
    let starsChange = 0;
    let isComplete = false;

    if (isTrue) {
      starsChange = 5; // More points for right attempt
      const nextCount = Math.min(currentProgress + 1, currentTarget);
      isComplete = nextCount >= currentTarget;

      setState((previous) => {
        const stats = previous.usageStats?.[currentLetter] ?? { attempts: 0, successes: 0 };
        const newRecord: VerificationRecord = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          letter: currentLetter,
          timestamp: Date.now(),
          isTrue: true,
          starsChange: 5,
        };
        const nextStars = (previous.stars ?? 0) + 5;
        return {
          ...previous,
          stars: nextStars,
          progress: { ...previous.progress, [currentLetter]: nextCount },
          completed: isComplete
            ? Array.from(new Set([...previous.completed, currentLetter]))
            : previous.completed,
          runnerUnlocked: isComplete || previous.runnerUnlocked || nextStars >= 15,
          totalWritten: previous.totalWritten + 1,
          usageStats: {
            ...(previous.usageStats ?? {}),
            [currentLetter]: {
              attempts: stats.attempts + 1,
              successes: stats.successes + 1,
            },
          },
          verificationHistory: [newRecord, ...(previous.verificationHistory ?? [])].slice(0, 50),
        };
      });

      if (isComplete) {
        setScreen("complete");
      }
    } else {
      starsChange = -2; // Decreases for false attempt
      setState((previous) => {
        const stats = previous.usageStats?.[currentLetter] ?? { attempts: 0, successes: 0 };
        const newRecord: VerificationRecord = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          letter: currentLetter,
          timestamp: Date.now(),
          isTrue: false,
          starsChange: -2,
        };
        const currentStars = previous.stars ?? 0;
        const nextStars = Math.max(0, currentStars - 2);
        return {
          ...previous,
          stars: nextStars,
          usageStats: {
            ...(previous.usageStats ?? {}),
            [currentLetter]: {
              ...stats,
              attempts: stats.attempts + 1,
            },
          },
          verificationHistory: [newRecord, ...(previous.verificationHistory ?? [])].slice(0, 50),
        };
      });
    }

    return { starsChange, isComplete };
  };

  const acceptWriting = () => {
    const nextCount = Math.min(currentProgress + 1, currentTarget);
    const isComplete = nextCount >= currentTarget;
    setState((previous) => {
      const stats = previous.usageStats?.[currentLetter] ?? { attempts: 0, successes: 0 };
      const nextStars = (previous.stars ?? 0) + 3;
      return {
        ...previous,
        stars: nextStars,
        progress: { ...previous.progress, [currentLetter]: nextCount },
        completed: isComplete
          ? Array.from(new Set([...previous.completed, currentLetter]))
          : previous.completed,
        runnerUnlocked: isComplete || previous.runnerUnlocked || nextStars >= 15,
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
      {screen === "write" ? (
        <WritingScreen
          letter={currentLetter}
          progress={currentProgress}
          target={currentTarget}
          guide={state.guide}
          soundEnabled={state.sound}
          language={state.language}
          childName={state.childName}
          stars={state.stars ?? 0}
          parentVerificationEnabled={state.parentVerificationEnabled ?? true}
          onToggleParentVerify={(enabled) =>
            setState((prev) => ({ ...prev, parentVerificationEnabled: enabled }))
          }
          onToggleGuide={() => {
            const modes: GuideMode[] = ["guided", "semi", "free"];
            const next = modes[(modes.indexOf(state.guide) + 1) % modes.length] ?? "guided";
            setState((prev) => ({ ...prev, guide: next }));
          }}
          onBack={() => setScreen("home")}
          onAccepted={acceptWriting}
          onVerify={handleVerifyWriting}
          onAttempt={recordAttempt}
        />
      ) : (
        <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-28 pt-5 sm:px-7 lg:px-10 lg:pt-8">
          {screen === "home" && (
            <ChildHome
              state={state}
              currentLetter={currentLetter}
              target={currentTarget}
              unlockedGamesCount={unlockedGamesCount}
              onNavigate={setScreen}
              onSelectLetter={(index) => setState((prev) => ({ ...prev, currentIndex: index }))}
            />
          )}
        {screen === "complete" && (
          <CompletionScreen
            letter={currentLetter}
            stars={state.stars ?? 0}
            soundEnabled={state.sound}
            onPlay={() => setScreen("games")}
            onNextLetter={continueJourney}
          />
        )}
        {screen === "games" && (
          <GamesScreen state={state} onPlay={setScreen} />
        )}
        {screen === "parent" && (
          <ParentScreen
            state={state}
            setState={setState}
            unlockedGamesCount={unlockedGamesCount}
            onDone={() => setScreen("home")}
          />
        )}
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
      )}

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
  unlockedGamesCount,
  onNavigate,
  onSelectLetter,
}: {
  state: AppState;
  currentLetter: string;
  target: number;
  unlockedGamesCount: number;
  onNavigate: (screen: Screen) => void;
  onSelectLetter: (index: number) => void;
}) {
  const progress = state.progress[currentLetter] ?? 0;
  return (
    <>
      <header className="flex items-center justify-between">
        <Brand />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-sun-soft px-3.5 py-1.5 text-sm font-bold text-sun-foreground shadow-soft">
            <Star className="size-4 fill-sun text-sun" />
            <span>{state.stars ?? 0} Stars</span>
          </div>
          <Button variant="ghost" size="icon" className="size-11 rounded-2xl" onClick={() => onNavigate("parent")} aria-label="Open parent space">
            <UserRoundCog className="size-5" />
          </Button>
        </div>
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
          <StatCard icon={<Star className="fill-current" />} value={state.stars ?? 0} label="Stars Collected" tone="yellow" />
          <StatCard icon={<Gamepad2 />} value={unlockedGamesCount} label="Games Unlocked" tone="mint" />
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

function WritingScreen({
  letter,
  progress,
  target,
  guide,
  soundEnabled,
  language,
  childName,
  stars,
  parentVerificationEnabled,
  onToggleParentVerify,
  onToggleGuide,
  onBack,
  onAccepted,
  onVerify,
  onAttempt,
}: {
  letter: string;
  progress: number;
  target: number;
  guide: GuideMode;
  soundEnabled: boolean;
  language: string;
  childName: string;
  stars: number;
  parentVerificationEnabled: boolean;
  onToggleParentVerify: (enabled: boolean) => void;
  onToggleGuide?: () => void;
  onBack: () => void;
  onAccepted: () => void;
  onVerify: (isTrue: boolean) => { starsChange: number; isComplete: boolean };
  onAttempt: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [showParentVerify, setShowParentVerify] = useState(false);
  const [canvasPreview, setCanvasPreview] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    text: string;
    type: "success" | "penalty" | "nice";
  } | null>(null);

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
    const color = styleInk || "#1D4ED8";
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = Math.max(12, rect.width / 26);
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
    setFeedbackBanner(null);
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

  const undo = () => {
    strokesRef.current.pop();
    setStrokeCount(strokesRef.current.length);
    setFeedbackBanner(null);
    render();
  };

  const submit = () => {
    if (!strokesRef.current.length) {
      setFeedbackBanner({ text: `Trace or write ${letter} first! ✏️`, type: "nice" });
      window.setTimeout(() => setFeedbackBanner(null), 1800);
      return;
    }

    if (parentVerificationEnabled) {
      try {
        const url = canvasRef.current?.toDataURL();
        setCanvasPreview(url || null);
      } catch {
        setCanvasPreview(null);
      }
      setShowParentVerify(true);
    } else {
      setFeedbackBanner({ text: "✨ +3 Stars! Good writing!", type: "success" });
      onAttempt();
      if (soundEnabled) playSound("success");
      window.setTimeout(() => {
        onAccepted();
        clear();
      }, 650);
    }
  };

  const handleParentDecision = (isTrue: boolean) => {
    setShowParentVerify(false);
    const { starsChange, isComplete } = onVerify(isTrue);

    if (isTrue) {
      if (soundEnabled) playSound("win");
      setFeedbackBanner({
        text: `🌟 +${starsChange} Stars! Verified Right Attempt!`,
        type: "success",
      });
      window.setTimeout(() => {
        if (!isComplete) {
          clear();
        }
      }, 700);
    } else {
      if (soundEnabled) playSound("retry");
      setFeedbackBanner({
        text: `⭐ ${starsChange} Stars. Needs practice — let's try ${letter} again!`,
        type: "penalty",
      });
      window.setTimeout(() => {
        setFeedbackBanner(null);
      }, 2500);
    }
  };

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#FAF7F0] select-none text-foreground">
      {/* Background Atmosphere - Clouds, Stars, Bubbles, Rolling Hills */}
      {/* Top right fluffy cloud */}
      <div className="absolute -top-3 right-0 sm:right-6 md:right-16 pointer-events-none z-0">
        <svg width="240" height="150" viewBox="0 0 240 150" fill="none" className="opacity-90 scale-90 sm:scale-100">
          <path
            d="M60 120h120c24.85 0 45-20.15 45-45 0-21.78-15.48-39.95-36.14-43.98C184.9 13.56 161.42 0 133.5 0 108.6 0 87.2 10.82 73.12 28.1 69.04 26.75 64.63 26 60 26 33.49 26 12 47.49 12 74c0 4.2.55 8.27 1.58 12.14C5.7 91.24 0 99.95 0 110c0 16.57 13.43 30 30 30h30z"
            fill="url(#cloudGradR)"
          />
          <defs>
            <linearGradient id="cloudGradR" x1="120" y1="0" x2="120" y2="140" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E2EFFF" stopOpacity="0.95" />
              <stop offset="1" stopColor="#C8E1FE" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Mid left fluffy cloud */}
      <div className="absolute top-28 -left-6 sm:left-4 md:left-12 pointer-events-none z-0">
        <svg width="190" height="120" viewBox="0 0 190 120" fill="none" className="opacity-85 scale-85 sm:scale-100">
          <path
            d="M45 95h95c19.33 0 35-15.67 35-35 0-16.8-11.83-30.82-27.67-34.12C144.18 10.95 125.75 0 104 0c-19.38 0-36.08 8.7-47.05 22.37C53.77 21.2 50.45 20.6 47 20.6 26.57 20.6 10 37.17 10 57.6c0 3.3.43 6.48 1.23 9.5C4.46 71.05 0 77.92 0 85.8 0 98.8 10.5 109.3 23.5 109.3H45z"
            fill="url(#cloudGradL)"
          />
          <defs>
            <linearGradient id="cloudGradL" x1="95" y1="0" x2="95" y2="110" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E5F1FF" stopOpacity="0.95" />
              <stop offset="1" stopColor="#D0E5FE" stopOpacity="0.75" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Yellow 5-point Stars */}
      <div className="absolute left-[7%] sm:left-[11%] top-[32%] sm:top-[33%] pointer-events-none z-0">
        <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
          <path
            d="M17 2.8c.6 0 1.2.4 1.4 1l3.3 7.2 7.7 1.1c.7.1 1.2.7 1.2 1.3 0 .3-.1.7-.4.9l-5.7 5.4 1.5 7.7c.1.7-.2 1.3-.8 1.6-.6.3-1.2.2-1.7-.1L17 25.1l-6.9 3.8c-.5.3-1.2.4-1.7.1-.6-.3-.9-1-.8-1.6l1.5-7.7-5.7-5.4c-.3-.2-.4-.6-.4-.9 0-.6.5-1.2 1.2-1.3l7.7-1.1 3.3-7.2c.2-.6.8-1 1.5-1z"
            fill="#FCD34D"
            stroke="#F59E0B"
            strokeWidth="0.8"
          />
        </svg>
      </div>

      <div className="absolute right-[10%] sm:right-[15%] top-[48%] sm:top-[49%] pointer-events-none z-0">
        <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
          <path
            d="M17 2.8c.6 0 1.2.4 1.4 1l3.3 7.2 7.7 1.1c.7.1 1.2.7 1.2 1.3 0 .3-.1.7-.4.9l-5.7 5.4 1.5 7.7c.1.7-.2 1.3-.8 1.6-.6.3-1.2.2-1.7-.1L17 25.1l-6.9 3.8c-.5.3-1.2.4-1.7.1-.6-.3-.9-1-.8-1.6l1.5-7.7-5.7-5.4c-.3-.2-.4-.6-.4-.9 0-.6.5-1.2 1.2-1.3l7.7-1.1 3.3-7.2c.2-.6.8-1 1.5-1z"
            fill="#FCD34D"
            stroke="#F59E0B"
            strokeWidth="0.8"
          />
        </svg>
      </div>

      {/* Floating soft blue dots / bubbles */}
      <div className="absolute left-[9%] top-[26%] size-3.5 rounded-full bg-[#60A5FA]/80 pointer-events-none z-0" />
      <div className="absolute left-[10%] top-[62%] size-3 rounded-full bg-[#60A5FA]/70 pointer-events-none z-0" />
      <div className="absolute right-[13%] top-[41%] size-2.5 rounded-full bg-[#60A5FA]/75 pointer-events-none z-0" />
      <div className="absolute right-[5%] top-[26%] size-2.5 rounded-full bg-[#60A5FA]/75 pointer-events-none z-0" />

      {/* Bottom Rolling Green Hills & Corner Foliage */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none z-0 overflow-hidden h-36 sm:h-48 md:h-56">
        {/* Back rolling hill */}
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="absolute bottom-0 w-full h-28 sm:h-36 md:h-44 fill-[#B9F5D8]">
          <path d="M0,90 Q320,15 720,80 T1440,50 L1440,220 L0,220 Z" />
        </svg>
        {/* Front rolling hill */}
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="absolute bottom-0 w-full h-20 sm:h-28 md:h-34 fill-[#86EFAC]">
          <path d="M0,60 Q420,130 860,50 T1440,70 L1440,220 L0,220 Z" />
        </svg>
        {/* Front ground wave */}
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className="absolute bottom-0 w-full h-12 sm:h-18 fill-[#4ADE80]/30">
          <path d="M0,40 Q500,90 1000,30 T1440,50 L1440,220 L0,220 Z" />
        </svg>

        {/* Left corner foliage / bushes */}
        <div className="absolute left-0 bottom-0 translate-y-3 -translate-x-1 sm:translate-x-2">
          <svg width="100" height="110" viewBox="0 0 100 110" fill="none" className="scale-90 sm:scale-110 origin-bottom-left">
            <ellipse cx="28" cy="74" rx="18" ry="36" transform="rotate(-24 28 74)" fill="#10B981" />
            <ellipse cx="54" cy="58" rx="20" ry="42" transform="rotate(4 54 58)" fill="#059669" />
            <ellipse cx="80" cy="76" rx="16" ry="32" transform="rotate(28 80 76)" fill="#10B981" />
          </svg>
        </div>

        {/* Right corner foliage / bushes */}
        <div className="absolute right-0 bottom-0 translate-y-3 translate-x-1 sm:-translate-x-2">
          <svg width="100" height="110" viewBox="0 0 100 110" fill="none" className="scale-90 sm:scale-110 origin-bottom-right">
            <ellipse cx="72" cy="74" rx="18" ry="36" transform="rotate(24 72 74)" fill="#10B981" />
            <ellipse cx="46" cy="58" rx="20" ry="42" transform="rotate(-4 46 58)" fill="#059669" />
            <ellipse cx="20" cy="76" rx="16" ry="32" transform="rotate(-28 20 76)" fill="#10B981" />
          </svg>
        </div>
      </div>

      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between w-full max-w-5xl mx-auto px-5 sm:px-8 pt-5 sm:pt-7">
        {/* Round back button */}
        <button
          type="button"
          onClick={onBack}
          className="size-11 sm:size-12 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-slate-100 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-800 cursor-pointer"
          aria-label="Back home"
        >
          <ArrowLeft className="size-5 sm:size-5.5 stroke-[2.5]" />
        </button>

        {/* Parent Check Badge / Toggle */}
        <button
          type="button"
          onClick={() => onToggleParentVerify(!parentVerificationEnabled)}
          className="bg-[#EBF3FE] border border-[#BFDBFE] text-[#1D4ED8] px-4 sm:px-5 py-1.5 sm:py-2 rounded-full flex items-center gap-2 font-black text-xs sm:text-sm shadow-[0_2px_10px_rgba(37,99,235,0.08)] cursor-pointer hover:bg-blue-100/80 active:scale-95 transition-all select-none"
          title="Toggle Parent Verification"
        >
          <div className="size-4.5 rounded-full bg-[#007AFF] flex items-center justify-center text-white shrink-0">
            <Check className="size-3 stroke-[3]" />
          </div>
          <span>Parent Check: {parentVerificationEnabled ? "ON" : "OFF"}</span>
        </button>

        {/* Discreet Stars & Pronounce buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex items-center gap-1.5 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-slate-100 px-3.5 py-1.5 text-xs font-black text-slate-700">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span>{stars}</span>
          </div>
          <button
            type="button"
            onClick={pronounce}
            className="size-11 sm:size-12 rounded-full bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-slate-100 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-slate-700 cursor-pointer"
            aria-label="Pronounce letter"
            title="Hear pronunciation"
          >
            <Volume2 className="size-5 text-slate-700" />
          </button>
        </div>
      </header>

      {/* Main Center Area: Letter Card, Progress, and Action Button */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2 sm:py-4">
        {/* Letter Tracing Card */}
        <div className="relative w-full max-w-[310px] sm:max-w-[380px] md:max-w-[430px] aspect-square rounded-[36px] sm:rounded-[44px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.03)] border border-white/90 flex items-center justify-center overflow-hidden">
          {/* Guide Mode Badge / Toggle */}
          {onToggleGuide && (
            <button
              type="button"
              onClick={onToggleGuide}
              className={cn(
                "absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-20 px-3 py-1 rounded-full text-[11px] font-black tracking-wide border shadow-xs transition-all active:scale-95 cursor-pointer select-none",
                guide === "guided" && "bg-blue-50/90 text-blue-700 border-blue-200/80 hover:bg-blue-100",
                guide === "semi" && "bg-amber-50/90 text-amber-800 border-amber-200/80 hover:bg-amber-100",
                guide === "free" && "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
              )}
              title="Click to toggle guide mode"
              aria-label={`Current mode: ${guide}. Click to switch mode`}
            >
              {guide === "guided" ? "Guided" : guide === "semi" ? "Semi-guided" : "Free-hand"}
            </button>
          )}

          {/* Tracing letter background */}
          {guide !== "free" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center select-none transition-all duration-300">
              <span
                className="font-display font-black text-[13.5rem] sm:text-[16.5rem] md:text-[19rem] leading-none tracking-normal select-none transition-all duration-300"
                style={
                  guide === "semi"
                    ? {
                        color: "#2563EB",
                        opacity: 0.65,
                        filter: "blur(2.5px)",
                      }
                    : {
                        background:
                          "linear-gradient(180deg, #4EA8DE 0%, #2B7FFF 35%, #38BDF8 80%, #60EFFF 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        filter: "drop-shadow(0 2px 8px rgba(37,99,235,0.15))",
                        opacity: 1,
                      }
                }
              >
                {letter}
              </span>

              {/* Stroke guide arrows only in full guided mode */}
              {guide === "guided" && letter.toUpperCase() === "A" && (
                <div className="absolute top-[54.5%] w-[38%] flex items-center justify-between pointer-events-none opacity-40 px-1">
                  <span className="text-sky-500 font-bold text-xs select-none">◄</span>
                  <div className="h-0.5 border-b-2 border-dashed border-sky-400 flex-1 mx-1" />
                  <span className="text-sky-500 font-bold text-xs select-none">►</span>
                </div>
              )}
            </div>
          )}

          {/* Canvas for child's drawing */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 size-full touch-none cursor-crosshair z-10"
            aria-label={`Drawing area for letter ${letter}`}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          />

          {/* Discreet Undo / Clear tools */}
          <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20 flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
            {strokeCount > 0 && (
              <>
                <button
                  type="button"
                  onClick={undo}
                  className="size-8 sm:size-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
                  title="Undo stroke"
                  aria-label="Undo"
                >
                  <Undo2 className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={clear}
                  className="size-8 sm:size-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
                  title="Clear all"
                  aria-label="Clear"
                >
                  <RotateCcw className="size-4" />
                </button>
              </>
            )}
          </div>

          {/* Feedback banner */}
          {feedbackBanner && (
            <div
              className={cn(
                "pointer-events-none absolute inset-x-0 top-5 mx-auto w-fit max-w-[90%] rounded-full px-5 py-2 text-xs sm:text-sm font-black shadow-card animate-pop text-center z-30",
                feedbackBanner.type === "success" && "bg-mint text-mint-foreground border-2 border-mint-strong",
                feedbackBanner.type === "penalty" && "bg-coral text-white border-2 border-coral-soft",
                feedbackBanner.type === "nice" && "bg-sun text-sun-foreground"
              )}
            >
              {feedbackBanner.text}
            </div>
          )}
        </div>

        {/* Progress Bar under Card */}
        <div className="w-full max-w-[310px] sm:max-w-[380px] md:max-w-[430px] mt-4 sm:mt-5.5">
          <div className="h-3 sm:h-3.5 w-full rounded-full bg-[#DBEAFE] overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#007AFF] to-[#3B82F6] transition-all duration-500 shadow-[0_2px_8px_rgba(0,122,255,0.4)]"
              style={{
                width: `${Math.max(4, Math.min(100, (progress / target) * 100))}%`,
              }}
            />
          </div>
        </div>

        {/* Action: "Done" Button with Celebration Rays */}
        <div className="mt-5 sm:mt-6 flex items-center justify-center gap-2 sm:gap-3">
          {/* Left sparkle rays */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#22C55E] stroke-current stroke-[3] stroke-linecap-round select-none shrink-0">
            <line x1="18" y1="5" x2="8" y2="7" />
            <line x1="20" y1="12" x2="6" y2="12" />
            <line x1="18" y1="19" x2="8" y2="17" />
          </svg>

          <button
            type="button"
            onClick={submit}
            className="px-9 sm:px-11 py-3 sm:py-3.5 rounded-full bg-gradient-to-b from-[#22C55E] to-[#16A34A] hover:from-[#16A34A] hover:to-[#15803D] active:scale-95 transition-all text-white font-black text-base sm:text-lg shadow-[0_12px_24px_-4px_rgba(34,197,94,0.42)] flex items-center justify-center gap-2.5 cursor-pointer select-none"
          >
            <Check className="size-5.5 sm:size-6 stroke-[3.5] text-white" />
            <span>Done</span>
          </button>

          {/* Right sparkle rays */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#22C55E] stroke-current stroke-[3] stroke-linecap-round select-none shrink-0">
            <line x1="6" y1="5" x2="16" y2="7" />
            <line x1="4" y1="12" x2="18" y2="12" />
            <line x1="6" y1="19" x2="16" y2="17" />
          </svg>
        </div>
      </div>

      {/* Spacer to balance bottom */}
      <div className="h-6 sm:h-8" />

      {/* Parent Verification Modal - Responsive for Mobile & Desktop */}
      {showParentVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-md animate-pop">
          <div className="relative w-full max-w-[340px] sm:max-w-[440px] md:max-w-[540px] max-h-[94vh] overflow-y-auto bg-white rounded-[28px] sm:rounded-[36px] md:rounded-[40px] p-4 sm:p-6 md:p-7 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15),0_10px_25px_-5px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col items-center text-foreground">
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setShowParentVerify(false)}
              className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 size-8.5 sm:size-10 rounded-full bg-slate-100/90 hover:bg-slate-200 border border-slate-200/60 flex items-center justify-center text-slate-500 hover:text-slate-900 active:scale-95 transition-all shadow-xs cursor-pointer z-10"
              aria-label="Close parent verification"
            >
              <X className="size-4 sm:size-5 stroke-[2.5]" />
            </button>

            {/* Circular Blue Shield Icon */}
            <div className="size-10 sm:size-13 rounded-full bg-[#EBF3FE] flex items-center justify-center shadow-xs mb-1.5 sm:mb-2">
              <div className="size-5.5 sm:size-7 rounded-full bg-[#007AFF] flex items-center justify-center text-white shadow-xs">
                <Check className="size-3 sm:size-4 stroke-[3.5]" />
              </div>
            </div>

            {/* Parent Check: ON Pill Badge */}
            <div className="bg-[#EBF3FE] border border-[#BFDBFE] text-[#007AFF] px-3 sm:px-3.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1.5 font-black text-xs sm:text-sm shadow-xs mb-3 sm:mb-5 select-none">
              <div className="size-3 sm:size-3.5 rounded-full bg-[#007AFF] flex items-center justify-center text-white shrink-0">
                <Check className="size-2 stroke-[3]" />
              </div>
              <span>Parent Check: ON</span>
            </div>

            {/* Responsive Cards & Buttons Grid:
                - On mobile: Two compact stacked rounded cards (h-26 sm:h-30 md:h-auto md:aspect-square) + 2 side-by-side action buttons
                - On md/desktop: Side-by-side square cards with action buttons directly underneath each card
            */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 w-full">
              {/* Target Standard Letter Card */}
              <div className="col-span-2 md:col-span-1 h-26 sm:h-30 md:h-auto md:aspect-square rounded-[22px] sm:rounded-[28px] bg-[#F0F6FF] border border-blue-100/70 flex items-center justify-center p-2.5 sm:p-3 shadow-inner/40">
                <span className="font-display font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-[#1E293B] leading-none select-none">
                  {letter}
                </span>
              </div>

              {/* Child's Writing Attempt Card */}
              <div className="col-span-2 md:col-span-1 h-26 sm:h-30 md:h-auto md:aspect-square rounded-[22px] sm:rounded-[28px] bg-[#FFFBEB] border border-amber-100/70 flex items-center justify-center p-2.5 sm:p-3 overflow-hidden shadow-inner/40">
                {canvasPreview ? (
                  <img
                    src={canvasPreview}
                    alt={`${childName}'s writing attempt`}
                    className="size-full object-contain filter drop-shadow-xs"
                  />
                ) : (
                  <span className="font-display font-black text-5xl sm:text-6xl text-blue-500 italic select-none">
                    {letter}
                  </span>
                )}
              </div>

              {/* Red ✕ Button (Incorrect: -2 Stars) */}
              <button
                type="button"
                onClick={() => handleParentDecision(false)}
                className="col-span-1 h-12 sm:h-13 md:h-15 rounded-2xl sm:rounded-3xl md:rounded-[24px] bg-[#FEE2E2] hover:bg-[#FECACA] border border-red-200/60 flex items-center justify-center text-[#EF4444] shadow-xs active:scale-95 transition-all cursor-pointer"
                title="Needs practice (-2 Stars)"
                aria-label="Mark attempt as incorrect"
              >
                <X className="size-6 sm:size-7 stroke-[3.5]" />
              </button>

              {/* Green ✔ Button (Correct: +5 Stars) */}
              <button
                type="button"
                onClick={() => handleParentDecision(true)}
                className="col-span-1 h-12 sm:h-13 md:h-15 rounded-2xl sm:rounded-3xl md:rounded-[24px] bg-[#D1FAE5] hover:bg-[#A7F3D0] border border-emerald-200/60 flex items-center justify-center text-[#10B981] shadow-xs active:scale-95 transition-all cursor-pointer"
                title="Correct! (+5 Stars)"
                aria-label="Mark attempt as correct"
              >
                <Check className="size-6 sm:size-7 stroke-[3.5]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CompletionScreen({
  letter,
  stars,
  soundEnabled,
  onPlay,
  onNextLetter,
}: {
  letter: string;
  stars: number;
  soundEnabled: boolean;
  onPlay: () => void;
  onNextLetter: () => void;
}) {
  useEffect(() => {
    if (soundEnabled) playSound("win");
  }, [soundEnabled]);
  return (
    <section className="mx-auto flex min-h-[85vh] max-w-3xl flex-col items-center justify-center text-center">
      <div className="relative grid size-32 place-items-center rounded-full bg-sun-soft text-6xl font-bold text-sun-foreground shadow-glow animate-celebrate">
        {letter}
        <Check className="absolute -right-1 top-1 size-9 rounded-full bg-mint p-1.5 text-mint-foreground" />
      </div>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-sun-soft px-4 py-1.5 font-extrabold text-sun-foreground text-sm shadow-soft">
        <Star className="size-4 fill-sun text-sun" />
        <span>You now have {stars} Stars to unlock games!</span>
      </div>
      <p className="mt-4 text-sm font-bold text-primary">LETTER COMPLETE</p>
      <h1 className="mt-1 font-display text-4xl font-bold sm:text-5xl">Nicely written!</h1>
      <p className="mt-2 max-w-md font-semibold text-muted-foreground">
        Your writing unlocked new games in the Game Garden. Keep collecting stars!
      </p>
      <div className="mt-8 w-full overflow-hidden rounded-[2rem] bg-card text-left shadow-card">
        <img src={runnerImage} width={1200} height={900} alt="Game garden" className="aspect-[2/1] w-full object-cover" />
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-primary">
              <Sparkles className="size-4" /> REWARD UNLOCKED
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold">Game Garden</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-13 rounded-2xl px-6 font-bold" onClick={onNextLetter}>
              <Pencil /> Next letter
            </Button>
            <Button className="h-13 rounded-2xl px-7 font-bold shadow-button" onClick={onPlay}>
              <Gamepad2 className="fill-current" /> Go to games
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function GamesScreen({ state, onPlay }: { state: AppState; onPlay: (screen: Screen) => void }) {
  const [filter, setFilter] = useState<"all" | "action" | "puzzle" | "numbers">("all");
  const currentStars = state.stars ?? 0;
  const displayedGames = filter === "all" ? ALL_GAMES : ALL_GAMES.filter((g) => g.category === filter);
  const unlockedTotal = ALL_GAMES.filter((g) => currentStars >= g.reqStars).length;

  return (
    <section className="pb-10">
      <header className="flex items-center justify-between">
        <Brand />
        <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-bold shadow-soft">
          <Sparkles className="size-4 text-primary" />
          <span>{unlockedTotal} of {ALL_GAMES.length} unlocked</span>
        </div>
      </header>

      {/* Star Bank Hero Card */}
      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-[2.2rem] bg-gradient-to-r from-sun-soft/80 via-card to-secondary/70 border border-sun/30 p-6 sm:p-7 shadow-card">
        <div className="flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-sun text-sun-foreground shadow-glow animate-celebrate">
            <Star className="size-9 fill-current" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Star Bank</p>
            <h1 className="font-display text-3xl sm:text-4xl font-black text-foreground">
              {currentStars} {currentStars === 1 ? "Star" : "Stars"} Collected
            </h1>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              Every verified writing earns +5 stars to unlock more mini-games!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-card border border-border/70 px-5 py-3 text-center shadow-soft">
            <span className="block text-[11px] font-bold uppercase text-muted-foreground">Games Unlocked</span>
            <span className="font-display text-2xl font-bold text-primary">
              {unlockedTotal} / {ALL_GAMES.length}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-9 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-primary">Game Garden</p>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold">Pick a game to play</h2>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-muted-foreground">
            Games unlock automatically as you collect stars from handwriting!
          </p>
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
            All ({ALL_GAMES.length})
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

      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {displayedGames.map((game) => {
          const unlocked = currentStars >= game.reqStars;
          const needed = Math.max(0, game.reqStars - currentStars);

          return (
            <article
              key={game.id}
              className={cn(
                "group relative flex flex-col justify-between rounded-[2rem] border border-border bg-card p-6 shadow-soft transition-all hover:shadow-card hover:-translate-y-1",
                !unlocked && "opacity-80 bg-card/60"
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="grid size-16 place-items-center rounded-2xl bg-secondary text-3xl transition-transform group-hover:scale-105">
                    {game.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {game.category}
                    </span>
                    <span className={cn(
                      "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold",
                      unlocked ? "bg-sun-soft text-sun-foreground" : "bg-secondary text-muted-foreground"
                    )}>
                      <Star className={cn("size-3", unlocked && "fill-current")} />
                      <span>{game.reqStars} ⭐</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-display text-lg font-bold leading-snug">{game.name}</h3>
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
                      className="h-10 rounded-xl px-4 font-bold shadow-button cursor-pointer flex items-center gap-1.5 bg-primary text-primary-foreground"
                      onClick={() => onPlay(game.id)}
                      aria-label={`Play ${game.name}`}
                    >
                      <span>Play</span>
                      <Play className="size-3.5 fill-current" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 pr-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground mb-1">
                        <span className="flex items-center gap-1">
                          <Lock className="size-3 shrink-0" />
                          <span>Need {needed} more ⭐</span>
                        </span>
                        <span>{Math.min(currentStars, game.reqStars)}/{game.reqStars}</span>
                      </div>
                      <progress
                        className="progress h-1.5 w-full"
                        value={currentStars}
                        max={game.reqStars}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled
                      className="h-9 rounded-xl px-3 text-xs font-bold opacity-60 shrink-0"
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

function ParentScreen({
  state,
  setState,
  unlockedGamesCount,
  onDone,
}: {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  unlockedGamesCount: number;
  onDone: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "plan" | "analytics" | "settings">("overview");
  const currentLetter = state.letters[state.currentIndex] ?? state.letters[0] ?? "A";
  const historyList = state.verificationHistory ?? [];
  const verifiedTrueCount = historyList.filter((item) => item.isTrue).length;
  const verifiedFalseCount = historyList.filter((item) => !item.isTrue).length;
  const totalVerified = historyList.length;
  const verificationAccuracy = totalVerified > 0 ? Math.round((verifiedTrueCount / totalVerified) * 100) : 0;

  const toggleLetter = (letter: string) => {
    setState((previous) => {
      const selected = previous.letters.includes(letter);
      if (selected && previous.letters.length === 1) return previous;
      const letters = selected ? previous.letters.filter((item) => item !== letter) : [...previous.letters, letter].sort();
      return {
        ...previous,
        letters,
        currentIndex: 0,
        progress: { ...previous.progress, [letter]: previous.progress[letter] ?? 0 },
        targets: { ...previous.targets, [letter]: previous.targets?.[letter] ?? previous.target }
      };
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

  const reset = () =>
    setState((previous) => {
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
        stars: 0,
        parentVerificationEnabled: true,
        verificationHistory: [],
      };
    });

  return (
    <section className="pb-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Brand parent />
        <Button className="h-11 rounded-2xl px-5 font-bold" onClick={onDone}>
          <Check /> Done
        </Button>
      </header>

      <nav className="mt-8 flex gap-2 overflow-x-auto rounded-2xl bg-secondary p-1.5" aria-label="Parent sections">
        {(["overview", "plan", "analytics", "settings"] as const).map((item) => (
          <Button
            key={item}
            variant={tab === item ? "default" : "ghost"}
            className="h-11 flex-1 rounded-xl capitalize"
            onClick={() => setTab(item)}
          >
            {item === "overview" ? <Home /> : item === "plan" ? <Pencil /> : item === "analytics" ? <Gamepad2 /> : <Settings2 />}
            {item}
          </Button>
        ))}
      </nav>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="mt-9">
          <p className="text-sm font-bold text-primary">Good day</p>
          <h1 className="mt-2 font-display text-4xl font-bold">{state.childName}&apos;s progress</h1>
          <div className="mt-7 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[2rem] bg-ink p-7 text-ink-foreground shadow-card sm:p-9">
              <p className="text-sm font-bold text-ink-muted">Writing journey</p>
              <div className="mt-4 flex items-end justify-between">
                <p className="font-display text-5xl font-bold">
                  {state.completed.length}
                  <span className="text-xl text-ink-muted"> / {state.letters.length}</span>
                </p>
                <Trophy className="size-9 text-sun" />
              </div>
              <progress className="progress progress-light mt-7 h-2 w-full" value={state.completed.length} max={state.letters.length}>
                Letters complete
              </progress>
              <div className="mt-8 border-t border-ink-line pt-6">
                <p className="text-sm font-semibold text-ink-muted">Current practice letter</p>
                <p className="mt-2 text-xl font-bold">
                  {currentLetter} · {state.progress[currentLetter] ?? 0} / {state.targets?.[currentLetter] ?? state.target}
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <StatCard icon={<Pencil />} value={state.totalWritten} label="Total writings" tone="coral" />
              <StatCard icon={<Star className="fill-current" />} value={state.stars ?? 0} label="Stars Balance" tone="yellow" />
              <StatCard icon={<Gamepad2 />} value={unlockedGamesCount} label="Games Unlocked" tone="mint" />
            </div>
          </div>

          {/* Quick verification banner */}
          <div className="mt-6 rounded-[2rem] border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-6 text-primary" />
              <div>
                <h3 className="font-display text-lg font-bold">Parent Verification Status</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mode is currently <strong>{state.parentVerificationEnabled ? "Active (+5 ⭐ / -2 ⭐)" : "Auto-Accept (+3 ⭐)"}</strong>.
                  {totalVerified > 0 && ` ${verifiedTrueCount} Right attempts and ${verifiedFalseCount} False attempts evaluated.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLAN TAB */}
      {tab === "plan" && (
        <div className="mt-9">
          <p className="text-sm font-bold text-primary">Practice plan</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Choose the journey</h1>

          <div className="mt-7 rounded-[2rem] bg-card p-6 shadow-soft sm:p-8 mb-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Language</h2>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {Object.entries(ALPHABETS).map(([key, info]) => (
                <Button
                  key={key}
                  variant={(state.language ?? "english") === key ? "default" : "outline"}
                  className="h-12 rounded-xl"
                  onClick={() => changeLanguage(key)}
                >
                  {info.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-card p-6 shadow-soft sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Choose letters</h2>
              <span className="text-sm font-semibold text-muted-foreground">{state.letters.length} selected</span>
            </div>
            <div className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-9 md:grid-cols-13">
              {(ALPHABETS[state.language ?? "english"]?.letters ?? DEFAULT_ALPHABET.letters).map((letter) => (
                <Button
                  key={letter}
                  variant={state.letters.includes(letter) ? "default" : "outline"}
                  className="aspect-square h-auto rounded-xl p-0 text-base font-bold"
                  onClick={() => toggleLetter(letter)}
                >
                  {letter}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="rounded-[2rem] bg-card p-6 shadow-soft sm:p-8">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Default target</h2>
                <span className="font-display text-3xl font-bold text-primary">{state.target}</span>
              </div>
              <Slider
                className="mt-7"
                min={3}
                max={20}
                step={1}
                value={[state.target]}
                onValueChange={(value) => {
                  const target = value[0] ?? 5;
                  setState((previous) => ({
                    ...previous,
                    target,
                    targets: Object.fromEntries(previous.letters.map((letter) => [letter, target])),
                  }));
                }}
                aria-label="Writing target"
              />
              <div className="mt-6 flex gap-2">
                {[5, 10, 15, 20].map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={state.target === value ? "default" : "outline"}
                    className="flex-1 rounded-xl"
                    onClick={() =>
                      setState((previous) => ({
                        ...previous,
                        target: value,
                        targets: Object.fromEntries(previous.letters.map((letter) => [letter, value])),
                      }))
                    }
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-card p-6 shadow-soft sm:p-8">
              <h2 className="font-display text-xl font-bold">Letter order</h2>
              <div className="mt-5 grid gap-2">
                {([
                  { key: "sequential", label: "Sequential", icon: <Target /> },
                  { key: "custom", label: "My selected order", icon: <Pencil /> },
                  { key: "random", label: "Mix it up", icon: <Shuffle /> },
                ] as const).map((option) => (
                  <Button
                    key={option.key}
                    variant={state.order === option.key ? "default" : "outline"}
                    className="h-12 justify-start rounded-xl"
                    onClick={() => setState((previous) => ({ ...previous, order: option.key }))}
                  >
                    {option.icon}
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[2rem] bg-card p-6 shadow-soft sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Individual targets</h2>
              <span className="text-sm font-semibold text-muted-foreground">Tap − or +</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {state.letters.map((letter) => {
                const value = state.targets?.[letter] ?? state.target;
                return (
                  <div key={letter} className="flex items-center justify-between rounded-2xl bg-secondary p-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-card font-display text-lg font-bold">
                      {letter}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 rounded-xl"
                        aria-label={`Decrease ${letter} target`}
                        onClick={() =>
                          setState((previous) => ({
                            ...previous,
                            targets: { ...previous.targets, [letter]: Math.max(1, value - 1) },
                          }))
                        }
                      >
                        −
                      </Button>
                      <span className="w-7 text-center font-bold">{value}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 rounded-xl"
                        aria-label={`Increase ${letter} target`}
                        onClick={() =>
                          setState((previous) => ({
                            ...previous,
                            targets: { ...previous.targets, [letter]: Math.min(50, value + 1) },
                          }))
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 rounded-[2rem] bg-card p-6 shadow-soft sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">Writing guide</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Control how much assistance is shown on the canvas</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { mode: "guided" as const, label: "Guided", desc: "Full clear letter & directional arrows" },
                { mode: "semi" as const, label: "Semi-guided", desc: "Soft blurred letter guide without arrows" },
                { mode: "free" as const, label: "Free-hand", desc: "Blank canvas, no guide" },
              ].map(({ mode, label, desc }) => (
                <Button
                  key={mode}
                  variant={state.guide === mode ? "default" : "outline"}
                  className="h-auto flex-col items-start p-4 rounded-xl text-left cursor-pointer"
                  onClick={() => setState((previous) => ({ ...previous, guide: mode }))}
                >
                  <span className="font-bold text-sm">{label}</span>
                  <span className="text-[11px] font-normal opacity-80 mt-1">{desc}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {tab === "analytics" && (
        <div className="mt-9">
          <p className="text-sm font-bold text-primary">Analytics</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Practice & Star Metrics</h1>

          {/* Verification Cards */}
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.6rem] border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-xl bg-mint text-mint-foreground">
                  <Check className="size-6 stroke-[3]" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-mint-strong">{verifiedTrueCount}</p>
                  <p className="text-xs font-semibold text-muted-foreground">Right Attempts (+5 ⭐)</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-xl bg-destructive/15 text-destructive">
                  <X className="size-6 stroke-[3]" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-destructive">{verifiedFalseCount}</p>
                  <p className="text-xs font-semibold text-muted-foreground">False Attempts (-2 ⭐)</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-xl bg-sun-soft text-sun-foreground">
                  <Star className="size-6 fill-current" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-foreground">{state.stars ?? 0}</p>
                  <p className="text-xs font-semibold text-muted-foreground">Current Stars Balance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Log */}
          <div className="mt-7 rounded-[2rem] border border-border bg-card p-6 sm:p-8 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">Recent Parent Verifications</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  History of verified writings with points awarded or deducted.
                </p>
              </div>
              <span className="text-xs font-bold text-primary">Accuracy: {verificationAccuracy}%</span>
            </div>

            {historyList.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-secondary/50 p-6 text-center text-sm font-semibold text-muted-foreground">
                No verifications recorded yet. Enable Parent Verification and have your child practice letters!
              </div>
            ) : (
              <div className="mt-5 divide-y divide-border/60 max-h-80 overflow-y-auto pr-1">
                {historyList.slice(0, 15).map((record) => (
                  <div key={record.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-secondary font-display text-lg font-bold">
                        {record.letter}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {record.isTrue ? "Verified Right Attempt" : "False / Needs Practice"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(record.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-extrabold flex items-center gap-1",
                        record.isTrue ? "bg-mint text-mint-foreground" : "bg-destructive/15 text-destructive"
                      )}
                    >
                      <Star className="size-3 fill-current" />
                      <span>{record.starsChange > 0 ? `+${record.starsChange}` : record.starsChange} Stars</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Practice stats by letter */}
          <div className="mt-7">
            <h2 className="font-display text-xl font-bold">Letter Practice Stats</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(state.usageStats ?? {}).map(
                ([letter, stats]: [string, { attempts: number; successes: number }]) => (
                  <div key={letter} className="flex items-center justify-between rounded-2xl bg-card border border-border p-5 shadow-soft">
                    <div className="flex items-center gap-4">
                      <div className="grid size-12 place-items-center rounded-xl bg-secondary font-display text-2xl font-bold">
                        {letter}
                      </div>
                      <div>
                        <p className="font-bold">Attempts: {stats.attempts}</p>
                        <p className="text-xs font-semibold text-muted-foreground">Successes: {stats.successes}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-bold text-coral">
                        {stats.attempts > 0 ? Math.round((stats.successes / stats.attempts) * 100) : 0}%
                      </p>
                      <p className="text-xs font-semibold text-muted-foreground">Success Rate</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {tab === "settings" && (
        <div className="mt-9 max-w-2xl">
          <p className="text-sm font-bold text-primary">Settings</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Make it theirs</h1>

          <div className="mt-7 space-y-5 rounded-[2rem] bg-card p-6 shadow-soft sm:p-8">
            <label className="block">
              <span className="text-sm font-bold">Child&apos;s name</span>
              <Input
                className="mt-2 h-12 rounded-xl bg-background"
                value={state.childName}
                maxLength={20}
                onChange={(event) =>
                  setState((previous) => ({ ...previous, childName: event.target.value || "Writer" }))
                }
              />
            </label>

            {/* Parent Verification Toggle */}
            <div className="flex items-center justify-between rounded-2xl bg-secondary p-4">
              <div className="flex items-center gap-3 pr-2">
                <ShieldCheck className="size-6 text-primary shrink-0" />
                <div>
                  <p className="font-bold">Require Parent Verification</p>
                  <p className="text-xs text-muted-foreground leading-normal mt-0.5">
                    Parent verifies whether each handwriting is true or false. Right attempts award +5 stars; false attempts decrease 2 stars.
                  </p>
                </div>
              </div>
              <Button
                variant={state.parentVerificationEnabled ? "default" : "outline"}
                className="rounded-xl shrink-0 font-bold"
                onClick={() =>
                  setState((previous) => ({
                    ...previous,
                    parentVerificationEnabled: !previous.parentVerificationEnabled,
                  }))
                }
              >
                {state.parentVerificationEnabled ? "Active" : "Auto Mode"}
              </Button>
            </div>

            {/* Star Bank Manager */}
            <div className="rounded-2xl bg-secondary p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold flex items-center gap-1.5">
                    <Star className="size-4 text-sun fill-sun" />
                    <span>Star Bank Management</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Current Balance: <strong className="text-foreground">{state.stars ?? 0} Stars</strong>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl font-bold"
                    onClick={() => setState((prev) => ({ ...prev, stars: (prev.stars ?? 0) + 5 }))}
                  >
                    +5 ⭐
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl font-bold"
                    onClick={() => setState((prev) => ({ ...prev, stars: (prev.stars ?? 0) + 10 }))}
                  >
                    +10 ⭐
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl font-bold text-destructive hover:bg-destructive/10"
                    onClick={() => setState((prev) => ({ ...prev, stars: 0 }))}
                  >
                    Reset Stars
                  </Button>
                </div>
              </div>
            </div>

            {/* Sound toggle */}
            <div className="flex items-center justify-between rounded-2xl bg-secondary p-4">
              <div className="flex items-center gap-3">
                {state.sound ? <Volume2 /> : <VolumeX />}
                <div>
                  <p className="font-bold">Sounds & Chimes</p>
                  <p className="text-xs text-muted-foreground">Celebration, chime, and star feedback sounds</p>
                </div>
              </div>
              <Button
                variant={state.sound ? "default" : "outline"}
                className="rounded-xl font-bold"
                onClick={() => setState((previous) => ({ ...previous, sound: !previous.sound }))}
              >
                {state.sound ? "On" : "Off"}
              </Button>
            </div>

            <Button variant="outline" className="h-12 w-full rounded-xl text-destructive font-bold cursor-pointer" onClick={reset}>
              <RotateCcw /> Reset all progress & stars
            </Button>
          </div>
        </div>
      )}
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