import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { useItemStore } from '../store/itemStore';
import { fileToResizedDataUrl } from '../store/avatarStore';
import { SHOP_ITEMS, type ShopItem, type ItemCategory } from '../lib/shopItems';
import { sfx, vibrate } from '../lib/sound';
import Avatar from '../components/Avatar';

const CATS: { id: ItemCategory | 'custom'; label: string; emoji: string }[] = [
  { id: 'title',       label: 'ตำแหน่ง', emoji: '🏷️' },
  { id: 'frame',       label: 'กรอบ',    emoji: '🖼️' },
  { id: 'theme',       label: 'ธีม',     emoji: '🎨' },
  { id: 'custom',      label: 'ของฉัน',  emoji: '📁' },
];

export default function Shop() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const spendCoins = usePlayerStore(s => s.spendCoins);
  const awardItem = usePlayerStore(s => s.awardItem);
  const equipTitle = usePlayerStore(s => s.equipTitle);
  const equipFrame = usePlayerStore(s => s.equipFrame);

  const items = useItemStore(s => s.items);
  const addItem = useItemStore(s => s.addItem);
  const removeItem = useItemStore(s => s.removeItem);

  const [tab, setTab] = useState<ItemCategory | 'custom'>('title');
  const [purchaseMsg, setPurchaseMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const owned = new Set(player.ownedItems || []);
  const coins = player.coins || 0;

  const stagesDone = player.stagesCompleted.length;
  const isUnlockedByStage = (item: ShopItem) =>
    !item.unlockAfterStage || stagesDone >= item.unlockAfterStage;

  const handleBuy = (item: ShopItem) => {
    if (owned.has(item.id)) return;
    if (!isUnlockedByStage(item)) {
      setPurchaseMsg(`🔒 ต้องผ่านด่าน ${item.unlockAfterStage} ก่อน`);
      sfx.wrong();
      setTimeout(() => setPurchaseMsg(null), 2200);
      return;
    }
    if (coins < item.price) {
      setPurchaseMsg(`💰 เหรียญไม่พอ — ขาดอีก ${item.price - coins} เหรียญ`);
      sfx.wrong();
      setTimeout(() => setPurchaseMsg(null), 2200);
      return;
    }
    if (spendCoins(item.price)) {
      awardItem(item.id);
      sfx.buy();
      vibrate([20, 30, 20]);
      setPurchaseMsg(`✓ ซื้อ "${item.name}" สำเร็จ!`);
      setTimeout(() => setPurchaseMsg(null), 2200);
    }
  };

  const handleEquip = (item: ShopItem) => {
    sfx.click();
    if (item.category === 'title') {
      const isEquipped = player.equippedTitle === item.titleText;
      equipTitle(isEquipped ? undefined : item.titleText);
    } else if (item.category === 'frame') {
      const isEquipped = player.equippedFrame === item.id;
      equipFrame(isEquipped ? undefined : item.id);
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        if (!f.type.startsWith('image/')) continue;
        if (f.size > 10 * 1024 * 1024) continue;
        const dataUrl = await fileToResizedDataUrl(f);
        const baseName = f.name.replace(/\.[^.]+$/, '').slice(0, 24);
        addItem(baseName, dataUrl, 'misc');
      }
      sfx.buy();
    } catch { /* ignore */ }
    finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const tabItems = tab === 'custom' ? null : SHOP_ITEMS.filter(i => i.category === tab);

  return (
    <div className="min-h-full pb-8 relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-warning-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 -left-20 w-64 h-64 bg-detective-300/30 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/85 backdrop-blur-md shadow-sm border-b border-detective-100/50
                         p-3 flex items-center gap-3">
        <button
          onClick={() => { sfx.click(); nav('/'); }}
          className="text-detective-500 px-3 py-1.5 rounded-lg hover:bg-detective-50 active:scale-95"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-detective-700 text-base">🛍 ร้านค้านักสืบ</h2>
          <p className="text-[11px] text-gray-500">แลกของรางวัลด้วยเหรียญ</p>
        </div>
        <div className="flex items-center gap-1.5 bg-gradient-to-br from-warning-400 to-warning-500
                        text-white font-bold rounded-full px-3 py-1.5 shadow-glow-sm">
          <span className="text-base">🪙</span>
          <span className="text-sm">{coins}</span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4">
        {/* Avatar preview */}
        <div className="card-hero flex items-center gap-3 mb-4">
          <Avatar
            preset={player.avatar}
            customId={player.customAvatarId}
            size={56}
            ring={!!player.equippedFrame}
            className={
              player.equippedFrame
                ? SHOP_ITEMS.find(i => i.id === player.equippedFrame)?.frameClass || ''
                : ''
            }
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-detective-700 truncate">{player.nickname}</p>
            {player.equippedTitle && (
              <p className="text-xs text-warning-500 font-semibold">⭐ {player.equippedTitle}</p>
            )}
            <p className="text-[11px] text-gray-500">ตัวอย่างหน้าโปรไฟล์</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {CATS.map(c => (
            <button
              key={c.id}
              onClick={() => { sfx.click(); setTab(c.id); }}
              className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === c.id
                  ? 'bg-gradient-to-br from-detective-500 to-detective-600 text-white shadow-glow-sm'
                  : 'bg-white/80 text-gray-600 border border-detective-100'
              }`}
            >
              <div className="text-base">{c.emoji}</div>
              {c.label}
            </button>
          ))}
        </div>

        {/* Purchase toast */}
        <AnimatePresence>
          {purchaseMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="card text-center text-sm font-semibold mb-3 bg-detective-50 text-detective-700"
            >
              {purchaseMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Items */}
        {tab === 'custom' ? (
          <CustomItemsTab
            items={items}
            uploading={uploading}
            onUpload={() => fileRef.current?.click()}
            onRemove={(id) => { sfx.click(); removeItem(id); }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {tabItems?.map(item => {
              const isOwned = owned.has(item.id);
              const isEquipped = item.category === 'title'
                ? player.equippedTitle === item.titleText
                : item.category === 'frame'
                ? player.equippedFrame === item.id
                : false;
              const locked = !isUnlockedByStage(item);
              const canBuy = !isOwned && !locked && coins >= item.price;
              const canEquip = (item.category === 'title' || item.category === 'frame') && isOwned;

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -2 }}
                  className={`relative card flex flex-col items-center text-center p-3 ${
                    locked ? 'opacity-60' : ''
                  } ${isEquipped ? 'border-2 border-success-500' : ''}`}
                >
                  <div className="text-4xl mb-1">{item.emoji}</div>
                  <p className="font-semibold text-sm leading-tight">{item.name}</p>
                  <p className="text-[10px] text-gray-500 mb-2 line-clamp-2">{item.description}</p>

                  {locked ? (
                    <span className="pill bg-gray-200 text-gray-600">
                      🔒 ด่าน {item.unlockAfterStage}
                    </span>
                  ) : isOwned ? (
                    canEquip ? (
                      <button
                        onClick={() => handleEquip(item)}
                        className={`w-full text-xs font-bold py-1.5 rounded-lg transition-all ${
                          isEquipped
                            ? 'bg-success-500 text-white'
                            : 'bg-detective-100 text-detective-700 hover:bg-detective-200'
                        }`}
                      >
                        {isEquipped ? '✓ กำลังใช้' : 'สวมใส่'}
                      </button>
                    ) : (
                      <span className="pill bg-success-50 text-success-600 border border-success-500/30">
                        ✓ มีแล้ว
                      </span>
                    )
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!canBuy}
                      className={`w-full text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 ${
                        canBuy
                          ? 'bg-gradient-to-r from-warning-400 to-warning-500 text-white shadow-glow-sm'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      🪙 {item.price}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleUpload(e.target.files)}
        />

        {/* Daily streak hint */}
        {(player.streakDays || 0) > 0 && (
          <div className="mt-6 card-hero text-center">
            <p className="text-xs text-gray-500">เล่นต่อเนื่อง</p>
            <p className="text-2xl font-bold text-warning-500">🔥 {player.streakDays} วัน</p>
            <p className="text-[11px] text-gray-500 mt-1">
              เล่นทุกวันรับโบนัส +5 เหรียญ + บวกตามจำนวนวันต่อเนื่อง
            </p>
          </div>
        )}

        <p className="text-[11px] text-gray-400 text-center mt-6">
          💡 เก็บเหรียญด้วยการเล่นด่าน — XP ทุก 5 จะได้ 1 เหรียญ
        </p>
      </main>
    </div>
  );
}

// ===== Custom items tab =====
function CustomItemsTab({
  items,
  uploading,
  onUpload,
  onRemove,
}: {
  items: ReturnType<typeof useItemStore.getState>['items'];
  uploading: boolean;
  onUpload: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <button
        onClick={onUpload}
        disabled={uploading}
        className="btn-primary w-full mb-3"
      >
        {uploading ? 'กำลังอัป...' : '＋ อัปโหลดรูป/Sticker'}
      </button>

      {items.length === 0 ? (
        <div className="card-hero text-center py-8">
          <div className="text-5xl mb-2">📁</div>
          <p className="text-sm text-gray-600 font-semibold">โฟลเดอร์ยังว่าง</p>
          <p className="text-xs text-gray-500 mt-1">
            อัปโหลดรูป sticker, item, หรือรูปอนิเมะที่ชอบ<br/>
            ใช้แต่งโปรไฟล์ส่วนตัวได้
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <AnimatePresence>
            {items.map(it => (
              <motion.div
                key={it.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-2xl border-2 border-detective-100 overflow-hidden bg-white"
              >
                <img src={it.dataUrl} alt={it.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => onRemove(it.id)}
                  className="absolute top-1 right-1 bg-danger-500 text-white text-[10px]
                             rounded-full w-5 h-5 flex items-center justify-center shadow active:scale-90"
                  aria-label="ลบ"
                >
                  ✕
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] truncate px-1.5 py-0.5">
                  {it.name}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
