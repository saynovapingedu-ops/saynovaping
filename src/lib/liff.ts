// ============================================================================
//  LIFF wrapper — รองรับ mock mode สำหรับทดสอบใน browser ปกติ
// ============================================================================

import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID as string;
const MOCK_MODE = import.meta.env.VITE_MOCK_LIFF === 'true';

const MOCK_USER_KEY = 'hd_mock_user_id';

let initialized = false;
let cachedUserId: string | null = null;

/** สร้างหรืออ่าน mock user ID (เก็บใน localStorage) */
function getOrCreateMockUserId(): string {
  let id = localStorage.getItem(MOCK_USER_KEY);
  if (!id) {
    id = 'mock-' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    localStorage.setItem(MOCK_USER_KEY, id);
  }
  return id;
}

/** initialize LIFF (หรือ mock) */
export async function initLiff(): Promise<void> {
  if (initialized) return;
  if (MOCK_MODE) {
    cachedUserId = getOrCreateMockUserId();
    initialized = true;
    console.info('[LIFF] Forced MOCK mode. UserID:', cachedUserId);
    return;
  }
  try {
    await liff.init({ liffId: LIFF_ID });
    if (liff.isInClient() && liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      cachedUserId = profile.userId;
      initialized = true;
      console.info('[LIFF] Real mode in LINE app. UserID:', cachedUserId);
      return;
    }
    // นอกแอป LINE หรือยังไม่ login → ไม่เรียก liff.login() (กัน redirect loop)
    // ใช้ mock user แทน เพื่อให้ทดสอบใน browser ปกติได้
    cachedUserId = getOrCreateMockUserId();
    initialized = true;
    console.info('[LIFF] External browser, using MOCK. UserID:', cachedUserId);
  } catch (err) {
    console.error('[LIFF] init failed, fallback to mock:', err);
    cachedUserId = getOrCreateMockUserId();
    initialized = true;
  }
}

/** SHA-256 hash ของ userId (ปกป้อง privacy) */
export async function getUserIdHash(): Promise<string> {
  if (!cachedUserId) await initLiff();
  if (!cachedUserId) throw new Error('No user ID available');
  return await sha256Hex(cachedUserId);
}

export function getDisplayName(): string {
  if (MOCK_MODE) return 'ผู้ทดสอบ';
  try {
    return liff.isInClient() ? 'ผู้เล่น' : 'ผู้ทดสอบ';
  } catch {
    return 'ผู้เล่น';
  }
}

export function isMockMode(): boolean {
  return MOCK_MODE;
}

/** SHA-256 → hex string (web crypto API) */
export async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
