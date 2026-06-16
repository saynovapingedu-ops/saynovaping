import { useEffect, useRef, useState, useCallback } from 'react';
import { sfx, vibrate } from '../../lib/sound';

// ============================================================================
//  SnakeGame — "งูกินของดี" บังคับงูกิน 💧🍎 เลี่ยง 🚬 (คลาสสิก)
// ============================================================================

interface Props {
  goalScore?: number;
  onComplete?: (success: boolean, score: number) => void;
}

const CELL = 20;
const COLS = 16;
const ROWS = 15;
const W = COLS * CELL;
const H = ROWS * CELL;

type Pt = { x: number; y: number };

export default function SnakeGame({ goalScore, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const [score, setScore] = useState(0);

  const snake = useRef<Pt[]>([{ x: 8, y: 7 }]);
  const dir = useRef<Pt>({ x: 1, y: 0 });
  const nextDir = useRef<Pt>({ x: 1, y: 0 });
  const food = useRef<Pt>({ x: 12, y: 7 });
  const bad = useRef<Pt>({ x: 4, y: 4 });
  const scoreRef = useRef(0);
  const stepRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seed = useRef(1);
  const phaseRef = useRef<'ready' | 'playing' | 'over'>('ready');

  const setPhaseBoth = (p: 'ready' | 'playing' | 'over') => { phaseRef.current = p; setPhase(p); };

  const rnd = () => { seed.current = (seed.current * 9301 + 49297) % 233280; return seed.current / 233280; };
  const randCell = (): Pt => ({ x: Math.floor(rnd() * COLS), y: Math.floor(rnd() * ROWS) });

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#EAF4FF'; ctx.fillRect(0, 0, W, H);
    ctx.font = '17px serif'; ctx.textBaseline = 'top';
    ctx.fillText('💧', food.current.x * CELL + 1, food.current.y * CELL + 1);
    ctx.fillText('🚬', bad.current.x * CELL + 1, bad.current.y * CELL + 1);
    ctx.fillStyle = '#2563EB';
    snake.current.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#1D4ED8' : '#60A5FA';
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }, []);

  const over = () => {
    if (stepRef.current) clearInterval(stepRef.current);
    setPhaseBoth('over'); sfx.wrong(); vibrate(60);
    onComplete?.(goalScore ? scoreRef.current >= goalScore : true, scoreRef.current);
  };

  const step = () => {
    dir.current = nextDir.current;
    const head = snake.current[0];
    const nx = head.x + dir.current.x;
    const ny = head.y + dir.current.y;
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return over();
    if (snake.current.some(s => s.x === nx && s.y === ny)) return over();
    if (nx === bad.current.x && ny === bad.current.y) return over();

    const newSnake = [{ x: nx, y: ny }, ...snake.current];
    if (nx === food.current.x && ny === food.current.y) {
      scoreRef.current += 1; setScore(scoreRef.current); sfx.correct(); vibrate(10);
      food.current = randCell();
      bad.current = randCell();
      if (goalScore && scoreRef.current >= goalScore) { snake.current = newSnake; draw(); return over(); }
    } else {
      newSnake.pop();
    }
    snake.current = newSnake;
    draw();
  };

  const start = () => {
    snake.current = [{ x: 8, y: 7 }]; dir.current = { x: 1, y: 0 }; nextDir.current = { x: 1, y: 0 };
    food.current = { x: 12, y: 7 }; bad.current = { x: 4, y: 4 }; scoreRef.current = 0; setScore(0); seed.current = 1;
    setPhaseBoth('playing');
    if (stepRef.current) clearInterval(stepRef.current);
    stepRef.current = setInterval(step, 150);
    draw();
  };

  const turn = useCallback((d: Pt) => {
    if (phaseRef.current !== 'playing') return;
    if (d.x === -dir.current.x && d.y === -dir.current.y) return; // กันถอยหลัง
    nextDir.current = d;
  }, []);

  useEffect(() => { draw(); return () => { if (stepRef.current) clearInterval(stepRef.current); }; }, [draw]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'ArrowUp') turn({ x: 0, y: -1 });
      else if (e.code === 'ArrowDown') turn({ x: 0, y: 1 });
      else if (e.code === 'ArrowLeft') turn({ x: -1, y: 0 });
      else if (e.code === 'ArrowRight') turn({ x: 1, y: 0 });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turn]);

  const ts = useRef<Pt | null>(null);
  const onUp = (x: number, y: number) => {
    if (!ts.current) return;
    const dx = x - ts.current.x, dy = y - ts.current.y;
    if (Math.abs(dx) > Math.abs(dy)) turn({ x: dx > 0 ? 1 : -1, y: 0 });
    else turn({ x: 0, y: dy > 0 ? 1 : -1 });
    ts.current = null;
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-detective-700">🐍 งูกินของดี {goalScore ? `(เป้า ${goalScore})` : ''}</p>
        <p className="text-sm font-bold text-warning-600 tabular-nums">กิน 💧 {score}</p>
      </div>
      <div
        className="relative rounded-2xl overflow-hidden border-2 border-detective-200 shadow-glow-sm mx-auto"
        style={{ maxWidth: W }}
        onPointerDown={(e) => { ts.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={(e) => onUp(e.clientX, e.clientY)}
      >
        <canvas ref={canvasRef} width={W} height={H} className="w-full block" style={{ touchAction: 'none' }} />
        {phase !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px] text-center px-4">
            <p className="text-2xl mb-1">{phase === 'over' ? (goalScore && scoreRef.current >= goalScore ? '🏆 ผ่าน!' : '💥 จบเกม!') : '🐍'}</p>
            <p className="font-display font-bold text-detective-800">{phase === 'over' ? `กินของดี ${score} ชิ้น` : 'ปัดทิศทางให้งูกิน 💧 เลี่ยง 🚬'}</p>
            <button onClick={(e) => { e.stopPropagation(); start(); }} className="btn-primary mt-3 px-6">{phase === 'over' ? 'เล่นอีกครั้ง 🔄' : 'เริ่ม! ▶'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
