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
  // ลองสวม (preview) — ทับการสวมจริงชั่วคราวบน Avatar ด้านบน
  const [previewFrameId, setPreviewFrameId] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string | null>(null);
  // popup ยืนยันซื้อ
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);

  const owned = new Set(player.ownedItems || []);
  const coins = player.coins || 0;

  const stagesDone = player.stagesCompleted.length;
  const isUnlockedByStage = (item: ShopItem) =>
    !item.unlockAfterStage || stagesDone >= item.unlockAfterStage;

  // เปลี่ยนแท็บ → เคลียร์ preview ทุกครั้ง (กันสับสนข้ามหมวด)
  const switchTab = (next: ItemCategory | 'custom') => {
    sfx.click();
    setTab(next);
    setPreviewFrameId(null);
    setPreviewTitle(null);
  };

  const handlePreview = (item: ShopItem) => {
    sfx.click();
    if (item.category === 'frame') {
      setPreviewFrameId(p => (p === item.id ? null : item.id));
    } else if (item.category === 'title' && item.titleText) {
      setPreviewTitle(p => (p === item.titleText ? null : item.titleText!));
    }
  };

  const askBuy = (item: ShopItem) => {
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
    sfx.click();
    setConfirmItem(item);
  };

  const confirmBuy = () => {
    const item = confirmItem;
    if (!item) return;
    if (spendCoins(item.price)) {
      awardItem(item.id);
      sfx.buy();
      vibrate([20, 30, 20]);
      setPurchaseMsg(`✓ ซื้อ "${item.name}" สำเร็จ!`);
      setTimeout(() => setPurchaseMsg(null), 2200);
    }
    setConfirmItem(null);
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
        <button
          onClick={() => { sfx.click(); nav('/room'); }}
          className="text-xs bg-detective-100 text-detective-700 font-semibold rounded-full px-2.5 py-1.5 active:scale-95"
        >
          🏠 ห้อง
        </button>
        <div className="flex items-center gap-1.5 bg-gradient-to-br from-warning-400 to-warning-500
                        text-white font-bold rounded-full px-3 py-1.5 shadow-glow-sm">
          <span className="text-base">🪙</span>
          <span className="text-sm">{coins}</span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4">
        {/* Avatar preview — ใช้ preview ทับ equipped ถ้ากำลังลอง */}
        {(() => {
          const shownFrameId = previewFrameId ?? player.equippedFrame;
          const shownTitle   = previewTitle   ?? player.equippedTitle;
          const shownFrameClass = shownFrameId
            ? SHOP_ITEMS.find(i => i.id === shownFrameId)?.frameClass || ''
            : '';
          const isPreviewing = previewFrameId !== null || previewTitle !== null;
          return (
            <div className={`card-hero flex items-center gap-3 mb-4 transition-all ${
              isPreviewing ? 'border-2 border-warning-400 bg-warning-50/30' : ''
            }`}>
              <Avatar
                preset={player.avatar}
                customId={player.customAvatarId}
                size={56}
                ring={!!shownFrameId}
                className={shownFrameClass}
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-detective-700 truncate">{player.nickname}</p>
                {shownTitle && (
                  <p className="text-xs text-warning-500 font-semibold">⭐ {shownTitle}</p>
                )}
                <p className="text-[11px] text-gray-500">
                  {isPreviewing ? '👁 กำลังลอง — ยังไม่ได้ซื้อ' : 'ตัวอย่างหน้าโปรไฟล์'}
                </p>
              </div>
              {isPreviewing && (
                <button
                  onClick={() => { sfx.click(); setPreviewFrameId(null); setPreviewTitle(null); }}
                  className="text-xs text-detective-600 bg-white border border-detective-200
                             rounded-full px-2.5 py-1 active:scale-95"
                >
                  เลิกลอง ✕
                </button>
              )}
            </div>
          );
        })()}

        {/* คำอธิบายสั้น — เด็กจะรู้ว่าซื้อแล้วต้อง "สวมใส่" + "กำลังใช้" ต่างจาก "มีแล้ว" ยังไง */}
        <div className="mb-3 rounded-2xl border border-detective-100 bg-detective-50/70 p-2.5">
          <p className="text-[11px] text-gray-700 leading-relaxed">
            💡 <b>การ์ดเหรียญ:</b> ปุ่ม <span className="font-semibold text-warning-600">🪙 ราคา</span> = ซื้อด้วยเหรียญ
            • <span className="font-semibold text-detective-600">สวมใส่</span> = เอามาแต่งโปรไฟล์
            • <span className="font-semibold text-success-600">✓ กำลังใช้</span> = ตอนนี้กำลังโชว์อยู่บนหน้าโปรไฟล์
          </p>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {CATS.map(c => (
            <button
              key={c.id}
              onClick={() => switchTab(c.id)}
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

              const canPreview = !locked && (item.category === 'frame' || item.category === 'title');
              const isPreviewingThis =
                (item.category === 'frame' && previewFrameId === item.id) ||
                (item.category === 'title' && previewTitle === item.titleText);

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -2 }}
                  className={`relative card flex flex-col items-center text-center p-3 ${
                    locked ? 'opacity-60' : ''
                  } ${isEquipped ? 'border-2 border-success-500' : ''} ${
                    isPreviewingThis ? 'border-2 border-warning-400 bg-warning-50/40' : ''
                  }`}
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
                    <div className="w-full space-y-1.5">
                      {canPreview && (
                        <button
                          onClick={() => handlePreview(item)}
                          className={`w-full text-xs font-semibold py-1.5 rounded-lg border transition-all ${
                            isPreviewingThis
                              ? 'bg-warning-100 border-warning-400 text-warning-600'
                              : 'bg-white border-detective-200 text-detective-600 hover:border-detective-400'
                          }`}
                        >
                          {isPreviewingThis ? '👁 กำลังลอง' : '👁 ลองสวม'}
                        </button>
                      )}
                      <button
                        onClick={() => askBuy(item)}
                        disabled={!canBuy}
                        className={`w-full text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 ${
                          canBuy
                            ? 'bg-gradient-to-r from-warning-400 to-warning-500 text-white shadow-glow-sm'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        🪙 {item.price}
                      </button>
                    </div>
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

      {/* Buy confirmation modal */}
      <AnimatePresence>
        {confirmItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setConfirmItem(null)}
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
                <div className="text-5xl mb-2">{confirmItem.emoji}</div>
                <p className="font-display font-bold text-lg text-detective-700">{confirmItem.name}</p>
                <p className="text-xs text-gray-500 mt-1">{confirmItem.description}</p>
                <div className="my-4 inline-flex items-center gap-2 bg-warning-50 border border-warning-400
                                rounded-full px-3 py-1.5">
                  <span className="text-base">🪙</span>
                  <span className="font-bold text-warning-600">{confirmItem.price}</span>
                  <span className="text-[11px] text-gray-500">เหรียญ</span>
                </div>
                <p className="text-sm text-gray-700 mb-1">
                  ยืนยันแลกของชิ้นนี้ไหม?
                </p>
                <p className="text-[11px] text-gray-500 mb-4">
                  เหลือเหรียญหลังซื้อ: <strong className="text-detective-700">
                    {Math.max(0, coins - confirmItem.price)}
                  </strong>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { sfx.click(); setConfirmItem(null); }}
                  className="py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold active:scale-95"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmBuy}
                  className="py-2.5 rounded-xl bg-gradient-to-r from-warning-400 to-warning-500
                             text-white font-bold shadow-glow-sm active:scale-95"
                >
                  ✓ ยืนยันซื้อ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
