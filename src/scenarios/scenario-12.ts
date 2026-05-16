import type { Scenario } from '../types';

// ด่าน 12 (Master Final) — นักสืบระดับครู: ส่งต่อความรู้ให้รุ่นน้อง
export const scenario12: Scenario = {
  id: 12,
  title: 'นักสืบระดับครู',
  subtitle: 'Master Final — ส่งต่อทักษะให้นักสืบรุ่นน้อง',
  estMinutes: 10,
  startNode: 'd1',
  intro: [
    '🌟 ด่านสุดท้ายของเส้นทางนักสืบสุขภาพ',
    'ไม่ใช่การปะทะใคร — แต่คือการ "ส่งต่อ"',
    'น้องป.6 ชื่อเอม จะมาเข้าค่าย Health Detective Junior — คุณคือพี่เลี้ยง',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'd1', speaker: 'friend2', next: 'd2',
      text: '(เด็ก ป.6) สวัสดีพี่! หนูชื่อเอม มาเข้าค่ายนักสืบสุขภาพครั้งแรก — พี่จะสอนอะไรหนูบ้างคะ?',
    },
    {
      type: 'dialogue', id: 'd2', speaker: 'narrator', next: 'choice1',
      text: 'เอมตื่นเต้นและไว้ใจคุณ — แต่เธอเล่าว่าในห้องเรียนมีเพื่อนเริ่มลอง vape แล้ว',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'บทเรียนแรกที่จะสอนเอม',
      choices: [
        {
          label: 'เริ่มจากเรื่อง "อย่าเชื่อทุกอย่างในออนไลน์" — ทักษะแยกแยะ',
          next: 'd3', xp: 30,
        },
        {
          label: 'สอนทุกอย่างพร้อมกันเลย จะได้รู้เร็วๆ',
          next: 'okay1', xp: 10,
          reflection: 'การยัดข้อมูลทำให้เด็กล้น — สอนทีละทักษะ ค่อยๆ สร้างฐาน',
        },
      ],
    },
    {
      type: 'feedback', id: 'okay1', next: 'choice1',
      title: 'สอนทีละขั้น',
      body: 'การเรียนรู้ที่ดี = ทีละทักษะ แล้วค่อยต่อยอด — รุ่นน้องจะจำได้ดีกว่าและไม่ท้อ',
    },
    {
      type: 'dialogue', id: 'd3', speaker: 'friend2', next: 'mg-test',
      text: 'หนูชอบบทเรียนนี้! ลองทดสอบหนูสิพี่ — หนูจะแสดงให้พี่ดูว่าหนูเข้าใจ',
    },
    // === Phase 1: ทดสอบนักสืบรุ่นน้อง ===
    {
      type: 'minigame', id: 'mg-test', game: 'spot-the-lie',
      title: 'Phase 1 — ทดสอบเอม: จริงหรือเท็จ',
      claims: [
        {
          text: '"พี่ในโรงเรียนบอกว่าใช้ vape ผ่อนคลาย ไม่อันตราย"',
          isLie: true,
          reveal: 'เท็จ — นิโคตินรบกวนสมองวัยรุ่นที่ยังพัฒนา ทำให้สมาธิลดและเครียดง่ายขึ้น',
          source: 'Surgeon General Report 2023',
        },
        {
          text: '"ใน TikTok บอกว่ามีรสองุ่นไม่มีนิโคติน"',
          isLie: true,
          reveal: 'เท็จ — เกือบทุกยี่ห้อมีนิโคติน แม้จะติดฉลากว่า 0% ก็ตรวจพบในห้องแล็บ',
          source: 'งานวิจัย FDA 2022',
        },
      ],
      next: 'd4',
      xpOnSuccess: 60,
    },
    {
      type: 'dialogue', id: 'd4', speaker: 'friend2', next: 'd5',
      text: 'เย้! หนูตอบถูก — แต่ถ้าเพื่อนหนูยื่นมาตรงๆ ในห้องน้ำ หนูควรทำยังไงคะ?',
    },
    // === Phase 2: เลือกวิธีสอน ===
    {
      type: 'dialogue', id: 'd5', speaker: 'narrator', next: 'choice2',
      text: 'เอมยกสถานการณ์ขึ้นมา — คุณต้องอธิบายให้เธอจำได้',
    },
    {
      type: 'choice', id: 'choice2', speaker: 'player',
      prompt: 'อธิบายสูตรปฏิเสธให้เอมจำง่าย',
      choices: [
        {
          label: 'จำคำว่า "ไม่ → เพราะ → ไปทำอย่างอื่น"',
          next: 'd6', xp: 30,
        },
        {
          label: 'จำให้เป๊ะคำต่อคำตามที่พี่บอก',
          next: 'okay2', xp: 10,
          reflection: 'ท่องจำเป๊ะๆ ใช้ไม่ได้จริง — สอนเป็นโครง 3 คำ ปรับใช้ได้ทุกสถานการณ์',
        },
      ],
    },
    {
      type: 'feedback', id: 'okay2', next: 'choice2',
      title: 'ทักษะ ≠ ท่องจำ',
      body: 'สอนเด็กเป็น "หลักการ" สั้นๆ ที่ปรับใช้ได้ — ดีกว่าให้ท่องประโยคเป๊ะๆ ที่อาจฟังเป็นหุ่นยนต์',
    },
    {
      type: 'dialogue', id: 'd6', speaker: 'friend2', next: 'mg-roleplay',
      text: 'โอเค! ลองให้หนูจับคู่สถานการณ์กับสูตรปฏิเสธที่เหมาะสมนะคะพี่',
    },
    // === Phase 3: word-match สูตรกับสถานการณ์ ===
    {
      type: 'minigame', id: 'mg-roleplay', game: 'word-match',
      title: 'Phase 3 — เอมจับคู่สูตร ↔ สถานการณ์',
      pairs: [
        { left: 'ตื๊อในห้องน้ำ',         right: 'สูตรปฏิเสธ 3 ขั้น' },
        { left: 'รุ่นพี่ลดราคา + ตื๊อต่อ', right: 'Broken Record' },
        { left: 'คนแปลกหน้าใน DM',     right: 'Walk Away (บล็อก/รายงาน)' },
        { left: 'เพื่อนสนิทเครียด ',      right: 'Listen-Validate-Care-Lead' },
        { left: 'เห็นโพสต์โฆษณาแฝง',   right: 'แยกแยะ + รายงาน' },
      ],
      next: 'd7',
      xpOnSuccess: 100,
    },
    {
      type: 'dialogue', id: 'd7', speaker: 'friend2', next: 'mg-final',
      text: 'หนูจำได้หมดแล้ว! ลองอีกข้อสุดท้ายสิ — เพราะหนูอยากจบค่ายอย่างมั่นใจ',
    },
    // === Phase 4: fill-blank ปิดท้าย ===
    {
      type: 'minigame', id: 'mg-final', game: 'fill-blank',
      title: 'Phase 4 — บทเรียนสุดท้ายของอาจารย์',
      questions: [
        {
          sentence: 'นักสืบสุขภาพคนเก่ง = แยกข้อมูล + ปฏิเสธ + ___ + ส่งต่อ',
          options: ['ช่วยเพื่อน', 'แค่หลบเอง'],
          correctIndex: 0,
          reveal: 'การช่วยเพื่อนคือหัวใจ — นักสืบที่เก่งคนเดียวไม่พอ ต้องสร้างเครือข่าย',
        },
        {
          sentence: 'การส่งต่อความรู้ ทำให้เกิด ___ ของนักสืบรุ่นใหม่',
          options: ['ห่วงโซ่ปกป้อง', 'การแข่งขัน'],
          correctIndex: 0,
          reveal: 'ห่วงโซ่ปกป้อง = แต่ละรุ่นสอนรุ่นต่อไป สังคมแข็งแรงขึ้นทีละรุ่น',
        },
        {
          sentence: 'เมื่อรุ่นน้องผิดพลาด — สอนด้วย ___ ไม่ใช่ตำหนิ',
          options: ['ความเข้าใจ', 'การลงโทษ'],
          correctIndex: 0,
          reveal: 'ครูที่ดีสอนด้วยความเข้าใจ — เด็กเรียนรู้จากความรู้สึกปลอดภัย',
        },
      ],
      next: 'd8',
      xpOnSuccess: 120,
      badge: 'sensei',
    },
    {
      type: 'dialogue', id: 'd8', speaker: 'friend2', next: 'choice3',
      text: 'ขอบคุณพี่มากๆ! หนูจะเป็นนักสืบสุขภาพคนต่อไป และส่งต่อให้รุ่นน้องเหมือนที่พี่ทำกับหนู',
    },
    {
      type: 'choice', id: 'choice3', speaker: 'player',
      prompt: 'คำพูดสุดท้ายให้เอม',
      choices: [
        {
          label: 'อย่าลืมว่าเธอไม่ได้สู้คนเดียว — เครือข่ายของเรามีอยู่ทุกที่',
          next: 'd-final', xp: 50, badge: 'mentor',
        },
        {
          label: 'อย่าทำพลาดนะ',
          next: 'okay3', xp: 15,
          reflection: 'คำเตือนสร้างความกลัว — คำให้กำลังใจสร้างพลัง',
        },
      ],
    },
    {
      type: 'feedback', id: 'okay3', next: 'choice3',
      title: 'ปิดท้ายด้วยพลัง',
      body: 'นักสืบรุ่นน้องต้องการ "พลัง" ไม่ใช่ "ความกลัว" — ส่งคำให้กำลังใจให้เธอ',
    },
    {
      type: 'dialogue', id: 'd-final', speaker: 'narrator', next: 'feedback1',
      text: 'เอมยิ้มสว่าง — เธอกลายเป็นนักสืบสุขภาพรุ่นใหม่ พร้อมปกป้องเพื่อนป.6 ในห้องของเธอ',
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'Detective\'s Final Note 📓',
      body: 'นักสืบสุขภาพระดับครู ไม่ได้เก่งเพราะรู้มาก — แต่เก่งเพราะ "ส่งต่อ" ความรู้ให้รุ่นถัดไปได้',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'end1',
      fact: 'แนวคิด Peer Education พบว่ามีประสิทธิผลในการลดสารเสพติดในวัยรุ่นไทย — รุ่นพี่สอนรุ่นน้อง ลด vape ได้ 45% ในกลุ่มทดลอง',
      source: 'งานวิจัย ม.มหิดล + สสส. 2566',
    },
    {
      type: 'end', id: 'end1',
      title: '🎓✨ ตำนานนักสืบสุขภาพ',
      message: 'คุณคือ Sensei แล้ว — ห่วงโซ่ปกป้องเริ่มต้นจากคุณ และจะดำเนินต่อไปอีกหลายรุ่น',
      xp: 250,
      badge: 'sensei',
    },
  ],
  references: [
    'Surgeon General Report on E-cigarette Use Among Youth 2023',
    'งานวิจัย FDA 2022 — Nicotine Content in 0% Labeled Vape Products',
    'งานวิจัย ม.มหิดล + สสส. 2566 — Peer Education Effectiveness',
    'WHO — Adolescent Health Programmes',
  ],
};
