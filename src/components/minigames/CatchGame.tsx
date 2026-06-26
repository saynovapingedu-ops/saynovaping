import { useEffect, useRef, useState } from 'react';
import { sfx, vibrate } from '../../lib/sound';
import { LRPad } from './GamePad';

// ============================================================================
//  CatchGame — "ปอดสะอาด" เลื่อนตะกร้ารับของดี หลบควันพิษ
// ============================================================================

interface Props {
  goalScore?: number;
  onComplete?: (success: boolean, score: number) => void;
  seconds?: number;
}

const W = 640;
const H = 300;
const BASKET_Y = H - 44;
const BASKET_W = 70;

const GOOD = ['💧', '🍎', '🏃', '😴', '🥦'];
const BAD = ['🚬', '💨', '☠️'];

interface Item { x: number; y: number; vy: number; emoji: string; bad: boolean; }

export default function CatchGame({ goalScore, onComplete, seconds = 30 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(seconds);

  const basketX = useRef(W / 2 - BASKET_W / 2);
  const held = useRef(0);   // -1 ซ้าย · 0 หยุด · 1 ขวา (จากปุ่มกดค้าง)
  const items = useRef<Item[]>([]);
  const scoreRef = useRef(0);
  const spawnT = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef(0);
  const phaseRef = useRef<'ready' | 'playing' | 'done'>('ready');
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setPhaseBoth = (p: 'ready' | 'playing' | 'done') => { phaseRef.current = p; setPhase(p); };

  const end = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    setPhaseBoth('done');
    const won = goalScore ? scoreRef.current >= goalScore : true;
    if (won) sfx.victory(); else sfx.wrong();
    onComplete?.(won, scoreRef.current);
  };

  const start = () => {
    items.current = [];
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(seconds);
    spawnT.current = 0;
    setPhaseBoth('playing');
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { end(); return 0; } return t - 1; });
    }, 1000);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const c = ctx;
      if (phaseRef.current === 'playing') {
        const dt = lastTs.current ? Math.min((ts - lastTs.current) / 16.67, 2.5) : 1;
        lastTs.current = ts;

        basketX.current = Math.max(0, Math.min(W - BASKET_W, basketX.current + held.current * 9 * dt));

        spawnT.current -= dt;
        if (spawnT.current <= 0) {
          const bad = Math.random() < 0.4;
          items.current.push({
            x: 20 + Math.random() * (W - 60),
            y: -20,
            vy: 3 + Math.random() * 2.5,
            emoji: bad ? BAD[Math.floor(Math.random() * BAD.length)] : GOOD[Math.floor(Math.random() * GOOD.length)],
            bad,
          });
          spawnT.current = 32 + Math.random() * 26;
        }

        for (const it of items.current) {
          it.y += it.vy * dt;
          // จับได้?
          if (it.y >= BASKET_Y - 18 && it.y <= BASKET_Y + 14 &&
              it.x >= basketX.current - 14 && it.x <= basketX.current + BASKET_W + 14) {
            it.y = H + 100; // mark removed
            if (it.bad) {
              scoreRef.current = Math.max(0, scoreRef.current - 1);
              sfx.wrong(); vibrate(35);
            } else {
              scoreRef.current += 1;
              sfx.correct(); vibrate(10);
            }
            setScore(scoreRef.current);
            if (goalScore && scoreRef.current >= goalScore) { end(); }
          }
        }
        items.current = items.current.filter(it => it.y < H + 40);
      }

      // draw
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#EAF4FF'; c.fillRect(0, 0, W, H);
      c.font = '30px serif'; c.textBaseline = 'top';
      for (const it of items.current) c.fillText(it.emoji, it.x, it.y);
      // basket
      c.font = '40px serif';
      c.fillText('🧺', basketX.current + BASKET_W / 2 - 20, BASKET_Y - 14);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [goalScore]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-detective-700">
          🫁 ปอดสะอาด {goalScore ? `(เป้า ${goalScore})` : ''}
        </p>
        <p className="text-sm font-bold tabular-nums">
          <span className="text-warning-600">{score}</span>
          {phase === 'playing' && <span className="text-detective-500 ml-2">⏱ {timeLeft}s</span>}
        </p>
      </div>

      <div className="relative w-full max-w-[360px] mx-auto h-[400px] rounded-[24px] overflow-hidden shadow-clay bg-[#EAF4FF]">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full h-full block"
          style={{ objectFit: 'contain', touchAction: 'none' }}
        />
        {phase !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-[1px] text-center px-4">
            {phase === 'ready' ? (
              <>
                <p className="text-3xl mb-1">🧺💧</p>
                <p className="font-display font-bold text-detective-800">กดค้าง ◀ ▶ ขยับตะกร้ารับของดี!</p>
                <p className="text-xs text-slate-500 mt-1">รับ 💧🍎🏃 หลบ 🚬💨 ควันพิษ</p>
              </>
            ) : (
              <>
                <p className="text-2xl mb-1">{goalScore && scoreRef.current >= goalScore ? '🏆 ผ่าน!' : '⏰ หมดเวลา!'}</p>
                <p className="font-display font-bold text-detective-800">รับของดีได้ {score} ชิ้น</p>
              </>
            )}
            <button onClick={start} className="btn-primary mt-3 px-6">
              {phase === 'ready' ? 'เริ่ม! ▶' : 'เล่นอีกครั้ง 🔄'}
            </button>
          </div>
        )}
      </div>
      <LRPad
        onLeft={() => { held.current = -1; }}
        onRight={() => { held.current = 1; }}
        onRelease={() => { held.current = 0; }}
        disabled={phase !== 'playing'}
      />
    </div>
  );
}
