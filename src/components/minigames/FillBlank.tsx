import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FillBlankQuestion } from '../../types';

interface Props {
  title: string;
  questions: FillBlankQuestion[];
  onComplete: (allCorrect: boolean) => void;
}

// เพิ่มคำที่หายไป — มี 2 ตัวเลือกให้เลือก กันการพิมพ์ผิด
export default function FillBlank({ title, questions, onComplete }: Props) {
  const [answers, setAnswers] = useState<(0 | 1 | null)[]>(questions.map(() => null));
  const [revealed, setRevealed] = useState<boolean[]>(questions.map(() => false));

  const handlePick = (qIdx: number, optIdx: 0 | 1) => {
    if (revealed[qIdx]) return;
    setAnswers(a => { const n = [...a]; n[qIdx] = optIdx; return n; });
    setRevealed(r => { const n = [...r]; n[qIdx] = true; return n; });
  };

  const allDone = revealed.every(Boolean);
  const correctCount = answers.reduce<number>(
    (sum, a, i) => sum + (a === questions[i].correctIndex ? 1 : 0),
    0
  );

  const renderSentence = (s: string, qIdx: number) => {
    const parts = s.split('___');
    const ans = answers[qIdx];
    const blank = ans !== null
      ? questions[qIdx].options[ans]
      : '___';
    const isCorrect = revealed[qIdx] && ans === questions[qIdx].correctIndex;
    return (
      <p className="text-base leading-relaxed">
        {parts[0]}
        <span
          className={`inline-block px-2 py-0.5 rounded mx-1 font-bold border-2 transition-all ${
            !revealed[qIdx]
              ? 'bg-warning-50 border-dashed border-warning-300 text-warning-600'
              : isCorrect
              ? 'bg-success-50 border-success-500 text-success-600'
              : 'bg-danger-50 border-danger-500 text-danger-600'
          }`}
        >
          {blank}
        </span>
        {parts[1]}
      </p>
    );
  };

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold text-lg text-detective-700">✏️ {title}</h3>
      <p className="text-sm text-gray-600">
        เลือกคำที่ถูกต้องจาก 2 ตัวเลือกข้างล่าง เติมในช่องว่าง
      </p>

      {questions.map((q, qIdx) => (
        <div key={qIdx} className="card border-l-4 border-detective-500">
          {renderSentence(q.sentence, qIdx)}
          {!revealed[qIdx] ? (
            <div className="flex gap-2 mt-3">
              {q.options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => handlePick(qIdx, optIdx as 0 | 1)}
                  className="flex-1 py-2 px-3 bg-white border-2 border-detective-200 hover:border-detective-500
                             rounded-lg font-semibold text-sm active:scale-95 transition-all"
                >
                  <span className="text-detective-400 mr-1">{String.fromCharCode(65 + optIdx)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`mt-3 p-3 rounded-lg ${
                  answers[qIdx] === q.correctIndex ? 'bg-success-50' : 'bg-danger-50'
                }`}
              >
                <p className={`font-semibold mb-1 text-sm ${
                  answers[qIdx] === q.correctIndex ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {answers[qIdx] === q.correctIndex
                    ? '✓ ถูกต้อง!'
                    : `✗ คำตอบที่ถูกคือ "${q.options[q.correctIndex]}"`}
                </p>
                {q.reveal && <p className="text-xs text-gray-600 leading-relaxed">{q.reveal}</p>}
                {q.source && (
                  <p className="text-[10px] text-gray-500 mt-1.5 leading-snug">
                    📚 อ้างอิง: {q.source}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      ))}

      {allDone && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-2">
          <p className="font-semibold mb-2">
            ตอบถูก {correctCount}/{questions.length} ข้อ
          </p>
          <button
            onClick={() => onComplete(correctCount === questions.length)}
            className="btn-primary"
          >
            ไปต่อ →
          </button>
        </motion.div>
      )}
    </div>
  );
}
