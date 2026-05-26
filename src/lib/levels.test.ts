import { describe, it, expect } from 'vitest';
import { getLevelByXP, getNextLevel, getProgressToNextLevel, LEVELS } from './levels';

describe('getLevelByXP', () => {
  it('0 XP = level 1', () => {
    expect(getLevelByXP(0).level).toBe(1);
  });

  it('XP สูงมาก = level สูงสุด', () => {
    expect(getLevelByXP(999999).level).toBe(LEVELS[LEVELS.length - 1].level);
  });

  it('ตรงกับ minXP ของทุก bracket', () => {
    for (const lv of LEVELS) {
      expect(getLevelByXP(lv.minXP).level).toBe(lv.level);
    }
  });

  it('ต่ำกว่า threshold 1 หน่วยยังอยู่ level เดิม', () => {
    // level 2 minXP = 60 → 59 ต้องยังเป็น level 1
    expect(getLevelByXP(59).level).toBe(1);
  });
});

describe('getNextLevel', () => {
  it('คืน null เมื่ออยู่ level สูงสุด', () => {
    expect(getNextLevel(999999)).toBeNull();
  });

  it('จาก 0 XP เลเวลถัดไปคือ level 2', () => {
    expect(getNextLevel(0)?.level).toBe(2);
  });
});

describe('getProgressToNextLevel', () => {
  it('อยู่ในช่วง [0,1] เสมอ', () => {
    for (const xp of [0, 50, 100, 500, 2000, 99999]) {
      const p = getProgressToNextLevel(xp);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it('= 1 เมื่ออยู่ level สูงสุด', () => {
    expect(getProgressToNextLevel(999999)).toBe(1);
  });

  it('= 0 พอดี เมื่ออยู่ที่ minXP ของ level (ยังไม่ขยับเข้าหา level ถัดไป)', () => {
    // level 2 minXP = 60 → ที่ XP = 60 ความคืบหน้าไปสู่ lvl 3 ควรเป็น 0
    expect(getProgressToNextLevel(60)).toBe(0);
  });

  it('ใกล้ 1 เมื่อ XP เกือบถึง level ถัดไป', () => {
    // ก่อนถึง level 2 (minXP=60) แค่หน่วยเดียว
    expect(getProgressToNextLevel(59)).toBeGreaterThan(0.9);
  });
});

describe('LEVELS data integrity', () => {
  it('level เรียงต่อเนื่อง 1..N โดยไม่มีเลขซ้ำ/ขาด', () => {
    LEVELS.forEach((lv, i) => expect(lv.level).toBe(i + 1));
  });

  it('minXP เรียงจากน้อย→มากเสมอ (strictly increasing) ไม่งั้น getLevelByXP จะเพี้ยน', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].minXP, `lv ${LEVELS[i].level}`).toBeGreaterThan(LEVELS[i - 1].minXP);
    }
  });

  it('ทุก level มี name/emoji/tier (ไม่ว่าง)', () => {
    for (const lv of LEVELS) {
      expect(lv.name.trim().length, `lv ${lv.level}`).toBeGreaterThan(0);
      expect(lv.emoji.length).toBeGreaterThan(0);
      expect(lv.tier.length).toBeGreaterThan(0);
    }
  });
});
