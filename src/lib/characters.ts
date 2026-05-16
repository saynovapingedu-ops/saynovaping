// ============================================================================
//  Characters — ภาพตัวละครในเกม (ทั้งผู้เล่นและ NPC)
//
//  ที่มาของไฟล์: src/PhotoUse/character/  →  คัดลอกไว้ที่ public/characters/
//  เพื่อให้ vite serve เป็น static asset (URL คงที่ ตอน build ไม่ต้อง bundle)
// ============================================================================

export type CharacterId = 'g1' | 'g2' | 'g3' | 'm1' | 'm2';

export interface PlayerCharacter {
  id: CharacterId;
  /** ตัวเลข preset เดิม (เพื่อ backward-compat กับ playerStore) */
  preset: number;
  /** ชื่อแสดง */
  label: string;
  /** เพศ — ใช้แตกบทพูดให้ตรงกับตัวละครได้ในอนาคต */
  gender: 'female' | 'male';
  /** URL ของรูป PNG (วงกลม, 1000x1000) */
  src: string;
  /** emoji fallback (ถ้ารูปโหลดไม่ขึ้น) */
  emoji: string;
  /** ประโยคแนะนำตัวสั้นๆ — โชว์ตอนเลือกตัวละคร */
  tagline: string;
}

export const PLAYER_CHARACTERS: PlayerCharacter[] = [
  {
    id: 'g1', preset: 1, label: 'น้องน้ำใส',  gender: 'female',
    src: '/characters/player-g1.png', emoji: '👧',
    tagline: 'มีน้ำใจ ชอบช่วยเพื่อน',
  },
  {
    id: 'g2', preset: 2, label: 'น้องมิ้นต์', gender: 'female',
    src: '/characters/player-g2.png', emoji: '👧',
    tagline: 'สดใส กล้าพูด กล้าปฏิเสธ',
  },
  {
    id: 'g3', preset: 3, label: 'น้องดาว',   gender: 'female',
    src: '/characters/player-g3.png', emoji: '👧',
    tagline: 'อ่อนโยน รับฟังเก่ง',
  },
  {
    id: 'm1', preset: 4, label: 'น้องนพ',    gender: 'male',
    src: '/characters/player-m1.png', emoji: '👦',
    tagline: 'สังเกตเก่ง จับรายละเอียดไม่พลาด',
  },
  {
    id: 'm2', preset: 5, label: 'น้องภูมิ',   gender: 'male',
    src: '/characters/player-m2.png', emoji: '👦',
    tagline: 'มั่นใจ พูดตรง รักความถูกต้อง',
  },
];

export function getPlayerCharacter(preset?: number): PlayerCharacter {
  return PLAYER_CHARACTERS.find(c => c.preset === preset) || PLAYER_CHARACTERS[0];
}

// NPC speakers — รูปเฉพาะของหมอ + ตัวร้าย (ที่เหลือใช้ emoji ใน DialogueBubble)
export const NPC_CHARACTERS: Record<string, { src: string; label: string }> = {
  doctor: { src: '/characters/doctor.png', label: 'พี่หมอเก๋' },
  vapor:  { src: '/characters/vapor.png',  label: 'Vapor (ตัวร้าย)' },
};
