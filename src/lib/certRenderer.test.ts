import { describe, it, expect } from 'vitest';
import { formatThaiDate } from './certRenderer';

describe('certRenderer', () => {
  it('formatThaiDate แปลงวันที่เป็น พ.ศ. และชื่อเดือนภาษาไทยได้ถูกต้อง', () => {
    // 2026-09-03 (พ.ศ. 2569)
    const dateStr = '2026-09-03T10:00:00.000Z';
    const formatted = formatThaiDate(dateStr);
    expect(formatted).toContain('กันยายน');
    expect(formatted).toContain('2569');
  });

  it('formatThaiDate คืนค่าว่างถ้าไม่ส่ง iso string', () => {
    expect(formatThaiDate('')).toBe('');
  });
});
