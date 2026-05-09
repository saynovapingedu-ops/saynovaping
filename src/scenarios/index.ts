import type { Scenario } from '../types';
import { scenario01 } from './scenario-01';
import { scenario02 } from './scenario-02';
import { scenario03 } from './scenario-03';
import { scenario04 } from './scenario-04';
import { scenario05 } from './scenario-05';
import { scenario06 } from './scenario-06';

export interface ScenarioMeta {
  id: number;
  title: string;
  subtitle?: string;
  estMinutes: number;
  available: boolean;       // ใช้แยกระหว่างด่านที่พร้อมเล่น vs coming soon
  unlockAfter?: number;     // ต้องจบด่าน N ก่อน (null = ปลดตั้งแต่แรก)
}

export const SCENARIO_META: ScenarioMeta[] = [
  { id: 1, title: 'ความจริงที่ถูกซ่อน',     subtitle: 'แยกแยะข้อมูลจริง-เท็จ',  estMinutes: 5, available: true },
  { id: 2, title: 'เพื่อนคนใหม่ในห้องน้ำ', subtitle: 'สูตรปฏิเสธ 3 ขั้น',      estMinutes: 6, available: true,  unlockAfter: 1 },
  { id: 3, title: 'ปาร์ตี้วันเกิด',         subtitle: 'ใช้เหตุผลโน้มน้าว',        estMinutes: 7, available: true,  unlockAfter: 2 },
  { id: 4, title: 'ห้างใหญ่หลังเลิกเรียน',  subtitle: 'Broken Record',          estMinutes: 6, available: true,  unlockAfter: 3 },
  { id: 5, title: 'DM ในเกมออนไลน์',      subtitle: 'รู้จักถอย',                estMinutes: 5, available: true,  unlockAfter: 4 },
  { id: 6, title: 'น้องใบเตยกำลังจะลอง',  subtitle: 'ช่วยเพื่อน',              estMinutes: 7, available: true,  unlockAfter: 5 },
  { id: 7, title: 'คุณลุงที่ร้านสะดวกซื้อ', subtitle: 'รู้กฎหมาย',              estMinutes: 6, available: false, unlockAfter: 6 },
  { id: 8, title: 'บุก Vapor Corp (BOSS)', subtitle: 'รวมทุกทักษะ',            estMinutes: 10, available: false, unlockAfter: 7 },
];

export function getScenarioById(id: number): Scenario | null {
  switch (id) {
    case 1: return scenario01;
    case 2: return scenario02;
    case 3: return scenario03;
    case 4: return scenario04;
    case 5: return scenario05;
    case 6: return scenario06;
    default: return null;
  }
}

export function isStageUnlocked(stageId: number, completed: number[]): boolean {
  const meta = SCENARIO_META.find(m => m.id === stageId);
  if (!meta) return false;
  if (!meta.unlockAfter) return true;
  return completed.includes(meta.unlockAfter);
}
