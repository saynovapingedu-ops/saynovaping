// ============================================================================
//  Challenge — ท้าเพื่อนแบบ async ผ่าน LINE (ไม่ต้องมี realtime server)
//  ฝังคะแนนผู้ท้าไว้ใน URL → เพื่อนเปิดลิงก์ เล่นด่านเดิม แล้วเทียบคะแนน
// ============================================================================

export interface PendingChallenge {
  stageId: number;
  score: number;   // แต้มที่ผู้ท้าทำได้ในด่านนี้ (เป้าที่ต้องเอาชนะ)
  by: string;      // ชื่อผู้ท้า
}

const KEY = 'hd_pending_challenge';

export function setPendingChallenge(c: PendingChallenge): void {
  try { sessionStorage.setItem(KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

export function getPendingChallenge(): PendingChallenge | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PendingChallenge) : null;
  } catch { return null; }
}

export function clearPendingChallenge(): void {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** สร้างลิงก์คำท้า — ฝัง stage + คะแนน + ชื่อผู้ท้า */
export function buildChallengeUrl(stageId: number, score: number, by: string): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`;
  return `${base}?challenge=${stageId}&s=${score}&by=${encodeURIComponent(by)}`;
}

/** อ่านคำท้าจาก query string (คืน null ถ้าไม่มี) */
export function parseChallengeFromSearch(search: string): PendingChallenge | null {
  const p = new URLSearchParams(search);
  const stageId = Number(p.get('challenge'));
  if (!stageId || Number.isNaN(stageId)) return null;
  const score = Number(p.get('s')) || 0;
  const byRaw = p.get('by');
  const by = byRaw ? decodeURIComponent(byRaw) : 'เพื่อน';
  return { stageId, score, by };
}
