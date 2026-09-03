// ============================================================================
//  LIFF wrapper — รองรับ mock mode สำหรับทดสอบใน browser ปกติ
// ============================================================================

import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID as string;
const MOCK_MODE = import.meta.env.VITE_MOCK_LIFF === 'true';

const MOCK_USER_KEY = 'hd_mock_user_id';

let initialized = false;
let cachedUserId: string | null = null;
let cachedDisplayName: string | null = null;
let cachedPictureUrl: string | null = null;

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
    cachedDisplayName = 'ผู้เล่นทดสอบ';
    initialized = true;
    console.info('[LIFF] Forced MOCK mode. UserID:', cachedUserId);
    return;
  }
  try {
    await liff.init({ liffId: LIFF_ID, withLoginOnExternalBrowser: false });
    if (liff.isLoggedIn()) {
      try {
        const profile = await liff.getProfile();
        cachedUserId = profile.userId;
        cachedDisplayName = profile.displayName;
        cachedPictureUrl = profile.pictureUrl || null;
        initialized = true;
        console.info('[LIFF] Real mode in LINE app. UserID:', cachedUserId, 'Name:', cachedDisplayName);
        return;
      } catch (profErr) {
        console.warn('[LIFF] getProfile failed during init:', profErr);
      }
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

/** ดึงข้อมูล LINE Profile ของผู้ใช้ (ชื่อที่แสดงใน LINE) */
export async function getLineProfile(): Promise<{ userId?: string; displayName?: string; pictureUrl?: string } | null> {
  if (!initialized) await initLiff();
  if (cachedDisplayName) {
    return {
      userId: cachedUserId || undefined,
      displayName: cachedDisplayName,
      pictureUrl: cachedPictureUrl || undefined,
    };
  }
  try {
    if (liff.isLoggedIn && liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      cachedDisplayName = profile.displayName;
      cachedUserId = profile.userId;
      cachedPictureUrl = profile.pictureUrl || null;
      return {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
      };
    }
  } catch (e) {
    console.warn('[LIFF] getProfile failed:', e);
  }
  return null;
}

export function getDisplayName(): string {
  if (cachedDisplayName) return cachedDisplayName;
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

/**
 * แชร์คำท้าไปยังเพื่อน — ลอง LINE shareTargetPicker ก่อน
 * (ต้องเปิดสิทธิ์ใน LINE Developers console) แล้ว fallback เป็น Web Share / คัดลอกลิงก์
 * คืน true ถ้าแชร์/คัดลอกสำเร็จ
 */
export async function shareChallenge(text: string, url: string): Promise<boolean> {
  const message = `${text}\n${url}`;
  // 1) LINE shareTargetPicker (เฉพาะในแอป LINE + เปิดสิทธิ์แล้ว)
  try {
    if (!MOCK_MODE && liff.isApiAvailable && liff.isApiAvailable('shareTargetPicker')) {
      const res = await liff.shareTargetPicker([{ type: 'text', text: message }]);
      // res เป็น undefined ถ้าผู้ใช้ปิด picker — ถือว่าไม่ได้แชร์
      return !!res;
    }
  } catch (e) {
    console.warn('[LIFF] shareTargetPicker failed, fallback:', e);
  }
  // 2) Web Share API (มือถือทั่วไป)
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ text, url });
      return true;
    }
  } catch { /* ผู้ใช้ยกเลิก */ }
  // 3) คัดลอกลิงก์ลงคลิปบอร์ด
  try {
    await navigator.clipboard.writeText(message);
    return true;
  } catch {
    return false;
  }
}

/** ตรวจสอบว่ากำลังเปิดอยู่ในแอป LINE หรือไม่ */
export function isInLineBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Line/i.test(navigator.userAgent);
}

/**
 * เปิดหน้าเว็บในเบราว์เซอร์ภายนอก (เช่น Google Chrome บน Android / Safari บน iOS)
 * เพื่อให้สามารถดาวน์โหลดไฟล์รูปภาพลงเครื่องได้ 100% (LINE In-App Browser บล็อกการดาวน์โหลด)
 */
export function openInExternalBrowser(targetUrl?: string): void {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const url = targetUrl || currentUrl;
  try {
    if (!MOCK_MODE && liff.isInClient && liff.isInClient()) {
      liff.openWindow({
        url,
        external: true,
      });
      return;
    }
  } catch (err) {
    console.warn('[LIFF] openWindow failed, fallback to url param:', err);
  }

  // Fallback สำหรับ LINE In-App Browser ทั่วไป: ต่อท้ายด้วย openExternalBrowser=1
  if (typeof window !== 'undefined' && url) {
    const sep = url.includes('?') ? '&' : '?';
    window.location.href = `${url}${sep}openExternalBrowser=1`;
  }
}

/**
 * แชร์เกียรติบัตรผ่าน LINE LIFF shareTargetPicker หรือ Web Share
 */
export async function shareCertificateViaLiff(
  displayName: string,
  certNo: string,
  verifyUrl: string
): Promise<{ success: boolean; method: 'liff' | 'share' | 'clipboard' }> {
  const altText = `🏆 ประกาศนียบัตร: ${displayName} ผ่านการอบรมหลักสูตรนักสืบสู้บุหรี่ไฟฟ้า (เลขที่ ${certNo})`;

  // 1. ถ้าอยู่ใน LINE และเปิดสิทธิ์ shareTargetPicker ไว้: ส่งเป็นการ์ด Flex Message สวยงาม
  if (!MOCK_MODE && liff.isApiAvailable && liff.isApiAvailable('shareTargetPicker')) {
    try {
      const flexMessage: any = {
        type: 'flex',
        altText,
        contents: {
          type: 'bubble',
          size: 'mega',
          header: {
            type: 'box',
            layout: 'vertical',
            backgroundColor: '#003C73',
            paddingAll: '15px',
            contents: [
              {
                type: 'text',
                text: '🏆 ประกาศนียบัตรผู้ผ่านการอบรม',
                weight: 'bold',
                color: '#F59E0B',
                size: 'sm',
              },
              {
                type: 'text',
                text: 'โครงการ SayNo สู้บุหรี่ไฟฟ้า',
                weight: 'bold',
                color: '#FFFFFF',
                size: 'lg',
                margin: 'sm',
              },
            ],
          },
          body: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '15px',
            spacing: 'md',
            contents: [
              {
                type: 'text',
                text: 'ขอมอบเกียรติบัตรนี้ให้แก่',
                color: '#64748B',
                size: 'xs',
              },
              {
                type: 'text',
                text: displayName,
                weight: 'bold',
                color: '#003C73',
                size: 'xl',
                wrap: true,
              },
              {
                type: 'text',
                text: 'หลักสูตรการเรียนรู้ทักษะปฏิเสธ และรู้เท่าทันภัยจากบุหรี่ไฟฟ้า สำหรับเยาวชน',
                color: '#334155',
                size: 'xs',
                wrap: true,
              },
              {
                type: 'separator',
                margin: 'md',
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'เลขที่เกียรติบัตร:',
                    color: '#94A3B8',
                    size: 'xxs',
                  },
                  {
                    type: 'text',
                    text: certNo,
                    color: '#64748B',
                    size: 'xxs',
                    align: 'end',
                    weight: 'bold',
                  },
                ],
              },
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            paddingAll: '12px',
            contents: [
              {
                type: 'button',
                style: 'primary',
                color: '#0284C7',
                height: 'sm',
                action: {
                  type: 'uri',
                  label: '🔍 ตรวจสอบเกียรติบัตร',
                  uri: verifyUrl || 'https://saynovapingedu-ops.github.io/saynovaping/',
                },
              },
            ],
          },
        },
      };

      const res = await liff.shareTargetPicker([flexMessage]);
      if (res) return { success: true, method: 'liff' };
    } catch (err) {
      console.warn('[LIFF] shareTargetPicker flex failed, trying text:', err);
      try {
        const textMsg = `🏆 ประกาศนียบัตรหลักสูตร "นักสืบสู้บุหรี่ไฟฟ้า"\n👤 ผู้ได้รับ: ${displayName}\n📜 เลขที่: ${certNo}\n🔍 ตรวจสอบ: ${verifyUrl}`;
        const res = await liff.shareTargetPicker([{ type: 'text', text: textMsg }]);
        if (res) return { success: true, method: 'liff' };
      } catch (textErr) {
        console.warn('[LIFF] shareTargetPicker text failed:', textErr);
      }
    }
  }

  // 2. Web Share API (มือถือทั่วไป)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'ประกาศนียบัตร',
        text: altText,
        url: verifyUrl,
      });
      return { success: true, method: 'share' };
    } catch {
      // User cancelled
    }
  }

  // 3. Fallback คัดลอกคลิปบอร์ด
  try {
    const copyText = `🏆 ประกาศนียบัตรหลักสูตร "นักสืบสู้บุหรี่ไฟฟ้า"\nผู้ได้รับ: ${displayName}\nเลขที่: ${certNo}\nตรวจสอบได้ที่: ${verifyUrl}`;
    await navigator.clipboard.writeText(copyText);
    return { success: true, method: 'clipboard' };
  } catch {
    return { success: false, method: 'clipboard' };
  }
}

/** SHA-256 → hex string (web crypto API) */
export async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
