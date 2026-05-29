import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { getDailyQuestions, type QuizResultItem } from '../lib/quizBank';
import QuizRunner from '../components/QuizRunner';
import QuizReview from '../components/QuizReview';
import PageHeader from '../components/PageHeader';
import Confetti from '../components/Confetti';
import { sfx } from '../lib/sound';
import ResultHero from '../components/ui/ResultHero';
import ProgressCircle from '../components/ui/ProgressCircle';
import CountUp from '../components/ui/CountUp';
import StarRating from '../components/ui/StarRating';

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
  const [result, setResult] = useState<{ score: number; total: number; coins: number; details: QuizResultItem[] } | null>(null);

  const handleFinish = (score: number, total: number, details: QuizResultItem[]) => {
    const coins = score * COIN_PER_CORRECT;
    const ok = recordDaily(score, total, coins);
    if (ok) {
      pingDailyPlay(); // ช่วยรักษา streak
      setResult({ score, total, coins, details });
      sfx.victory();
    } else {
      // เผื่อกรณี race — ทำไปแล้ว
      setResult({ score, total, coins: 0, details });
    }
  };

  // ===== หน้าผลลัพธ์ =====
  if (result || alreadyDone) {
    const score = result?.score ?? 0;
    const total = result?.total ?? 5;
    const percent = result ? Math.round((result.score / result.total) * 100) : 0;
    return (
      <div className="min-h-full pb-10">
        <Confetti active={!!result} count={70} duration={2200} />
        <PageHeader title="📅 ภารกิจรายวัน" backTo="/" />
        <main className="max-w-md mx-auto px-4 pt-6">
          <ResultHero
            tone={result ? 'success' : 'info'}
            emoji={result ? '🎉' : '✅'}
            title={result ? 'ทำภารกิจวันนี้สำเร็จ!' : 'วันนี้ทำแล้ว'}
            subtitle={
              <p className="text-[11px] text-slate-500 leading-relaxed">
                💡 ภารกิจรายวันสุ่มคำถามใหม่ทุกวัน — ทำต่อเนื่องช่วยรักษาสถิติเล่นต่อเนื่อง 🔥
              </p>
            }
          >
            {result ? (
              <>
                <ProgressCircle
                  percent={percent}
                  tone="success"
                  size={130}
                  label={`ตอบถูก ${score} จาก ${total} ข้อ`}
                >
                  <span className="font-display font-extrabold text-3xl text-success-600 leading-none">
                    <CountUp to={score} duration={900} />
                    <span className="text-slate-400 text-xl">/{total}</span>
                  </span>
                  <span className="text-xs text-slate-500 mt-1">ข้อ</span>
                </ProgressCircle>
                <StarRating score={score} total={total} />
                {result.coins > 0 && (
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.55, type: 'spring', stiffness: 220 }}
                    className="inline-block bg-gradient-to-r from-warning-400 to-warning-500
                               text-white font-bold px-5 py-2 rounded-full shadow-glow-gold"
                  >
                    +<CountUp to={result.coins} duration={900} /> 🪙
                  </motion.span>
                )}
              </>
            ) : (
              <p className="text-slate-600">กลับมาทำชุดใหม่ได้พรุ่งนี้ 🌙</p>
            )}
          </ResultHero>

          {result && <QuizReview details={result.details} />}

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
        <QuizRunner questions={questions} onFinish={handleFinish} finishLabel="ดูผล →" revealMode="immediate" />
      </main>
    </div>
  );
}
