import { describe, it, expect } from 'vitest';
import { shuffle, shuffleChoices } from './shuffle';

describe('shuffle', () => {
  it('คืน permutation (สมาชิกครบเท่าเดิม)', () => {
    const arr = [1, 2, 3, 4, 5];
    const out = shuffle(arr);
    expect(out).toHaveLength(arr.length);
    expect([...out].sort()).toEqual([...arr].sort());
  });

  it('ไม่แก้ array เดิม (immutable)', () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffle(arr);
    expect(arr).toEqual(copy);
  });
});

describe('shuffleChoices', () => {
  it('correctIndex ยังชี้ที่คำตอบถูกเดิมเสมอ (กันคำตอบเพี้ยน)', () => {
    const q = { choices: ['ก', 'ข', 'ค', 'ง'], correctIndex: 0 };
    for (let i = 0; i < 300; i++) {
      const s = shuffleChoices(q);
      expect(s.choices[s.correctIndex]).toBe('ก');
      expect([...s.choices].sort()).toEqual([...q.choices].sort());
    }
  });

  it('ย้ายคำตอบถูกออกจากข้อ ก. ได้จริง (ไม่ใช่ "ตอบ ก. เสมอ")', () => {
    const q = { choices: ['ก', 'ข', 'ค', 'ง'], correctIndex: 0 };
    let moved = false;
    for (let i = 0; i < 300; i++) {
      if (shuffleChoices(q).correctIndex !== 0) { moved = true; break; }
    }
    expect(moved).toBe(true);
  });

  it('ทำงานกับ 3 ตัวเลือก (เพราะ bank มีหลายข้อแค่ 3 ตัวเลือก)', () => {
    const q = { choices: ['A', 'B', 'C'], correctIndex: 0 };
    for (let i = 0; i < 50; i++) {
      const s = shuffleChoices(q);
      expect(s.choices).toHaveLength(3);
      expect(s.choices[s.correctIndex]).toBe('A');
    }
  });

  it('การกระจายตำแหน่งคำตอบถูก "สมเหตุสมผล" (ทุกตำแหน่งโดนเลือกอย่างน้อยครั้งหนึ่งใน 1000 รอบ)', () => {
    const q = { choices: ['A', 'B', 'C', 'D'], correctIndex: 0 };
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      seen.add(shuffleChoices(q).correctIndex);
      if (seen.size === 4) break;
    }
    expect(seen.size).toBe(4);
  });
});
