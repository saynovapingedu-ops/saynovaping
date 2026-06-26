import { useEffect, useRef, useState, useCallback } from 'react';
import { sfx, vibrate } from '../../lib/sound';
import { LRPad } from './GamePad';

// ============================================================================
//  LaneRunGame — "รูดหลบ 3 เลน" ปัดซ้าย/ขวาหลบบุหรี่ เก็บน้ำ (แนว Subway)
// ============================================================================

interface Props {
  goalScore?: number;
  onComplete?: (success: boolean, score: number) => void;
}

const W = 360;
const H = 320;
const LANES = [W * 0.2, W * 0.5, W * 0.8];
const PLAYER_Y = H - 50;

interface Ob { lane: number; y: number; bad: boolean; emoji: string; hit?: boolean; }

export default function LaneRunGame({ goalScore, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const lane = useRef(1);
  const obs = useRef<Ob[]>([]);
  const scoreRef = useRef(0);
  const speed = useRef(3.4);
  const spawnT = useRef(0);
  const spawnCount = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef(0);
  const phaseRef = useRef<'ready' | 'playing' | 'over'>('ready');

  const setPhaseBoth = (p: 'ready' | 'playing' | 'over') => { phaseRef.current = p; setPhase(p); };

  const move = useCallback((dir: -1 | 1) => {
    if (phaseRef.current !== 'playing') return;
    lane.current = Math.max(0, Math.min(2, lane.current + dir));
    sfx.click();
  }, []);

  const reset = () => { lane.current = 1; obs.current = []; scoreRef.current = 0; speed.current = 3.0; spawnT.current = 40; setScore(0); spawnCount.current = 0; };
  const start = () => { reset(); setPhaseBoth('playing'); };
  const over = () => {
    setPhaseBoth('over'); setBest(b => Math.max(b, scoreRef.current)); sfx.wrong(); vibrate(60);
    onComplete?.(goalScore ? scoreRef.current >= goalScore : true, scoreRef.current);
  };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const BAD = ['🚬', '💨'];
    const GOOD = ['💧', '🍎'];

    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (phaseRef.current === 'playing') {
        const dt = lastTs.current ? Math.min((ts - lastTs.current) / 16.67, 2.5) : 1;
        lastTs.current = ts;
        spawnT.current -= dt;
        if (spawnT.current <= 0) {
          // สุ่มเลน + ส่วนใหญ่เป็นบุหรี่ (ต้องหลบจริง) ตัวแรกปล่อยของดีให้ตั้งตัว
          const first = spawnCount.current === 0;
          const laneI = Math.floor(Math.random() * 3);
          const bad = !first && Math.random() < 0.72;
          obs.current.push({ lane: laneI, y: -30, bad, emoji: bad ? BAD[Math.floor(Math.random() * 2)] : GOOD[Math.floor(Math.random() * 2)] });
          spawnCount.current += 1;
          // ถี่ขึ้นเล็กน้อยตามคะแนน
          spawnT.current = Math.max(38, 60 - scoreRef.current);
        }
        const px = LANES[lane.current];
        for (const o of obs.current) {
          o.y += speed.current * dt;
          if (!o.hit && Math.abs(o.y - PLAYER_Y) < 22 && Math.abs(LANES[o.lane] - px) < 30) {
            o.hit = true;
            if (o.bad) { over(); return; }
            else { scoreRef.current += 1; setScore(scoreRef.current); sfx.correct(); vibrate(10); speed.current = Math.min(7, speed.current + 0.08);
              if (goalScore && scoreRef.current >= goalScore) { over(); return; } }
          }
        }
        obs.current = obs.current.filter(o => o.y < H + 30 && !o.hit);
      }
      // draw
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#EAF4FF'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#CFE3FA'; ctx.lineWidth = 2;
      for (const lx of LANES) { ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke(); }
      ctx.font = '26px serif'; ctx.textBaseline = 'middle';
      for (const o of obs.current) ctx.fillText(o.emoji, LANES[o.lane] - 14, o.y);
      ctx.font = '30px serif';
      ctx.fillText('🛹', LANES[lane.current] - 16, PLAYER_Y);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [goalScore]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft') move(-1);
      else if (e.code === 'ArrowRight') move(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-detective-700">🛹 รูดหลบ 3 เลน {goalScore ? `(เป้า ${goalScore})` : ''}</p>
        <p className="text-sm font-bold text-warning-600 tabular-nums">เก็บได้ {score}</p>
      </div>
      <div className="relative w-full max-w-[360px] mx-auto h-[400px] rounded-[24px] overflow-hidden shadow-clay bg-[#EAF4FF]">
        <canvas ref={canvasRef} width={W} height={H} className="w-full h-full block" style={{ objectFit: 'contain', touchAction: 'none' }} />
        {phase !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px] text-center px-4">
            <p className="text-2xl mb-1">{phase === 'over' ? (goalScore && scoreRef.current >= goalScore ? '🏆 ผ่าน!' : '💥 ชน 🚬!') : '🛹'}</p>
            <p className="font-display font-bold text-detective-800">{phase === 'over' ? `เก็บน้ำได้ ${score} · สถิติ ${best}` : 'กดปุ่ม ◀ ▶ หลบ 🚬 เก็บ 💧'}</p>
            <button onClick={(e) => { e.stopPropagation(); start(); }} className="btn-primary mt-3 px-6">{phase === 'over' ? 'เล่นอีกครั้ง 🔄' : 'เริ่ม! ▶'}</button>
          </div>
        )}
      </div>
      <LRPad onLeft={() => move(-1)} onRight={() => move(1)} disabled={phase !== 'playing'} />
    </div>
  );
}
