import { useEffect, useRef, useState } from 'react';
import { sfx, vibrate } from '../../lib/sound';

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

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (phaseRef.current === 'playing') {
        const dt = lastTs.current ? Math.min((ts - lastTs.current) / 16.67, 2) : 1;
        lastTs.current = ts;
        vy.current += 0.45 * dt;
        py.current += vy.current * dt;
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

      // ===== draw =====
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#DBEAFE'); g.addColorStop(1, '#EFF6FF');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      for (const p of plats.current) {
        // แพลตฟอร์มมน
        ctx.fillStyle = '#34D399';
        roundRect(p.x, p.y, PW, PH, 7); ctx.fill();
        ctx.fillStyle = '#10B981';
        roundRect(p.x, p.y + PH - 5, PW, 5, 4); ctx.fill();
        // เหรียญ
        if (p.coin) {
          ctx.fillStyle = '#FBBF24';
          ctx.beginPath(); ctx.arc(p.x + PW / 2, p.y - 12, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#B45309'; ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('฿', p.x + PW / 2, p.y - 11);
          ctx.textAlign = 'left';
        }
      }
      // ผู้เล่น — ตัวกลมฟ้า + หน้า
      ctx.fillStyle = '#3B82F6';
      ctx.beginPath(); ctx.arc(px.current, py.current, PR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(px.current - 5, py.current - 3, 3, 0, Math.PI * 2); ctx.arc(px.current + 5, py.current - 3, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1E3A8A';
      ctx.beginPath(); ctx.arc(px.current - 5, py.current - 3, 1.5, 0, Math.PI * 2); ctx.arc(px.current + 5, py.current - 3, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1E3A8A'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px.current, py.current + 3, 5, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [goalScore]); // eslint-disable-line react-hooks/exhaustive-deps

  const moveTo = (clientX: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    px.current = Math.max(0, Math.min(W, ((clientX - r.left) / r.width) * W));
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-detective-700">⬆️ กระโดดสะสมสุขภาพ {goalScore ? `(เป้า ${goalScore})` : ''}</p>
        <p className="text-sm font-bold text-warning-600 tabular-nums">🪙 เก็บ {score}</p>
      </div>
      <div
        className="relative rounded-2xl overflow-hidden border-2 border-detective-200 shadow-glow-sm mx-auto"
        style={{ maxWidth: W }}
        onPointerMove={(e) => phase === 'playing' && moveTo(e.clientX, e.currentTarget)}
        onPointerDown={(e) => phase === 'playing' && moveTo(e.clientX, e.currentTarget)}
      >
        <canvas ref={canvasRef} width={W} height={H} className="w-full block" style={{ touchAction: 'none' }} />
        {phase !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px] text-center px-4">
            <p className="text-2xl mb-1">{phase === 'over' ? (goalScore && scoreRef.current >= goalScore ? '🏆 ผ่าน!' : '⬇️ ตกแล้ว!') : '⬆️'}</p>
            <p className="font-display font-bold text-detective-800">{phase === 'over' ? `เก็บเหรียญได้ ${score} · สถิติ ${best}` : 'เลื่อนนิ้วซ้าย-ขวา เด้งเก็บ 🪙 ให้ได้มากสุด'}</p>
            <button onClick={(e) => { e.stopPropagation(); start(); }} className="btn-primary mt-3 px-6">{phase === 'over' ? 'เล่นอีกครั้ง 🔄' : 'เริ่ม! ▶'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
