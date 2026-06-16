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

if (ttsSupported()) {
  loadVoices();
  // เสียงมักโหลดแบบ async — อัปเดต cache เมื่อพร้อม
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
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

/** Hook: มีเสียงไทยพร้อมใช้ไหม (เผื่อเสียงโหลดช้าหลัง render แรก) */
export function useTtsAvailable(): boolean {
  const [ok, setOk] = useState(() => ttsThaiAvailable());
  useEffect(() => {
    if (!ttsSupported()) return;
    const check = () => setOk(ttsThaiAvailable());
    check();
    window.speechSynthesis.addEventListener?.('voiceschanged', check);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', check);
  }, []);
  return ok;
}
