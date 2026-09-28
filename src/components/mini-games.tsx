import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Trophy, Check } from "lucide-react";
import { playSound } from "./write-unlock";

export type MiniGameId =
  | "lights-out"
  | "perfect-stack"
  | "one-line"
  | "stop-at-100"
  | "number-path"
  | "orbit-tap"
  | "flip-four"
  | "slide-to-exit"
  | "color-wheel"
  | "make-ten"
  | "higher-lower"
  | "plus-one";

export interface MiniGameMeta {
  id: MiniGameId;
  title: string;
  icon: string;
  description: string;
  req: number;
  category: "action" | "puzzle" | "numbers";
}

export const MINI_GAMES: MiniGameMeta[] = [
  { id: "lights-out", title: "Lights Out", icon: "💡", description: "Turn off every light.", req: 1, category: "puzzle" },
  { id: "perfect-stack", title: "Perfect Stack", icon: "🧱", description: "Stack blocks perfectly.", req: 1, category: "action" },
  { id: "one-line", title: "One Line", icon: "〰️", description: "Connect all the dots.", req: 2, category: "puzzle" },
  { id: "stop-at-100", title: "Stop at 100", icon: "💯", description: "Stop as close to 100 as possible.", req: 1, category: "action" },
  { id: "number-path", title: "Number Path", icon: "🔢", description: "Find numbers in order 1 to 16.", req: 2, category: "numbers" },
  { id: "orbit-tap", title: "Orbit Tap", icon: "🎯", description: "Tap at the perfect moment.", req: 2, category: "action" },
  { id: "flip-four", title: "Flip Four", icon: "🔲", description: "Make all tiles match.", req: 2, category: "puzzle" },
  { id: "slide-to-exit", title: "Slide to Exit", icon: "🚪", description: "Free the red block to the exit.", req: 3, category: "puzzle" },
  { id: "color-wheel", title: "Color Wheel", icon: "🎨", description: "Match the target colors fast.", req: 1, category: "puzzle" },
  { id: "make-ten", title: "Make Ten", icon: "🔟", description: "Select numbers that add up to 10.", req: 2, category: "numbers" },
  { id: "higher-lower", title: "Higher or Lower", icon: "⬆️", description: "Guess the next number.", req: 2, category: "numbers" },
  { id: "plus-one", title: "Plus One", icon: "➕", description: "Tap to make every number 5.", req: 3, category: "numbers" },
];

/* =========================================================
   SHARED COMPONENTS
========================================================= */

export function Win({ text }: { text: string }) {
  return (
    <div className="win flex items-center justify-center gap-2">
      <Check className="size-5 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

export function GameShell({
  title,
  back,
  children,
}: {
  title: string;
  back: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="game-page">
      <div className="game-card">
        <button className="back-button flex items-center gap-1.5" onClick={back}>
          <ArrowLeft className="size-4" />
          <span>Games Garden</span>
        </button>

        <h1>{title}</h1>

        {children}
      </div>
    </div>
  );
}

/* =========================================================
   1. LIGHTS OUT
========================================================= */

export function LightsOut({ back, soundEnabled = true }: { back: () => void; soundEnabled?: boolean }) {
  const create = () =>
    Array.from({ length: 25 }, () => Math.random() > 0.5);

  const [board, setBoard] = useState(create);
  const [moves, setMoves] = useState(0);

  const toggle = (index: number) => {
    const row = Math.floor(index / 5);
    const col = index % 5;
    const next = [...board];

    const deltas: [number, number][] = [
      [row, col],
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];

    deltas.forEach(([r, c]) => {
      if (r >= 0 && r < 5 && c >= 0 && c < 5) {
        const i = r * 5 + c;
        next[i] = !next[i];
      }
    });

    setBoard(next);
    setMoves((m) => m + 1);
    if (soundEnabled) playSound("collect", 0.3);
  };

  const won = board.every((x) => !x);

  useEffect(() => {
    if (won && moves > 0 && soundEnabled) {
      playSound("win");
    }
  }, [won, moves, soundEnabled]);

  return (
    <GameShell title="💡 Lights Out" back={back}>
      <div className="info">Moves: {moves}</div>

      <div className="lights-grid">
        {board.map((on, i) => (
          <button
            key={i}
            className={on ? "light on" : "light"}
            onClick={() => toggle(i)}
            aria-label={`Light ${i + 1} ${on ? "on" : "off"}`}
          />
        ))}
      </div>

      {won && <Win text="All lights are off!" />}

      <button
        className="main-button"
        onClick={() => {
          setBoard(create());
          setMoves(0);
        }}
      >
        New Game
      </button>
    </GameShell>
  );
}

/* =========================================================
   2. PERFECT STACK
========================================================= */

export function PerfectStack({ back, soundEnabled = true }: { back: () => void; soundEnabled?: boolean }) {
  const [position, setPosition] = useState(0);
  const [direction, setDirection] = useState(1);
  const [blocks, setBlocks] = useState<number[]>([120]);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameOver) return;

    const timer = setInterval(() => {
      setPosition((p) => {
        let next = p + direction * 4;

        if (next > 240 || next < 0) {
          setDirection((d) => -d);
          next = p + -direction * 4;
        }

        return next;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [direction, gameOver]);

  const drop = () => {
    if (gameOver) return;

    const last = blocks[blocks.length - 1] ?? 120;
    const difference = Math.abs(position - last);

    if (difference > 55) {
      setGameOver(true);
      if (soundEnabled) playSound("retry");
      return;
    }

    setBlocks([...blocks, position]);
    if (soundEnabled) playSound("jump");
  };

  const score = blocks.length - 1;

  useEffect(() => {
    if (score >= 8 && soundEnabled) {
      playSound("win");
    }
  }, [score, soundEnabled]);

  return (
    <GameShell title="🧱 Perfect Stack" back={back}>
      <div className="stack-score">
        Height: <strong>{score}</strong>
      </div>

      <div className="stack-area">
        {blocks.map((x, i) => (
          <div
            key={i}
            className="stack-block"
            style={{
              left: `${x}px`,
              bottom: `${i * 32}px`,
            }}
          />
        ))}

        {!gameOver && (
          <div
            className="moving-block"
            style={{ left: `${position}px` }}
          />
        )}
      </div>

      {gameOver && <Win text={`Stack stopped! Final Height: ${score}`} />}

      <button className="main-button" onClick={drop}>
        DROP BLOCK
      </button>

      <button
        className="secondary-button"
        onClick={() => {
          setBlocks([120]);
          setPosition(0);
          setGameOver(false);
        }}
      >
        Restart
      </button>
    </GameShell>
  );
}

/* =========================================================
   3. ONE LINE
========================================================= */

export function OneLine({ back, soundEnabled = true }: { back: () => void; soundEnabled?: boolean }) {
  const points = [
    [20, 20],
    [80, 20],
    [80, 80],
    [20, 80],
  ];

  const [path, setPath] = useState<number[]>([]);

  const select = (i: number) => {
    if (path.includes(i)) return;
    const nextPath = [...path, i];
    setPath(nextPath);
    if (nextPath.length === points.length) {
      if (soundEnabled) playSound("win");
    } else {
      if (soundEnabled) playSound("collect", 0.3);
    }
  };

  const won = path.length === points.length;

  return (
    <GameShell title="〰️ One Line" back={back}>
      <p className="instruction">
        Connect every dot once by clicking them.
      </p>

      <div className="line-board">
        <svg viewBox="0 0 100 100" className="w-full">
          {path.length > 1 &&
            path.slice(1).map((point, i) => {
              const prevIdx = path[i];
              if (prevIdx === undefined) return null;
              const a = points[prevIdx];
              const b = points[point];
              if (!a || !b) return null;

              return (
                <line
                  key={i}
                  x1={a[0]}
                  y1={a[1]}
                  x2={b[0]}
                  y2={b[1]}
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              );
            })}

          {points.map((p, i) => (
            <circle
              key={i}
              cx={p[0]}
              cy={p[1]}
              r="8"
              fill={path.includes(i) ? "var(--primary, #3b82f6)" : "#a1a1aa"}
              onClick={() => select(i)}
              className="cursor-pointer transition-all hover:scale-110"
            />
          ))}
        </svg>
      </div>

      {won && <Win text="Puzzle complete!" />}

      <button
        className="main-button"
        onClick={() => setPath([])}
      >
        Reset
      </button>
    </GameShell>
  );
}

/* =========================================================
   4. STOP AT 100
========================================================= */

export function StopAt100({ back, soundEnabled = true }: { back: () => void; soundEnabled?: boolean }) {
  const [number, setNumber] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);

  const start = () => {
    if (running) return;

    setNumber(0);
    setRunning(true);

    timer.current = window.setInterval(() => {
      setNumber((n) => {
        const next = n + 1;

        if (next >= 120) {
          if (timer.current) clearInterval(timer.current);
          setRunning(false);
        }

        return next;
      });
    }, 40);
  };

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    setRunning(false);
    const dist = Math.abs(100 - number);
    if (soundEnabled) {
      if (dist === 0) playSound("win");
      else if (dist <= 5) playSound("success");
      else playSound("retry");
    }
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const distance = Math.abs(100 - number);

  return (
    <GameShell title="💯 Stop at 100" back={back}>
      <div className="big-number">{number}</div>

      <p className="text-base font-bold text-muted-foreground">
        {number === 100
          ? "🎉 Perfect 100!"
          : distance > 0 && !running && number > 0
          ? `Distance from 100: ${distance}`
          : "Try to stop right on 100!"}
      </p>

      {!running ? (
        <button className="main-button" onClick={start}>
          START
        </button>
      ) : (
        <button className="stop-button" onClick={stop}>
          STOP NOW!
        </button>
      )}

      <button
        className="secondary-button"
        onClick={() => {
          stop();
          setNumber(0);
        }}
      >
        Reset
      </button>
    </GameShell>
  );
}

/* =========================================================
   5. NUMBER PATH
========================================================= */

export function NumberPath({ back, soundEnabled = true }: { back: () => void; soundEnabled?: boolean }) {
  const [numbers, setNumbers] = useState(() =>
    Array.from({ length: 16 }, (_, i) => i + 1).sort(
      () => Math.random() - 0.5
    )
  );

  const [next, setNext] = useState(1);
  const [mistakes, setMistakes] = useState(0);

  const click = (n: number) => {
    if (n === next) {
      if (n === 16) {
        if (soundEnabled) playSound("win");
      } else {
        if (soundEnabled) playSound("collect", 0.3);
      }
      setNext(next + 1);
    } else {
      if (soundEnabled) playSound("retry", 0.3);
      setMistakes((m) => m + 1);
    }
  };

  const won = next === 17;

  return (
    <GameShell title="🔢 Number Path" back={back}>
      <div className="info">
        Find next number: <strong>{next <= 16 ? next : "DONE!"}</strong>
      </div>

      <div className="number-grid">
        {numbers.map((n) => (
          <button
            key={n}
            className={
              n < next
                ? "number-tile done"
                : "number-tile"
            }
            onClick={() => click(n)}
          >
            {n}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">Mistakes: {mistakes}</p>

      {won && <Win text="Great job finding all 16 numbers!" />}

      <button
        className="main-button"
        onClick={() => {
          setNumbers(
            Array.from(
              { length: 16 },
              (_, i) => i + 1
            ).sort(() => Math.random() - 0.5)
          );
          setNext(1);
          setMistakes(0);
        }}
      >
        New Game
      </button>
    </GameShell>
  );
}

/* =========================================================
   6. ORBIT TAP
========================================================= */

export function OrbitTap({ back, soundEnabled = true }: { back: () => void; soundEnabled?: boolean }) {
  const [angle, setAngle] = useState(0);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setAngle((a) => (a + 6) % 360);
    }, 30);

    return () => clearInterval(timer);
  }, [running]);

  const tap = () => {
    const target = 0;
    const difference = Math.min(
      Math.abs(angle - target),
      360 - Math.abs(angle - target)
    );

    if (difference < 25) {
      const nextScore = score + 1;
      setScore(nextScore);
      if (soundEnabled) {
        if (nextScore > 0 && nextScore % 5 === 0) playSound("win");
        else playSound("collect", 0.4);
      }
    } else {
      setScore(Math.max(0, score - 1));
      if (soundEnabled) playSound("retry", 0.3);
    }
  };

  return (
    <GameShell title="🎯 Orbit Tap" back={back}>
      <p className="instruction">Tap when the ball hits the top red target!</p>

      <div className="orbit">
        <div className="target-dot" />

        <div
          className="orbit-ball"
          style={{
            transform: `rotate(${angle}deg) translateX(120px)`,
          }}
        />
      </div>

      <h2>Score: <strong>{score}</strong></h2>

      <button className="main-button" onClick={tap}>
        TAP NOW!
      </button>

      <button
        className="secondary-button"
        onClick={() => {
          setScore(0);
          setAngle(0);
          setRunning(true);
        }}
      >
        Reset
      </button>
    </GameShell>
  );
}

/* =========================================================
   7. FLIP FOUR
========================================================= */

export function FlipFour({ back, soundEnabled = true }: { back: () => void; soundEnabled?: boolean }) {
  const create = () =>
    Array.from({ length: 4 }, () => Math.random() > 0.5);

  const [tiles, setTiles] = useState(create);

  const flip = (index: number) => {
    const next = [...tiles];

    [index, (index + 1) % 4].forEach(
      (i) => (next[i] = !next[i])
    );

    setTiles(next);
    if (soundEnabled) playSound("collect", 0.3);
  };

  const won =
    tiles.every((x) => x) || tiles.every((x) => !x);

  useEffect(() => {
    if (won && soundEnabled) {
      playSound("win");
    }
  }, [won, soundEnabled]);

  return (
    <GameShell title="🔲 Flip Four" back={back}>
      <p className="instruction">Flip tiles until they all match!</p>

      <div className="four-grid">
        {tiles.map((active, i) => (
          <button
            key={i}
            className={active ? "flip active" : "flip"}
            onClick={() => flip(i)}
            aria-label={`Tile ${i + 1} ${active ? "active" : "inactive"}`}
          />
        ))}
      </div>

      {won && <Win text="All tiles match!" />}

      <button
        className="main-button"
        onClick={() => setTiles(create())}
      >
        New Game
      </button>
    </GameShell>
  );
}

/* =========================================================
   8. SLIDE TO EXIT
========================================================= */

export function SlideToExit({ back, soundEnabled = true }: { back: () => void; soundEnabled?: boolean }) {
  const [x, setX] = useState(0);

  const won = x >= 4;

  const moveLeft = () => {
    setX((prev) => Math.max(0, prev - 1));
    if (soundEnabled) playSound("jump", 0.3);
  };

  const moveRight = () => {
    setX((prev) => {
      const next = Math.min(4, prev + 1);
      if (next >= 4 && soundEnabled) {
        playSound("win");
      } else if (soundEnabled) {
        playSound("jump", 0.3);
      }
      return next;
    });
  };

  return (
    <GameShell title="🚪 Slide to Exit" back={back}>
      <p className="instruction">
        Slide the red block all the way to the exit door.
      </p>

      <div className="slide-board">
        <div
          className="red-block"
          style={{ left: `${x * 55 + 10}px` }}
        >
          EXIT
        </div>

        <div className="exit">→</div>
      </div>

      {won && <Win text="You escaped!" />}

      {!won && (
        <div className="move-buttons">
          <button onClick={moveLeft} aria-label="Move Left">
            ←
          </button>

          <button onClick={moveRight} aria-label="Move Right">
            →
          </button>
        </div>
      )}

      <button
        className="secondary-button"
        onClick={() => setX(0)}
      >
        Reset
      </button>
    </GameShell>
  );
}

/* =========================================================
   9. COLOR WHEEL
========================================================= */

export function ColorWheel({ back, soundEnabled = true }: { back: () => void; soundEnabled?: boolean }) {
  const colors = ["red", "blue", "green", "yellow"];

  const [target, setTarget] = useState<string>(
    () => colors[Math.floor(Math.random() * colors.length)] ?? "red"
  );

  const [score, setScore] = useState(0);

  const choose = (color: string) => {
    if (color === target) {
      const nextScore = score + 1;
      setScore(nextScore);
      if (soundEnabled) {
        if (nextScore > 0 && nextScore % 5 === 0) playSound("win");
        else playSound("collect", 0.3);
      }
    } else {
      setScore(Math.max(0, score - 1));
      if (soundEnabled) playSound("retry", 0.3);
    }

    setTarget(
      colors[Math.floor(Math.random() * colors.length)] ?? "red"
    );
  };

  return (
    <GameShell title="🎨 Color Wheel" back={back}>
      <p className="instruction">Tap the matching colored button:</p>

      <div
        className="color-target"
        style={{ background: target }}
      >
        {target.toUpperCase()}
      </div>

      <div className="color-buttons">
        {colors.map((color) => (
          <button
            key={color}
            style={{ background: color }}
            onClick={() => choose(color)}
            aria-label={`Select ${color}`}
          />
        ))}
      </div>

      <h2>Score: <strong>{score}</strong></h2>

      <button
        className="secondary-button"
        onClick={() => setScore(0)}
      >
        Reset
      </button>
    </GameShell>
  );
}

/* =========================================================
   10. MAKE TEN
========================================================= */

export function MakeTen({ back, soundEnabled = true }: { back: () => void; soundEnabled?: boolean }) {
  const create = () =>
    Array.from(
      { length: 12 },
      () => Math.floor(Math.random() * 9) + 1
    );

  const [numbers, setNumbers] = useState(create);
  const [selected, setSelected] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  const choose = (i: number) => {
    if (selected.includes(i)) return;

    const next = [...selected, i];
    const sum = next.reduce(
      (total, index) => total + (numbers[index] ?? 0),
      0
    );

    if (sum === 10) {
      setScore((s) => s + 1);
      setSelected([]);
      if (soundEnabled) playSound("win");
    } else if (sum > 10) {
      setSelected([]);
      if (soundEnabled) playSound("retry", 0.3);
    } else {
      setSelected(next);
      if (soundEnabled) playSound("collect", 0.3);
    }
  };

  const currentSum = selected.reduce((tot, idx) => tot + (numbers[idx] ?? 0), 0);

  return (
    <GameShell title="🔟 Make Ten" back={back}>
      <p className="instruction">Select numbers that add up to 10.</p>
      <div className="info">Current sum: <strong>{currentSum}</strong> / 10</div>

      <div className="number-grid">
        {numbers.map((n, i) => (
          <button
            key={i}
            className={
              selected.includes(i)
                ? "number-tile selected"
                : "number-tile"
            }
            onClick={() => choose(i)}
          >
            {n}
          </button>
        ))}
      </div>

      <h2>Score: <strong>{score}</strong></h2>

      <button
        className="main-button"
        onClick={() => {
          setNumbers(create());
          setSelected([]);
          setScore(0);
        }}
      >
        New Game
      </button>
    </GameShell>
  );
}

/* =========================================================
   11. HIGHER OR LOWER
========================================================= */

export function HigherLower({ back, soundEnabled = true }: { back: () => void; soundEnabled?: boolean }) {
  const [current, setCurrent] = useState(
    Math.floor(Math.random() * 99) + 1
  );

  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");

  const guess = (higher: boolean) => {
    const next = Math.floor(Math.random() * 99) + 1;

    const correct = higher
      ? next > current
      : next < current;

    if (correct) {
      setScore((s) => s + 1);
      setMessage("✓ Correct! It was " + next);
      if (soundEnabled) playSound("collect", 0.4);
    } else {
      setScore(0);
      setMessage("✗ Wrong! It was " + next);
      if (soundEnabled) playSound("retry", 0.3);
    }

    setCurrent(next);
  };

  return (
    <GameShell title="⬆️ Higher or Lower" back={back}>
      <div className="big-number">{current}</div>

      <p className="instruction">
        Will the next number be higher or lower?
      </p>

      <div className="two-buttons">
        <button
          className="main-button"
          onClick={() => guess(true)}
        >
          ↑ HIGHER
        </button>

        <button
          className="main-button"
          onClick={() => guess(false)}
        >
          ↓ LOWER
        </button>
      </div>

      {message && <h2 className="mt-3 text-base font-bold">{message}</h2>}
      <p className="mt-2 text-sm text-muted-foreground">Current Streak: <strong>{score}</strong></p>
    </GameShell>
  );
}

/* =========================================================
   12. PLUS ONE
========================================================= */

export function PlusOne({ back, soundEnabled = true }: { back: () => void; soundEnabled?: boolean }) {
  const [numbers, setNumbers] = useState([1, 2, 3, 4]);
  const [moves, setMoves] = useState(0);

  const target = [5, 5, 5, 5];

  const add = (index: number) => {
    const val = numbers[index];
    if (val === undefined) return;
    const next = [...numbers];

    if (val < 5) {
      next[index] = val + 1;
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      if (soundEnabled) playSound("collect", 0.3);

      if (next.every((n, i) => n === target[i])) {
        if (soundEnabled) playSound("win");
      }
    }

    setNumbers(next);
  };

  const won = numbers.every((n, i) => n === target[i]);

  return (
    <GameShell title="➕ Plus One" back={back}>
      <p className="instruction">Tap tiles to make every number 5.</p>

      <div className="plus-grid">
        {numbers.map((n, i) => (
          <button
            key={i}
            onClick={() => add(i)}
            className="plus-tile"
            disabled={n >= 5}
          >
            {n}
            <small>+1</small>
          </button>
        ))}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">Moves: <strong>{moves}</strong></p>

      {won && <Win text="Perfect! All numbers reached 5!" />}

      <button
        className="main-button"
        onClick={() => {
          setNumbers([1, 2, 3, 4]);
          setMoves(0);
        }}
      >
        Reset
      </button>
    </GameShell>
  );
}
