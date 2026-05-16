import type { Scenario } from '../types';
import { scenario01 } from './scenario-01';
import { scenario02 } from './scenario-02';
import { scenario03 } from './scenario-03';
import { scenario04 } from './scenario-04';
import { scenario05 } from './scenario-05';
import { scenario06 } from './scenario-06';
import { scenario07 } from './scenario-07';
import { scenario08 } from './scenario-08';
import { scenario09 } from './scenario-09';
import { scenario10 } from './scenario-10';
import { scenario11 } from './scenario-11';
import { scenario12 } from './scenario-12';
import { scenario13 } from './scenario-13';
import { scenario14 } from './scenario-14';
import { scenario15 } from './scenario-15';

export interface ScenarioMeta {
  id: number;
  title: string;
  subtitle?: string;
  estMinutes: number;
  available: boolean;
  unlockAfter?: number;
  /** กลุ่มของด่าน — ใช้แบ่งบนแผนที่ */
  arc?: 'hero' | 'master' | 'pro';
}

export const SCENARIO_META: ScenarioMeta[] = [
  // === Hero Arc (1-8) ===
  { id: 1,  arc: 'hero',   title: 'ความจริงที่ถูกซ่อน',     subtitle: 'แยกแยะข้อมูลจริง-เท็จ',  estMinutes: 5,  available: true },
  { id: 2,  arc: 'hero',   title: 'เพื่อนคนใหม่ในห้องน้ำ', subtitle: 'สูตรปฏิเสธ 3 ขั้น',      estMinutes: 6,  available: true,  unlockAfter: 1 },
  { id: 3,  arc: 'hero',   title: 'ปาร์ตี้วันเกิด',         subtitle: 'ใช้เหตุผลโน้มน้าว',        estMinutes: 7,  available: true,  unlockAfter: 2 },
  { id: 4,  arc: 'hero',   title: 'ห้างใหญ่หลังเลิกเรียน',  subtitle: 'ยืนยันคำเดิมไม่หวั่น',     estMinutes: 6,  available: true,  unlockAfter: 3 },
  { id: 5,  arc: 'hero',   title: 'ข้อความส่วนตัวในเกมออนไลน์', subtitle: 'รู้จักถอย',          estMinutes: 5,  available: true,  unlockAfter: 4 },
  { id: 6,  arc: 'hero',   title: 'น้องใบเตยกำลังจะลอง',  subtitle: 'ช่วยเพื่อน',              estMinutes: 7,  available: true,  unlockAfter: 5 },
  { id: 7,  arc: 'hero',   title: 'คุณลุงที่ร้านสะดวกซื้อ', subtitle: 'รู้กฎหมาย — เติมคำ + จับคู่', estMinutes: 6, available: true,  unlockAfter: 6 },
  { id: 8,  arc: 'hero',   title: 'บุก Vapor Corp (ด่านบอสใหญ่)', subtitle: 'รวมทุกทักษะ 5 ช่วง',   estMinutes: 12, available: true,  unlockAfter: 7 },
  // === Master Arc (9-12) ===
  { id: 9,  arc: 'master', title: 'เพื่อนเริ่มติดแล้ว',      subtitle: 'Master 1 — สูตร 5A ช่วยเลิก',  estMinutes: 8,  available: true, unlockAfter: 8 },
  { id: 10, arc: 'master', title: 'รหัสลับใน TikTok',     subtitle: 'Master 2 — รู้เท่าทันสื่อ',     estMinutes: 7,  available: true, unlockAfter: 9 },
  { id: 11, arc: 'master', title: 'พี่ในครอบครัวสูบ',      subtitle: 'Master 3 — รับมือคนในบ้าน',   estMinutes: 7,  available: true, unlockAfter: 10 },
  { id: 12, arc: 'master', title: 'นักสืบระดับครู',         subtitle: 'Master Final — ส่งต่อรุ่นน้อง', estMinutes: 10, available: true, unlockAfter: 11 },
  // === Pro Arc (13-15) — ทักษะเสริม + เกมเพลย์รูปแบบใหม่ ===
  { id: 13, arc: 'pro', title: 'ฉลาดเสี่ยง',             subtitle: 'Pro 1 — จัดอันดับความเสี่ยง',   estMinutes: 7, available: true, unlockAfter: 12 },
  { id: 14, arc: 'pro', title: 'TikTok ขุดความจริง',     subtitle: 'Pro 2 — ปัดจริง/เท็จแบบเร็ว',   estMinutes: 6, available: true, unlockAfter: 13 },
  { id: 15, arc: 'pro', title: 'บันทึกนักสืบรุ่นเก่า',     subtitle: 'Pro 3 — จับคู่ความจำ',         estMinutes: 7, available: true, unlockAfter: 14 },
];

export const TOTAL_STAGES = SCENARIO_META.length;
/** ผ่าน Hero Arc ครบ = ได้ Certificate */
export const CERT_STAGE_COUNT = 8;

export function getScenarioById(id: number): Scenario | null {
  switch (id) {
    case 1: return scenario01;
    case 2: return scenario02;
    case 3: return scenario03;
    case 4: return scenario04;
    case 5: return scenario05;
    case 6: return scenario06;
    case 7: return scenario07;
    case 8: return scenario08;
    case 9: return scenario09;
    case 10: return scenario10;
    case 11: return scenario11;
    case 12: return scenario12;
    case 13: return scenario13;
    case 14: return scenario14;
    case 15: return scenario15;
    default: return null;
  }
}

export function isStageUnlocked(stageId: number, completed: number[]): boolean {
  const meta = SCENARIO_META.find(m => m.id === stageId);
  if (!meta) return false;
  if (!meta.unlockAfter) return true;
  return completed.includes(meta.unlockAfter);
}
