import { describe, it, expect } from 'vitest';
import { encodeName, decodeName } from './certName';

describe('certName (obfuscation สำหรับชื่อจริงบนเกียรติบัตร)', () => {
  it('roundtrip ภาษาไทยได้ถูกต้อง', () => {
    const name = 'ธรรมรักษ์ คุณภาพ';
    expect(decodeName(encodeName(name))).toBe(name);
  });

  it('roundtrip ภาษาอังกฤษได้ถูกต้อง', () => {
    const name = 'John Smith';
    expect(decodeName(encodeName(name))).toBe(name);
  });

  it('roundtrip ผสมไทย-อังกฤษ-อีโมจิได้ถูกต้อง', () => {
    const name = 'น้องนัท Nut 🎓 #1';
    expect(decodeName(encodeName(name))).toBe(name);
  });

  it('string ว่าง → คืนค่าว่าง', () => {
    expect(encodeName('')).toBe('');
    expect(decodeName('')).toBe('');
  });

  it('cipher ผิดรูป → ไม่ throw, คืนสตริง (อาจเพี้ยน) — robust against corruption', () => {
    // ป้องกัน app crash หากค่าใน localStorage โดนแก้
    expect(() => decodeName('not-a-valid-base64-!!!')).not.toThrow();
  });

  it('ciphertext ไม่ใช่ plaintext ตรงๆ (มี obfuscation จริง)', () => {
    const name = 'ธรรมรักษ์';
    const cipher = encodeName(name);
    expect(cipher).not.toBe(name);
    expect(cipher.length).toBeGreaterThan(0);
  });

  it('ชื่อเดียวกันให้ ciphertext เดิมเสมอ (deterministic — สำคัญต่อการ migrate)', () => {
    const name = 'นักเรียน01';
    expect(encodeName(name)).toBe(encodeName(name));
  });
});
