# Backend — เพิ่ม Leaderboard (กระดานอันดับ)

ฟีเจอร์ Leaderboard ในแอพต้องให้ Apps Script backend (ตัวเดียวกับที่ sync คะแนน/ออก Certificate)
คืน "ข้อมูลผู้เล่นคนอื่น" กลับมา — จึงต้องเพิ่ม endpoint `action=leaderboard` ที่ฝั่ง Google Sheet

> หน้าเว็บออกแบบให้ทำงานได้ก่อนทำขั้นตอนนี้ (จะโชว์ "กำลังเปิดเร็ว ๆ นี้" + การ์ดของผู้เล่นเอง)
> เมื่อติดตั้ง backend เสร็จ อันดับจริงจะปรากฏทันที

## ติดตั้ง — เลือก 1 ทาง

**ทาง A (ง่ายสุด):** เปิด Google Sheet → **Extensions → Apps Script** → เปิดไฟล์ `Code.gs`
แล้ว **แทนทั้งไฟล์** ด้วยเนื้อหาจาก [`Code.gs`](./Code.gs) (เป็นโค้ดเดิมของคุณ + leaderboard รวมแล้ว, version 1.1.0)

**ทาง B (เพิ่มเฉพาะส่วน):**
1. วางฟังก์ชัน `handleLeaderboard_` จาก [`leaderboard.gs`](./leaderboard.gs) ต่อท้าย `Code.gs` เดิม
2. เพิ่ม 1 บรรทัดใน `doGet(e)` (ก่อน `if (action === 'ping')`):
   ```js
   if (action === 'leaderboard') return handleLeaderboard_(e.parameter);
   ```

จากนั้น **Deploy → Manage deployments → (ดินสอ) Edit → Version: New version → Deploy**
(ต้องออกเวอร์ชันใหม่ ไม่งั้น URL เดิมจะยังเป็นโค้ดเก่า)

## ทดสอบเร็ว

เปิด URL นี้ใน browser (แทน `<SYNC_URL>` ด้วยค่าใน `.env` → `VITE_SYNC_URL`):

```
<SYNC_URL>?action=leaderboard&limit=10
```

ควรได้ JSON ประมาณ (สังเกตว่าแถวคนอื่น **ไม่มี** `nickname`):

```json
{
  "ok": true,
  "scope": "all",
  "groupLabel": "ผู้เล่นทั้งหมด",
  "total": 12,
  "entries": [
    { "rank": 1, "totalXP": 640, "stagesCount": 8, "isMe": false },
    { "rank": 2, "totalXP": 540, "stagesCount": 7, "isMe": false }
  ],
  "me": null
}
```

ถ้าได้ `{"ok":false,"error":"unknown_action"}` แปลว่ายังไม่ได้ deploy เวอร์ชันใหม่ (หรือยังไม่เพิ่ม route)

## สัญญา (contract) frontend ↔ backend

Frontend เรียก (ดู [`src/lib/cloudSync.ts`](../src/lib/cloudSync.ts) → `fetchLeaderboard`):

```
GET <SYNC_URL>?action=leaderboard&hash=<userIdHash>&limit=<n>
```

เป็น **กระดานรวมทั้งหมด** (ไม่แยกห้อง/โรงเรียน) — `hash` ใช้เพื่อทำเครื่องหมายแถวของผู้เล่นเอง (`isMe`)
และคืนอันดับของตัวเอง (`me`) เผื่อหลุดนอก top N

ต้องตอบ `ok:true` พร้อม array `entries` (ถ้าไม่มี field นี้ frontend จะถือว่า backend ยังไม่รองรับ
แล้วแสดง state "กำลังเปิดเร็ว ๆ นี้" แทน)

### 🔒 ความเป็นส่วนตัว (PDPA)

- ส่งกลับเฉพาะ **ลำดับ + คะแนนรวม** ของผู้เล่นแต่ละคน
- **ไม่ส่งชื่อเล่นของผู้เล่นคนอื่น** — `nickname` มีเฉพาะแถวที่ `isMe: true` (ของผู้เล่นเอง)
- ไม่ส่ง `userIdHash`, ชื่อจริง, ชั้นเรียน, หรือชื่อโรงเรียน ออกไปยัง client เลย
