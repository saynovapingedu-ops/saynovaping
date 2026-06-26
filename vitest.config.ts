import { defineConfig } from 'vitest/config';

// แยก config สำหรับ vitest โดยเฉพาะ — ไม่โหลด @vitejs/plugin-react
// หมายเหตุ: ใช้ vitest@3 (เข้ากับ vite@5 ของแอป) — เลี่ยง vitest@4 ที่ต้องใช้ vite@6+
// เทสในโปรเจกต์นี้เป็น pure TS (ไม่มี JSX) จึงไม่จำเป็นต้องมี react plugin
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    globals: false,
  },
});
