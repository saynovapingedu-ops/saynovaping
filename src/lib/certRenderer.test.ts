import { describe, it, expect, vi } from 'vitest';
import { formatThaiDate, drawCenteredText, CANVAS_W, CANVAS_H } from './certRenderer';

describe('certRenderer', () => {
  it('formatThaiDate แปลงวันที่เป็น พ.ศ. และชื่อเดือนภาษาไทยได้ถูกต้อง', () => {
    const dateStr = '2026-09-03T10:00:00.000Z';
    const formatted = formatThaiDate(dateStr);
    expect(formatted).toContain('กันยายน');
    expect(formatted).toContain('2569');
  });

  it('formatThaiDate คืนค่าว่างถ้าไม่ส่ง iso string', () => {
    expect(formatThaiDate('')).toBe('');
  });

  it('drawCenteredText คำนวณพิกเซลจัดกึ่งกลางและใช้ textAlign left เสมอเพื่อป้องกันบั๊ก WebKit', () => {
    const fillTextMock = vi.fn();
    const measureTextMock = vi.fn().mockReturnValue({ width: 200 });

    const mockCtx = {
      textAlign: 'center',
      measureText: measureTextMock,
      fillText: fillTextMock,
    } as unknown as CanvasRenderingContext2D;

    drawCenteredText(mockCtx, 'ทดสอบกึ่งกลาง', 420, 200);

    // ต้องเซ็ต textAlign เป็น left เพื่อหลบเลี่ยงบั๊ก Safari
    expect(mockCtx.textAlign).toBe('left');
    // ต้องคำนวณ x = cx - width / 2 = 420 - 100 = 320
    expect(fillTextMock).toHaveBeenCalledWith('ทดสอบกึ่งกลาง', 320, 200);
  });

  it('ขนาด CANVAS_W และ CANVAS_H มีสัดส่วน A4 มาตรฐาน', () => {
    expect(CANVAS_W).toBe(840);
    expect(CANVAS_H).toBe(1188);
  });
});
