import type { Scenario } from '../types';
import { asset } from '../lib/asset';

export const scenario02: Scenario = {
  id: 2,
  title: 'รุ่นพี่ในห้องน้ำ',
  subtitle: 'ทักษะปฏิเสธตรงไปตรงมา — สูตร 3 ขั้น',
  estMinutes: 6,
  startNode: 'intro1',
  intro: [
    'พักกลางวัน คุณเดินเข้าห้องน้ำที่โรงเรียน',
    'เห็นรุ่นพี่ ม.ปลาย กำลังแอบสูบอะไรบางอย่างอยู่',
    'เขายื่นพอดส่งมาให้คุณ...',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'intro1', speaker: 'senior', speakerName: 'รุ่นพี่ ม.ปลาย', speakerAvatar: asset('characters/player-m1.png'), next: 'intro2',
      text: 'เฮ้ยน้อง! มาทำอะไรตรงนี้ ลองหน่อยไหม? ตัวนี้รสองุ่น หอมหวานมาก ไม่มีอันตรายหรอก ไอน้ำธรรมดาเอง',
    },
    {
      type: 'dialogue', id: 'intro2', speaker: 'narrator', next: 'choice1',
      text: 'หัวใจคุณเต้นแรง — รุ่นพี่ในโรงเรียนกำลังยื่นบุหรี่ไฟฟ้าให้ จะตอบปฏิเสธยังไงดี?',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'คุณจะตอบว่า...',
      choices: [
        {
          label: 'ลองสักคำก่อนแล้วค่อยว่ากัน',
          next: 'wrong1', xp: 0,
          reflection: 'เสี่ยงมาก — ลองแค่ครั้งเดียวก็อาจทำให้สมองเริ่มเสพติดได้ทันที',
        },
        {
          label: 'ไม่เอาครับ/ค่ะ ผม/หนูไม่สูบ',
          next: 'right1', xp: 30,
        },
        {
          label: 'พี่อย่ามายุ่งกับผม/หนูดีกว่า',
          next: 'okay1', xp: 10,
          reflection: 'ปฏิเสธได้ แต่อาจสร้างความขัดแย้งที่ไม่จำเป็น',
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
      type: 'dialogue', id: 'right1', speaker: 'senior', speakerName: 'รุ่นพี่ ม.ปลาย', speakerAvatar: asset('characters/player-m1.png'), next: 'choice2',
      text: 'ทำไมล่ะน้อง? คนอื่นในกลุ่มเขาก็ลองกันทั้งนั้น เท่จะตาย ลองนิดเดียวไม่ติดหรอก',
    },
    {
      type: 'choice', id: 'choice1b', speaker: 'player',
      prompt: 'ลองตอบใหม่ — ปฏิเสธชัดเจนแต่ไม่สร้างความขัดแย้ง',
      choices: [
        { label: 'ไม่เอาครับ/ค่ะ ผม/หนูไม่สูบ', next: 'right1', xp: 30 },
        { label: 'ขอบคุณครับ/ค่ะพี่ แต่ผม/หนูไม่สูบจริงๆ', next: 'right1', xp: 28 },
        { label: 'ขอบายดีกว่าครับ/ค่ะพี่ ไม่ใช่แนวเรา 😅', next: 'right1', xp: 30 },
      ],
    },
    {
      type: 'choice', id: 'choice2', speaker: 'player',
      prompt: 'ให้เหตุผลที่หนักแน่นและชัดเจน',
      choices: [
        { label: 'มันผิดกฎหมายในไทยครับ/ค่ะ ผม/หนูไม่อยากมีปัญหา', next: 'right2', xp: 30 },
        { label: 'ผม/หนูไม่ชอบกลิ่นน่ะครับ/ค่ะ', next: 'okay2', xp: 15,
          reflection: 'เป็นเหตุผลที่ใช้ได้ แต่อาจถูกตื๊อต่อได้ง่าย' },
        { label: 'พี่อย่าชวนผม/หนูเลยครับ/ค่ะ', next: 'okay2', xp: 10,
          reflection: 'ตรงไปตรงมา แต่ยังขาดเหตุผลที่ชัดเจน' },
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
        { label: 'มันผิดกฎหมายในไทยครับ/ค่ะ ผม/หนูไม่อยากมีปัญหา', next: 'right2', xp: 25 },
        { label: 'นิโคตินทำลายปอด ผม/หนูเล่นกีฬาอยู่ ไม่เสี่ยงดีกว่าครับ/ค่ะ', next: 'right2', xp: 25 },
        { label: 'เก็บตังค์ไว้กินของอร่อยตอนเย็นดีกว่าครับ/ค่ะพี่ 🥩', next: 'right2', xp: 25 },
      ],
    },
    {
      type: 'dialogue', id: 'right2', speaker: 'senior', speakerName: 'รุ่นพี่ ม.ปลาย', speakerAvatar: asset('characters/player-m1.png'), next: 'choice3',
      text: 'โอเค... แล้วจะรีบไปไหนล่ะเรา? ยืนคุยกันก่อนสิ',
    },
    {
      type: 'choice', id: 'choice3', speaker: 'player',
      prompt: 'เสนอทางเลือกเพื่อออกจากสถานการณ์อย่างสุภาพ',
      choices: [
        { label: 'เดี๋ยวผม/หนูต้องรีบไปกินข้าวต่อแถวกับเพื่อนแล้วครับ/ค่ะ ขอตัวก่อนนะครับ/ค่ะ', next: 'right3', xp: 30 },
        { label: 'ผม/หนูต้องรีบเอาการบ้านไปส่งอาจารย์ ขอตัวก่อนครับ/ค่ะ', next: 'right3', xp: 25 },
        { label: 'พี่ก็เลิกสูบเถอะ มันไม่ดีนะ', next: 'preachy', xp: 5,
          reflection: 'หวังดี แต่อาจดูเหมือนสั่งสอนรุ่นพี่ — เสนอทางเลือกเพื่อเดินออกมาดีกว่า' },
      ],
    },
    {
      type: 'feedback', id: 'preachy', next: 'choice3b',
      title: 'หวังดีนะ แต่...',
      body: 'การสั่งสอนมักทำให้คนอีกฝ่ายต่อต้าน — เสนอ "สิ่งอื่นที่จะทำ" จะดีกว่าให้คำเตือน',
    },
    {
      type: 'choice', id: 'choice3b', speaker: 'player',
      prompt: 'ลองอีกครั้ง — เสนอทางเลือกเพื่อเดินออกมา',
      choices: [
        { label: 'เดี๋ยวผม/หนูต้องรีบไปต่อแถวกินข้าวแล้วครับ/ค่ะ หิวมากแล้ว ขอตัวก่อนนะครับ/ค่ะ', next: 'right3', xp: 25 },
        { label: 'ตอนเย็นผม/หนูมีซ้อมบอลกับเพื่อน ขอตัวไปเตรียมตัวก่อนครับ/ค่ะ', next: 'right3', xp: 25 },
        { label: 'ขอผ่านก่อนนะครับ/ค่ะพี่ เดี๋ยวต้องรีบไปเข้าแถวแล้ว 🏃', next: 'right3', xp: 25 },
      ],
    },
    {
      type: 'dialogue', id: 'right3', speaker: 'senior', speakerName: 'รุ่นพี่ ม.ปลาย', speakerAvatar: asset('characters/player-m1.png'), next: 'mg-run',
      text: 'เออๆ ตามใจ รีบไปเหอะ วันนี้พี่ไม่กวนละ',
    },
    {
      type: 'minigame', id: 'mg-run', game: 'lane-run',
      title: '🛹 รีบเดินออกจากห้องน้ำ — หลบควัน เก็บของดี',
      goalScore: 6,
      next: 'mg2',
      xpOnSuccess: 40,
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
      body: 'จำสูตรง่ายๆ: ไม่ → เพราะ → ชวนไปทำอย่างอื่น 💡\nที่เวิร์กเพราะการชวนไปทำอย่างอื่นทำให้ไม่กระอักกระอ่วน ดีกว่าปฏิเสธห้วนๆ\nลองซ้อมหน้ากระจกหรือกับเพื่อนดู เดี๋ยวพูดได้ลื่นเอง',
      source: 'Botvin Life Skills Training (LST), Cornell University — Refusal Skills Module / NIDA 2022',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'end1',
      fact: 'งานวิจัยพบว่าวัยรุ่นที่ฝึกปฏิเสธชัดเจนมีโอกาสไม่ลองสารเสพติดสูงกว่า 60%',
      source: 'สสส. งานวิจัยพฤติกรรมเยาวชน 2566',
    },
    {
      type: 'end', id: 'end1',
      title: 'จบด่าน 2!',
      message: 'คุณปฏิเสธได้อย่างมีชั้นเชิง — ทักษะ "ปฏิเสธตรงไปตรงมา" ปลดล็อกแล้ว\n\n🎂 สุดสัปดาห์นี้มีปาร์ตี้วันเกิดเพื่อนสนิท... แต่มีบางอย่างซ่อนอยู่ในกระเป๋าใครบางคน',
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
