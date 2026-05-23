// ============================================================================
//  Leaderboard — กระดานอันดับ "ห้องเรียน / โรงเรียน / ทั้งหมด"
//
//  ข้อมูลมาจาก backend (Apps Script action=leaderboard) ผ่าน fetchLeaderboard()
//  ออกแบบให้ degrade gracefully: ถ้า backend ยังไม่รองรับ → โชว์ state แนะนำ
//  พร้อมการ์ดของผู้เล่นเอง ไม่ปล่อยหน้าว่าง และไม่ crash
//
//  ดีไซน์เน้น "กำลังใจ" ไม่ใช่ "กดดันแข่งขัน" (สอดคล้องข้อ 14 ของแบบประเมิน)
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { getLevelByXP, TIER_INFO } from '../lib/levels';
import { fetchLeaderboard } from '../lib/cloudSync';
import type { LeaderboardEntry, LeaderboardScope, LeaderboardResponse } from '../lib/cloudSync';
import PageHeader from '../components/PageHeader';
import { sfx } from '../lib/sound';

const SCOPES: { key: LeaderboardScope; label: string; emoji: string }[] = [
  { key: 'class',  label: 'ห้องเรียน', emoji: '🏫' },
  { key: 'school', label: 'โรงเรียน', emoji: '🏛️' },
  { key: 'all',    label: 'ทั้งหมด',  emoji: '🌏' },
];

function medal(rank: number): string {
  return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
}

export default function Leaderboard() {
  const nav = useNavigate();
  const player = usePlayerStore();

  const [scope, setScope] = useState<LeaderboardScope>('class');
  const [status, setStatus] = useState<'loading' | 'ok' | 'unsupported' | 'error'>('loading');
  const [data, setData] = useState<LeaderboardResponse | null>(null);

  // การ์ดของผู้เล่นเอง (ใช้ตอน backend ยังไม่พร้อม หรือผู้เล่นหลุด top N)
  const myLevel = getLevelByXP(player.totalXP);
  const myEntry: LeaderboardEntry = {
    rank: data?.me?.rank ?? 0,
    nickname: player.nickname || 'คุณ',
    level: myLevel.level,
    totalXP: player.totalXP,
    stagesCount: player.stagesCompleted.length,
    isMe: true,
  };

  const hasClassroom = !!(player.school && player.grade);

  const load = useCallback(async (sc: LeaderboardScope) => {
    setStatus('loading');
    const res = await fetchLeaderboard(player.userIdHash, sc);
    setData(res);
    if (res.ok) setStatus('ok');
    else if (res.unsupported) setStatus('unsupported');
    else setStatus('error');
  }, [player.userIdHash]);

  useEffect(() => { load(scope); }, [scope, load]);

  const changeScope = (sc: LeaderboardScope) => {
    if (sc === scope) return;
    sfx.click();
    setScope(sc);
  };

  // ผู้เล่นอยู่ในรายการ top N หรือไม่
  const meInList = data?.entries.some(e => e.isMe);

  return (
    <div className="min-h-full pb-10 relative">
      <PageHeader title="🏆 กระดานอันดับ" subtitle="เทียบความก้าวหน้ากับเพื่อน ๆ" backTo="/stats" />

      <main className="max-w-md md:max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* ===== Scope tabs ===== */}
        <div className="grid grid-cols-3 gap-1.5 bg-detective-50 rounded-2xl p-1.5">
          {SCOPES.map(s => (
            <button
              key={s.key}
              onClick={() => changeScope(s.key)}
              className={`py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                scope === s.key
                  ? 'bg-detective-600 text-white shadow-sm'
                  : 'text-detective-600 hover:bg-detective-100'
              }`}
            >
              <span className="block text-base leading-none mb-0.5">{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* group label (เช่น ม.2 • ร.ร.xxx) */}
        {data?.groupLabel && status === 'ok' && (
          <p className="text-center text-xs text-slate-500 -mt-1">
            📍 {data.groupLabel}
            {typeof data.total === 'number' && ` · ${data.total} คน`}
          </p>
        )}

        {/* ===== เตือนถ้ายังไม่ตั้งห้องเรียน (เฉพาะ scope class) ===== */}
        {scope === 'class' && !hasClassroom && (
          <div className="card border border-warning-200 bg-warning-50">
            <p className="text-sm text-warning-700 font-semibold mb-1">🏫 ยังไม่ได้ตั้งห้องเรียน</p>
            <p className="text-xs text-slate-600 mb-2">
              กรอกชั้นเรียนและโรงเรียนในโปรไฟล์ เพื่อจัดอันดับกับเพื่อนห้องเดียวกัน
            </p>
            <button onClick={() => { sfx.click(); nav('/profile'); }} className="btn-secondary text-sm">
              ไปตั้งค่าโปรไฟล์ →
            </button>
          </div>
        )}

        {/* ===== Loading ===== */}
        {status === 'loading' && (
          <div className="text-center py-12">
            <div className="text-4xl mb-2 animate-pulse">🏆</div>
            <p className="text-sm text-slate-500">กำลังโหลดอันดับ...</p>
          </div>
        )}

        {/* ===== Error (network) ===== */}
        {status === 'error' && (
          <div className="card text-center py-8">
            <div className="text-4xl mb-2">📡</div>
            <p className="font-semibold text-slate-700 mb-1">เชื่อมต่อไม่ได้</p>
            <p className="text-xs text-slate-500 mb-3">ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง</p>
            <button onClick={() => load(scope)} className="btn-secondary text-sm">ลองใหม่</button>
          </div>
        )}

        {/* ===== Backend ยังไม่รองรับ → preview การ์ดตัวเอง ===== */}
        {status === 'unsupported' && (
          <div className="card border border-detective-100 bg-detective-50/40 text-center py-6">
            <div className="text-4xl mb-2">🚧</div>
            <p className="font-semibold text-detective-700 mb-1">กระดานอันดับกำลังเปิดเร็ว ๆ นี้</p>
            <p className="text-xs text-slate-500">
              เมื่อเพื่อน ๆ ในห้องเริ่มเล่น อันดับจะปรากฏที่นี่ — ด้านล่างคือสถิติของคุณตอนนี้
            </p>
          </div>
        )}

        {/* ===== รายการอันดับ ===== */}
        {status === 'ok' && data && data.entries.length > 0 && (
          <ol className="space-y-2">
            {data.entries.map((e, i) => (
              <LeaderRow key={`${e.rank}-${e.nickname}-${i}`} entry={e} index={i} />
            ))}
          </ol>
        )}

        {/* ว่างเปล่า (backend ตอบ ok แต่ยังไม่มีใคร) */}
        {status === 'ok' && data && data.entries.length === 0 && (
          <div className="card text-center py-8">
            <div className="text-4xl mb-2">🌱</div>
            <p className="font-semibold text-slate-700 mb-1">ยังไม่มีใครในกลุ่มนี้</p>
            <p className="text-xs text-slate-500">เล่นด่านให้จบเพื่อเป็นคนแรกบนกระดาน!</p>
          </div>
        )}

        {/* ===== การ์ดอันดับของคุณ (ถ้าหลุด top N หรือ backend ยังไม่พร้อม) ===== */}
        {(status === 'unsupported' || (status === 'ok' && !meInList)) && (
          <div>
            <p className="section-label text-sm mb-1.5">⭐ อันดับของคุณ</p>
            <LeaderRow entry={data?.me ?? myEntry} index={0} />
          </div>
        )}

        {/* ===== หมายเหตุ (ลดความกดดัน + privacy) ===== */}
        <div className="card bg-success-50/50 border border-success-100">
          <p className="text-[11px] text-slate-600 leading-relaxed">
            🌱 อันดับมีไว้เป็น <b>กำลังใจ</b> ไม่ใช่การแข่งขัน — เล่นเพื่อเรียนรู้และดูแลสุขภาพของตัวเองเป็นหลัก
            <br />
            🔒 ชื่อที่แสดงเป็น <b>ชื่อเล่น</b> ที่ผู้เล่นตั้งเอง ไม่ใช่ชื่อจริง
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
//  แถวอันดับเดียว
// ============================================================================
function LeaderRow({ entry, index }: { entry: LeaderboardEntry; index: number }) {
  const lv = getLevelByXP(entry.totalXP);
  const tier = TIER_INFO[lv.tier];
  const top3 = entry.rank >= 1 && entry.rank <= 3;

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
        {entry.rank > 0 ? medal(entry.rank) : '—'}
      </div>

      {/* ชื่อ + tier */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate ${entry.isMe ? 'text-detective-700' : 'text-gray-800'}`}>
          {entry.nickname}{entry.isMe && ' (คุณ)'}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: tier.color }}
          >
            {tier.label}
          </span>
          <span className="text-[11px] text-slate-500">
            {lv.emoji} Lv.{lv.level} · {entry.stagesCount} ด่าน
          </span>
        </div>
      </div>

      {/* XP */}
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-detective-700 leading-none">{entry.totalXP.toLocaleString()}</p>
        <p className="text-[10px] text-slate-400">XP</p>
      </div>
    </motion.li>
  );
}
