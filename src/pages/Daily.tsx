import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { getDailyQuestions } from '../lib/quizBank';
import QuizRunner from '../components/QuizRunner';
import PageHeader from '../components/PageHeader';
import Confetti from '../components/Confetti';
import { sfx } from '../lib/sound';

const COIN_PER_CORRECT = 4;

// yyyy-mm-dd ท้องถิ่น (ตรงกับ playerStore.todayDate)
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Daily() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const recordDaily = usePlayerStore(s => s.recordDaily);
  const pingDailyPlay = usePlayerStore(s => s.pingDailyPlay);

  const today = todayStr();
  const alreadyDone = player.lastDailyDate === today;

  const questions = useMemo(() => getDailyQuestions(today, 5), [today]);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; coins: number } | null>(null);

  const handleFinish = (score: number, total: number) => {
    const coins = score * COIN_PER_CORRECT;
    const ok = recordDaily(score, total, coins);
    if (ok) {
      pingDailyPlay(); // ช่วยรักษา streak
      setResult({ score, total, coins });
      sfx.victory();
    } else {
      // เผื่อกรณี race — ทำไปแล้ว
      setResult({ score, total, coins: 0 });
    }
  };

  // ===== หน้าผลลัพธ์ =====
  if (result || alreadyDone) {
    const score = result?.score;
    return (
      <div className="min-h-full pb-10">
        <Confetti active={!!result} count={70} duration={2200} />
        <PageHeader title="📅 ภารกิจรายวัน" backTo="/" />
        <main className="max-w-md mx-auto px-4 pt-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card-hero text-center py-8"
          >
            <div className="text-6xl mb-3 leading-none">{result ? '🎉' : '✅'}</div>
            <h2 className="font-display font-bold text-xl text-detective-700 mb-1">
              {result ? 'ทำภารกิจวันนี้สำเร็จ!' : 'วันนี้ทำแล้ว'}
            </h2>
            {result ? (
              <>
                <p className="text-slate-600 mb-3">
                  ตอบถูก <b className="text-success-600">{score}/{result.total}</b> ข้อ
                </p>
                {result.coins > 0 && (
                  <p className="inline-block bg-gradient-to-r from-warning-400 to-warning-500
                                text-white font-bold px-5 py-2 rounded-full shadow-glow">
                    +{result.coins} 🪙
                  </p>
                )}
              </>
            ) : (
              <p className="text-slate-600 mb-3">กลับมาทำชุดใหม่ได้พรุ่งนี้ 🌙</p>
            )}
            <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
              💡 ภารกิจรายวันสุ่มคำถามใหม่ทุกวัน — ทำต่อเนื่องช่วยรักษา streak 🔥
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={() => { sfx.click(); nav('/knowledge'); }} className="btn-secondary">
              📖 ทบทวนความรู้
            </button>
            <button onClick={() => { sfx.click(); nav('/'); }} className="btn-primary">
              🏠 หน้าหลัก
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ===== หน้าเริ่ม =====
  if (!started) {
    return (
      <div className="min-h-full pb-10">
        <PageHeader title="📅 ภารกิจรายวัน" subtitle="ควิซสั้นๆ ทบทวนความรู้ทุกวัน" backTo="/" />
        <main className="max-w-md mx-auto px-4 pt-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-hero text-center py-8">
            <div className="text-6xl mb-3 leading-none">📅</div>
            <h2 className="font-display font-bold text-xl text-detective-700 mb-2">ภารกิจวันนี้</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-1">
              ตอบคำถามเรื่องบุหรี่ไฟฟ้า <b>5 ข้อ</b>
            </p>
            <p className="text-slate-500 text-xs mb-4">
              ถูกข้อละ <b className="text-warning-600">+{COIN_PER_CORRECT} 🪙</b> · ทำได้วันละครั้ง
            </p>
            <button onClick={() => { sfx.click(); setStarted(true); }} className="btn-primary w-full">
              เริ่มทำ →
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  // ===== หน้าทำควิซ =====
  return (
    <div className="min-h-full pb-10">
      <PageHeader title="📅 ภารกิจรายวัน" backTo="/" />
      <main className="max-w-md mx-auto px-4 pt-4">
        <QuizRunner questions={questions} onFinish={handleFinish} finishLabel="ดูผล →" />
      </main>
    </div>
  );
}
