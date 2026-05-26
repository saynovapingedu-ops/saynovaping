import { describe, it, expect } from 'vitest';
import {
  QUIZ_BANK,
  getDailyQuestions,
  getExamQuestions,
  getAssessmentQuestions,
} from './quizBank';

describe('QUIZ_BANK ความถูกต้องของข้อมูล', () => {
  it('ทุกข้อมีตัวเลือก/correctIndex ที่ถูกต้อง + มีเฉลย + มีแหล่งอ้างอิง', () => {
    for (const q of QUIZ_BANK) {
      expect(q.choices.length).toBeGreaterThanOrEqual(2);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.choices.length);
      expect(q.explain.trim().length).toBeGreaterThan(0);
      expect(q.source.trim().length).toBeGreaterThan(0);
    }
  });

  it('id ไม่ซ้ำกัน', () => {
    const ids = QUIZ_BANK.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getDailyQuestions', () => {
  it('ผลคงที่เมื่อ seed (วันที่) เดียวกัน', () => {
    const a = getDailyQuestions('2026-05-25', 5).map(q => q.id);
    const b = getDailyQuestions('2026-05-25', 5).map(q => q.id);
    expect(a).toEqual(b);
  });

  it('คืนจำนวนข้อตามที่ขอ', () => {
    expect(getDailyQuestions('2026-05-25', 5)).toHaveLength(5);
  });
});

describe('getAssessmentQuestions', () => {
  it('คืนชุดเดิมทุกครั้ง (เทียบ pre/post ยุติธรรม)', () => {
    const a = getAssessmentQuestions(10).map(q => q.id);
    const b = getAssessmentQuestions(10).map(q => q.id);
    expect(a).toEqual(b);
    expect(a).toHaveLength(10);
  });
});

describe('getExamQuestions', () => {
  it('คืนจำนวนข้อตามที่ขอ', () => {
    expect(getExamQuestions(15)).toHaveLength(15);
  });

  it('สองครั้งติดควรได้ลำดับ "ไม่เหมือนกัน" (สุ่มใหม่จริง — เล่นซ้ำได้)', () => {
    // ใช้ขนาดเต็ม bank ทั้งสองครั้ง แล้วเช็คว่าลำดับต่างกันอย่างน้อย 1 ตำแหน่ง
    const all = QUIZ_BANK.length;
    const a = getExamQuestions(all).map(q => q.id);
    const b = getExamQuestions(all).map(q => q.id);
    // ทั้งสองครั้งต้องเป็น permutation ของ bank
    expect([...a].sort()).toEqual([...b].sort());
    // แต่ลำดับควรต่างกัน — ความน่าจะเป็นเจอลำดับเดิมเป๊ะคือ 1/n! ≈ 0
    expect(a).not.toEqual(b);
  });
});

describe('QUIZ_BANK นโยบายและ structure (สำคัญต่อความถูกต้องของวิจัย)', () => {
  it('ทุกข้อ correctIndex = 0 (ตามนโยบาย — สลับ runtime เท่านั้น ดู memory: answer-shuffle)', () => {
    for (const q of QUIZ_BANK) {
      expect(q.correctIndex, `q.id=${q.id}`).toBe(0);
    }
  });

  it('arc ทุกข้อต้องเป็นค่า hero/master/pro/expert', () => {
    const valid = new Set(['hero', 'master', 'pro', 'expert']);
    for (const q of QUIZ_BANK) {
      expect(valid.has(q.arc), `q.id=${q.id} arc=${q.arc}`).toBe(true);
    }
  });

  it('มีข้ออย่างน้อย 10 ข้อ (รองรับ Assessment ขนาด 10)', () => {
    expect(QUIZ_BANK.length).toBeGreaterThanOrEqual(10);
  });

  it('มี hero หลายข้อ + expert หลายข้อ (กระจายระดับ ไม่กระจุกระดับเดียว)', () => {
    const byArc = QUIZ_BANK.reduce<Record<string, number>>((acc, q) => {
      acc[q.arc] = (acc[q.arc] || 0) + 1; return acc;
    }, {});
    expect(byArc.hero || 0).toBeGreaterThan(0);
    expect(byArc.expert || 0).toBeGreaterThan(0);
  });

  it('ทุก choice ไม่ใช่สตริงว่าง', () => {
    for (const q of QUIZ_BANK) {
      for (const c of q.choices) {
        expect(c.trim().length, `q.id=${q.id}`).toBeGreaterThan(0);
      }
    }
  });

  it('ทุก choice ในข้อเดียวกันต้องไม่ซ้ำกัน (กันตอบถูกหลายข้อ)', () => {
    for (const q of QUIZ_BANK) {
      const set = new Set(q.choices.map(c => c.trim()));
      expect(set.size, `q.id=${q.id} มี choice ซ้ำ`).toBe(q.choices.length);
    }
  });
});

describe('getDailyQuestions edge cases', () => {
  it('seed คนละวันให้ผลลัพธ์ "ต่างกัน" (ลำดับสลับใหม่)', () => {
    const all = QUIZ_BANK.length;
    const a = getDailyQuestions('2026-05-25', all).map(q => q.id);
    const b = getDailyQuestions('2026-05-26', all).map(q => q.id);
    expect([...a].sort()).toEqual([...b].sort());
    expect(a).not.toEqual(b);
  });

  it('ขอจำนวน 0 ข้อได้ → คืน array ว่าง', () => {
    expect(getDailyQuestions('2026-05-25', 0)).toEqual([]);
  });

  it('ขอจำนวนเกินขนาด bank → ไม่ throw, คืนสูงสุดเท่าที่มี', () => {
    const out = getDailyQuestions('2026-05-25', 9999);
    expect(out.length).toBe(QUIZ_BANK.length);
  });
});

describe('getAssessmentQuestions edge cases', () => {
  it('ขอ Assessment 10 ข้อ — ทุกข้อมี id ไม่ซ้ำ', () => {
    const ids = getAssessmentQuestions(10).map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ขอ Assessment ขนาดต่างกันยังคงเป็น "prefix" ของชุดเดียวกัน (seed คงที่)', () => {
    const five = getAssessmentQuestions(5).map(q => q.id);
    const ten  = getAssessmentQuestions(10).map(q => q.id);
    expect(ten.slice(0, 5)).toEqual(five);
  });
});
