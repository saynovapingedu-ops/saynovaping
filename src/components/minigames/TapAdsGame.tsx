import { useEffect, useRef, useState } from 'react';
import { sfx, vibrate } from '../../lib/sound';

// ============================================================================
//  TapAdsGame — "ทุบโฆษณาหลอก" แนว whack-a-mole
//  แตะ "โฆษณาบุหรี่ไฟฟ้า/คำหลอก" ให้ทัน — ห้ามแตะ "ข้อมูลจริง/สุขภาพ"
// ============================================================================

interface Props {
  goalScore?: number;
  onComplete?: (success: boolean, score: number) => void;
  seconds?: number;
}

const SLOTS = 9; // 3x3
const BAD = ['🚬', '💨', '📢', '🆓'];   // โฆษณา/คำหลอก — แตะได้
const GOOD = ['❤️', '✅', '🫁', '💧'];  // ข้อมูลจริง/สุขภาพ — ห้ามแตะ

interface Mole { slot: number; emoji: string; bad: boolean; id: number; }

export default function TapAdsGame({ goalScore, onComplete, seconds = 30 }: Props) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [moles, setMoles] = useState<Mole[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  const scoreRef = useRef(0);
  const idRef = useRef(0);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phaseRef = useRef<'ready' | 'playing' | 'done'>('ready');
  const setPhaseBoth = (p: 'ready' | 'playing' | 'done') => { phaseRef.current = p; setPhase(p); };

  const cleanup = () => {
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    spawnRef.current = null; tickRef.current = null;
  };

  const end = () => {
    if (phaseRef.current !== 'playing') return;
    cleanup();
    setMoles([]);
    setPhaseBoth('done');
    const won = goalScore ? scoreRef.current >= goalScore : true;
    if (won) sfx.victory(); else sfx.wrong();
    if (!goalScore || won) onComplete?.(won, scoreRef.current);
  };

  const start = () => {
    cleanup();
    scoreRef.current = 0;
    setScore(0);
    setTimeLeft(seconds);
    setMoles([]);
    setPhaseBoth('playing');

    spawnRef.current = setInterval(() => {
      setMoles(prev => {
        if (prev.length >= 4) return prev.slice(1);
        const used = new Set(prev.map(m => m.slot));
        let slot = Math.floor(Math.random() * SLOTS);
        let guard = 0;
        while (used.has(slot) && guard++ < 12) slot = Math.floor(Math.random() * SLOTS);
        const bad = Math.random() < 0.68;
        const emoji = bad
          ? BAD[Math.floor(Math.random() * BAD.length)]
          : GOOD[Math.floor(Math.random() * GOOD.length)];
        const id = ++idRef.current;
        // หายเองหลัง ~1.1s
        setTimeout(() => setMoles(cur => cur.filter(m => m.id !== id)), 1100);
        return [...prev, { slot, emoji, bad, id }];
      });
    }, 600);

    tickRef.current = setInterval(() => {
      setTimeLeft(t => (t <= 1 ? 0 : t - 1));
    }, 1000);
  };

  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0) end();
  }, [timeLeft, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => cleanup, []);

  const hit = (m: Mole) => {
    if (phaseRef.current !== 'playing') return;
    setMoles(prev => prev.filter(x => x.id !== m.id));
    if (m.bad) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      sfx.correct(); vibrate(12);
      setFlash('+1');
    } else {
      scoreRef.current = Math.max(0, scoreRef.current - 1);
      setScore(scoreRef.current);
      sfx.wrong(); vibrate(40);
      setFlash('นั่นข้อมูลจริง! -1');
    }
    setTimeout(() => setFlash(null), 500);
    if (goalScore && scoreRef.current >= goalScore) end();
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-detective-700">
          👆 ทุบโฆษณาหลอก {goalScore ? `(เป้า ${goalScore})` : ''}
        </p>
        <p className="text-sm font-bold tabular-nums">
          <span className="text-warning-600">{score} คะแนน</span>
          {phase === 'playing' && <span className="text-detective-500 ml-2">⏱ {timeLeft}s</span>}
        </p>
      </div>

      <div className="relative rounded-2xl border-2 border-detective-200 bg-detective-50/50 p-3 shadow-glow-sm">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: SLOTS }).map((_, slot) => {
            const m = moles.find(x => x.slot === slot);
            return (
              <button
                key={slot}
                onPointerDown={() => m && phase === 'playing' && hit(m)}
                className="aspect-square rounded-xl bg-white border border-detective-100
                           flex items-center justify-center text-3xl active:scale-95 transition-transform"
              >
                {m ? m.emoji : ''}
              </button>
            );
          })}
        </div>

        {flash && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold
                          bg-white/90 rounded-full px-3 py-1 shadow text-detective-700">
            {flash}
          </div>
        )}

        {phase !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-[1px] text-center px-4 rounded-2xl">
            {phase === 'ready' ? (
              <>
                <p className="text-3xl mb-1">👆🚬</p>
                <p className="font-display font-bold text-detective-800">แตะโฆษณาบุหรี่ไฟฟ้าให้ทัน!</p>
                <p className="text-xs text-slate-500 mt-1">อย่าแตะ ❤️ ✅ 🫁 (ข้อมูลจริง) — จะเสียคะแนน</p>
              </>
            ) : (
              <>
                <p className="text-2xl mb-1">{goalScore && scoreRef.current >= goalScore ? '🏆 ผ่าน!' : '⏰ หมดเวลา!'}</p>
                <p className="font-display font-bold text-detective-800">ได้ {score} คะแนน</p>
              </>
            )}
            <button onClick={start} className="btn-primary mt-3 px-6">
              {phase === 'ready' ? 'เริ่ม! ▶' : 'เล่นอีกครั้ง 🔄'}
            </button>
            {phase === 'done' && goalScore && scoreRef.current < goalScore && (
              <button onClick={() => onComplete?.(false, scoreRef.current)} className="text-xs text-slate-500 underline mt-2">
                ข้ามด่านมินิเกมนี้ →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
