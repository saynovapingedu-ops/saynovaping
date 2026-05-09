// ============================================================================
//  Shop Items — รายการของในร้านค้า (preset)
//  player ซื้อด้วย coins เก็บใน playerStore.ownedItems
// ============================================================================

export type ItemCategory = 'title' | 'frame' | 'avatar-pack' | 'theme';

export interface ShopItem {
  id: string;
  category: ItemCategory;
  name: string;
  description: string;
  price: number;            // เหรียญ
  emoji: string;            // ไอคอน
  unlockAfterStage?: number; // ต้องผ่านด่านนี้ก่อนซื้อ
  /** สำหรับ frame: CSS class ขอบ avatar */
  frameClass?: string;
  /** สำหรับ title: text ที่แสดงใต้ชื่อ */
  titleText?: string;
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

  // ===== Theme accents (ของฟรี/ราคาน้อย เป็นรางวัล) =====
  { id: 'theme-confetti-pink',  category: 'theme', name: 'Confetti สีพาสเทล', description: 'เปลี่ยนสี confetti', price: 60,  emoji: '🎀' },
  { id: 'theme-confetti-neon',  category: 'theme', name: 'Confetti นีออน',     description: 'สีนีออนสด',         price: 120, emoji: '💫', unlockAfterStage: 4 },
];

export function getShopItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find(i => i.id === id);
}
