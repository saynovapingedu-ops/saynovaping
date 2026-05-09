import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { BADGES } from '../lib/badges';
import { getLevelByXP } from '../lib/levels';
import XPBar from '../components/XPBar';
import Avatar from '../components/Avatar';
import AvatarFolder from '../components/AvatarFolder';

export default function Profile() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const reset = usePlayerStore(s => s.reset);
  const setAvatar = usePlayerStore(s => s.setAvatar);
  const lv = getLevelByXP(player.totalXP);
  const earned = new Set(player.badges);
  const [editAvatar, setEditAvatar] = useState(false);

  const handleReset = () => {
    if (!confirm('แน่ใจไหมว่าต้องการลบข้อมูลทั้งหมดและเริ่มใหม่? — การกระทำนี้กลับคืนไม่ได้')) return;
    reset();
    localStorage.removeItem('hd_mock_user_id');
    nav('/');
    location.reload();
  };

  return (
    <div className="min-h-full bg-detective-50 pb-8">
      <header className="sticky top-0 bg-white shadow-sm p-3 flex items-center gap-3 z-10">
        <button onClick={() => nav('/')} className="text-detective-500 px-2">←</button>
        <h2 className="font-display font-bold text-detective-700">โปรไฟล์</h2>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setEditAvatar(v => !v)}
              className="rounded-full active:scale-95"
              aria-label="เปลี่ยนอวตาร"
            >
              <Avatar preset={player.avatar} customId={player.customAvatarId} size={64} ring />
            </button>
            <div className="flex-1">
              <h3 className="font-display font-bold text-xl text-detective-700">{player.nickname}</h3>
              <p className="text-sm text-gray-500">{player.grade} {player.school && `• ${player.school}`}</p>
              <button
                onClick={() => setEditAvatar(v => !v)}
                className="text-xs text-detective-500 font-semibold mt-1 active:opacity-70"
              >
                {editAvatar ? '✕ ปิด' : '✏️ เปลี่ยนอวตาร'}
              </button>
            </div>
          </div>

          {editAvatar && (
            <div className="mb-4 p-3 rounded-xl bg-detective-50/60">
              <AvatarFolder
                preset={player.avatar}
                customId={player.customAvatarId}
                onPick={(preset, customId) => {
                  if (customId) setAvatar(player.avatar || 1, customId);
                  else setAvatar(preset, undefined);
                }}
              />
            </div>
          )}

          <XPBar />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <p className="text-2xl font-bold text-detective-700">{lv.level}</p>
            <p className="text-xs text-gray-500">Level</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-success-600">{player.stagesCompleted.length}/8</p>
            <p className="text-xs text-gray-500">ด่านที่จบ</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-warning-500">{earned.size}</p>
            <p className="text-xs text-gray-500">Badges</p>
          </div>
        </div>

        <div className="card">
          <h4 className="font-display font-bold text-detective-700 mb-3">🏅 Badges</h4>
          <div className="grid grid-cols-3 gap-2">
            {BADGES.map(b => {
              const got = earned.has(b.id);
              return (
                <div key={b.id} className={`p-2 rounded-xl text-center ${got ? 'bg-warning-50' : 'bg-gray-50 opacity-40'}`}>
                  <div className="text-3xl">{b.emoji}</div>
                  <p className="text-xs font-semibold mt-1">{b.name}</p>
                </div>
              );
            })}
          </div>
        </div>

        {player.certificateNo && (
          <button onClick={() => nav('/certificate')} className="btn-secondary w-full">
            🏆 ดู Certificate
          </button>
        )}

        <details className="card text-sm">
          <summary className="font-semibold cursor-pointer">ข้อมูลความเป็นส่วนตัว</summary>
          <div className="mt-3 space-y-2 text-gray-600">
            <p>• User ID (hash): <code className="text-xs">{player.userIdHash.slice(0, 12)}...</code></p>
            <p>• เริ่มเล่น: {player.createdAt && new Date(player.createdAt).toLocaleDateString('th-TH')}</p>
            <p>• เล่นล่าสุด: {player.lastActiveAt && new Date(player.lastActiveAt).toLocaleDateString('th-TH')}</p>
            <button onClick={handleReset} className="text-danger-500 underline mt-2">
              ลบข้อมูลทั้งหมดและเริ่มใหม่
            </button>
          </div>
        </details>
      </main>
    </div>
  );
}
