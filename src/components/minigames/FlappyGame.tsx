import { useEffect, useRef, useState, useCallback } from 'react';
import { sfx, vibrate } from '../../lib/sound';

// ============================================================================
//  FlappyGame — "บินหลบท่อบุหรี่" แตะให้บินหลบช่องว่างระหว่างท่อ
// ============================================================================

interface Props {
  goalScore?: number;
  onComplete?: (success: boolean, score: number) => void;
}

const W = 400;
const H = 300;
const GAP = 135;
const PIPE_W = 46;
const BIRD_X = 90;
const BIRD_R = 14;

interface Pipe { x: number; gapY: number; passed?: boolean; }

export default function FlappyGame({ goalScore, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const birdY = useRef(H / 2);
  const vy = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const scoreRef = useRef(0);
  const spawnT = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef(0);
  const phaseRef = useRef<'ready' | 'playing' | 'over'>('ready');

  const setPhaseBoth = (p: 'ready' | 'playing' | 'over') => { phaseRef.current = p; setPhase(p); };

  const flap = useCallback(() => {
    if (phaseRef.current === 'playing') { vy.current = -6; sfx.click(); vibrate(8); }
  }, []);

  const reset = () => { birdY.current = H / 2; vy.current = 0; pipes.current = []; scoreRef.current = 0; spawnT.current = 0; setScore(0); };
  const start = () => { reset(); setPhaseBoth('playing'); };
  const over = () => {
    setPhaseBoth('over');
    setBest(b => Math.max(b, scoreRef.current));
    sfx.wrong(); vibrate(60);
    onComplete?.(goalScore ? scoreRef.current >= goalScore : true, scoreRef.current);
  };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (phaseRef.current === 'playing') {
        const dt = lastTs.current ? Math.min((ts - lastTs.current) / 16.67, 2.5) : 1;
        lastTs.current = ts;
        vy.current += 0.34 * dt;
        if (vy.current > 7) vy.current = 7;
        birdY.current += vy.current * dt;

        spawnT.current -= dt;
        if (spawnT.current <= 0) { pipes.current.push({ x: W + 10, gapY: 50 + (scoreRef.current * 37) % (H - GAP - 90) }); spawnT.current = 110; }

        for (const p of pipes.current) {
          p.x -= 2.0 * dt;
          if (!p.passed && p.x + PIPE_W < BIRD_X) {
            p.passed = true; scoreRef.current += 1; setScore(scoreRef.current);
            if (goalScore && scoreRef.current >= goalScore) { over(); return; }
          }
          // collision
          if (BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W &&
              (birdY.current - BIRD_R < p.gapY || birdY.current + BIRD_R > p.gapY + GAP)) { over(); return; }
        }
        pipes.current = pipes.current.filter(p => p.x > -PIPE_W - 10);
        if (birdY.current > H - 10 || birdY.current < 0) { over(); return; }
      }
      // draw
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#EAF4FF'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#7C3AED';
      for (const p of pipes.current) {
        ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
        ctx.fillRect(p.x, p.gapY + GAP, PIPE_W, H - (p.gapY + GAP));
        ctx.font = '22px serif';
        ctx.fillText('🚬', p.x + 11, p.gapY - 26);
        ctx.fillStyle = '#7C3AED';
      }
      ctx.font = '26px serif'; ctx.textBaseline = 'middle';
      ctx.fillText('🕵️', BIRD_X - 16, birdY.current);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [goalScore]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (phaseRef.current === 'playing') flap(); else start();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flap]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-detective-700">🐦 บินหลบท่อบุหรี่ {goalScore ? `(เป้า ${goalScore})` : ''}</p>
        <p className="text-sm font-bold text-warning-600 tabular-nums">ผ่าน {score}</p>
      </div>
      <div className="relative w-full max-w-[360px] mx-auto h-[400px] rounded-[24px] overflow-hidden shadow-clay bg-[#EAF4FF] cursor-pointer"
           onPointerDown={() => { if (phase === 'playing') flap(); else start(); }}>
        <canvas ref={canvasRef} width={W} height={H} className="w-full h-full block" style={{ objectFit: 'contain', touchAction: 'none' }} />
        {phase !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px] text-center px-4">
            <p className="text-2xl mb-1">{phase === 'over' ? (goalScore && scoreRef.current >= goalScore ? '🏆 ผ่าน!' : '💥 ชน!') : '🐦'}</p>
            <p className="font-display font-bold text-detective-800">{phase === 'over' ? `ผ่าน ${score} ท่อ · สถิติ ${best}` : 'แตะให้บินหลบท่อ 🚬'}</p>
            <button onClick={(e) => { e.stopPropagation(); start(); }} className="btn-primary mt-3 px-6">{phase === 'over' ? 'เล่นอีกครั้ง 🔄' : 'เริ่ม! ▶'}</button>
          </div>
        )}
      </div>
      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); if (phase === 'playing') flap(); else start(); }}
        className="mt-3 w-full max-w-[360px] mx-auto block py-3.5 rounded-[18px] bg-detective-500 text-white font-bold text-lg shadow-clay-blue active:shadow-clay-pressed active:translate-y-px select-none touch-none"
      >
        🐦 ตีปีกบิน
      </button>
    </div>
  );
}
