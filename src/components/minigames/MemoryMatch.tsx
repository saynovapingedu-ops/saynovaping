import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MemoryPair } from '../../types';

interface Props {
  title: string;
  pairs: MemoryPair[];
  onComplete: (allCorrect: boolean) => void;
}

interface CardSlot {
  uid: string;            // unique key
  pairIdx: number;
  side: 'a' | 'b';
  text: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Concentration / memory match — เปิดทีละ 2 ใบ ถ้าเข้าคู่จะค้างเปิด
export default function MemoryMatch({ title, pairs, onComplete }: Props) {
  const slots = useMemo<CardSlot[]>(() => {
    const arr: CardSlot[] = [];
    pairs.forEach((p, i) => {
      arr.push({ uid: `${i}-a`, pairIdx: i, side: 'a', text: p.a });
      arr.push({ uid: `${i}-b`, pairIdx: i, side: 'b', text: p.b });
    });
    return shuffle(arr);
  }, [pairs]);

  const [opened, setOpened] = useState<string[]>([]);    // uids ที่กำลังเปิด (สูงสุด 2)
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [revealing, setRevealing] = useState<{ pairIdx: number; reveal?: string } | null>(null);

  const allMatched = matched.size === slots.length;

  // เมื่อเปิด 2 ใบ → ตรวจ → เก็บไว้ถ้าเข้าคู่ / ปิดถ้าไม่เข้า
  useEffect(() => {
    if (opened.length < 2) return;
    const [u1, u2] = opened;
    const s1 = slots.find(s => s.uid === u1)!;
    const s2 = slots.find(s => s.uid === u2)!;
    setAttempts(a => a + 1);
    if (s1.pairIdx === s2.pairIdx && s1.side !== s2.side) {
      // match
      setMatched(prev => new Set([...prev, u1, u2]));
      const reveal = pairs[s1.pairIdx].reveal;
      setRevealing({ pairIdx: s1.pairIdx, reveal });
      const t = setTimeout(() => {
        setOpened([]);
        setRevealing(null);
      }, 1400);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setOpened([]), 1100);
      return () => clearTimeout(t);
    }
  }, [opened, slots, pairs]);

  useEffect(() => {
    if (allMatched) {
      const t = setTimeout(() => {
        // win conditions: ใช้ครั้งน้อย = ครบ; ถือว่าผ่านเสมอเพราะจับครบ
        onComplete(true);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [allMatched, onComplete]);

  const handleClick = (slot: CardSlot) => {
    if (matched.has(slot.uid)) return;
    if (opened.includes(slot.uid)) return;
    if (opened.length >= 2) return;
    setOpened([...opened, slot.uid]);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold text-lg text-detective-700">🧠 {title}</h3>
      <p className="text-sm text-gray-600">
        เปิดทีละ 2 ใบ — จับคู่พฤติกรรมกับผลที่เกิดให้ถูก
      </p>

      <div className="flex justify-between text-xs px-1">
        <span className="text-gray-500">เปิดไปแล้ว {attempts} ครั้ง</span>
        <span className="text-success-600 font-semibold">
          จับคู่ {matched.size / 2}/{pairs.length}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map(slot => {
          const isOpen = opened.includes(slot.uid) || matched.has(slot.uid);
          const isMatched = matched.has(slot.uid);
          return (
            <button
              key={slot.uid}
              onClick={() => handleClick(slot)}
              disabled={isMatched}
              className="aspect-[3/4] relative perspective"
              style={{ perspective: '900px' }}
            >
              <motion.div
                className="absolute inset-0 transition-all"
                animate={{ rotateY: isOpen ? 180 : 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Card BACK (face down) */}
                <div
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-detective-500 to-detective-700
                             flex items-center justify-center text-white text-2xl shadow-md border-2 border-detective-300"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  🔍
                </div>
                {/* Card FRONT (face up) */}
                <div
                  className={`absolute inset-0 rounded-xl flex items-center justify-center p-2
                              text-center text-[11px] font-semibold leading-tight shadow-md border-2 ${
                    isMatched
                      ? 'bg-success-50 border-success-500 text-success-700'
                      : 'bg-white border-warning-400 text-detective-700'
                  }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {slot.text}
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {revealing?.reveal && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card bg-success-50 border-l-4 border-success-500"
          >
            <p className="font-semibold text-success-600 text-sm mb-1">✓ จับคู่ได้!</p>
            <p className="text-xs text-gray-700 leading-relaxed">{revealing.reveal}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {allMatched && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center">
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-semibold text-detective-700">
            จับครบ {pairs.length} คู่ใน {attempts} ครั้ง
          </p>
        </motion.div>
      )}
    </div>
  );
}
