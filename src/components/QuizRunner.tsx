import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QuizQuestion } from '../lib/quizBank';
import { sfx, vibrate } from '../lib/sound';

interface Props {
  questions: QuizQuestion[];
  /** เรียกเมื่อตอบครบทุกข้อ — score = จำนวนข้อถูก */
  onFinish: (score: number, total: number) => void;
  /** ข้อความปุ่มจบ (default "ดูผล →") */
  finishLabel?: string;
}

/**
 * QuizRunner — คอมโพเนนต์ควิซกลาง ใช้ทั้ง Daily / Exam / Assessment
 * แสดงทีละข้อ → เลือก → reveal เฉลย+ที่มา → ถัดไป → จบเรียก onFinish
 */
export default function QuizRunner({ questions, onFinish, finishLabel = 'ดูผล →' }: Props) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const q = questions[idx];
  const isLast = idx === questions.length - 1;
  const revealed = picked !== null;

  const handlePick = (optIdx: number) => {
    if (revealed) return;
    const correct = optIdx === q.correctIndex;
    setPicked(optIdx);
    if (correct) {
      setScore(s => s + 1);
      sfx.correct();
      vibrate([15, 25, 15]);
    } else {
      sfx.wrong();
      vibrate(40);
    }
  };

  const handleNext = () => {
    sfx.click();
    if (isLast) {
      onFinish(score, questions.length);
      return;
    }
    setIdx(i => i + 1);
    setPicked(null);
  };

  return (
    <div className="space-y-3">
      {/* progress */}
      <div className="flex items-center gap-2">
        <div className="progress-track flex-1">
          <div
            className="progress-fill"
            style={{ width: `${((idx + (revealed ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold text-detective-600 flex-shrink-0">
          {idx + 1}/{questions.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
        >
          {/* topic chip */}
          <span className="inline-block text-[10px] font-bold text-detective-500 bg-detective-50
                           border border-detective-200 rounded-full px-2 py-0.5 mb-2">
            {q.topic}
          </span>

          {/* question */}
          <div className="card border-l-4 border-detective-500 mb-3">
            <p className="text-base font-semibold text-slate-800 leading-relaxed">{q.question}</p>
          </div>

          {/* choices */}
          <div className="space-y-2">
            {q.choices.map((c, i) => {
              const isCorrect = i === q.correctIndex;
              const isPicked = picked === i;
              let cls = 'bg-white border-detective-200 hover:border-detective-400';
              if (revealed) {
                if (isCorrect) cls = 'bg-success-50 border-success-500';
                else if (isPicked) cls = 'bg-danger-50 border-danger-500';
                else cls = 'bg-white border-slate-200 opacity-60';
              }
              return (
                <button
                  key={i}
                  onClick={() => handlePick(i)}
                  disabled={revealed}
                  className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-start gap-2.5
                              ${cls} ${!revealed ? 'active:scale-[0.98]' : ''}`}
                >
                  <span className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold
                                    ${revealed && isCorrect ? 'bg-success-500 text-white'
                                      : revealed && isPicked ? 'bg-danger-500 text-white'
                                      : 'bg-detective-100 text-detective-600'}`}>
                    {revealed && isCorrect ? '✓' : revealed && isPicked ? '✗' : String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm text-slate-800 leading-snug pt-0.5">{c}</span>
                </button>
              );
            })}
          </div>

          {/* reveal */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-3 p-3 rounded-2xl ${picked === q.correctIndex ? 'bg-success-50' : 'bg-warning-50'}`}
              >
                <p className={`font-semibold text-sm mb-1 ${picked === q.correctIndex ? 'text-success-600' : 'text-warning-700'}`}>
                  {picked === q.correctIndex ? '✓ ถูกต้อง!' : `เฉลย: ${String.fromCharCode(65 + q.correctIndex)}. ${q.choices[q.correctIndex]}`}
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">{q.explain}</p>
                <p className="text-[10px] text-slate-500 italic mt-1.5 leading-snug">📚 อ้างอิง: {q.source}</p>
                <button onClick={handleNext} className="btn-primary w-full mt-3">
                  {isLast ? finishLabel : 'ข้อต่อไป →'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
