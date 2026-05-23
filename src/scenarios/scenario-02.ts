import type { Scenario } from '../types';

export const scenario02: Scenario = {
  id: 2,
  title: 'เพื่อนคนใหม่ในห้องน้ำ',
  subtitle: 'ทักษะปฏิเสธตรงไปตรงมา — สูตร 3 ขั้น',
  estMinutes: 6,
  startNode: 'intro1',
  intro: [
    'พักกลางวัน คุณเข้าห้องน้ำที่โรงเรียน',
    'มีเพื่อนรุ่นพี่กำลังสูบอะไรบางอย่างอยู่',
    'เขายื่นมาให้คุณ...',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'intro1', speaker: 'friend1', next: 'intro2',
      text: 'เฮ้ย น้อง! ลองไหม? ยี่ห้อนี้รสองุ่น หอมมาก ไม่มีอันตรายหรอก ไอน้ำเฉยๆ',
    },
    {
      type: 'dialogue', id: 'intro2', speaker: 'narrator', next: 'choice1',
      text: 'หัวใจคุณเต้นแรง — รุ่นพี่ดูใจดีแต่กำลังเสนอบุหรี่ไฟฟ้า ต้องตอบยังไงดี?',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'คุณจะตอบว่า...',
      choices: [
        {
          label: 'ลองสักเปาก่อนแล้วค่อยตัดสินใจ',
          next: 'wrong1', xp: 0,
          reflection: 'เสี่ยง — ลองครั้งเดียวอาจเสพติดได้',
        },
        {
          label: 'ไม่ครับ ผมไม่สูบ',
          next: 'right1', xp: 30,
        },
        {
          label: 'พี่อย่ายุ่งกับผมสิ',
          next: 'okay1', xp: 10,
          reflection: 'ปฏิเสธได้ แต่อาจสร้างความขัดแย้ง',
        },
      ],
    },
    {
      type: 'feedback', id: 'wrong1', next: 'choice1',
      title: '⚠️ ระวัง!',
      body: 'นิโคตินทำให้สมองเสพติดเร็ว แค่ลองครั้งเดียวอาจไม่หยุดได้ — ลองคิดวิธีปฏิเสธใหม่',
    },
    {
      type: 'feedback', id: 'okay1', next: 'choice1b',
      title: 'ปฏิเสธได้แล้ว แต่...',
      body: 'การปฏิเสธควรชัดเจนแต่ไม่สร้างความขัดแย้งโดยไม่จำเป็น ลองสูตร "ปฏิเสธ + เหตุผล + ทางเลือก" ดู',
    },
    {
      type: 'dialogue', id: 'right1', speaker: 'friend1', next: 'choice2',
      text: 'ทำไมล่ะน้อง? คนอื่นเขาก็ลองกันหมด',
    },
    {
      type: 'choice', id: 'choice1b', speaker: 'player',
      prompt: 'ลองตอบใหม่ — ปฏิเสธชัดเจนแต่ไม่สร้างความขัดแย้ง',
      choices: [
        { label: 'ไม่ครับ ผมไม่สูบ', next: 'right1', xp: 30 },
        { label: 'ขอบคุณครับพี่ แต่ผมไม่สูบจริงๆ', next: 'right1', xp: 28 },
        { label: 'ไม่เอาครับ ผมไม่ยุ่งกับบุหรี่ไฟฟ้า', next: 'right1', xp: 30 },
      ],
    },
    {
      type: 'choice', id: 'choice2', speaker: 'player',
      prompt: 'ตอบเหตุผลให้พี่เขายังไง?',
      choices: [
        { label: 'มันผิดกฎหมายในไทย ผมไม่อยากเสี่ยง', next: 'right2', xp: 30 },
        { label: 'ผมไม่ชอบกลิ่นน่ะครับ', next: 'okay2', xp: 15,
          reflection: 'เป็นเหตุผลที่ใช้ได้ แต่อาจถูกตื้อต่อ' },
        { label: 'พี่อย่าให้ผมเลย', next: 'okay2', xp: 10,
          reflection: 'ตรงไปตรงมา แต่ขาดเหตุผลที่ชัด' },
      ],
    },
    {
      type: 'feedback', id: 'okay2', next: 'choice2b',
      title: 'พอใช้ได้',
      body: 'ลองเหตุผลที่หนักแน่นกว่า — เช่น เรื่องสุขภาพ กฎหมาย หรือเป้าหมายส่วนตัว',
    },
    {
      type: 'choice', id: 'choice2b', speaker: 'player',
      prompt: 'ลองอีกครั้ง — เลือกเหตุผลที่หนักแน่น',
      choices: [
        { label: 'มันผิดกฎหมายในไทย ผมไม่อยากเสี่ยง', next: 'right2', xp: 25 },
        { label: 'นิโคตินทำลายปอด ผมเล่นกีฬาอยู่ ไม่ลองดีกว่า', next: 'right2', xp: 25 },
        { label: 'ถ้าพ่อแม่รู้คงเสียใจมาก ผมไม่อยากให้เขาผิดหวัง', next: 'right2', xp: 25 },
      ],
    },
    {
      type: 'dialogue', id: 'right2', speaker: 'friend1', next: 'choice3',
      text: 'โอเค... แล้วน้องจะทำอะไรล่ะตอนนี้? นั่งเล่นคนเดียวเหรอ',
    },
    {
      type: 'choice', id: 'choice3', speaker: 'player',
      prompt: 'เสนอทางเลือกที่ปลอดภัยกว่า — ทำให้บทสนทนาจบแบบสบายๆ',
      choices: [
        { label: 'ไปต่อแถวกินข้าวกันไหมครับ ผมหิวแล้ว', next: 'right3', xp: 30 },
        { label: 'ผมต้องไปทำการบ้าน ขอตัวก่อนครับ', next: 'right3', xp: 25 },
        { label: 'พี่ก็เลิกสูบเถอะ ไม่ดี', next: 'preachy', xp: 5,
          reflection: 'หวังดี แต่อาจดูเหมือนสั่งสอน — เสนอทางเลือกดีกว่า' },
      ],
    },
    {
      type: 'feedback', id: 'preachy', next: 'choice3b',
      title: 'หวังดีนะ แต่...',
      body: 'การสั่งสอนมักทำให้คนอีกฝ่ายต่อต้าน — เสนอ "สิ่งอื่นที่จะทำ" จะดีกว่าให้คำเตือน',
    },
    {
      type: 'choice', id: 'choice3b', speaker: 'player',
      prompt: 'ลองอีกครั้ง — เสนอทางเลือก',
      choices: [
        { label: 'ไปต่อแถวกินข้าวกันไหมครับ ผมหิวแล้ว', next: 'right3', xp: 25 },
        { label: 'พี่ ผมขอชวนไปเตะบอลตอนเย็นนะครับ', next: 'right3', xp: 25 },
        { label: 'พี่ไปร้านน้ำหวานหน้าโรงเรียนกันไหมครับ ผมเลี้ยง', next: 'right3', xp: 25 },
      ],
    },
    {
      type: 'dialogue', id: 'right3', speaker: 'friend1', next: 'mg2',
      text: 'เออ ก็ได้น้อง... แล้วเจอกันนะ',
    },
    {
      type: 'minigame', id: 'mg2', game: 'order-cards',
      title: 'สูตรปฏิเสธ 3 ขั้น',
      cards: [
        { id: 'c1', text: 'ปฏิเสธชัดเจน — "ไม่ครับ ผมไม่สูบ"' },
        { id: 'c2', text: 'ให้เหตุผลสั้นๆ — "ผิดกฎหมาย / เสียสุขภาพ"' },
        { id: 'c3', text: 'เสนอทางเลือกอื่น — "ไปกินข้าวกันไหม"' },
      ],
      correctOrder: ['c1', 'c2', 'c3'],
      next: 'feedback1',
      xpOnSuccess: 80,
      badge: 'direct-refusal',
      source: 'NIDA — Refusal Skills for Adolescents (2022) / สสส. คู่มือป้องกันสารเสพติดเยาวชน 2566',
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'บันทึกนักสืบ 📓',
      body: 'สูตรปฏิเสธ 3 ขั้น "ไม่ → เพราะ → ไปทำอย่างอื่นแทน" มาจาก Life Skills Training (LST) ของ Dr. Gilbert Botvin มหาวิทยาลัย Cornell ปี 1980s. มันได้ผลเพราะการ "เสนอทางเลือก" ลดความอึดอัดในกลุ่มเพื่อน (peer pressure) มากกว่าการปฏิเสธเฉยๆ ที่ดูเย็นชา. ฝึกซ้อมจริงหน้ากระจกหรือกับเพื่อน — จะพูดได้คล่องเมื่อถึงเวลาจริง',
      source: 'Botvin Life Skills Training (LST), Cornell University — Refusal Skills Module / NIDA Principles of Substance Use Prevention for Adolescents 2022',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'end1',
      fact: 'งานวิจัยพบว่าวัยรุ่นที่ฝึกปฏิเสธชัดเจนมีโอกาสไม่ลองสารเสพติดสูงกว่า 60%',
      source: 'สสส. งานวิจัยพฤติกรรมเยาวชน 2566',
    },
    {
      type: 'end', id: 'end1',
      title: 'จบด่าน 2!',
      message: 'คุณปฏิเสธได้อย่างมีชั้นเชิง — ทักษะ "ปฏิเสธตรงไปตรงมา" ปลดล็อกแล้ว',
      xp: 50,
      badge: 'stage-2-clear',
    },
  ],
  references: [
    'สสส. — งานวิจัยพฤติกรรมเยาวชน 2566',
    'NIDA — Refusal Skills for Adolescents (2022)',
    'WHO Adolescent Health — Substance Use Prevention',
  ],
};
