// ============================================================================
//  Room Items — ของแต่งห้องตัวละคร (แบบ isometric / 2.5D)
//  ปลดล็อคด้วย XP สะสม
//
//  ระบบ zone:
//    - wall-back  : ผนังหลัง (ด้านบนของห้อง) เช่น โปสเตอร์, นาฬิกา
//    - wall-side  : ผนังข้าง (ด้านขวา) เช่น ตู้, ผ้าม่าน, ป้าย
//    - floor      : พื้น (ด้านหน้า) เช่น พรม, ต้นไม้
//    - desk       : บนโต๊ะ (ด้านขวาของห้อง)
//    - pet        : สัตว์เลี้ยงเดินบนพื้น
//
//  ตำแหน่งวัดเป็น % บน "ระนาบ" ของ zone นั้นๆ (0=ซ้าย/บน, 100=ขวา/ล่าง)
// ============================================================================

export type RoomZone = 'wall-back' | 'wall-side' | 'floor' | 'desk' | 'pet';

export interface RoomItem {
  id: string;
  name: string;
  emoji: string;
  zone: RoomZone;
  /** ตำแหน่งบน zone นั้นๆ — % */
  position: { x: number; y: number };
  /** ขนาด emoji (px) */
  size?: number;
  unlockAtXP: number;
  /** บทพูดของตัวละครตอนปลดล็อค */
  thanks: string;
  /** คำอธิบายสั้น */
  hint?: string;
}

export const ROOM_ITEMS: RoomItem[] = [
  // ===== เริ่มต้น =====
  {
    id: 'rm-plant-1',
    name: 'ต้นกระบองเพชรเล็ก',
    emoji: '🌵',
    zone: 'floor',
    position: { x: 18, y: 80 },
    size: 32,
    unlockAtXP: 50,
    thanks: 'ว้าว! ต้นไม้เล็กๆ ทำให้ห้องสดชื่นเลย ขอบคุณมาก!',
    hint: 'ของชิ้นแรกในห้อง',
  },
  {
    id: 'rm-poster-1',
    name: 'โปสเตอร์นักสืบ',
    emoji: '🖼️',
    zone: 'wall-back',
    position: { x: 25, y: 35 },
    size: 38,
    unlockAtXP: 120,
    thanks: 'โปสเตอร์เท่ห์มาก! ฉันจะดูแล้วฮึดสู้ทุกวัน 🔍',
  },
  {
    id: 'rm-lamp-1',
    name: 'โคมไฟอ่านหนังสือ',
    emoji: '💡',
    zone: 'desk',
    position: { x: 25, y: 30 },
    size: 30,
    unlockAtXP: 200,
    thanks: 'แสงสว่างใหม่! ตอนนี้ฉันอ่านหนังสือยามค่ำได้แล้ว',
  },

  // ===== กลางเกม =====
  {
    id: 'rm-rug-1',
    name: 'พรมลายม่วงทอง',
    emoji: '🟪',
    zone: 'floor',
    position: { x: 50, y: 88 },
    size: 56,
    unlockAtXP: 300,
    thanks: 'พรมใหม่! ห้องดูอบอุ่นขึ้นเยอะ — ขอบคุณนักสืบสุดที่รัก',
  },
  {
    id: 'rm-bookshelf',
    name: 'ตู้หนังสือนักสืบ',
    emoji: '📚',
    zone: 'wall-side',
    position: { x: 70, y: 55 },
    size: 42,
    unlockAtXP: 450,
    thanks: 'มีที่เก็บหนังสือสืบสวนแล้ว! ฉันจะอ่านทุกเล่มเลย',
  },
  {
    id: 'rm-trophy-1',
    name: 'ถ้วยรางวัลแรก',
    emoji: '🏆',
    zone: 'desk',
    position: { x: 65, y: 35 },
    size: 32,
    unlockAtXP: 600,
    thanks: 'ถ้วยรางวัล! ฉันจะวางไว้ตรงโต๊ะ ให้ทุกคนเห็นเลย',
  },
  {
    id: 'rm-window-curtain',
    name: 'ผ้าม่านลายดาว',
    emoji: '🪟',
    zone: 'wall-back',
    position: { x: 65, y: 30 },
    size: 46,
    unlockAtXP: 800,
    thanks: 'ผ้าม่านสวยจัง! ทำให้ห้องดูเป็นบ้านเลย 🌟',
  },
  {
    id: 'rm-clock',
    name: 'นาฬิกาห้อยผนัง',
    emoji: '🕰️',
    zone: 'wall-back',
    position: { x: 45, y: 15 },
    size: 36,
    unlockAtXP: 1000,
    thanks: 'นาฬิกาคลาสสิก! ฉันจะตื่นเช้ามาเล่นเกมต่อ',
  },

  // ===== Master tier =====
  {
    id: 'rm-pet-cat',
    name: 'แมวเหมียวประจำห้อง',
    emoji: '🐱',
    zone: 'pet',
    position: { x: 30, y: 70 },
    size: 36,
    unlockAtXP: 1300,
    thanks: 'เมี้ยว! เพื่อนใหม่มาแล้ว — ฉันมีคนคุยตอนคิดคดีหนักๆ แล้ว',
    hint: 'สัตว์เลี้ยงประจำห้อง',
  },
  {
    id: 'rm-plant-big',
    name: 'ต้นมอนสเตอร่า',
    emoji: '🪴',
    zone: 'floor',
    position: { x: 12, y: 60 },
    size: 44,
    unlockAtXP: 1600,
    thanks: 'ต้นใหญ่! ห้องเริ่มเหมือนคาเฟ่หรูแล้ว ขอบคุณมาก!',
  },
  {
    id: 'rm-poster-2',
    name: 'โปสเตอร์ SayNo',
    emoji: '🚭',
    zone: 'wall-back',
    position: { x: 12, y: 28 },
    size: 38,
    unlockAtXP: 2000,
    thanks: 'โปสเตอร์รณรงค์ปฏิเสธบุหรี่ไฟฟ้า — ภูมิใจมากที่มีในห้อง!',
  },
  {
    id: 'rm-trophy-master',
    name: 'ถ้วย Master',
    emoji: '🥇',
    zone: 'desk',
    position: { x: 45, y: 35 },
    size: 32,
    unlockAtXP: 2400,
    thanks: 'ถ้วยรางวัลใบที่สอง! ฉันใกล้ระดับครูแล้ว ขอบคุณเพื่อนรัก',
  },
  {
    id: 'rm-pet-bird',
    name: 'นกแก้วคุยเก่ง',
    emoji: '🦜',
    zone: 'wall-side',
    position: { x: 30, y: 30 },
    size: 32,
    unlockAtXP: 2800,
    thanks: 'พรร์ดดด! นกแก้วของฉัน บอกว่า "ไม่ vape" ทั้งวัน 😂',
  },
  {
    id: 'rm-cosmic-light',
    name: 'โคมไฟจักรวาล',
    emoji: '✨',
    zone: 'floor',
    position: { x: 80, y: 70 },
    size: 40,
    unlockAtXP: 3200,
    thanks: 'แสงระยิบระยับ! ห้องของตำนานนักสืบสุขภาพ ✨',
    hint: 'รางวัลระดับ Legend',
  },
  {
    id: 'rm-legend-banner',
    name: 'ป้าย Health Legend',
    emoji: '🏆',
    zone: 'wall-back',
    position: { x: 80, y: 30 },
    size: 44,
    unlockAtXP: 3500,
    thanks: 'นี่คือสุดยอดของห้อง! ตอนนี้ฉันคือตำนานนักสืบสุขภาพอย่างแท้จริง 🏆',
    hint: 'รางวัลสูงสุด — ห้องเสร็จสมบูรณ์',
  },
];

export function nextRoomItemFor(xp: number, owned: Set<string>): RoomItem | undefined {
  return ROOM_ITEMS
    .filter(i => !owned.has(i.id))
    .sort((a, b) => a.unlockAtXP - b.unlockAtXP)
    .find(i => xp >= i.unlockAtXP)
    ?? ROOM_ITEMS.filter(i => !owned.has(i.id)).sort((a, b) => a.unlockAtXP - b.unlockAtXP)[0];
}
