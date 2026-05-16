import type { Scenario } from '../types';

// ด่าน 9 (Master) — เพื่อนเริ่มติดแล้ว ช่วยเลิกด้วยสูตร 5A
export const scenario09: Scenario = {
  id: 9,
  title: 'เพื่อนเริ่มติดแล้ว',
  subtitle: 'บทเรียนขั้นสูง 1 — สูตร 5 ขั้นช่วยเพื่อนเลิก (5A)',
  estMinutes: 8,
  startNode: 'mg-warmup',
  intro: [
    '⚜️ บทเรียนขั้นสูงเปิดแล้ว',
    'นักสืบสุขภาพไม่ได้แค่ปฏิเสธ — แต่ต้องช่วยคนที่หลงไปแล้วกลับมาด้วย',
    'น้องใบเตยส่งข้อความ: "พี่ช่วยหน่อย เพื่อนหนูเลิกไม่ได้"',
  ],
  nodes: [
    // เริ่มด้วย minigame เลย (ไม่ใช่ dialogue) — แตกต่างจากด่านอื่น
    {
      type: 'minigame', id: 'mg-warmup', game: 'fill-blank',
      title: 'อุ่นเครื่อง — รู้สัญญาณคนติด',
      questions: [
        {
          sentence: 'อาการขาดนิโคติน 4-24 ชม. แรก: หงุดหงิด สมาธิลด ___',
          options: ['อยากใช้บุหรี่ไฟฟ้า', 'หิวข้าวมาก'],
          correctIndex: 0,
          reveal: 'craving (อาการอยาก) คือสัญญาณหลักของการขาด — เกิดเร็วและรุนแรง',
          source: 'DSM-5 — Tobacco Withdrawal Criteria / NIDA',
        },
        {
          sentence: 'อาการกายภาพที่พบบ่อย: ปวดหัว เหนื่อยง่าย ___ ผิดปกติ',
          options: ['การนอน', 'การร้องเพลง'],
          correctIndex: 0,
          reveal: 'นิโคตินรบกวนวงจรการนอน — คนติดมักนอนไม่หลับหรือฝันร้าย',
          source: 'CDC Nicotine Withdrawal Symptoms / WHO Tobacco Cessation Guidelines 2023',
        },
      ],
      next: 'd1',
      xpOnSuccess: 60,
    },
    {
      type: 'dialogue', id: 'd1', speaker: 'baitoey', next: 'd2',
      text: 'พี่... เพื่อนหนูชื่อปาล์ม ลองครั้งเดียวเมื่อเดือนก่อน ตอนนี้ใช้ทุกวัน เขาเริ่มเครียด มือสั่น',
    },
    {
      type: 'dialogue', id: 'd2', speaker: 'baitoey', next: 'choice1',
      text: 'หนูคุยกับเขาแล้ว เขาบอกว่าเลิกไม่ได้ ตอนเลิกใช้รู้สึกแย่มาก',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'ขั้นแรก: "ถาม" (Ask) — ถามอย่างไม่ตัดสิน',
      choices: [
        {
          label: 'ปาล์ม รู้สึกยังไงตอนนี้? ฉันอยู่ตรงนี้นะ',
          next: 'd3', xp: 30,
        },
        {
          label: 'ทำไมเริ่มลองตั้งแต่แรกล่ะ?',
          next: 'wrong1', xp: 0,
          reflection: '"ทำไม" ฟังเหมือนตำหนิ — เริ่มจาก "รู้สึกยังไง" จะเปิดใจกว่า',
        },
        {
          label: 'อ่านบทความนี้ก่อน — มันอันตราย',
          next: 'wrong2', xp: 0,
          reflection: 'ก่อนสอน ต้องฟัง — ขั้นแรกคือ "ถาม" ไม่ใช่ "แนะนำ"',
        },
      ],
    },
    {
      type: 'feedback', id: 'wrong1', next: 'choice1',
      title: 'ระวังคำถามแบบสอบสวน',
      body: '"ทำไม" มักทำให้คนตั้งกำแพง — ใช้ "อย่างไร" หรือ "รู้สึกยังไง" จะเปิดใจมากกว่า',
    },
    {
      type: 'feedback', id: 'wrong2', next: 'choice1',
      title: 'รีบสอนก่อนฟัง',
      body: 'การยื่นข้อมูลก่อนรับฟัง = ทำให้รู้สึกถูกตัดสิน — ทำให้เขาปิดประตู ลองฟังก่อน',
    },
    {
      type: 'dialogue', id: 'd3', speaker: 'narrator', next: 'choice2',
      text: 'ปาล์มเปิดใจ — เล่าว่าเขาใช้เพราะเครียดเรื่องครอบครัว เคยลองเลิกแล้วทรมาน',
    },
    {
      type: 'choice', id: 'choice2', speaker: 'player',
      prompt: 'ขั้นที่ 2: "แนะนำ" (Advise) — ให้คำแนะนำกระชับ',
      choices: [
        {
          label: 'ฉันแนะนำให้เลิก เพราะมันทำลายปอดและสมองที่ยังพัฒนา',
          next: 'd4', xp: 30,
        },
        {
          label: 'อย่าลังเล — เลิกเลย!',
          next: 'okay1', xp: 10,
          reflection: 'การกดดัน = การต่อต้าน คำแนะนำต้องชัดเจนแต่อ่อนโยน',
        },
      ],
    },
    {
      type: 'feedback', id: 'okay1', next: 'choice2',
      title: 'อ่อนโยนกว่านี้',
      body: '"แนะนำ" ที่ดี = ตรงไปตรงมา + ไม่บีบคั้น — บอกเหตุผลทางสุขภาพ ให้เขาเลือกเอง',
    },
    {
      type: 'dialogue', id: 'd4', speaker: 'narrator', next: 'mg-5a',
      text: 'ปาล์มฟังและคิดอยู่ — ขั้นต่อไปคือ "ประเมิน" (Assess), "ช่วยเหลือ" (Assist), "ติดตาม" (Arrange)',
    },
    // มินิเกมหลัก: เรียงสูตร 5A
    {
      type: 'minigame', id: 'mg-5a', game: 'order-cards',
      title: 'สูตร 5 ขั้นช่วยเพื่อนเลิก (5A) — เรียงลำดับให้ถูก',
      cards: [
        { id: 'a1', text: '1) ถาม (Ask) — ถามอย่างไม่ตัดสิน "รู้สึกยังไง"' },
        { id: 'a2', text: '2) แนะนำ (Advise) — กระชับ ไม่กดดัน' },
        { id: 'a3', text: '3) ประเมิน (Assess) — ดูว่าเขาพร้อมเลิกขั้นไหน' },
        { id: 'a4', text: '4) ช่วยเหลือ (Assist) — วางแผน + ติดต่อสายด่วน 1600' },
        { id: 'a5', text: '5) ติดตาม (Arrange) — นัดตามผล อยู่เป็นกำลังใจ' },
      ],
      correctOrder: ['a1', 'a2', 'a3', 'a4', 'a5'],
      next: 'mg-resources',
      xpOnSuccess: 90,
      badge: 'recovery-coach',
      source: '5A Model — US Public Health Service Clinical Practice Guideline / WHO Tobacco Cessation 2023',
    },
    // จับคู่ resource
    {
      type: 'minigame', id: 'mg-resources', game: 'word-match',
      title: 'จับคู่แหล่งช่วยเหลือ',
      pairs: [
        { left: 'สายด่วนเลิกบุหรี่',          right: 'โทร 1600 ปรึกษาฟรี ไม่มีค่าใช้จ่าย',
          source: 'กรมการแพทย์ กระทรวงสาธารณสุข' },
        { left: 'แอป Quitline / iCanQuit',    right: 'ติดตามอาการรายวัน',
          source: 'iCanQuit Clinical Trial — JMIR Mental Health 2020' },
        { left: 'นักจิตวิทยา รพ.รัฐ',         right: 'CBT บำบัดความเครียด',
          source: 'WHO Tobacco Cessation Guidelines 2023 / กรมสุขภาพจิต' },
        { left: 'กลุ่มเพื่อนที่เลิกได้',        right: 'เพิ่มกำลังใจระยะยาว',
          source: 'Cochrane Review on Peer-led Cessation Programs 2022' },
      ],
      next: 'd-end',
      xpOnSuccess: 80,
      source: 'รวมแหล่งช่วยเหลือเลิกบุหรี่/บุหรี่ไฟฟ้าในประเทศไทย',
    },
    {
      type: 'dialogue', id: 'd-end', speaker: 'baitoey', next: 'edu1',
      text: 'พี่... ปาล์มยอมโทร 1600 แล้ว ขอบคุณนะที่อยู่เคียงข้าง',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'end1',
      fact: '70% ของคนที่ติดนิโคติน เลิกได้สำเร็จเมื่อมีคนใกล้ตัวสนับสนุนระยะยาว — เพื่อนคือยาที่ทรงพลังที่สุด',
      source: 'WHO Tobacco Cessation Guidelines 2023',
    },
    {
      type: 'end', id: 'end1',
      title: '🎓 Master 1 ผ่าน!',
      message: 'คุณเป็นโค้ชเลิกบุหรี่แล้ว — ทักษะ "Recovery Coach" ปลดล็อก',
      xp: 80,
      badge: 'recovery-coach',
    },
  ],
  references: [
    'WHO Tobacco Cessation Guidelines 2023',
    '5A Model — US Public Health Service Clinical Practice Guideline',
    'สายด่วนเลิกบุหรี่ 1600 — กรมการแพทย์ กระทรวงสาธารณสุข',
    'iCanQuit / Quitline — Cognitive Behavioral Apps for Smoking Cessation',
  ],
};
