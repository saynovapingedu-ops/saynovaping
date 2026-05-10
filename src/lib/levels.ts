export interface Level {
  level: number;
  name: string;
  minXP: number;
  emoji: string;
  description: string;
  /** กลุ่มแรงค์ (ROV-style) — ใช้สำหรับสีและไอคอนภาพรวม */
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'legend';
}

// แรงค์แบบ ROV — แต่ละ tier มี 3 ดิวิชัน (III/II/I) ยกเว้น Legend (1 อย่าง)
export const LEVELS: Level[] = [
  // Bronze — มือใหม่
  { level: 1,  tier: 'bronze',   name: 'มือใหม่ III',       minXP: 0,    emoji: '🥉', description: 'เริ่มต้นเส้นทางนักสืบ' },
  { level: 2,  tier: 'bronze',   name: 'มือใหม่ II',        minXP: 60,   emoji: '🥉', description: 'เริ่มจับทาง' },
  { level: 3,  tier: 'bronze',   name: 'มือใหม่ I',         minXP: 140,  emoji: '🥉', description: 'พร้อมก้าวต่อ' },
  // Silver — ฝึกหัด
  { level: 4,  tier: 'silver',   name: 'ฝึกหัด III',        minXP: 230,  emoji: '🥈', description: 'นักสืบฝึกหัด' },
  { level: 5,  tier: 'silver',   name: 'ฝึกหัด II',         minXP: 330,  emoji: '🥈', description: 'มีประสบการณ์' },
  { level: 6,  tier: 'silver',   name: 'ฝึกหัด I',          minXP: 450,  emoji: '🥈', description: 'พร้อมเลื่อนขั้น' },
  // Gold — เต็มตัว
  { level: 7,  tier: 'gold',     name: 'นักสืบ III',        minXP: 580,  emoji: '🥇', description: 'นักสืบตัวจริง' },
  { level: 8,  tier: 'gold',     name: 'นักสืบ II',         minXP: 720,  emoji: '🥇', description: 'รับมือคดียาก' },
  { level: 9,  tier: 'gold',     name: 'นักสืบ I',          minXP: 880,  emoji: '🥇', description: 'ใกล้ระดับแชมป์' },
  // Platinum — อาวุโส
  { level: 10, tier: 'platinum', name: 'อาวุโส III',        minXP: 1060, emoji: '💠', description: 'นักสืบอาวุโส' },
  { level: 11, tier: 'platinum', name: 'อาวุโส II',         minXP: 1260, emoji: '💠', description: 'นำทีมได้' },
  { level: 12, tier: 'platinum', name: 'อาวุโส I',          minXP: 1480, emoji: '💠', description: 'ระดับสูงของการสืบสวน' },
  // Diamond — ครู
  { level: 13, tier: 'diamond',  name: 'ครูนักสืบ III',      minXP: 1720, emoji: '💎', description: 'สอนรุ่นน้องได้' },
  { level: 14, tier: 'diamond',  name: 'ครูนักสืบ II',       minXP: 2000, emoji: '💎', description: 'ครูที่นักเรียนนับถือ' },
  { level: 15, tier: 'diamond',  name: 'ครูนักสืบ I',        minXP: 2300, emoji: '💎', description: 'ครูเชี่ยวชาญ' },
  // Master — มหาครู
  { level: 16, tier: 'master',   name: 'มหาครู',             minXP: 2650, emoji: '🏅', description: 'ระดับมหาครูนักสืบสุขภาพ' },
  { level: 17, tier: 'master',   name: 'มหาครูสูงสุด',        minXP: 3050, emoji: '🏅', description: 'อาจารย์ของอาจารย์' },
  // Legend — ตำนาน
  { level: 18, tier: 'legend',   name: 'ตำนานนักสืบสุขภาพ',   minXP: 3500, emoji: '🏆', description: 'ระดับสูงสุด — ปกป้องลมหายใจของรุ่นต่อไป' },
];

// สี/ป้ายของแต่ละ tier (ใช้บน UI)
export const TIER_INFO: Record<Level['tier'], { label: string; color: string; bg: string; text: string }> = {
  bronze:   { label: 'Bronze',   color: '#A06A3D', bg: 'bg-amber-100',   text: 'text-amber-700'    },
  silver:   { label: 'Silver',   color: '#9CA3AF', bg: 'bg-gray-200',    text: 'text-gray-700'     },
  gold:     { label: 'Gold',     color: '#E8B500', bg: 'bg-warning-100', text: 'text-warning-600'  },
  platinum: { label: 'Platinum', color: '#5BC0DE', bg: 'bg-sky-100',     text: 'text-sky-700'      },
  diamond:  { label: 'Diamond',  color: '#A78BFA', bg: 'bg-violet-100',  text: 'text-violet-700'   },
  master:   { label: 'Master',   color: '#F472B6', bg: 'bg-pink-100',    text: 'text-pink-700'     },
  legend:   { label: 'Legend',   color: '#6F2D8E', bg: 'bg-detective-100', text: 'text-detective-700' },
};

export function getLevelByXP(xp: number): Level {
  let current = LEVELS[0];
  for (const lv of LEVELS) {
    if (xp >= lv.minXP) current = lv;
  }
  return current;
}

export function getNextLevel(xp: number): Level | null {
  for (const lv of LEVELS) {
    if (xp < lv.minXP) return lv;
  }
  return null; // อยู่ level สูงสุดแล้ว
}

export function getProgressToNextLevel(xp: number): number {
  const current = getLevelByXP(xp);
  const next = getNextLevel(xp);
  if (!next) return 1; // max level
  const span = next.minXP - current.minXP;
  const inLevel = xp - current.minXP;
  return Math.max(0, Math.min(1, inLevel / span));
}
