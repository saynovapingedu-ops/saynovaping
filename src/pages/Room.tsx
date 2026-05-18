import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { ROOM_ITEMS, type RoomItem } from '../lib/roomItems';
import { SHOP_ITEMS } from '../lib/shopItems';
import Avatar from '../components/Avatar';
import PageHeader from '../components/PageHeader';
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

  const nextToUnlock = useMemo(() => {
    const remaining = ROOM_ITEMS
      .filter(i => !owned.has(i.id))
      .sort((a, b) => a.unlockAtXP - b.unlockAtXP);
    return remaining[0];
  }, [owned]);

  const equippedFrameClass = player.equippedFrame
    ? SHOP_ITEMS.find(i => i.id === player.equippedFrame)?.frameClass
    : undefined;

  // จัดของตาม zone
  const byZone = useMemo(() => {
    const z: Record<string, RoomItem[]> = {
      'wall-back': [], 'wall-side': [], 'floor': [], 'desk': [], 'pet': [],
    };
    ROOM_ITEMS.forEach(it => z[it.zone]?.push(it));
    return z;
  }, []);

  // Render item — ใช้กับทุก zone
  const renderItem = (item: RoomItem) => {
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
            ? 'drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]'
            : canUnlock
              ? 'drop-shadow-[0_4px_6px_rgba(245,158,11,0.5)] animate-pulse-slow'
              : 'opacity-25 grayscale'
        }`}
        style={{
          left:    `${item.position.x}%`,
          top:     `${item.position.y}%`,
          fontSize: size,
          lineHeight: 1,
        }}
        title={isOwned ? item.name : `🔒 ${item.unlockAtXP} XP — ${item.name}`}
      >
        <span className="block leading-none">{item.emoji}</span>
        {!isOwned && (
          <span className="absolute -top-1 -right-2 text-[10px] bg-white border border-detective-200
                           rounded-full px-1.5 font-bold text-detective-600 shadow-sm">
            {canUnlock ? '✨' : '🔒'}
          </span>
        )}
      </motion.button>
    );
  };

  return (
    <div className="min-h-full pb-10 relative">
      <PageHeader
        title="🏠 ห้องของฉัน"
        subtitle={`ปลดล็อค ${unlockedCount}/${ROOM_ITEMS.length} ชิ้น • ${player.totalXP} XP สะสม`}
        backTo="/"
      />
      <div className="px-3 py-2 flex justify-end">
        <button
          onClick={() => { sfx.click(); nav('/shop'); }}
          className="text-xs bg-detective-100 text-detective-700 font-semibold rounded-full px-3 py-1.5 active:scale-95"
        >
          🛍 ร้านค้า
        </button>
      </div>

      <main className="max-w-md md:max-w-2xl mx-auto px-3 pt-3">
        <div className="mb-3 rounded-2xl border border-detective-200 bg-detective-50/70 p-2.5">
          <p className="text-[11px] text-gray-700 leading-relaxed">
            💡 <b className="text-detective-700">ห้องของคุณ</b> = รางวัลสะสม XP — แตะของที่เรืองแสง ✨
            เพื่อปลดล็อค
          </p>
        </div>

        {/* === Isometric 3D Room === */}
        <div className="relative aspect-[4/4.5] rounded-3xl overflow-hidden shadow-xl mb-3
                        border-4 border-detective-200 bg-detective-50">

          {/* ==== ผนังด้านหลัง (wall-back) — รูปสี่เหลี่ยมคางหมู perspective ==== */}
          <div className="absolute inset-x-0 top-0 h-[55%]"
               style={{
                 background: 'linear-gradient(180deg, #FFF8EA 0%, #FCEDD0 100%)',
                 clipPath: 'polygon(0 0, 100% 0, 90% 100%, 10% 100%)',
               }}>
            {/* Pattern ลายผนัง */}
            <div className="absolute inset-0 opacity-30"
                 style={{
                   backgroundImage:
                     'repeating-linear-gradient(0deg, rgba(217,119,6,.15) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgba(217,119,6,.10) 0 1px, transparent 1px 40px)',
                 }} />
          </div>

          {/* ==== ผนังด้านข้าง (wall-side ขวา) ==== */}
          <div className="absolute right-0 top-0 h-[68%] w-[18%]"
               style={{
                 background: 'linear-gradient(270deg, #E5C99B 0%, #F4D9AB 100%)',
                 clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 85%)',
               }} />

          {/* ==== ผนังด้านข้าง (ซ้าย) — เงาเล็กให้ดูมีมิติ ==== */}
          <div className="absolute left-0 top-0 h-[68%] w-[18%]"
               style={{
                 background: 'linear-gradient(90deg, #C8A876 0%, #E5C99B 100%)',
                 clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)',
                 opacity: 0.85,
               }} />

          {/* ==== พื้นห้อง (floor) — รูปสี่เหลี่ยมคางหมูกลับด้าน ==== */}
          <div className="absolute inset-x-0 bottom-0 h-[55%]"
               style={{
                 background:
                   'linear-gradient(180deg, #B4855A 0%, #8B6240 100%)',
                 clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0 100%)',
               }}>
            {/* Wood plank pattern */}
            <div className="absolute inset-0 opacity-50"
                 style={{
                   backgroundImage:
                     'repeating-linear-gradient(180deg, rgba(58,30,12,.30) 0 1px, transparent 1px 18px)',
                 }} />
            {/* แสงเงาตรงกลางพื้น */}
            <div className="absolute inset-0"
                 style={{
                   background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,.15) 0%, transparent 60%)',
                 }} />
          </div>

          {/* ==== โต๊ะ (built-in desk ตรงมุมขวา-หลัง) ==== */}
          <div className="absolute"
               style={{
                 right: '6%', top: '38%', width: '32%', height: '14%',
                 background: 'linear-gradient(180deg, #5D3A1F 0%, #3B2510 100%)',
                 clipPath: 'polygon(15% 0, 100% 0, 95% 100%, 0 100%)',
                 boxShadow: '0 4px 8px rgba(0,0,0,0.25)',
               }} />
          {/* ขาโต๊ะ */}
          <div className="absolute"
               style={{
                 right: '8%', top: '50%', width: '4px', height: '10%',
                 background: '#3B2510',
               }} />
          <div className="absolute"
               style={{
                 right: '32%', top: '50%', width: '4px', height: '8%',
                 background: '#3B2510',
               }} />

          {/* === Wall-back items (โปสเตอร์ นาฬิกา ผ้าม่าน) === */}
          <div className="absolute inset-x-0 top-0 h-[55%]">
            {byZone['wall-back'].map(renderItem)}
          </div>

          {/* === Wall-side items (ตู้ ฯลฯ) — อยู่ขวา === */}
          <div className="absolute right-0 top-0 h-[68%] w-[35%]">
            {byZone['wall-side'].map(renderItem)}
          </div>

          {/* === Desk items === */}
          <div className="absolute"
               style={{ right: '6%', top: '38%', width: '32%', height: '14%' }}>
            {byZone['desk'].map(renderItem)}
          </div>

          {/* === Floor items === */}
          <div className="absolute inset-x-0 bottom-0 h-[55%]">
            {byZone['floor'].map(renderItem)}
          </div>

          {/* === Pet items === */}
          <div className="absolute inset-x-0 bottom-0 h-[55%]">
            {byZone['pet'].map(renderItem)}
          </div>

          {/* ==== ตัวละครยืนกลางห้อง — มีเงา ==== */}
          <div className="absolute left-1/2 -translate-x-1/2 z-10"
               style={{ top: '58%' }}>
            <div className="relative flex flex-col items-center">
              <Avatar
                preset={player.avatar}
                customId={player.customAvatarId}
                size={88}
                ring={!equippedFrameClass}
                className={equippedFrameClass}
              />
              <p className="mt-1 text-[11px] font-bold text-white bg-detective-700/80 px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                {player.nickname}
              </p>
              {/* shadow under avatar (isometric ellipse) */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-3 bg-black/30 rounded-full blur-md" />
            </div>
          </div>

          {/* Thanks bubble */}
          <AnimatePresence>
            {thanksItem && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-1/2 top-[44%] -translate-x-1/2 z-20 max-w-[78%]"
              >
                <div className="bg-white rounded-2xl shadow-xl border-2 border-warning-400 px-3 py-2 relative">
                  <p className="text-xs text-detective-700 font-semibold leading-snug">
                    {thanksItem.thanks}
                  </p>
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
