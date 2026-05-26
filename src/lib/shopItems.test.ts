import { describe, it, expect } from 'vitest';
import { SHOP_ITEMS, getShopItem } from './shopItems';

describe('SHOP_ITEMS data integrity', () => {
  it('id ไม่ซ้ำกัน', () => {
    const ids = SHOP_ITEMS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ทุก item มี name/description/emoji + price ≥ 0', () => {
    for (const it of SHOP_ITEMS) {
      expect(it.name.trim().length, it.id).toBeGreaterThan(0);
      expect(it.description.trim().length, it.id).toBeGreaterThan(0);
      expect(it.emoji.length, it.id).toBeGreaterThan(0);
      expect(it.price, it.id).toBeGreaterThanOrEqual(0);
    }
  });

  it('booster ทุกชิ้นต้องระบุ booster.effect', () => {
    for (const it of SHOP_ITEMS.filter(i => i.category === 'booster')) {
      expect(it.booster, it.id).toBeDefined();
      expect(it.booster?.effect, it.id).toMatch(/^(hint-token|coin-x2|streak-shield)$/);
    }
  });

  it('unlockAfterStage ถ้ามีต้องเป็นเลขจำนวนเต็มบวก', () => {
    for (const it of SHOP_ITEMS) {
      if (it.unlockAfterStage !== undefined) {
        expect(Number.isInteger(it.unlockAfterStage), it.id).toBe(true);
        expect(it.unlockAfterStage, it.id).toBeGreaterThan(0);
      }
    }
  });
});

describe('getShopItem', () => {
  it('หาเจอ id ที่มีอยู่', () => {
    const sample = SHOP_ITEMS[0];
    expect(getShopItem(sample.id)?.id).toBe(sample.id);
  });

  it('คืน undefined เมื่อ id ไม่มีในระบบ (ไม่ throw)', () => {
    expect(getShopItem('not-exist-id-xyz')).toBeUndefined();
  });
});
