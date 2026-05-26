import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { getExamQuestions, type QuizResultItem } from '../lib/quizBank';
import { TOTAL_STAGES } from '../scenarios';
import QuizRunner from '../components/QuizRunner';
import QuizReview from '../components/QuizReview';
import PageHeader from '../components/PageHeader';
import Confetti from '../components/Confetti';
import { sfx } from '../lib/sound';

const EXAM_N = 15;
const PASS_PERCENT = 80;
const BONUS_COINS = 200;

export default function Exam() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const recordExam = usePlayerStore(s => s.recordExam);

  // ปลดเมื่อจบครบทุกด่าน หรือมี certificate แล้ว
  const eligible = player.stagesCompleted.length >= TOTAL_STAGES || !!player.certificateNo;

  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<{ percent: number; passed: boolean; gotBonus: boolean; details: QuizResultItem[] } | null>(null);
  // สุ่มชุดใหม่ทุกครั้งที่กดเริ่ม
  const [runKey, setRunKey] = useState(0);
  const questions = useMemo(() => getExamQuestions(EXAM_N), [runKey]);

  const handleFinish = (score: number, total: number, details: QuizResultItem[]) => {
    const percent = Math.round((score / total) * 100);
    const passed = percent >= PASS_PERCENT;
    const gotBonus = recordExam(percent, passed, BONUS_COINS);
    setResult({ percent, passed, gotBonus, details });
    if (passed) sfx.victory(); else sfx.wrong();
  };

  const restart = () => {
    sfx.click();
    setResult(null);
    setStarted(true);
    setRunKey(k => k + 1);
  };

  // ===== ยังไม่ปลดล็อก =====
  if (!eligible) {
    return (
      <div className="min-h-full pb-10">
        <PageHeader title="🎓 แบบทดสอบรวม" backTo="/" />
        <main className="max-w-md mx-auto px-4 pt-6 text-center">
          <div className="card-hero py-8">
            <div className="text-6xl mb-3 leading-none">🔒</div>
            <h2 className="font-display font-bold text-xl text-detective-700 mb-2">ยังไม่ปลดล็อก</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              แบบทดสอบรวมจะเปิดเมื่อ <b>จบครบ {TOTAL_STAGES} ด่าน</b> หรือได้รับเกียรติบัตรแล้ว
              <br />(ตอนนี้ {player.stagesCompleted.length}/{TOTAL_STAGES} ด่าน)
            </p>
            <button onClick={() => { sfx.click(); nav('/'); }} className="btn-primary mt-5">
              กลับไปเล่นต่อ
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ===== หน้าผลลัพธ์ =====
  if (result) {
    return (
      <div className="min-h-full pb-10">
        <Confetti active={result.passed} count={90} duration={2600} />
        <PageHeader title="🎓 แบบทดสอบรวม" backTo="/" />
        <main className="max-w-md mx-auto px-4 pt-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="card-hero text-center py-8">
            <div className="text-6xl mb-3 leading-none">{result.passed ? '🎓' : '📚'}</div>
            <h2 className="font-display font-bold text-2xl text-detective-700 mb-1">{result.percent}%</h2>
            <p className={`font-semibold mb-3 ${result.passed ? 'text-success-600' : 'text-warning-600'}`}>
              {result.passed ? '✓ ผ่านการประเมิน!' : `ยังไม่ผ่าน (ต้อง ≥ ${PASS_PERCENT}%)`}
            </p>
            {result.passed && (
              <p className="text-sm text-slate-600 mb-2">
                ได้รับเหรียญตรา <b className="text-detective-700">🎓 ผ่านการประเมิน</b>
              </p>
            )}
            {result.gotBonus && (
              <p className="inline-block bg-gradient-to-r from-warning-400 to-warning-500
                            text-white font-bold px-5 py-2 rounded-full shadow-glow">
                โบนัสครั้งแรก +{BONUS_COINS} 🪙
              </p>
            )}
            {player.examBestScore !== undefined && (
              <p className="text-[11px] text-slate-500 mt-4">คะแนนสูงสุดที่เคยทำ: {player.examBestScore}%</p>
            )}
          </motion.div>

          <QuizReview details={result.details} defaultOpen />

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={restart} className="btn-secondary">🔄 ทำใหม่</button>
            <button onClick={() => { sfx.click(); nav('/'); }} className="btn-primary">🏠 หน้าหลัก</button>
          </div>
        </main>
      </div>
    );
  }

  // ===== หน้าเริ่ม =====
  if (!started) {
    return (
      <div className="min-h-full pb-10">
        <PageHeader title="🎓 แบบทดสอบรวม" subtitle="วัดความรู้รวมทุกด่าน" backTo="/" />
        <main className="max-w-md mx-auto px-4 pt-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-hero text-center py-8">
            <div className="text-6xl mb-3 leading-none">🎓</div>
            <h2 className="font-display font-bold text-xl text-detective-700 mb-2">แบบทดสอบรวม</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-1">
              {EXAM_N} ข้อ ครอบคลุมความรู้เรื่องบุหรี่ไฟฟ้าทุกด่าน
            </p>
            <p className="text-slate-500 text-xs mb-4">
              ผ่านที่ <b className="text-success-600">{PASS_PERCENT}%</b> ขึ้นไป · เล่นซ้ำได้
              {!player.examBonusClaimed && <> · ผ่านครั้งแรกรับ <b className="text-warning-600">+{BONUS_COINS} 🪙</b></>}
            </p>
            <button onClick={() => { sfx.click(); setStarted(true); }} className="btn-primary w-full">
              เริ่มสอบ →
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  // ===== หน้าทำควิซ =====
  return (
    <div className="min-h-full pb-10">
      <PageHeader title="🎓 แบบทดสอบรวม" backTo="/" />
      <main className="max-w-md mx-auto px-4 pt-4">
        <QuizRunner key={runKey} questions={questions} onFinish={handleFinish} finishLabel="ส่งคำตอบ →" revealMode="end" />
      </main>
    </div>
  );
}
