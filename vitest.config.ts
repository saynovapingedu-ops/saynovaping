import { defineConfig } from 'vitest/config';

// แยก config สำหรับ vitest โดยเฉพาะ — ไม่โหลด @vitejs/plugin-react
// เพราะ vitest@4 ใช้ vite@8 ภายใน ซึ่งไม่เข้ากับ plugin-react ที่ผูกกับ vite@5 ของแอป
// เทสในโปรเจกต์นี้เป็น pure TS (ไม่มี JSX) จึงไม่จำเป็นต้องมี react plugin
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    globals: false,
  },
});
