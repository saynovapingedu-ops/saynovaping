import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { BADGES } from '../lib/badges';
import type { Badge } from '../types';
import PageHeader from '../components/PageHeader';
import { sfx } from '../lib/sound';

type Filter = 'all' | 'skill' | 'progress' | 'social';

const FILTERS: { id: Filter; label: string; emoji: string }[] = [
  { id: 'all',      label: 'ทั้งหมด', emoji: '🏅' },
  { id: 'skill',    label: 'ทักษะ',   emoji: '🎯' },
  { id: 'progress', label: 'ความคืบหน้า', emoji: '📈' },
  { id: 'social',   label: 'สังคม',   emoji: '👥' },
];

const CAT_LABEL: Record<Badge['category'], string> = {
  skill: '🎯 ทักษะ',
  progress: '📈 ความคืบหน้า',
  social: '👥 สังคม',
};

export default function Achievements() {
  const player = usePlayerStore();
  const earned = new Set(player.badges);
  const [filter, setFilter] = useState<Filter>('all');

  const total = BADGES.length;
  const earnedCount = BADGES.filter(b => earned.has(b.id)).length;

  const shown = filter === 'all' ? BADGES : BADGES.filter(b => b.category === filter);

  // จัดกลุ่มตามหมวด (เมื่อดู "ทั้งหมด")
  const groups: Badge['category'][] = ['skill', 'progress', 'social'];

  return (
    <div className="min-h-full pb-10 relative">
      <PageHeader title="🏅 เหรียญตรา" subtitle="รางวัลความสำเร็จทั้งหมด" backTo="/stats" />

      <main className="max-w-md md:max-w-2xl mx-auto px-4 pt-4">
        {/* progress hero */}
        <div className="card-hero mb-4">
          <div className="flex items-center gap-3">
            <div className="icon-tile bg-warning-50 text-warning-600 text-3xl">🏅</div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-extrabold text-detective-700 text-lg leading-tight">
                สะสมแล้ว {earnedCount}/{total}
              </p>
              <div className="progress-track mt-1.5">
                <div
                  className="progress-fill"
                  style={{ width: `${total ? (earnedCount / total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                อีก {total - earnedCount} เหรียญตราเพื่อสะสมครบ
              </p>
            </div>
          </div>
        </div>

        {/* filter tabs */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {FILTERS.map(f => {
            const count = f.id === 'all'
              ? earnedCount
              : BADGES.filter(b => b.category === f.id && earned.has(b.id)).length;
            const tot = f.id === 'all' ? total : BADGES.filter(b => b.category === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => { sfx.click(); setFilter(f.id); }}
                className={`rounded-2xl py-2 px-1 text-center transition-all active:scale-95 ${
                  filter === f.id
                    ? 'bg-detective-600 text-white shadow-glow-sm'
                    : 'bg-white text-slate-600 border border-slate-200'
                }`}
              >
                <div className="text-lg leading-none">{f.emoji}</div>
                <p className="text-[10px] font-bold mt-1 leading-tight">{f.label}</p>
                <p className={`text-[9px] ${filter === f.id ? 'text-white/80' : 'text-slate-400'}`}>{count}/{tot}</p>
              </button>
            );
          })}
        </div>

        {/* badges — grouped when "all", flat otherwise */}
        {filter === 'all' ? (
          groups.map(cat => {
            const list = BADGES.filter(b => b.category === cat);
            if (list.length === 0) return null;
            return (
              <section key={cat} className="mb-5">
                <h3 className="font-display font-bold text-detective-700 text-sm mb-2">{CAT_LABEL[cat]}</h3>
                <BadgeGrid badges={list} earned={earned} />
              </section>
            );
          })
        ) : (
          <BadgeGrid badges={shown} earned={earned} />
        )}

        <p className="text-[10px] text-center text-slate-400 mt-4 leading-relaxed">
          💡 เหรียญตราปลดล็อกจากการเล่นด่าน ทำภารกิจ และสอบผ่าน
        </p>
      </main>
    </div>
  );
}

function BadgeGrid({ badges, earned }: { badges: Badge[]; earned: Set<string> }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {badges.map((b, i) => {
        const got = earned.has(b.id);
        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.02 }}
            className={`relative card p-3 text-center transition-all ${got ? '' : 'opacity-45 grayscale'}`}
          >
            <div className="text-3xl leading-none mb-1">{b.emoji}</div>
            <p className={`text-[11px] font-bold leading-tight ${got ? 'text-detective-700' : 'text-slate-500'}`}>
              {b.name}
            </p>
            <p className="text-[9px] text-slate-500 leading-snug mt-0.5 line-clamp-2">{b.description}</p>
            {!got && <div className="absolute top-1.5 right-1.5 text-[11px]">🔒</div>}
            {got && <div className="absolute top-1.5 right-1.5 text-[11px]">✓</div>}
          </motion.div>
        );
      })}
    </div>
  );
}
