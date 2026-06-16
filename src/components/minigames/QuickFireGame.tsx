import { useEffect, useRef, useState } from 'react';
import { sfx, vibrate } from '../../lib/sound';
import { VAPE_FACTS, shuffledFacts, type FactStatement } from '../../lib/vapeFacts';

// ============================================================================
//  QuickFireGame — "ตอบเร็วจับเวลา" จริง/เท็จรัวๆ แข่งกับเวลา (ได้ความรู้)
// ============================================================================

interface Props {
  goalScore?: number;
  onComplete?: (success: boolean, score: number) => void;
  seconds?: number;
  facts?: FactStatement[];
}

export default function QuickFireGame({ goalScore, onComplete, seconds = 30, facts }: Props) {
  const pool = facts && facts.length ? facts : VAPE_FACTS;
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<'ok' | 'no' | null>(null);

  const order = useRef<FactStatement[]>(pool);
  const scoreRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const end = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    setPhase('done');
    const won = goalScore ? scoreRef.current >= goalScore : true;
    if (won) sfx.victory(); else sfx.wrong();
    onComplete?.(won, scoreRef.current);
  };

  const start = () => {
    order.current = shuffledFacts(Math.floor(timeLeft + score + 7));
    scoreRef.current = 0;
    setScore(0); setIdx(0); setTimeLeft(seconds); setFeedback(null);
    setPhase('playing');
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { end(); return 0; } return t - 1; });
    }, 1000);
  };

  useEffect(() => () => { if (tickRef.current) clearInterval(tickRef.current); }, []);

  const answer = (saidTrue: boolean) => {
    if (phase !== 'playing') return;
    const cur = order.current[idx % order.current.length];
    const correct = saidTrue === cur.isTrue;
    if (correct) { scoreRef.current += 1; setScore(scoreRef.current); sfx.correct(); vibrate(10); setFeedback('ok'); }
    else { scoreRef.current = Math.max(0, scoreRef.current - 1); setScore(scoreRef.current); sfx.wrong(); vibrate(40); setFeedback('no'); }
    setTimeout(() => setFeedback(null), 280);
    setIdx(i => i + 1);
    if (goalScore && scoreRef.current >= goalScore) end();
  };

  const cur = order.current[idx % order.current.length];

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-detective-700">⚡ ตอบเร็วจับเวลา {goalScore ? `(เป้า ${goalScore})` : ''}</p>
        <p className="text-sm font-bold tabular-nums">
          <span className="text-warning-600">{score}</span>
          {phase === 'playing' && <span className="text-detective-500 ml-2">⏱ {timeLeft}s</span>}
        </p>
      </div>

      <div className={`relative rounded-2xl border-2 p-5 min-h-[200px] flex flex-col items-center justify-center text-center shadow-glow-sm transition-colors ${
        feedback === 'ok' ? 'border-success-400 bg-success-50'
        : feedback === 'no' ? 'border-danger-400 bg-danger-50'
        : 'border-detective-200 bg-detective-50/40'
      }`}>
        {phase === 'playing' ? (
          <>
            <p className="text-base font-bold text-detective-800 leading-snug mb-5 px-2">"{cur.text}"</p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              <button onClick={() => answer(true)} className="btn-secondary py-3 text-base">✅ จริง</button>
              <button onClick={() => answer(false)} className="btn-secondary py-3 text-base">❌ เท็จ</button>
            </div>
          </>
        ) : phase === 'ready' ? (
          <>
            <p className="text-3xl mb-1">⚡</p>
            <p className="font-display font-bold text-detective-800">จริง หรือ เท็จ? ตอบให้ไวที่สุด!</p>
            <p className="text-xs text-slate-500 mt-1">ตอบถูก +1 · ผิด -1 · มีเวลา {seconds} วินาที</p>
            <button onClick={start} className="btn-primary mt-3 px-6">เริ่ม! ▶</button>
          </>
        ) : (
          <>
            <p className="text-2xl mb-1">{goalScore && scoreRef.current >= goalScore ? '🏆 ผ่าน!' : '⏰ หมดเวลา!'}</p>
            <p className="font-display font-bold text-detective-800">ตอบถูก {score} ข้อ</p>
            <button onClick={start} className="btn-primary mt-3 px-6">เล่นอีกครั้ง 🔄</button>
          </>
        )}
      </div>
    </div>
  );
}
