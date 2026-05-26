import type { Badge } from '../types';

export const BADGES: Badge[] = [
  // ===== Skill badges =====
  { id: 'truth-finder',   name: 'นักค้นหาความจริง', description: 'แยกแยะข้อมูลจริง-เท็จได้', category: 'skill', emoji: '🔍' },
  { id: 'direct-refusal', name: 'ปฏิเสธตรงไปตรงมา', description: 'ใช้สูตรปฏิเสธ 3 ขั้นได้',  category: 'skill', emoji: '✋' },
  { id: 'broken-record',  name: 'แผ่นเสียงตกร่อง',  description: 'ยืนยันคำตอบเดิมได้ไม่หวั่น', category: 'skill', emoji: '🔁' },
  { id: 'walk-away',      name: 'ถอยเป็น',         description: 'รู้จักออกจากสถานการณ์เสี่ยง', category: 'skill', emoji: '🚶' },
  { id: 'reasoning',      name: 'ใช้เหตุผลโน้มน้าว', description: 'เปลี่ยนใจเพื่อนได้ด้วยเหตุผล', category: 'skill', emoji: '💡' },
  { id: 'buddy-saver',    name: 'พี่ช่วยน้อง',      description: 'ช่วยเพื่อนพ้นจากการลองได้', category: 'skill', emoji: '🤝' },
  { id: 'wise-words',     name: 'คำพูดทรงพลัง',    description: 'พูดให้คนอื่นรับฟังได้',     category: 'skill', emoji: '💬' },
  { id: 'law-aware',      name: 'รู้กฎหมาย',        description: 'เข้าใจ พ.ร.บ. เกี่ยวกับ vape', category: 'skill', emoji: '⚖️' },
  { id: 'recovery-coach', name: 'โค้ชเลิกบุหรี่',    description: 'ช่วยเพื่อนเลิกใช้ vape ได้',   category: 'skill', emoji: '🩺' },
  { id: 'media-literate', name: 'รู้เท่าทันสื่อ',    description: 'จับโกหกในโซเชียลได้',         category: 'skill', emoji: '📱' },
  { id: 'family-care',    name: 'อบอุ่นในบ้าน',     description: 'รับมือกับคนในครอบครัวได้',  category: 'skill', emoji: '🏠' },
  { id: 'sensei',         name: 'อาจารย์นักสืบ',    description: 'ส่งต่อความรู้ให้รุ่นน้อง',     category: 'skill', emoji: '🎓' },

  // ===== Progress badges =====
  { id: 'rookie',           name: 'นักสืบมือใหม่',    description: 'เริ่มเล่นเป็นครั้งแรก',  category: 'progress', emoji: '🌱' },
  { id: 'stage-1-clear',    name: 'ผ่านด่าน 1',      description: 'จบด่านความจริงที่ถูกซ่อน', category: 'progress', emoji: '①' },
  { id: 'stage-2-clear',    name: 'ผ่านด่าน 2',      description: 'จบด่านห้องน้ำ',         category: 'progress', emoji: '②' },
  { id: 'stage-3-clear',    name: 'ผ่านด่าน 3',      description: 'จบด่านปาร์ตี้',         category: 'progress', emoji: '③' },
  { id: 'stage-4-clear',    name: 'ผ่านด่าน 4',      description: 'จบด่านห้าง',           category: 'progress', emoji: '④' },
  { id: 'health-legend',    name: 'ตำนานสุขภาพ',     description: 'จบเกมและได้รับเกียรติบัตร', category: 'progress', emoji: '🏆' },
  { id: 'streak-7',         name: 'ต่อเนื่อง 7 วัน',  description: 'เล่นต่อกันครบสัปดาห์',   category: 'progress', emoji: '🔥' },
  // ===== Expert Arc clears (ด่าน 16-20) =====
  { id: 'expert-1-clear',     name: 'เข้าใจสมอง',      description: 'รู้กลไกนิโคติน-dopamine ในสมองวัยรุ่น', category: 'progress', emoji: '🧠' },
  { id: 'expert-2-clear',     name: 'รู้ทันเกมออนไลน์', description: 'รับมือคนขายในเกม/Discord ได้',         category: 'progress', emoji: '🎮' },
  { id: 'expert-3-clear',     name: 'สื่อสารกับบ้าน',   description: 'บอกพ่อแม่เรื่องยากได้อย่างถูกวิธี',     category: 'progress', emoji: '💬' },
  { id: 'expert-4-clear',     name: 'รู้จัก EVALI',     description: 'เข้าใจปอดอักเสบจากบุหรี่ไฟฟ้า',         category: 'progress', emoji: '🫁' },
  { id: 'expert-final-clear', name: 'นักสืบเชี่ยวชาญ',  description: 'จบครบ 20 ด่าน — รู้สูตรเลิก 4D',         category: 'progress', emoji: '🌟' },
  { id: 'master-graduate',    name: 'ผ่านการประเมิน',   description: 'สอบแบบทดสอบรวมผ่าน ≥ 80%',              category: 'progress', emoji: '🎓' },

  // ===== Social badges =====
  { id: 'first-share',  name: 'แชร์ครั้งแรก',  description: 'แชร์เกมให้เพื่อน',     category: 'social', emoji: '📣' },
  { id: 'mentor',       name: 'พี่เลี้ยง',     description: 'ช่วย NPC สำเร็จ 3 ครั้ง', category: 'social', emoji: '🎓' },
  { id: 'team-player',  name: 'เพื่อนแท้',    description: 'ทำภารกิจ social ครบ',  category: 'social', emoji: '👥' },
];

export function getBadge(id: string): Badge | undefined {
  return BADGES.find(b => b.id === id);
}
