import type { Scenario } from '../types';

// ด่าน 16 (Expert 1) — นิโคตินกับสมองวัยรุ่น (กลไก dopamine)
export const scenario16: Scenario = {
  id: 16,
  title: 'นิโคตินกับสมองวัยรุ่น',
  subtitle: 'Expert 1 — เข้าใจกลไก dopamine',
  estMinutes: 7,
  startNode: 'd1',
  intro: [
    '🔬 Expert Arc เริ่มแล้ว — เนื้อหาเชิงลึกเรื่องบุหรี่ไฟฟ้า',
    'พี่หมอเก๋ชวนคุณคุยเรื่อง "ทำไมวัยรุ่นติด vape เร็วกว่าผู้ใหญ่ 4 เท่า?"',
    'คำตอบอยู่ที่ "สมอง" ที่ยังโตไม่จบ',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'd1', speaker: 'doctor', next: 'd2',
      text: 'น้องนักสืบ — รู้มั้ยว่าสมองของเราพัฒนาไปจนถึงอายุเท่าไหร่?',
    },
    {
      type: 'choice', id: 'd2', speaker: 'player',
      prompt: 'สมองวัยรุ่นโตเต็มที่เมื่ออายุเท่าไหร่?',
      choices: [
        { label: '18 ปี — ตอนเรียนจบ ม.6', next: 'wrong1', xp: 5,
          reflection: 'ผิด — สมองยังต่อสายไฟ (myelination) ต่อไปจนถึง 25 ปี' },
        { label: '25 ปี — กว่าจะ wiring เสร็จ', next: 'd3', xp: 30 },
        { label: '15 ปี — เร็วๆ', next: 'wrong2', xp: 0,
          reflection: 'ผิดมาก — 15 ปีคือช่วงที่เปราะบางที่สุดต่อสารเสพติด' },
      ],
    },
    {
      type: 'feedback', id: 'wrong1', next: 'd2',
      title: 'ใกล้แล้ว — แต่ยังไม่ใช่',
      body: 'สมองมี 2 ส่วนสำคัญ — ระบบ reward (โตเร็ว ~14 ปี) กับ ระบบควบคุมตัวเอง prefrontal (โตช้า ~25 ปี) ความไม่สมดุลนี้แหละทำให้วัยรุ่นเสี่ยงเสพติด',
      source: 'NIDA — Adolescent Brain Development',
    },
    {
      type: 'feedback', id: 'wrong2', next: 'd2',
      title: 'น้อยเกินไป',
      body: 'แม้จะรู้สึกว่า "โตเป็นวัยรุ่น = คิดได้แล้ว" แต่ส่วน prefrontal cortex (ที่ตัดสินใจ) ยังพัฒนาต่ออีก 10 ปี',
      source: 'Harvard Medical School — The Adolescent Brain',
    },
    {
      type: 'dialogue', id: 'd3', speaker: 'doctor', next: 'd4',
      text: 'ถูกต้อง! แล้ว "นิโคติน" ไปทำอะไรกับสมองวัยรุ่นบ้าง?',
    },
    {
      type: 'choice', id: 'd4', speaker: 'player',
      prompt: 'นิโคติน + สมองวัยรุ่น = ?',
      choices: [
        { label: 'กระตุ้น dopamine → สมองเรียนรู้ว่า "นิโคติน = ความสุข"',
          next: 'd5', xp: 30 },
        { label: 'ทำให้ฉลาดขึ้น — กระตุ้นสมอง',
          next: 'wrong3', xp: 0,
          reflection: 'ตรงข้าม — นิโคตินลด IQ ในวัยรุ่นและสมาธิตก',
          source: 'Pediatrics 2020 — Nicotine & Cognitive Development' },
        { label: 'ไม่มีผลอะไรในระยะสั้น',
          next: 'wrong3', xp: 0,
          reflection: 'แค่ครั้งเดียวก็มีผล — สมองสร้าง receptor ใหม่ทันที' },
      ],
    },
    {
      type: 'feedback', id: 'wrong3', next: 'd4',
      title: 'ลองอีกครั้ง',
      body: 'นิโคติน hijack ระบบ reward — ทำให้สมองเรียกหา dopamine จากนิโคตินแทนกิจกรรมปกติ (อาหาร เพื่อน เรียน) นี่คือต้นกำเนิดการเสพติด',
      source: 'NIDA — Tobacco, Nicotine, and E-Cigarettes Research Report',
    },
    {
      type: 'dialogue', id: 'd5', speaker: 'doctor', next: 'mg1',
      text: 'เก่งมาก! ลองมาดูกัน — เหตุการณ์ไหนเกิดในสมองตามลำดับ',
    },
    {
      type: 'minigame', id: 'mg1', game: 'order-cards',
      title: 'ลำดับการติดนิโคติน',
      cards: [
        { id: 'c1', text: 'สูบบุหรี่ไฟฟ้าครั้งแรก — นิโคตินเข้าสมองใน 7 วินาที' },
        { id: 'c2', text: 'สมองหลั่ง dopamine — รู้สึกดี ผ่อนคลาย' },
        { id: 'c3', text: 'สมองสร้าง nicotine receptor ใหม่ — ต้องการมากขึ้น' },
        { id: 'c4', text: 'เมื่อไม่ได้สูบ — หงุดหงิด สมาธิหลุด (withdrawal)' },
        { id: 'c5', text: 'สมองวัยรุ่นเสีย wiring ถาวร — เสี่ยงติดสารอื่นๆ ตาม' },
      ],
      correctOrder: ['c1', 'c2', 'c3', 'c4', 'c5'],
      next: 'feedback1',
      xpOnSuccess: 100,
      badge: 'expert-1-clear',
      source: 'NIDA Research Report — Tobacco, Nicotine, and E-Cigarettes (2023)',
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'บันทึกนักสืบ 📓',
      body: 'งานวิจัยพบว่าวัยรุ่นที่เริ่มสูบนิโคติน มีโอกาสติดสารอื่นในอนาคต (เหล้า กัญชา) สูงขึ้น 3-4 เท่า เพราะสมอง "เรียนรู้" pattern การเสพติด ข่าวดีคือ — ถ้าเลิกได้ภายใน 6 เดือน สมองยังซ่อมตัวเองได้',
      source: 'U.S. Surgeon General Report 2023 / NIDA Adolescent Brain Atlas',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'd-end',
      fact: 'นิโคตินใน vape 1 พอตเท่ากับบุหรี่ 1 ซอง (20 มวน) — และเข้าสมองเร็วกว่าบุหรี่ปกติ เพราะไอร้อนทำให้ดูดซึมเร็ว',
      source: 'Truth Initiative / FDA Vape Nicotine Content Analysis 2023',
    },
    {
      type: 'dialogue', id: 'd-end', speaker: 'doctor', next: 'end1',
      text: 'ตอนนี้น้องเข้าใจ "ทำไมต้องห้าม vape ในวัยรุ่น" แล้ว — ไม่ใช่เพราะผู้ใหญ่ขี้บ่น แต่เป็นเพราะวิทยาศาสตร์',
    },
    {
      type: 'end', id: 'end1',
      title: '🧠 Expert 1 ผ่าน!',
      message: 'คุณเข้าใจกลไก dopamine + การติดนิโคตินในสมองวัยรุ่นแล้ว',
      xp: 90,
      badge: 'expert-1-clear',
    },
  ],
  references: [
    'NIDA — Tobacco, Nicotine, and E-Cigarettes Research Report (2023)',
    'U.S. Surgeon General Report — Youth & Tobacco (2016, updated 2023)',
    'Harvard Medical School — The Adolescent Brain',
    'Nature Neuroscience — Adolescent Nicotine Exposure (2021)',
  ],
};
