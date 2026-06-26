import { useEffect, useRef, useState } from 'react';
import { sfx, vibrate } from '../../lib/sound';
import { LRPad } from './GamePad';

// ============================================================================
//  JumpUpGame — "กระโดดสะสมสุขภาพ" เด้งขึ้นแพลตฟอร์ม เก็บ 🪙 บนแต่ละแผ่น
// ============================================================================

interface Props {
  goalScore?: number;
  onComplete?: (success: boolean, score: number) => void;
}

const W = 320;
const H = 380;
const PW = 64;
const PH = 14;
const PR = 16;
const JUMP = -12;

interface Plat { x: number; y: number; coin: boolean; }

export default function JumpUpGame({ goalScore, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const [score, setScore] = useState(0);   // จำนวนเหรียญที่เก็บได้
  const [best, setBest] = useState(0);

  const px = useRef(W / 2);
  const py = useRef(H - 70);
  const vy = useRef(0);
  const held = useRef(0);   // -1 ซ้าย · 0 หยุด · 1 ขวา (จากปุ่มกดค้าง)
  const plats = useRef<Plat[]>([]);
  const scoreRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef(0);
  const phaseRef = useRef<'ready' | 'playing' | 'over'>('ready');

  const setPhaseBoth = (p: 'ready' | 'playing' | 'over') => { phaseRef.current = p; setPhase(p); };

  const makePlat = (y: number): Plat => ({ x: Math.random() * (W - PW), y, coin: true });

  const initPlats = () => {
    const arr: Plat[] = [{ x: W / 2 - PW / 2, y: H - 40, coin: false }];
    for (let i = 1; i < 8; i++) arr.push(makePlat(H - 40 - i * 50));
    plats.current = arr;
  };

  const start = () => {
    px.current = W / 2; py.current = H - 70; vy.current = JUMP; scoreRef.current = 0; setScore(0);
    initPlats(); setPhaseBoth('playing');
  };

  const over = () => {
    setPhaseBoth('over'); setBest(b => Math.max(b, scoreRef.current)); sfx.wrong(); vibrate(60);
    onComplete?.(goalScore ? scoreRef.current >= goalScore : true, scoreRef.current);
  };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (phaseRef.current === 'playing') {
        const dt = lastTs.current ? Math.min((ts - lastTs.current) / 16.67, 2) : 1;
        lastTs.current = ts;
        vy.current += 0.45 * dt;
        py.current += vy.current * dt;
        px.current += held.current * 6 * dt;
        if (px.current < -PR) px.current = W + PR;
        if (px.current > W + PR) px.current = -PR;

        if (vy.current > 0) {
          for (const p of plats.current) {
            if (px.current > p.x - PR && px.current < p.x + PW + PR &&
                py.current + PR > p.y && py.current + PR < p.y + PH + 14) {
              vy.current = JUMP; sfx.click();
              if (p.coin) {
                p.coin = false;
                scoreRef.current += 1; setScore(scoreRef.current);
                sfx.correct(); vibrate(10);
                if (goalScore && scoreRef.current >= goalScore) { over(); return; }
              }
              break;
            }
          }
        }
        if (py.current < H / 2) {
          const d = H / 2 - py.current;
          py.current = H / 2;
          for (const p of plats.current) p.y += d;
        }
        plats.current = plats.current.filter(p => p.y < H + 20);
        while (plats.current.length < 8) {
          const top = plats.current.length ? Math.min(...plats.current.map(p => p.y)) : H / 2;
          plats.current.push(makePlat(top - 50));
        }
        if (py.current > H + 20) { over(); return; }
      }

      // ===== draw (จอ LCD เขียว Nokia) =====
      ctx.fillStyle = '#C7D89B'; ctx.fillRect(0, 0, W, H);

      for (const p of plats.current) {
        // แพลตฟอร์มบล็อกพิกเซลเข้ม
        ctx.fillStyle = '#3A4A1A';
        ctx.fillRect(p.x, p.y, PW, PH);
        // เหรียญ — บล็อกเล็กมีตัวอักษร
        if (p.coin) {
          ctx.fillStyle = '#1B2608';
          ctx.fillRect(p.x + PW / 2 - 6, p.y - 18, 12, 12);
          ctx.fillStyle = '#C7D89B'; ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('฿', p.x + PW / 2, p.y - 12);
          ctx.textAlign = 'left';
        }
      }
      // ผู้เล่น — บล็อกพิกเซลเข้ม + ตา
      const s = PR + 1;
      ctx.fillStyle = '#1B2608';
      ctx.fillRect(px.current - s, py.current - s, s * 2, s * 2);
      ctx.fillStyle = '#C7D89B';
      ctx.fillRect(px.current - 5, py.current - 4, 3, 3);
      ctx.fillRect(px.current + 2, py.current - 4, 3, 3);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [goalScore]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-detective-700">⬆️ กระโดดสะสมสุขภาพ {goalScore ? `(เป้า ${goalScore})` : ''}</p>
        <p className="text-sm font-bold text-warning-600 tabular-nums">🪙 เก็บ {score}</p>
      </div>
      <div className="relative w-full max-w-[360px] mx-auto h-[400px] rounded-[24px] overflow-hidden shadow-clay bg-[#C7D89B]">
        <canvas ref={canvasRef} width={W} height={H} className="w-full h-full block" style={{ objectFit: 'contain', touchAction: 'none' }} />
        {phase !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px] text-center px-4">
            <p className="text-2xl mb-1">{phase === 'over' ? (goalScore && scoreRef.current >= goalScore ? '🏆 ผ่าน!' : '⬇️ ตกแล้ว!') : '⬆️'}</p>
            <p className="font-display font-bold text-detective-800">{phase === 'over' ? `เก็บเหรียญได้ ${score} · สถิติ ${best}` : 'กดค้าง ◀ ▶ เด้งเก็บ 🪙 ให้ได้มากสุด'}</p>
            <button onClick={(e) => { e.stopPropagation(); start(); }} className="btn-primary mt-3 px-6">{phase === 'over' ? 'เล่นอีกครั้ง 🔄' : 'เริ่ม! ▶'}</button>
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
