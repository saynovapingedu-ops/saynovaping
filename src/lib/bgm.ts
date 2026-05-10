// ============================================================================
//  BGM — เพลงประกอบ procedural ด้วย Web Audio API
//  (ไม่ต้องโหลดไฟล์เสียง — generate ทุก loop ใน browser)
//
//  ธีม "นักสืบ" — minor key, soft, repetitive จับใจ
// ============================================================================

import { useSettingsStore } from '../store/settingsStore';

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let timerId: number | null = null;
let nextNoteTime = 0;
let stepIndex = 0;

const STEP_SEC = 0.45;        // ความยาวต่อ step (ช้าๆ — bpm ~ 66)
const SCHEDULE_AHEAD = 0.2;    // มอง schedule ไปข้างหน้า 200ms
const LOOKAHEAD_MS = 25;       // poll ทุก 25ms

// เมโลดี้ A minor — รูปแบบนักสืบเรียบๆ ขึ้นลง
// เลข = MIDI note number (A4 = 69)
// null = พัก
const MELODY: (number | null)[] = [
  69, null, 72, 76,   // A C E
  74, null, 72, 69,   // D C A
  67, null, 69, 72,   // G A C
  74, 72, 69, null,   // D C A rest
  // bridge
  76, null, 79, 76,   // E G E
  74, 72, 69, null,   // D C A
  67, 65, 64, 65,     // G F E F
  67, null, null, null,
];

// เบสไลน์ — เดินช้าๆ
const BASS: (number | null)[] = [
  45, null, null, null,  // A2
  45, null, null, null,
  41, null, null, null,  // F2
  41, null, null, null,
  43, null, null, null,  // G2
  43, null, null, null,
  40, null, null, null,  // E2
  40, null, null, null,
];

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function ensureCtx(): boolean {
  if (typeof window === 'undefined') return false;
  if (!ctx) {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      ctx = new Ctx();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.18;       // เริ่มเบาๆ ให้ไม่รบกวน
      masterGain.connect(ctx.destination);
    } catch {
      return false;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return true;
}

// เล่นโน้ตเดี่ยวด้วย oscillator + envelope
function playNote(
  midi: number,
  time: number,
  durSec: number,
  type: OscillatorType,
  peak: number,
) {
  if (!ctx || !masterGain) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(midiToFreq(midi), time);

  // soft attack/release
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(peak, time + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + durSec);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(time);
  osc.stop(time + durSec + 0.05);
}

// scheduler — เรียกซ้ำๆ เพื่อ queue โน้ตล่วงหน้า
function scheduler() {
  if (!ctx) return;
  while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
    const i = stepIndex % MELODY.length;
    const melodyNote = MELODY[i];
    const bassNote = BASS[i];

    if (melodyNote !== null) {
      // โน้ตเมโลดี้ — triangle ใส
      playNote(melodyNote, nextNoteTime, STEP_SEC * 1.4, 'triangle', 0.08);
    }
    if (bassNote !== null) {
      // เบส — sine นุ่ม
      playNote(bassNote, nextNoteTime, STEP_SEC * 3.6, 'sine', 0.10);
    }

    // hi-hat soft accent ทุก 4 step (ใช้ noise สั้นๆ จาก high freq triangle)
    if (i % 4 === 0 && melodyNote !== null) {
      playNote(melodyNote + 24, nextNoteTime, 0.06, 'sine', 0.02);
    }

    nextNoteTime += STEP_SEC;
    stepIndex += 1;
  }
  timerId = window.setTimeout(scheduler, LOOKAHEAD_MS);
}

let started = false;

export function startBgm(): void {
  if (started) return;
  if (!ensureCtx()) return;
  if (!ctx) return;

  const settings = useSettingsStore.getState();
  if (!settings.musicEnabled) return;

  started = true;
  stepIndex = 0;
  nextNoteTime = ctx.currentTime + 0.06;

  // fade-in master gain
  if (masterGain) {
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.6);
  }

  scheduler();
}

export function stopBgm(): void {
  if (!started) return;
  started = false;
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
  // fade-out — แล้วหยุดจริง
  if (ctx && masterGain) {
    const t = ctx.currentTime;
    masterGain.gain.cancelScheduledValues(t);
    masterGain.gain.setValueAtTime(masterGain.gain.value, t);
    masterGain.gain.linearRampToValueAtTime(0.0001, t + 0.4);
  }
}

export function isBgmPlaying(): boolean {
  return started;
}

// auto-pause เมื่อสลับแท็บ — กลับมา play ต่อถ้ายังเปิดอยู่
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (started) stopBgm();
    } else {
      const settings = useSettingsStore.getState();
      if (settings.musicEnabled) startBgm();
    }
  });
}
