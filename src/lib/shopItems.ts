// ============================================================================
//  Shop Items — รายการของในร้านค้า (preset)
//  player ซื้อด้วย coins เก็บใน playerStore.ownedItems
// ============================================================================

export type ItemCategory =
  | 'title'      // ตำแหน่งใต้ชื่อ
  | 'frame'      // กรอบ avatar
  | 'theme'      // สีหลักของแอป + Confetti
  | 'accessory'  // ของแต่ง avatar (แว่น หมวก โบว์ ฯลฯ) — overlay
  | 'backdrop'   // พื้นหลังหน้าโปรไฟล์
  | 'cert-deco'  // ลายกรอบใบประกาศ
  | 'booster';   // ของใช้ในเกม — ใช้แล้วหมด (consumable)

/** Booster effect — ใช้ตอนเล่นด่าน / รักษา streak */
export type BoosterEffect =
  | 'hint-token'      // ดูเฉลย 1 choice (ใช้ในด่าน)
  | 'coin-x2'         // เหรียญ x2 ใน 3 ด่านถัดไป
  | 'streak-shield';  // กันสตรีคขาด 1 วัน

export interface ShopItem {
  id: string;
  category: ItemCategory;
  name: string;
  description: string;
  price: number;            // เหรียญ
  emoji: string;            // ไอคอน
  unlockAfterStage?: number; // ต้องผ่านด่านนี้ก่อนซื้อ

  // ---- category-specific ----
  /** frame: CSS class ขอบ avatar */
  frameClass?: string;
  /** title: text ที่แสดงใต้ชื่อ */
  titleText?: string;
  /** theme: ชุดสี hex 6-8 สี ใช้กับ Confetti + accent */
  themeColors?: string[];
  /** accessory: overlay emoji + ตำแหน่ง (% รอบ avatar) */
  accessory?: { emoji: string; x: number; y: number; scale?: number };
  /** backdrop: CSS background (gradient/pattern) สำหรับหน้าโปรไฟล์ */
  backdropCss?: string;
  /** cert-deco: CSS class กรอบใบประกาศ + emoji มุมตกแต่ง */
  certDeco?: { borderClass: string; corner?: string };
  /** booster: effect + จำนวนครั้ง (1 = ของชิ้นเดียวจ่ายซ้ำได้) */
  booster?: { effect: BoosterEffect; uses?: number };
}

export const SHOP_ITEMS: ShopItem[] = [
  // ===== Titles =====
  { id: 'title-rookie',     category: 'title', name: 'นักสืบมือใหม่', description: 'ตำแหน่งเริ่มต้น',     price: 30,  emoji: '🌱', titleText: 'นักสืบมือใหม่' },
  { id: 'title-investigator', category: 'title', name: 'นักสืบฝึกหัด', description: 'มีประสบการณ์ 3+ ด่าน', price: 80,  emoji: '🔎', titleText: 'นักสืบฝึกหัด',  unlockAfterStage: 3 },
  { id: 'title-detective',  category: 'title', name: 'นักสืบเต็มตัว',  description: 'มากด้วยประสบการณ์',      price: 200, emoji: '🕵️', titleText: 'นักสืบเต็มตัว', unlockAfterStage: 6 },
  { id: 'title-legend',     category: 'title', name: 'ตำนานนักสืบ',   description: 'จบเกมและรับ Cert',         price: 500, emoji: '🏆', titleText: 'ตำนานนักสืบ',  unlockAfterStage: 8 },
  { id: 'title-sensei',     category: 'title', name: 'อาจารย์นักสืบ',  description: 'ครูของนักสืบรุ่นใหม่',     price: 1000,emoji: '🎓', titleText: 'Sensei',         unlockAfterStage: 12 },

  // ===== Frames (กรอบ avatar) =====
  { id: 'frame-bronze',  category: 'frame', name: 'กรอบทองแดง',  description: 'กรอบเริ่มต้นน่ารัก',  price: 50,  emoji: '🟫',
    frameClass: 'ring-4 ring-amber-700 ring-offset-2' },
  { id: 'frame-silver',  category: 'frame', name: 'กรอบเงิน',    description: 'สีเงินเงาๆ',          price: 150, emoji: '⚪',
    frameClass: 'ring-4 ring-gray-400 ring-offset-2', unlockAfterStage: 3 },
  { id: 'frame-gold',    category: 'frame', name: 'กรอบทอง',     description: 'สำหรับนักสืบเก่ง',     price: 350, emoji: '🟡',
    frameClass: 'ring-4 ring-warning-500 ring-offset-2 shadow-glow', unlockAfterStage: 6 },
  { id: 'frame-rainbow', category: 'frame', name: 'กรอบสายรุ้ง', description: 'หายากที่สุด',          price: 800, emoji: '🌈',
    frameClass: 'ring-4 ring-pink-500 ring-offset-2 shadow-glow-lg', unlockAfterStage: 8 },
  { id: 'frame-cosmic',  category: 'frame', name: 'กรอบจักรวาล', description: 'ตำนานเท่านั้น',         price: 1500,emoji: '✨',
    frameClass: 'ring-4 ring-detective-500 ring-offset-2 shadow-glow-lg', unlockAfterStage: 12 },

  // ===== Theme accents — เปลี่ยนสี Confetti ตอนเล่นจบด่าน =====
  { id: 'theme-default',  category: 'theme', name: 'TMF Blue',  description: 'ชุดสีหลัก (default)',  price: 0,   emoji: '🟦',
    themeColors: ['#008FFF', '#0072CC', '#ABDAFF', '#2BCAAB', '#F59E0B', '#FBBF24'] },
  { id: 'theme-pastel',   category: 'theme', name: 'Pastel หวาน', description: 'สีพาสเทลฟุ้งๆ',     price: 60,  emoji: '🎀',
    themeColors: ['#FFD9EB', '#FF7AB6', '#FEF3C7', '#FBBF24', '#CFFAFE', '#A78BFA'] },
  { id: 'theme-neon',     category: 'theme', name: 'Neon สด',     description: 'สีนีออนสะดุดตา',     price: 120, emoji: '💫', unlockAfterStage: 4,
    themeColors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF00AA', '#00FF88', '#AA00FF'] },
  { id: 'theme-forest',   category: 'theme', name: 'Forest เขียว', description: 'โทนเขียวธรรมชาติ',   price: 180, emoji: '🌿', unlockAfterStage: 6,
    themeColors: ['#10B981', '#34D399', '#06B6D4', '#22D3EE', '#FBBF24', '#F59E0B'] },
  { id: 'theme-sunset',   category: 'theme', name: 'Sunset อบอุ่น', description: 'ส้ม-แดง-ม่วงพระอาทิตย์ตก', price: 250, emoji: '🌅', unlockAfterStage: 8,
    themeColors: ['#F59E0B', '#EF4444', '#EC4899', '#A78BFA', '#FBBF24', '#FB7185'] },

  // ===== Accessories — overlay บน avatar (ของแต่งหน้าตา)
  //   x/y = % ของขนาด avatar (จุดศูนย์กลางของ emoji)
  //   scale = สเกลของ emoji เทียบกับขนาด avatar
  //   ตำแหน่งคำนวณให้พอดีกับศิลปะตัวละคร (ใบหน้าอยู่ ~5-50% ของรูป)
  { id: 'acc-glasses-nerd', category: 'accessory', name: 'แว่นนักสืบ', description: 'แว่นกรอบดำสำหรับนักสืบ',
    price: 80,  emoji: '👓', accessory: { emoji: '👓', x: 50, y: 32, scale: 0.4 } },
  { id: 'acc-cap-detective', category: 'accessory', name: 'หมวกนักสืบ', description: 'หมวก Sherlock สุดคลาสสิก',
    price: 120, emoji: '🎩', unlockAfterStage: 2, accessory: { emoji: '🎩', x: 50, y: 5, scale: 0.5 } },
  { id: 'acc-bow-pink', category: 'accessory', name: 'โบว์ชมพู', description: 'โบว์น่ารักติดผม',
    price: 100, emoji: '🎀', accessory: { emoji: '🎀', x: 68, y: 12, scale: 0.35 } },
  { id: 'acc-mask', category: 'accessory', name: 'แมสปิดปาก', description: 'ใส่แมสดูแลสุขภาพ',
    price: 60,  emoji: '😷', accessory: { emoji: '😷', x: 50, y: 50, scale: 0.55 } },
  { id: 'acc-headphones', category: 'accessory', name: 'หูฟัง gamer', description: 'หูฟัง gamer สีนีออน',
    price: 150, emoji: '🎧', unlockAfterStage: 4, accessory: { emoji: '🎧', x: 50, y: 28, scale: 0.6 } },
  { id: 'acc-crown', category: 'accessory', name: 'มงกุฎทอง', description: 'มงกุฎสำหรับนักสืบระดับตำนาน',
    price: 600, emoji: '👑', unlockAfterStage: 8, accessory: { emoji: '👑', x: 50, y: 0, scale: 0.45 } },
  { id: 'acc-sparkle', category: 'accessory', name: 'ประกายดารา', description: 'ดาวระยิบรอบหัว',
    price: 250, emoji: '✨', unlockAfterStage: 5, accessory: { emoji: '✨', x: 22, y: 18, scale: 0.4 } },
  { id: 'acc-flower', category: 'accessory', name: 'ดอกไม้ผม', description: 'ดอกไม้ติดผมหวานๆ',
    price: 90,  emoji: '🌸', accessory: { emoji: '🌸', x: 25, y: 14, scale: 0.35 } },

  // ===== Profile Backdrops — พื้นหลังหน้าโปรไฟล์ =====
  { id: 'bd-default', category: 'backdrop', name: 'ขาวสุภาพ', description: 'พื้นหลังเริ่มต้น',
    price: 0,   emoji: '⬜', backdropCss: '#F6F4FA' },
  { id: 'bd-sky', category: 'backdrop', name: 'ท้องฟ้าฟ้าใส', description: 'ฟ้าอ่อนสบายตา',
    price: 80,  emoji: '🌤️',
    backdropCss: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)' },
  { id: 'bd-sunset', category: 'backdrop', name: 'พระอาทิตย์ตก', description: 'ส้ม-ชมพู-ม่วงนุ่มๆ',
    price: 150, emoji: '🌇', unlockAfterStage: 3,
    backdropCss: 'linear-gradient(135deg, #FED7AA 0%, #FBCFE8 50%, #C4B5FD 100%)' },
  { id: 'bd-night', category: 'backdrop', name: 'ราตรีดาว', description: 'น้ำเงินเข้มมีดาวประกาย',
    price: 220, emoji: '🌃', unlockAfterStage: 6,
    backdropCss: 'radial-gradient(circle at 20% 20%, #312E81 0%, #0F172A 70%)' },
  { id: 'bd-forest', category: 'backdrop', name: 'ป่าเขียวขจี', description: 'เขียวสด สดชื่น',
    price: 180, emoji: '🌲', unlockAfterStage: 4,
    backdropCss: 'linear-gradient(135deg, #DCFCE7 0%, #86EFAC 100%)' },
  { id: 'bd-galaxy', category: 'backdrop', name: 'กาแล็กซี่', description: 'ม่วง-ชมพู-น้ำเงิน สวยจัด',
    price: 400, emoji: '🌌', unlockAfterStage: 8,
    backdropCss: 'linear-gradient(135deg, #581C87 0%, #BE185D 50%, #1E3A8A 100%)' },

  // ===== Cert Decorations — ลายกรอบใบประกาศ =====
  { id: 'cd-default', category: 'cert-deco', name: 'กรอบมาตรฐาน', description: 'กรอบเรียบหรู',
    price: 0,   emoji: '📜',
    certDeco: { borderClass: 'border-2 border-detective-300' } },
  { id: 'cd-gold', category: 'cert-deco', name: 'กรอบทองคำ', description: 'กรอบทองสุดหรู',
    price: 200, emoji: '🥇', unlockAfterStage: 6,
    certDeco: { borderClass: 'border-[6px] border-double border-warning-500 shadow-glow', corner: '✨' } },
  { id: 'cd-platinum', category: 'cert-deco', name: 'กรอบแพลตตินั่ม', description: 'กรอบเงิน-เพชรงาม',
    price: 350, emoji: '💎', unlockAfterStage: 8,
    certDeco: { borderClass: 'border-[6px] border-double border-slate-400 shadow-glow-lg', corner: '💎' } },
  { id: 'cd-floral', category: 'cert-deco', name: 'กรอบดอกไม้', description: 'ดอกไม้ขนาบมุมใบประกาศ',
    price: 180, emoji: '🌸', unlockAfterStage: 4,
    certDeco: { borderClass: 'border-4 border-pink-300', corner: '🌸' } },
  { id: 'cd-laurel', category: 'cert-deco', name: 'กรอบใบลอเรล', description: 'ใบลอเรลเขียวมงคล',
    price: 250, emoji: '🌿', unlockAfterStage: 5,
    certDeco: { borderClass: 'border-4 border-mint-500', corner: '🌿' } },

  // ===== Boosters — ของใช้ในเกม (consumable, ซื้อซ้ำได้) =====
  { id: 'boost-hint',    category: 'booster', name: 'Hint Token',     description: 'ดูเฉลยข้อที่ตอบยาก 1 ครั้ง — ใช้ในด่าน',
    price: 40,  emoji: '💡', booster: { effect: 'hint-token', uses: 1 } },
  { id: 'boost-hint-3',  category: 'booster', name: 'Hint Pack ×3',    description: 'แพ็คคุ้ม 3 ครั้ง — ประหยัดกว่า 10%',
    price: 108, emoji: '🎁', booster: { effect: 'hint-token', uses: 3 } },
  { id: 'boost-coin-x2', category: 'booster', name: 'Coin x2 (3 ด่าน)', description: 'เหรียญที่ได้ x2 ใน 3 ด่านถัดไป',
    price: 100, emoji: '💰', unlockAfterStage: 2, booster: { effect: 'coin-x2', uses: 3 } },
  { id: 'boost-shield',  category: 'booster', name: 'Streak Shield',  description: 'กันสตรีค (🔥) ขาด 1 วัน ถ้าลืมเข้ามาเล่น',
    price: 80,  emoji: '🛡️', unlockAfterStage: 1, booster: { effect: 'streak-shield', uses: 1 } },
];

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find(i => i.id === id);
}
