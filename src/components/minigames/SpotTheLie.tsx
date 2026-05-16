import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SpotTheLieClaim } from '../../types';

interface Props {
  title: string;
  claims: SpotTheLieClaim[];
  onComplete: (allCorrect: boolean) => void;
}

export default function SpotTheLie({ title, claims, onComplete }: Props) {
  const [answers, setAnswers] = useState<(boolean | null)[]>(claims.map(() => null));
  const [revealed, setRevealed] = useState<boolean[]>(claims.map(() => false));

  const handlePick = (i: number, isLie: boolean) => {
    if (revealed[i]) return;
    const newAns = [...answers]; newAns[i] = isLie; setAnswers(newAns);
    const newRev = [...revealed]; newRev[i] = true; setRevealed(newRev);
  };

  const allDone = revealed.every(Boolean);
  const correctCount = answers.reduce((sum, a, i) => sum + (a === claims[i].isLie ? 1 : 0), 0);

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold text-lg text-detective-700">🎯 {title}</h3>
      <p className="text-sm text-gray-600">
        แต่ละข้อความด้านล่าง — กดว่า "จริง" หรือ "เท็จ"
      </p>
      {claims.map((claim, i) => (
        <div key={i} className="card border-l-4 border-detective-500">
          <p className="text-gray-800 leading-relaxed mb-3">{claim.text}</p>
          {!revealed[i] ? (
            <div className="flex gap-2">
              <button
                onClick={() => handlePick(i, false)}
                className="flex-1 py-2 px-4 bg-success-500 text-white rounded-lg font-semibold active:scale-95"
              >
                ✓ จริง
              </button>
              <button
                onClick={() => handlePick(i, true)}
                className="flex-1 py-2 px-4 bg-danger-500 text-white rounded-lg font-semibold active:scale-95"
              >
                ✗ เท็จ
              </button>
            </div>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`p-3 rounded-lg ${
                  answers[i] === claim.isLie ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'
                }`}
              >
                <p className="font-semibold mb-1">
                  {answers[i] === claim.isLie ? '✓ ถูกต้อง!' : '✗ ลองคิดอีกครั้ง'}
                </p>
                <p className="text-sm text-gray-700">{claim.reveal}</p>
                {claim.source && (
                  <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                    📚 อ้างอิง: {claim.source}
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
            ตอบถูก {correctCount}/{claims.length} ข้อ
          </p>
          <button onClick={() => onComplete(correctCount === claims.length)} className="btn-primary">
            ไปต่อ →
          </button>
        </motion.div>
      )}
    </div>
  );
}
