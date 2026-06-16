// ============================================================================
//  Changelog — "มีอะไรใหม่" สื่อสารการอัปเดตเกมให้ผู้เล่นรู้ทุกเวอร์ชัน
//  อัปเดตเนื้อหา = เพิ่ม entry ใหม่ที่ด้านบน + bumpเลข APP_VERSION
// ============================================================================

export const APP_VERSION = '1.2.0';

export interface ChangelogEntry {
  version: string;
  date: string;        // YYYY-MM
  title: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.2.0',
    date: '2026-06',
    title: 'เล่นง่ายขึ้น + ท้าเพื่อนได้!',
    items: [
      '🎮 เพิ่มปุ่ม "เริ่ม/เล่นต่อ" หน้าแรก — หาที่เริ่มเล่นง่ายขึ้น',
      '⭐ อธิบาย "แต้ม" ให้ชัด (เปลี่ยนจากคำว่า XP) — กดปุ่ม ? ดูได้',
      '🗺️ จัดด่านใหม่: ด่านหลัก 10 + ขั้นกว่า 5 + เจาะลึก 5 พร้อมป้ายระดับความยาก',
      '🎯 ระบบ "ท้าเพื่อน" ผ่าน LINE — แชร์คะแนนให้เพื่อนมาลองเอาชนะ',
      '📓 เฉลยจบด่านครบทุกข้อ (รวมมินิเกม) + แถบความคืบหน้าในด่าน',
    ],
  },
];

const SEEN_KEY = 'hd_changelog_seen_version';

/** ยังไม่เคยเห็น changelog ของเวอร์ชันปัจจุบันไหม */
export function hasUnseenChangelog(): boolean {
  try { return localStorage.getItem(SEEN_KEY) !== APP_VERSION; }
  catch { return false; }
}

export function markChangelogSeen(): void {
  try { localStorage.setItem(SEEN_KEY, APP_VERSION); } catch { /* ignore */ }
}
