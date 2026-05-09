// ============================================================================
//  Sound — เสียงประกอบสังเคราะห์ด้วย Web Audio API (ไม่ต้องโหลดไฟล์)
// ============================================================================

import { useSettingsStore } from '../store/settingsStore';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new Ctx();
    } catch {
      return null;
    }
  }
  // user gesture อาจ suspend ctx — resume ก่อนเล่น
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

/** เล่นเสียง envelope ง่ายๆ — freq (Hz), durMs, type, peakGain */
function tone(freq: number, durMs: number, type: OscillatorType = 'sine', peakGain = 0.15) {
  const settings = useSettingsStore.getState();
  if (!settings.soundEnabled) return;
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;

  const now = ctx.currentTime;
  const dur = durMs / 1000;
  // ADSR ง่ายๆ: attack 5ms → decay → release
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peakGain, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur);
}

/** เล่นโน้ตหลายตัวต่อกัน */
function chord(notes: Array<{ freq: number; delayMs: number; durMs: number; type?: OscillatorType; gain?: number }>) {
  notes.forEach(n => {
    setTimeout(() => tone(n.freq, n.durMs, n.type || 'sine', n.gain ?? 0.12), n.delayMs);
  });
}

// ===== Sound effects =====

export const sfx = {
  // คลิกปุ่ม — เสียงสั้น แห้ง
  click() { tone(620, 60, 'square', 0.06); },

  // ตอบถูก — เสียง 2 โน้ตขึ้น
  correct() {
    chord([
      { freq: 660, delayMs: 0,   durMs: 100, type: 'triangle' },
      { freq: 880, delayMs: 80,  durMs: 180, type: 'triangle' },
    ]);
  },

  // ตอบผิด — เสียงต่ำลง
  wrong() {
    chord([
      { freq: 280, delayMs: 0,  durMs: 120, type: 'sawtooth', gain: 0.08 },
      { freq: 200, delayMs: 80, durMs: 180, type: 'sawtooth', gain: 0.08 },
    ]);
  },

  // ได้ XP — กริ๊ง
  xp() {
    chord([
      { freq: 880,  delayMs: 0,   durMs: 80,  type: 'triangle' },
      { freq: 1100, delayMs: 60,  durMs: 80,  type: 'triangle' },
      { freq: 1320, delayMs: 120, durMs: 120, type: 'triangle' },
    ]);
  },

  // ได้ badge — แฟนแฟร์สั้น
  badge() {
    chord([
      { freq: 523, delayMs: 0,   durMs: 100, type: 'square', gain: 0.1 },  // C
      { freq: 659, delayMs: 100, durMs: 100, type: 'square', gain: 0.1 },  // E
      { freq: 784, delayMs: 200, durMs: 200, type: 'square', gain: 0.12 }, // G
      { freq: 1046, delayMs: 350, durMs: 280, type: 'triangle', gain: 0.14 }, // C high
    ]);
  },

  // จบด่าน — แฟนแฟร์ใหญ่
  victory() {
    chord([
      { freq: 523, delayMs: 0,   durMs: 130, type: 'square' },
      { freq: 659, delayMs: 130, durMs: 130, type: 'square' },
      { freq: 784, delayMs: 260, durMs: 130, type: 'square' },
      { freq: 1046,delayMs: 390, durMs: 320, type: 'triangle', gain: 0.16 },
      { freq: 1318,delayMs: 700, durMs: 400, type: 'triangle', gain: 0.14 },
    ]);
  },

  // เลือก choice — เสียง pop
  pick() { tone(440, 50, 'sine', 0.08); },

  // เปิดร้านค้า / ซื้อสำเร็จ
  buy() {
    chord([
      { freq: 700, delayMs: 0,  durMs: 80, type: 'triangle' },
      { freq: 1050, delayMs: 70, durMs: 100, type: 'triangle' },
    ]);
  },
};

/** สั่นมือถือ (ถ้ามีและเปิดอยู่) */
export function vibrate(pattern: number | number[]) {
  const settings = useSettingsStore.getState();
  if (!settings.vibrationEnabled) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch { /* ignore */ }
  }
}
