import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RiskBucket, RiskItem } from '../../types';

interface Props {
  title: string;
  buckets: RiskBucket[];
  items: RiskItem[];
  onComplete: (allCorrect: boolean) => void;
}

const LEVEL_STYLE: Record<RiskBucket['level'], { bg: string; border: string; text: string; tag: string }> = {
  low:     { bg: 'bg-success-50',  border: 'border-success-500',  text: 'text-success-700',  tag: 'bg-success-500'  },
  mid:     { bg: 'bg-warning-50',  border: 'border-warning-500',  text: 'text-warning-700',  tag: 'bg-warning-500'  },
  high:    { bg: 'bg-orange-50',   border: 'border-orange-500',   text: 'text-orange-700',   tag: 'bg-orange-500'   },
  extreme: { bg: 'bg-danger-50',   border: 'border-danger-500',   text: 'text-danger-700',   tag: 'bg-danger-500'   },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// จัดของลงช่อง risk levels — ผู้เล่นแตะของก่อน แล้วแตะช่องเป้าหมาย
export default function RiskRank({ title, buckets, items, onComplete }: Props) {
  const [pool, setPool] = useState<RiskItem[]>(useMemo(() => shuffle(items), [items]));
  // mapping: itemId -> bucketId
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [pickedItemId, setPickedItemId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleItemTap = (id: string) => {
    if (submitted) return;
    setPickedItemId(prev => (prev === id ? null : id));
  };

  const handleBucketTap = (bucketId: string) => {
    if (submitted) return;
    if (!pickedItemId) return;
    setPlaced(p => ({ ...p, [pickedItemId]: bucketId }));
    setPool(p => p.filter(it => it.id !== pickedItemId));
    setPickedItemId(null);
  };

  const handleRemoveFromBucket = (itemId: string) => {
    if (submitted) return;
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    setPlaced(p => {
      const next = { ...p };
      delete next[itemId];
      return next;
    });
    setPool(p => [...p, item]);
  };

  const allPlaced = pool.length === 0;
  const correctCount = Object.entries(placed).reduce(
    (sum, [itemId, bucketId]) =>
      sum + (items.find(i => i.id === itemId)?.bucketId === bucketId ? 1 : 0),
    0
  );

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => onComplete(correctCount === items.length), 1800);
  };

  const itemsInBucket = (bucketId: string) =>
    Object.entries(placed)
      .filter(([, b]) => b === bucketId)
      .map(([itemId]) => items.find(i => i.id === itemId)!)
      .filter(Boolean);

  const isItemCorrect = (itemId: string) => {
    if (!submitted) return null;
    const placedBucket = placed[itemId];
    return placedBucket === items.find(i => i.id === itemId)?.bucketId;
  };

  return (
    <div className="space-y-3">
      <h3 className="font-display font-bold text-lg text-detective-700">📊 {title}</h3>
      <p className="text-sm text-gray-600">
        แตะการ์ดด้านบน → แตะช่องระดับความเสี่ยงด้านล่างเพื่อจัดวาง
      </p>

      {/* Pool */}
      {pool.length > 0 && !submitted && (
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">การ์ดที่ยังไม่ได้จัด</p>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {pool.map(it => (
                <motion.button
                  key={it.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  onClick={() => handleItemTap(it.id)}
                  className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                    pickedItemId === it.id
                      ? 'bg-warning-50 border-warning-500 ring-2 ring-warning-300 scale-105'
                      : 'bg-white border-detective-200 text-detective-700'
                  }`}
                >
                  {it.text}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Buckets */}
      <div className="space-y-2">
        {buckets.map(b => {
          const style = LEVEL_STYLE[b.level];
          const list = itemsInBucket(b.id);
          return (
            <motion.button
              key={b.id}
              onClick={() => handleBucketTap(b.id)}
              disabled={submitted || !pickedItemId}
              className={`w-full text-left rounded-2xl border-2 p-3 transition-all ${style.bg} ${style.border} ${
                pickedItemId ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${style.tag}`} />
                <span className={`font-bold text-sm ${style.text}`}>{b.label}</span>
                <span className="ml-auto text-[10px] text-gray-500">{list.length} ชิ้น</span>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                <AnimatePresence>
                  {list.map(it => {
                    const correct = isItemCorrect(it.id);
                    return (
                      <motion.span
                        key={it.id}
                        layout
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        onClick={(e) => { e.stopPropagation(); handleRemoveFromBucket(it.id); }}
                        className={`inline-block text-[11px] px-2 py-1 rounded-lg cursor-pointer ${
                          correct === true  ? 'bg-success-100 border border-success-500 text-success-700'
                          : correct === false ? 'bg-danger-100 border border-danger-500 text-danger-700'
                          : 'bg-white border border-detective-200 text-detective-700'
                        }`}
                      >
                        {it.text}
                        {!submitted && <span className="ml-1 opacity-60 text-[9px]">✕</span>}
                        {correct === true  && <span className="ml-1">✓</span>}
                        {correct === false && <span className="ml-1">✗</span>}
                      </motion.span>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!allPlaced}
          className="btn-primary w-full disabled:opacity-50"
        >
          ยืนยันการจัดอันดับ
        </button>
      )}

      {submitted && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center">
          <p className="font-semibold">
            จัดถูก {correctCount}/{items.length}
          </p>
        </motion.div>
      )}
    </div>
  );
}
