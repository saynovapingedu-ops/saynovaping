import type { Scenario } from '../types';

// ด่าน 17 (Expert 2) — แชทแปลกใน Discord: ขาย vape ผ่านเกมออนไลน์
export const scenario17: Scenario = {
  id: 17,
  title: 'แชทแปลกใน Discord',
  subtitle: 'บทเจาะลึก 2 — รับมือคนขายในเกมออนไลน์',
  estMinutes: 6,
  basedOnRealEvents: true,
  startNode: 'd1',
  intro: [
    'คุณกำลังเล่นเกมกับเพื่อนใน Discord server',
    'มีคนแปลกหน้าส่ง DM เข้ามาทักทาย — แล้วชวนซื้อ "พ๊อตคูล" ราคาถูก',
    'นักสืบสุขภาพต้องรู้ทันรูปแบบใหม่ของการขาย vape',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'd1', speaker: 'dm-stranger', next: 'd2',
      text: 'เฮ้! เล่นเกมเก่งจังเลย ใช้ปุ่มไหนแอบ? เห็นใน Discord ปะ — มีของเด็ดๆ ใหม่นะ พ๊อตรสองุ่น 250 บาทเอง',
    },
    {
      type: 'dialogue', id: 'd2', speaker: 'narrator', next: 'choice1',
      text: 'สังเกตสิ — เขาเริ่มด้วยคำชม + ทำให้รู้สึกใกล้ชิด แล้วค่อยขายของ นี่คือเทคนิค "grooming" ของคนขายผ่านเกม',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'คุณจะตอบยังไง?',
      choices: [
        { label: 'ไม่ตอบ + block + screenshot รายงานครู',
          next: 'right1', xp: 35 },
        { label: 'ราคาเท่าไหร่บอกหน่อย แค่อยากรู้',
          next: 'wrong1', xp: 0,
          reflection: 'ห้ามตอบเลย — แค่ตอบ "อยากรู้" เขาก็เก็บคุณเป็น lead แล้ว' },
        { label: 'ผมยังเด็ก ไม่ซื้อหรอก',
          next: 'okay1', xp: 10,
          reflection: 'การบอกอายุ = ยืนยันว่าคุณเป็นวัยรุ่น เขาจะตื๊อหนักขึ้น' },
      ],
    },
    {
      type: 'feedback', id: 'wrong1', next: 'choice1',
      title: '⚠️ อย่าตอบ!',
      body: 'คนขายในเกม "ทำรายชื่อ" ผ่านการสนทนา — แค่คุณตอบ 1 ครั้ง เขาก็รู้ว่าคุณ active และจะตื๊อต่อ ถ้ารู้ว่าคุณวัยรุ่นยิ่งดีสำหรับเขา',
      source: 'FBI Online Predators & Gaming Platforms Report 2022',
    },
    {
      type: 'feedback', id: 'okay1', next: 'choice1',
      title: 'ปลอดภัยมั้ย แต่ยังเสี่ยง',
      body: 'การบอกอายุ = ให้ข้อมูลส่วนตัว วัยรุ่นเป็นเป้าหมายอันดับ 1 ของคนขาย — ลองยุทธวิธีอื่น',
    },
    {
      type: 'dialogue', id: 'right1', speaker: 'narrator', next: 'mg1',
      text: '✓ ถูกต้อง! คุณ block + ส่ง screenshot ให้ครูแล้ว — มาดูสัญญาณอันตรายอื่นๆ ที่ควรสังเกตในเกมออนไลน์',
    },
    {
      type: 'minigame', id: 'mg1', game: 'swipe-decide',
      title: 'สัญญาณอันตรายในเกม — ปัดถูก/ผิด',
      swipeCards: [
        {
          text: 'ชื่อบัญชี Discord มี emoji 💨 🍃 🍓',
          isTrue: true,
          reveal: 'จริง — emoji เหล่านี้เป็นรหัสลับสำหรับขาย vape/กัญชา ใน community',
          emoji: '💨',
          source: 'Truth Initiative — Social Media Tobacco Codes 2023',
        },
        {
          text: 'มีคนทักว่า "เห็นน้องเล่นเก่ง อยากเป็นเพื่อน"',
          isTrue: true,
          reveal: 'จริง — pattern ของ grooming เริ่มจากคำชม สร้างความใกล้ชิด',
          emoji: '⚠️',
          source: 'FBI Cyber Tipline — Online Predator Patterns',
        },
        {
          text: 'ส่งลิงก์ Telegram/Line ขายของแบบ "ส่งฟรี"',
          isTrue: true,
          reveal: 'จริง — เลี่ยงระบบ moderate ของแพลตฟอร์ม + เก็บข้อมูลส่วนตัว',
          emoji: '🔗',
          source: 'พ.ร.บ.คอมพิวเตอร์ มาตรา 14',
        },
        {
          text: 'เพื่อนที่รู้จักกันใน รร. ชวนเล่นเกม',
          isTrue: false,
          reveal: 'ไม่อันตราย — เพื่อนจริงที่เจอแบบ in-person ก่อน OK เล่นได้',
          emoji: '👍',
        },
        {
          text: 'บัญชีสร้างมาไม่ถึง 1 สัปดาห์',
          isTrue: true,
          reveal: 'จริง — บัญชีใหม่ + ทักคนแปลกหน้า = สัญญาณหลอกลวง',
          emoji: '🆕',
          source: 'Discord Trust & Safety Report',
        },
        {
          text: 'ทักให้แอด LINE บอกว่ามี "promo เฉพาะวันนี้"',
          isTrue: true,
          reveal: 'จริง — ใช้ scarcity (เร่งให้รีบตัดสินใจ) เพื่อกดดัน',
          emoji: '⏰',
          source: 'Cialdini — Influence: Psychology of Persuasion',
        },
      ],
      next: 'feedback1',
      xpOnSuccess: 100,
      badge: 'expert-2-clear',
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'บันทึกนักสืบ 📓',
      body: 'แพลตฟอร์มเกม (Discord/Roblox/Steam) ทำเรื่องนี้ยาก เพราะ DM เป็น private — โมเดอเรเตอร์ตรวจไม่ได้ ทางที่ดีคือ "อย่าให้คนแปลกหน้าทักถึงคุณ" — ตั้งค่า DM = friends only เป็นค่าเริ่มต้น',
      source: 'Common Sense Media — Discord Safety Guide 2023',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'd-end',
      fact: 'พ.ร.บ.คอมพิวเตอร์ มาตรา 14 — โพสต์/ส่งข้อความขายของผิดกฎหมายผ่านระบบคอมพิวเตอร์ มีโทษจำคุก 5 ปี ปรับ 100,000 บาท',
      source: 'พ.ร.บ.ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ พ.ศ. 2560',
    },
    {
      type: 'dialogue', id: 'd-end', speaker: 'narrator', next: 'end1',
      text: 'คุณรายงานบัญชีให้ครูและ admin server เรียบร้อย — บัญชีถูก ban ไป 1 ตัว ป้องกันน้องอีกหลายคน',
    },
    {
      type: 'end', id: 'end1',
      title: '🎮 Expert 2 ผ่าน!',
      message: 'คุณรู้ทันคนขายในเกม + รายงานได้ถูกวิธี — ทักษะนี้ใช้กับ Roblox/Discord/Steam ก็ได้',
      xp: 90,
      badge: 'expert-2-clear',
    },
  ],
  references: [
    'FBI — Online Predators & Gaming Platforms (2022)',
    'พ.ร.บ.ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ พ.ศ. 2560',
    'Common Sense Media — Discord Safety Guide',
    'Truth Initiative — Social Media Tobacco Marketing (2023)',
  ],
};
