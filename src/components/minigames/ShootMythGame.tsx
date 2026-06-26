import { useEffect, useRef, useState } from 'react';
import { sfx, vibrate } from '../../lib/sound';
import { VAPE_FACTS, type FactStatement } from '../../lib/vapeFacts';

// ============================================================================
//  ShootMythGame — "ยิงจับเท็จ" แตะ "คำโฆษณาหลอก (เท็จ)" เว้น "ข้อมูลจริง"
// ============================================================================

interface Props {
  goalScore?: number;
  onComplete?: (success: boolean, score: number) => void;
  seconds?: number;
  facts?: FactStatement[];
}

interface Floater { id: number; text: string; isTrue: boolean; x: number; y: number; }

const W = 100; // ใช้เป็น % ของกว้าง container

export default function ShootMythGame({ goalScore, onComplete, seconds = 35, facts }: Props) {
  const pool = facts && facts.length ? facts : VAPE_FACTS;
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [floaters, setFloaters] = useState<Floater[]>([]);

  const scoreRef = useRef(0);
  const idRef = useRef(0);
  const poolIdx = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef(0);
  const spawnT = useRef(0);
  const phaseRef = useRef<'ready' | 'playing' | 'done'>('ready');
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setPhaseBoth = (p: 'ready' | 'playing' | 'done') => { phaseRef.current = p; setPhase(p); };

  const end = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    setFloaters([]);
    setPhaseBoth('done');
    const won = goalScore ? scoreRef.current >= goalScore : true;
    if (won) sfx.victory(); else sfx.wrong();
    onComplete?.(won, scoreRef.current);
  };

  const start = () => {
    scoreRef.current = 0; setScore(0); setTimeLeft(seconds); setFloaters([]);
    poolIdx.current = 0; spawnT.current = 0;
    setPhaseBoth('playing');
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { end(); return 0; } return t - 1; });
    }, 1000);
  };

  useEffect(() => {
    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (phaseRef.current !== 'playing') return;
      const dt = lastTs.current ? Math.min((ts - lastTs.current) / 16.67, 2.5) : 1;
      lastTs.current = ts;

      spawnT.current -= dt;
      if (spawnT.current <= 0) {
        const f = pool[poolIdx.current % pool.length];
        poolIdx.current += 1;
        const id = ++idRef.current;
        const y = 8 + (id * 29) % 70;
        setFloaters(prev => [...prev, { id, text: f.text, isTrue: f.isTrue, x: W + 5, y }]);
        spawnT.current = 75 + (id % 3) * 20;
      }

      setFloaters(prev => prev
        .map(f => ({ ...f, x: f.x - 0.35 * dt }))
        .filter(f => f.x > -60));
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shoot = (f: Floater) => {
    if (phaseRef.current !== 'playing') return;
    setFloaters(prev => prev.filter(x => x.id !== f.id));
    if (!f.isTrue) { // เท็จ = ยิงถูก
      scoreRef.current += 1; setScore(scoreRef.current); sfx.correct(); vibrate(12);
    } else {          // จริง = ยิงผิด
      scoreRef.current = Math.max(0, scoreRef.current - 1); setScore(scoreRef.current); sfx.wrong(); vibrate(40);
    }
    if (goalScore && scoreRef.current >= goalScore) end();
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-detective-700">🎯 ยิงจับเท็จ {goalScore ? `(เป้า ${goalScore})` : ''}</p>
        <p className="text-sm font-bold tabular-nums">
          <span className="text-warning-600">{score}</span>
          {phase === 'playing' && <span className="text-detective-500 ml-2">⏱ {timeLeft}s</span>}
        </p>
      </div>

      <div className="relative w-full max-w-[360px] mx-auto rounded-[24px] bg-detective-50/40 overflow-hidden shadow-clay"
           style={{ height: 400 }}>
        {floaters.map(f => (
          <button
            key={f.id}
            onPointerDown={() => shoot(f)}
            className="absolute whitespace-nowrap text-left text-xs font-semibold leading-snug
                       px-2.5 py-1.5 rounded-xl shadow-clay-sm active:scale-95 transition-transform
                       bg-[#FFFCF7] text-detective-800"
            style={{ left: `${f.x}%`, top: `${f.y}%` }}
          >
            🗯️ {f.text}
          </button>
        ))}

        {phase !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-[1px] text-center px-4">
            {phase === 'ready' ? (
              <>
                <p className="text-3xl mb-1">🎯🗯️</p>
                <p className="font-display font-bold text-detective-800">แตะ "คำโฆษณาหลอก (เท็จ)" ให้โดน!</p>
                <p className="text-xs text-slate-500 mt-1">ระวัง — อย่าแตะ "ข้อมูลจริง" จะเสียคะแนน</p>
              </>
            ) : (
              <>
                <p className="text-2xl mb-1">{goalScore && scoreRef.current >= goalScore ? '🏆 ผ่าน!' : '⏰ หมดเวลา!'}</p>
                <p className="font-display font-bold text-detective-800">จับเท็จได้ {score} ข้อ</p>
              </>
            )}
            <button onClick={start} className="btn-primary mt-3 px-6">{phase === 'ready' ? 'เริ่ม! ▶' : 'เล่นอีกครั้ง 🔄'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
