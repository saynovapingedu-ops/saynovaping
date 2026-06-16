// ============================================================================
//  Leaderboard — กระดานอันดับ "รวมผู้เล่นทั้งหมด"
//
//  PDPA: ไม่เปิดเผยข้อมูลผู้เล่นคนอื่น — backend ส่งกลับเฉพาะ "ลำดับ + คะแนนรวม"
//  ชื่อเล่นจะแสดงเฉพาะแถวของผู้เล่นเองเท่านั้น คนอื่นขึ้นว่า "นักสืบนิรนาม"
//  ไม่มีการแยกตามห้องเรียน/โรงเรียน (ลดการประมวลผลข้อมูลส่วนบุคคล)
//
//  ออกแบบให้ degrade gracefully: ถ้า backend ยังไม่รองรับ → โชว์ state แนะนำ
//  พร้อมการ์ดของผู้เล่นเอง ไม่ปล่อยหน้าว่าง และไม่ crash
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { getLevelByXP, TIER_INFO } from '../lib/levels';
import { fetchLeaderboard } from '../lib/cloudSync';
import type { LeaderboardEntry, LeaderboardResponse } from '../lib/cloudSync';
import PageHeader from '../components/PageHeader';
import { sfx } from '../lib/sound';
import SkeletonCard from '../components/ui/SkeletonCard';
import EmptyState from '../components/ui/EmptyState';
import AnonymousAvatar from '../components/ui/AnonymousAvatar';

function medal(rank: number): string {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
}

export default function Leaderboard() {
  const nav = useNavigate();
  const player = usePlayerStore();

  const [status, setStatus] = useState<'loading' | 'ok' | 'unsupported' | 'error'>('loading');
  const [data, setData] = useState<LeaderboardResponse | null>(null);

  const myLevel = getLevelByXP(player.totalXP);
  const myTier = TIER_INFO[myLevel.tier];
  const myRank = data?.me?.rank ?? 0;
  const totalPlayers = data?.total ?? 0;

  const load = useCallback(async () => {
    setStatus('loading');
    const res = await fetchLeaderboard(player.userIdHash, 'all');
    setData(res);
    if (res.ok) setStatus('ok');
    else if (res.unsupported) setStatus('unsupported');
    else setStatus('error');
  }, [player.userIdHash]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-full pb-10 relative">
      <PageHeader title="🏆 กระดานอันดับ" subtitle="อันดับรวมของผู้เล่นทั้งหมด" backTo="/stats" />

      <main className="max-w-md md:max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* ===== การ์ดอันดับของฉัน (เด่นบนสุด) ===== */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-hero text-center"
        >
          <p className="text-xs text-slate-500">อันดับของคุณ</p>
          <p className="font-display font-extrabold text-detective-700 leading-tight my-0.5"
             style={{ fontSize: '2rem' }}>
            {status === 'ok' && myRank > 0
              ? <>#{myRank} <span className="text-base text-slate-400 font-bold">
                  {totalPlayers > 0 && `จาก ${totalPlayers} คน`}</span></>
              : <span className="text-xl text-slate-400">ยังไม่มีอันดับ</span>}
          </p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: myTier.color }}>
              {myTier.label}
            </span>
            <span className="text-xs text-slate-600">
              {myLevel.emoji} {player.totalXP.toLocaleString()} แต้ม · {player.stagesCompleted.length} ด่าน
            </span>
          </div>
        </motion.div>

        {totalPlayers > 0 && status === 'ok' && (
          <p className="text-center text-xs text-slate-500 -mt-1">🌏 ผู้เล่นทั้งหมด {totalPlayers} คน</p>
        )}

        {/* ===== Loading ===== */}
        {status === 'loading' && (
          <SkeletonCard variant="row" count={5} label="กำลังโหลดอันดับ" />
        )}

        {/* ===== Error (network) ===== */}
        {status === 'error' && (
          <EmptyState
            icon="📡"
            tone="error"
            title="เชื่อมต่อไม่ได้"
            description="ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง"
            action={<button onClick={load} className="btn-secondary">ลองใหม่</button>}
          />
        )}

        {/* ===== Backend ยังไม่รองรับ ===== */}
        {status === 'unsupported' && (
          <EmptyState
            icon="🚧"
            tone="info"
            title="กระดานอันดับกำลังเปิดเร็ว ๆ นี้"
            description="เมื่อมีผู้เล่นเข้ามามากขึ้น อันดับจะปรากฏที่นี่"
          />
        )}

        {/* ===== รายการอันดับ (ปิดชื่อคนอื่น) ===== */}
        {status === 'ok' && data && data.entries.length > 0 && (
          <div>
            <p className="section-label text-sm mb-1.5">🏅 อันดับสูงสุด</p>
            <ol className="space-y-2">
              {data.entries.map((e, i) => (
                <LeaderRow key={`${e.rank}-${i}`} entry={e} index={i} />
              ))}
            </ol>
          </div>
        )}

        {/* ว่างเปล่า */}
        {status === 'ok' && data && data.entries.length === 0 && (
          <EmptyState
            icon="🌱"
            title="ยังไม่มีใครบนกระดาน"
            description="เล่นด่านให้จบเพื่อเป็นคนแรก!"
          />
        )}

        {/* ===== หมายเหตุ PDPA ===== */}
        <div className="card bg-success-50/50 border border-success-100">
          <p className="text-[11px] text-slate-600 leading-relaxed">
            🔒 <b>ความเป็นส่วนตัว (PDPA):</b> กระดานนี้ <b>ไม่เปิดเผยชื่อผู้เล่นคนอื่น</b> —
            แสดงเพียงลำดับและคะแนนรวมเท่านั้น ส่วนชื่อเล่นของคุณจะเห็นได้เฉพาะตัวคุณเอง
            <br />
            🌱 อันดับมีไว้เป็น <b>กำลังใจ</b> ไม่ใช่การแข่งขัน — เล่นเพื่อเรียนรู้และดูแลสุขภาพเป็นหลัก
          </p>
        </div>

        <div className="text-center pt-1">
          <button onClick={() => { sfx.click(); nav('/'); }} className="btn-secondary">
            ← กลับหน้าแรก
          </button>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
//  แถวอันดับเดียว — คนอื่นไม่แสดงชื่อ (PDPA)
// ============================================================================
function LeaderRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const lv = getLevelByXP(entry.totalXP);
  const tier = TIER_INFO[lv.tier];
  const top3 = entry.rank >= 1 && entry.rank <= 3;

  // PDPA: แสดงชื่อเฉพาะแถวของผู้เล่นเอง
  const displayName = entry.isMe ? `${entry.nickname || 'คุณ'} (คุณ)` : 'นักสืบนิรนาม';

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className={`card flex items-center gap-3 ${
        entry.isMe ? 'border-2 border-detective-400 bg-detective-50/60' : ''
      }`}
    >
      {/* อันดับ */}
      <div className={`w-9 text-center font-display font-extrabold flex-shrink-0 ${
        top3 ? 'text-2xl' : 'text-base text-slate-500'
      }`}>
        {medal(entry.rank)}
      </div>

      {/* avatar — ใช้ AnonymousAvatar สำหรับคนอื่น (PDPA) */}
      {!entry.isMe && <AnonymousAvatar rank={entry.rank} size={36} />}

      {/* ชื่อ (เฉพาะตัวเอง) + tier */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate ${
          entry.isMe ? 'text-detective-700' : 'text-slate-400 italic'
        }`}>
          {displayName}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: tier.color }}>
            {tier.label}
          </span>
          <span className="text-xs text-slate-500">{lv.emoji} ระดับ {lv.level}</span>
        </div>
      </div>

      {/* XP */}
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-detective-700 leading-none">{entry.totalXP.toLocaleString()}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">แต้ม</p>
      </div>
    </motion.li>
  );
}
