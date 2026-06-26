// ============================================================================
//  TTS — อ่านบทสนทนาออกเสียงภาษาไทย (Web Speech API ฟรี ในเบราว์เซอร์)
//  ถ้าเครื่อง/เบราว์เซอร์ไม่มีเสียงไทย ถือว่าใช้ไม่ได้ → ซ่อนปุ่มอ่านออกเสียง
//  หมายเหตุ: เบราว์เซอร์ในแอป LINE/iOS บางรุ่นไม่มีเสียงไทย จึงต้องเช็กก่อนเสมอ
// ============================================================================

import { useEffect, useState } from 'react';

let cachedVoices: SpeechSynthesisVoice[] = [];

export function ttsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  );
}

function loadVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return [];
  const v = window.speechSynthesis.getVoices();
  if (v.length) cachedVoices = v;
  return cachedVoices;
}

// ===== ปลุกระบบเสียง (prime) ตอนผู้ใช้แตะครั้งแรก =====
// Android Chrome บล็อก speechSynthesis.speak() ที่ไม่ได้อยู่ใน user-gesture โดยตรง
// (การพากย์อัตโนมัติยิงจาก useEffect เลยถูกเมินบน Android) — จึงต้อง "ปลุก" 1 ครั้ง
// ด้วย utterance เงียบภายในการแตะแรกของผู้ใช้ หลังจากนั้น speak() จาก effect จะทำงาน
let primed = false;
export function primeTts(): void {
  if (primed || !ttsSupported()) return;
  primed = true;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;          // เงียบ ไม่ให้ผู้ใช้ได้ยินตอนปลุก (แต่ยังนับเป็นการปลดล็อกภายใน gesture)
    window.speechSynthesis.speak(u);
    loadVoices();          // กระตุ้นให้รายชื่อเสียงโหลด (Android มักว่างจนกว่าจะมี gesture)
  } catch { /* ignore */ }
}

if (ttsSupported()) {
  loadVoices();
  // เสียงมักโหลดแบบ async — อัปเดต cache เมื่อพร้อม
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
  // ปลุกระบบเสียงตอนแตะ/คลิกแรกของผู้ใช้ (ครั้งเดียว)
  window.addEventListener('pointerdown', primeTts, { once: true });
  window.addEventListener('keydown', primeTts, { once: true });
}

function thaiVoice(): SpeechSynthesisVoice | null {
  return loadVoices().find(v => v.lang?.toLowerCase().startsWith('th')) || null;
}

/** มีเสียงไทยให้ใช้ไหม — ใช้ตัดสินใจว่าจะโชว์ปุ่มอ่านออกเสียงหรือไม่ */
export function ttsThaiAvailable(): boolean {
  return ttsSupported() && !!thaiVoice();
}

/** อ่านข้อความออกเสียง — หยุดของเดิมก่อนเสมอ */
export function speak(text: string): void {
  if (!ttsSupported() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = thaiVoice();
  if (v) u.voice = v;
  u.lang = v?.lang || 'th-TH';
  u.rate = 0.95;
  u.pitch = 1;
  synth.speak(u);
}

export function stopSpeaking(): void {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

/** Hook: เบราว์เซอร์รองรับการอ่านออกเสียงไหม
 *  หมายเหตุ: ไม่บังคับว่าต้องมี voice ไทยโดยเฉพาะแล้ว — ถ้ามีจะใช้, ถ้าไม่มีจะลองอ่านด้วย lang th-TH
 *  (เครื่องเป้าหมายเป็นมือถือ Android/iOS ที่มีเสียงไทยอยู่แล้ว ปุ่มจะได้ไม่หายไปเฉยๆ บนเครื่องทดสอบ) */
export function useTtsAvailable(): boolean {
  const [ok, setOk] = useState(() => ttsSupported());
  useEffect(() => {
    setOk(ttsSupported());
  }, []);
  return ok;
}
