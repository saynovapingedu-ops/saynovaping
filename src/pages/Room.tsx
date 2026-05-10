import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { ROOM_ITEMS, type RoomItem } from '../lib/roomItems';
import Avatar from '../components/Avatar';
import { sfx, vibrate } from '../lib/sound';

export default function Room() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const awardItem = usePlayerStore(s => s.awardItem);

  const owned = useMemo(() => new Set(player.ownedItems || []), [player.ownedItems]);
  const unlockedCount = ROOM_ITEMS.filter(i => owned.has(i.id)).length;

  const [thanksItem, setThanksItem] = useState<RoomItem | null>(null);
  const [tappedItem, setTappedItem] = useState<RoomItem | null>(null);

  const handleTap = (item: RoomItem) => {
    sfx.click();
    if (owned.has(item.id)) {
      // ของที่ปลดล็อคแล้ว — โชว์บับเบิลขอบคุณซ้ำได้
      setThanksItem(item);
      setTimeout(() => setThanksItem(null), 2400);
      return;
    }
    setTappedItem(item);
  };

  const handleUnlock = (item: RoomItem) => {
    if (player.totalXP < item.unlockAtXP) return;
    awardItem(item.id);
    sfx.buy();
    vibrate([20, 30, 20]);
    setTappedItem(null);
    setThanksItem(item);
    setTimeout(() => setThanksItem(null), 3200);
  };

  // หาของชิ้นถัดไปที่ใกล้ปลด
  const nextToUnlock = useMemo(() => {
    const remaining = ROOM_ITEMS
      .filter(i => !owned.has(i.id))
      .sort((a, b) => a.unlockAtXP - b.unlockAtXP);
    return remaining[0];
  }, [owned]);

  return (
    <div className="min-h-full pb-10 relative">
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md shadow-sm border-b border-detective-100/50
                         p-3 flex items-center gap-3">
        <button
          onClick={() => { sfx.click(); nav('/'); }}
          className="text-detective-500 px-3 py-1.5 rounded-lg hover:bg-detective-50 active:scale-95"
        >←</button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-detective-700 text-base">🏠 ห้องของฉัน</h2>
          <p className="text-[11px] text-gray-500">
            ปลดล็อค {unlockedCount}/{ROOM_ITEMS.length} ชิ้น • {player.totalXP} XP สะสม
          </p>
        </div>
        <button
          onClick={() => { sfx.click(); nav('/shop'); }}
          className="text-xs bg-detective-100 text-detective-700 font-semibold rounded-full px-3 py-1.5 active:scale-95"
        >
          🛍 ร้านค้า
        </button>
      </header>

      <main className="max-w-md mx-auto px-3 pt-3">
        {/* === Room visual === */}
        <div
          className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl mb-3 border-4 border-warning-300"
          style={{
            background:
              'linear-gradient(180deg, #F4ECFA 0%, #F4ECFA 55%, #E9D2F0 55%, #D2A8E0 100%)',
          }}
        >
          {/* wall pattern */}
          <div className="absolute inset-0 opacity-20 pointer-events-none"
               style={{
                 backgroundImage:
                   'repeating-linear-gradient(135deg, rgba(111,45,142,.15) 0 2px, transparent 2px 20px)',
                 maskImage: 'linear-gradient(180deg, black 55%, transparent 55%)',
                 WebkitMaskImage: 'linear-gradient(180deg, black 55%, transparent 55%)',
               }} />

          {/* Floor wood grain */}
          <div className="absolute left-0 right-0 bottom-0 h-[45%] opacity-25 pointer-events-none"
               style={{
                 backgroundImage:
                   'repeating-linear-gradient(90deg, rgba(72,29,92,.20) 0 60px, rgba(72,29,92,.05) 60px 62px)',
               }} />

          {/* Room items */}
          {ROOM_ITEMS.map(item => {
            const isOwned = owned.has(item.id);
            const canUnlock = player.totalXP >= item.unlockAtXP;
            const size = item.size ?? 36;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleTap(item)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all ${
                  isOwned
                    ? 'drop-shadow-md'
                    : canUnlock
                      ? 'drop-shadow-lg animate-pulse-slow'
                      : 'opacity-30 grayscale'
                }`}
                style={{
                  left:    `${item.position.x}%`,
                  top:     `${item.position.y}%`,
                  fontSize: size,
                }}
                title={isOwned ? item.name : `🔒 ${item.unlockAtXP} XP — ${item.name}`}
              >
                <span className="leading-none">{item.emoji}</span>
                {!isOwned && (
                  <span className="absolute -top-1 -right-2 text-[10px] bg-white border border-detective-200
                                   rounded-full px-1.5 font-bold text-detective-600 shadow-sm">
                    {canUnlock ? '✨' : '🔒'}
                  </span>
                )}
              </motion.button>
            );
          })}

          {/* Avatar in the center */}
          <div className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              <Avatar
                preset={player.avatar}
                customId={player.customAvatarId}
                size={88}
                ring
              />
              {/* shadow under avatar */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-2 bg-black/20 rounded-full blur-sm" />
            </div>
          </div>

          {/* Thanks bubble */}
          <AnimatePresence>
            {thanksItem && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-1/2 top-[40%] -translate-x-1/2 z-20 max-w-[78%]"
              >
                <div className="bg-white rounded-2xl shadow-xl border-2 border-warning-400 px-3 py-2 relative">
                  <p className="text-xs text-detective-700 font-semibold">
                    {thanksItem.thanks}
                  </p>
                  {/* tail */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-warning-400 rotate-45" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Next-to-unlock progress */}
        {nextToUnlock && (
          <div className="card mb-3">
            <div className="flex items-center gap-3">
              <div className="text-3xl opacity-60">{nextToUnlock.emoji}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">ของชิ้นถัดไป</p>
                <p className="font-semibold text-detective-700 truncate">{nextToUnlock.name}</p>
                <div className="mt-1.5 h-2 bg-detective-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-warning-400 to-warning-500 transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (player.totalXP / nextToUnlock.unlockAtXP) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  {player.totalXP < nextToUnlock.unlockAtXP
                    ? `อีก ${nextToUnlock.unlockAtXP - player.totalXP} XP จะปลดได้`
                    : '✨ พร้อมปลดล็อคแล้ว — แตะที่ของในห้อง'}
                </p>
              </div>
            </div>
          </div>
        )}

        {!nextToUnlock && (
          <div className="card-hero text-center py-4 mb-3">
            <p className="text-2xl mb-1">🏆</p>
            <p className="font-bold text-detective-700">ห้องเสร็จสมบูรณ์!</p>
            <p className="text-xs text-gray-500">นักสืบของคุณสะสมครบทุกชิ้นแล้ว</p>
          </div>
        )}

        {/* Item list legend */}
        <details className="card text-sm">
          <summary className="font-semibold text-detective-700 cursor-pointer select-none">
            📋 รายการของในห้อง ({unlockedCount}/{ROOM_ITEMS.length})
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {ROOM_ITEMS.slice().sort((a, b) => a.unlockAtXP - b.unlockAtXP).map(item => {
              const isOwned = owned.has(item.id);
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 p-1.5 rounded-lg ${
                    isOwned ? 'bg-success-50' : 'bg-gray-50/60'
                  }`}
                >
                  <span className="text-lg flex-shrink-0">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${
                      isOwned ? 'text-success-700' : 'text-gray-500'
                    }`}>
                      {item.name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {isOwned ? '✓ ปลดแล้ว' : `🔒 ${item.unlockAtXP} XP`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </details>
      </main>

      {/* Unlock confirmation modal */}
      <AnimatePresence>
        {tappedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setTappedItem(null)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-xl"
            >
              <div className="text-center">
                <div className="text-6xl mb-2">{tappedItem.emoji}</div>
                <p className="font-display font-bold text-lg text-detective-700">{tappedItem.name}</p>
                {tappedItem.hint && (
                  <p className="text-xs text-gray-500 mt-1">{tappedItem.hint}</p>
                )}
                <div className="my-4 inline-flex items-center gap-2 bg-detective-50 border border-detective-200
                                rounded-full px-3 py-1.5">
                  <span className="text-base">⭐</span>
                  <span className="font-bold text-detective-700">{tappedItem.unlockAtXP} XP</span>
                </div>
                {player.totalXP >= tappedItem.unlockAtXP ? (
                  <p className="text-sm text-success-600 mb-3">
                    ✨ คุณมี {player.totalXP} XP — ปลดล็อคได้แล้ว!
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 mb-3">
                    ตอนนี้คุณมี <strong className="text-detective-700">{player.totalXP} XP</strong>
                    {' '}— อีก {tappedItem.unlockAtXP - player.totalXP} XP
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { sfx.click(); setTappedItem(null); }}
                  className="py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold active:scale-95"
                >
                  ปิด
                </button>
                <button
                  onClick={() => handleUnlock(tappedItem)}
                  disabled={player.totalXP < tappedItem.unlockAtXP}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-warning-400 to-warning-500
                             text-white font-bold shadow-glow-sm active:scale-95 disabled:opacity-40
                             disabled:bg-gray-300 disabled:bg-none"
                >
                  {player.totalXP >= tappedItem.unlockAtXP ? '✨ ปลดล็อค' : '🔒 ยังไม่ถึง XP'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
