import type { Scenario } from '../types';

// ด่าน 13 (Pro 1) — ฉลาดเสี่ยง: จัดอันดับความเสี่ยงพฤติกรรม
export const scenario13: Scenario = {
  id: 13,
  title: 'ฉลาดเสี่ยง',
  subtitle: 'เชี่ยวชาญ 1 — รู้จักระดับความเสี่ยง',
  estMinutes: 7,
  startNode: 'd1',
  intro: [
    '🎯 บทเชี่ยวชาญ — ทักษะเสริมของนักสืบระดับสูง',
    'น้องใบเตยมีคำถาม: "พี่ บุหรี่ไฟฟ้ากับบุหรี่ปกติ อันไหนอันตรายกว่ากัน?"',
    'นักสืบสุขภาพต้องตอบได้ — และอธิบายให้น้องเข้าใจ "ระดับ" ของความเสี่ยง',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'd1', speaker: 'baitoey', speakerName: 'น้องใบเตย (ม.1)', next: 'd2',
      text: 'พี่คะ... เพื่อนหนูบอกว่า "บุหรี่ไฟฟ้าปลอดภัยกว่าบุหรี่ปกติตั้งเยอะ" มันจริงไหมคะพี่?',
    },
    {
      type: 'dialogue', id: 'd2', speaker: 'narrator', next: 'choice1',
      text: 'ลองคิดดูดีๆ คำถามนี้ไม่ได้ตอบแค่ "จริง" หรือ "ไม่จริง" ซะทีเดียว — เพราะคำว่า "ปลอดภัยกว่า" ไม่ได้แปลว่า "ปลอดภัย" เลยสักนิด ทุกพฤติกรรมมีความเสี่ยงในระดับที่ต่างกัน',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'ตอบน้องใบเตยอย่างไรดี?',
      choices: [
        {
          label: 'มันไม่ได้มีแค่ ปลอดภัย กับ อันตราย นะ — แต่ความเสี่ยงมันมีหลายระดับ',
          next: 'd3', xp: 30,
        },
        {
          label: 'ใช่ บุหรี่ไฟฟ้าปลอดภัยกว่า เลยลองได้',
          next: 'wrong1', xp: 0,
          reflection: '"ปลอดภัยกว่า" ≠ "ปลอดภัย" — บุหรี่ไฟฟ้าก็มีนิโคติน + โลหะหนัก',
        },
        {
          label: 'อันตรายถึงชีวิตทั้งคู่แหละ อย่าไปยุ่งเลย',
          next: 'okay1', xp: 10,
          reflection: 'จริงในระยะยาว — แต่การพูดให้สุดโต่ง อาจทำให้น้องไม่กล้าปรึกษาต่อ',
        },
      ],
    },
    {
      type: 'feedback', id: 'wrong1', next: 'choice1',
      title: 'ระวังคำว่า "ปลอดภัยกว่า"',
      body: 'อุตสาหกรรมยาสูบใช้คำนี้เพื่อทำให้คนลอง — ความจริงคือทั้งสองอันตราย แค่กลไกต่างกัน',
    },
    {
      type: 'feedback', id: 'okay1', next: 'choice1',
      title: 'ไม่ผิด แต่ยังไม่พอ',
      body: 'การพูด "อันตรายถึงตาย" อาจฟังดูน่ากลัวเกินไป — ลองอธิบายให้เห็นเป็นระดับความเสี่ยง น้องจะเข้าใจเหตุผลได้ดีกว่า',
    },
    {
      type: 'dialogue', id: 'd3', speaker: 'baitoey', speakerName: 'น้องใบเตย (ม.1)', next: 'mg1',
      text: 'น้องใบเตยพยักหน้าเข้าใจ — "งั้นพี่ช่วยสอนหนูดูหน่อยสิคะ ว่าพฤติกรรมแต่ละอย่าง มันเสี่ยงมากน้อยต่างกันยังไงบ้าง?"',
    },
    // มินิเกมหลัก — RiskRank
    {
      type: 'minigame', id: 'mg1', game: 'risk-rank',
      title: 'จัดระดับความเสี่ยง',
      buckets: [
        { id: 'b-low',  level: 'low',     label: '🟢 ความเสี่ยงน้อย' },
        { id: 'b-mid',  level: 'mid',     label: '🟡 เสี่ยงปานกลาง' },
        { id: 'b-high', level: 'high',    label: '🟠 เสี่ยงสูง' },
        { id: 'b-ext',  level: 'extreme', label: '🔴 เสี่ยงสูงมาก' },
      ],
      riskItems: [
        { id: 'i-water',   text: 'ดื่มน้ำเปล่า 2 ลิตรต่อวัน',           bucketId: 'b-low',
          source: 'WHO Hydration Guidelines — Adolescents' },
        { id: 'i-vegoil',  text: 'กินขนมขบเคี้ยวเป็นครั้งคราว',       bucketId: 'b-low',
          source: 'กรมอนามัย กระทรวงสาธารณสุข — โภชนาการเด็ก' },
        { id: 'i-soda',    text: 'ดื่มน้ำอัดลมทุกมื้อ',                bucketId: 'b-mid',
          source: 'AHA Sugar Recommendation for Children 2022' },
        { id: 'i-2nd',     text: 'อยู่ใกล้คนสูบบุหรี่ไฟฟ้า (มือสอง)',     bucketId: 'b-mid',
          source: 'American Lung Association — Secondhand Vapor 2023' },
        { id: 'i-vape-occ',text: 'ลองบุหรี่ไฟฟ้าเป็นครั้งคราว',           bucketId: 'b-high',
          source: 'Pediatrics 2023 — Occasional Use & Addiction Risk' },
        { id: 'i-cig-occ', text: 'สูบบุหรี่ปกติเป็นครั้งคราว',           bucketId: 'b-high',
          source: 'WHO Report on the Global Tobacco Epidemic 2023' },
        { id: 'i-vape-d',  text: 'ใช้บุหรี่ไฟฟ้าทุกวัน',                  bucketId: 'b-ext',
          source: 'Surgeon General Report 2023 — Adolescent Vape Use' },
        { id: 'i-cig-d',   text: 'สูบบุหรี่ปกติทุกวัน',                bucketId: 'b-ext',
          source: 'WHO Tobacco Mortality Statistics 2023' },
      ],
      next: 'feedback1',
      xpOnSuccess: 110,
      badge: 'media-literate',
      source: 'Pediatrics 2023 / National Academy of Sciences — Harm Reduction Spectrum',
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'ความเสี่ยง = สเปกตรัม ไม่ใช่ขาว-ดำ',
      body: 'นักสืบสุขภาพอธิบายเป็น "ระดับ" — น้องๆ จะเข้าใจง่ายและยอมรับฟัง มากกว่าการพูดขู่ให้กลัว',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'd-end',
      fact: 'การใช้บุหรี่ไฟฟ้าทุกวันในวัยรุ่น เพิ่มโอกาสติดบุหรี่ปกติในอนาคตถึง 4 เท่า — ไม่ใช่ทางเลือกที่ปลอดภัยกว่า',
      source: 'Pediatrics 2023 / National Academy of Sciences',
    },
    {
      type: 'dialogue', id: 'd-end', speaker: 'baitoey', speakerName: 'น้องใบเตย (ม.1)', next: 'end1',
      text: 'พี่อธิบายเข้าใจง่ายมากเลยค่ะ! หนูจะเอาความรู้นี้ไปเล่าให้เพื่อนฟัง — ขอบคุณพี่นักสืบมากนะคะ',
    },
    {
      type: 'end', id: 'end1',
      title: '🎯 Pro 1 ผ่าน!',
      message: 'คุณเข้าใจระดับความเสี่ยงแล้ว — สามารถอธิบายให้น้องๆ และคนรอบข้างเข้าใจได้',
      xp: 80,
      badge: 'media-literate',
    },
  ],
  references: [
    'Pediatrics 2023 — Youth Vape Use and Tobacco Initiation',
    'National Academy of Sciences — Health Effects of E-Cigarettes',
    'Harm Reduction Spectrum — UK Royal College of Physicians',
  ],
};
