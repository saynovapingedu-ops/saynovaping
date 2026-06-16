import { useEffect, useRef, useState } from 'react';
import { sfx, vibrate } from '../../lib/sound';

// ============================================================================
//  ReactionGame — "แตะให้ไว" แตะตอนขึ้นของดี (เขียว) ห้ามแตะของแย่ (แดง)
// ============================================================================

interface Props {
  goalScore?: number;
  onComplete?: (success: boolean, score: number) => void;
  seconds?: number;
}

const GOOD = ['💧', '🍎', '🏃', '😴', '🫁'];
const BAD = ['🚬', '💨', '☠️'];

export default function ReactionGame({ goalScore, onComplete, seconds = 25 }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [cur, setCur] = useState<{ emoji: string; good: boolean } | null>(null);

  const scoreRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const swapRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seedRef = useRef(0);

  const cleanup = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (swapRef.current) clearInterval(swapRef.current);
  };

  const end = () => {
    cleanup(); setCur(null); setPhase('done');
    const won = goalScore ? scoreRef.current >= goalScore : true;
    if (won) sfx.victory(); else sfx.wrong();
    onComplete?.(won, scoreRef.current);
  };

  const nextItem = () => {
    seedRef.current += 1;
    const good = (seedRef.current * 7 + 3) % 5 < 3; // ~60% good
    const arr = good ? GOOD : BAD;
    setCur({ emoji: arr[seedRef.current % arr.length], good });
  };

  const start = () => {
    scoreRef.current = 0; setScore(0); setTimeLeft(seconds); seedRef.current = 0;
    setPhase('playing'); nextItem();
    cleanup();
    swapRef.current = setInterval(nextItem, 850);
    tickRef.current = setInterval(() => { setTimeLeft(t => { if (t <= 1) { end(); return 0; } return t - 1; }); }, 1000);
  };

  useEffect(() => cleanup, []);

  const tap = () => {
    if (phase !== 'playing' || !cur) return;
    if (cur.good) { scoreRef.current += 1; setScore(scoreRef.current); sfx.correct(); vibrate(10); }
    else { scoreRef.current = Math.max(0, scoreRef.current - 1); setScore(scoreRef.current); sfx.wrong(); vibrate(40); }
    nextItem();
    if (goalScore && scoreRef.current >= goalScore) end();
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-detective-700">🟢 แตะให้ไว {goalScore ? `(เป้า ${goalScore})` : ''}</p>
        <p className="text-sm font-bold tabular-nums">
          <span className="text-warning-600">{score}</span>
          {phase === 'playing' && <span className="text-detective-500 ml-2">⏱ {timeLeft}s</span>}
        </p>
      </div>
      <div
        onPointerDown={() => { if (phase === 'playing') tap(); }}
        className={`relative w-full rounded-2xl border-2 shadow-glow-sm flex items-center justify-center transition-colors ${
          cur?.good ? 'border-success-400 bg-success-50' : cur ? 'border-danger-400 bg-danger-50' : 'border-detective-200 bg-detective-50/40'
        } ${phase === 'playing' ? 'cursor-pointer' : ''}`}
        style={{ height: 220 }}
      >
        {phase === 'playing' ? (
          <span className="text-7xl">{cur?.emoji}</span>
        ) : (
          <div className="text-center px-4">
            {phase === 'ready' ? (
              <>
                <p className="text-3xl mb-1">🟢🚫</p>
                <p className="font-display font-bold text-detective-800">แตะเฉพาะ "ของดี" (เขียว) ให้ไว!</p>
                <p className="text-xs text-slate-500 mt-1">เห็น 🚬💨 ห้ามแตะ — จะเสียคะแนน</p>
              </>
            ) : (
              <>
                <p className="text-2xl mb-1">{goalScore && scoreRef.current >= goalScore ? '🏆 ผ่าน!' : '⏰ หมดเวลา!'}</p>
                <p className="font-display font-bold text-detective-800">ได้ {score} คะแนน</p>
              </>
            )}
            <button onClick={(e) => { e.stopPropagation(); start(); }} className="btn-primary mt-3 px-6">
              {phase === 'ready' ? 'เริ่ม! ▶' : 'เล่นอีกครั้ง 🔄'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
