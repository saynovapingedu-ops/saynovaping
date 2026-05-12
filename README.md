# 🔍 Health Detective — นักสืบสุขภาพ

เกม chatbot สอนทักษะปฏิเสธบุหรี่ไฟฟ้าสำหรับเยาวชน ม.ต้น

🌐 **เล่นเกม:** https://saynovapingedu-ops.github.io/saynovaping/

## 📦 Stack

- React 18 + Vite + TypeScript
- Tailwind CSS
- Zustand (state) + persist
- React Router v6
- Framer Motion (animation)
- @line/liff
- qrcode

## 🏗 Backend

- Google Apps Script (Web App) — ฟรีตลอด
- Google Sheets (database) — Players / Events / Certificates
- ดู `backend/Code.gs` ใน repo แยก / Apps Script project

## 🧪 Run locally

```bash
npm install
npm run dev
```

เปิด http://localhost:5173 — ใช้ mock mode ทดสอบโดยไม่ต้องมี LINE app

## 🚀 Deploy

push ขึ้น `main` → GitHub Actions auto-build → GitHub Pages

ตั้งค่าที่ Settings → Secrets and variables → Actions → Variables (ไม่ใช่ Secrets):

| Name | Value |
|---|---|
| `VITE_LIFF_ID` | LIFF ID จาก LINE Developers (optional) |
| `VITE_SYNC_URL` | Apps Script Web App URL |
| `VITE_MOCK_LIFF` | `false` ตอน production |

## 📋 Status

**v0.1.0 MVP** — ด่าน 1-2 พร้อมเล่น, ระบบ certificate ทำงานครบ

ด่าน 3-8 จะเพิ่มในรุ่นถัดไป

## 📜 License

โครงการเพื่อการศึกษา ไม่อนุญาตใช้เชิงพาณิชย์
