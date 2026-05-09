import type { Scenario } from '../types';

// ด่าน 5 — DM ในเกมออนไลน์: รู้จักถอย/บล็อก
export const scenario05: Scenario = {
  id: 5,
  title: 'DM ในเกมออนไลน์',
  subtitle: 'รู้จักถอย — block, report, walk away',
  estMinutes: 5,
  startNode: 'intro1',
  intro: [
    'คืนหนึ่งคุณเล่นเกมออนไลน์ในห้องนอน',
    'มีคนทักมาใน DM ใช้ชื่อ "Vapor"',
    'อ้างเป็นคนรู้จัก พี่เพื่อนของพี่...',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'intro1', speaker: 'dm-stranger', next: 'intro2',
      text: 'เฮ้น้อง! เก่งมากเลย เห็นเล่นในห้องเรา พี่ Vapor นะ พี่ของพี่บอลมาบอกให้รู้จักน้อง',
    },
    {
      type: 'dialogue', id: 'intro2', speaker: 'dm-stranger', next: 'intro3',
      text: 'พี่จะให้ skin ฟรี เอาไหม? แค่บอกที่อยู่ ส่ง vape เครื่องเล็กๆ ให้ลองด้วย ของขวัญ',
    },
    {
      type: 'dialogue', id: 'intro3', speaker: 'narrator', next: 'choice1',
      text: 'มีบางอย่างผิดปกติ — คุณไม่เคยได้ยินชื่อ "พี่บอล" และคนแปลกหน้าทักมาเสนอของฟรี',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'จะทำยังไง?',
      choices: [
        {
          label: 'ตอบไปว่าไม่รู้จัก แล้วบล็อก',
          next: 'right1', xp: 35,
        },
        {
          label: 'ส่งที่อยู่ไป ก็ดีนะได้ของฟรี',
          next: 'wrong1', xp: 0,
          reflection: 'อันตราย — คนแปลกหน้าออนไลน์ไม่ควรรู้ที่อยู่จริง',
        },
        {
          label: 'ถามชื่อพี่บอลเต็มๆ ก่อน',
          next: 'okay1', xp: 15,
          reflection: 'การพยายามตรวจสอบดี — แต่กรณีนี้ตัดบทแล้วบล็อกปลอดภัยกว่า',
        },
      ],
    },
    {
      type: 'feedback', id: 'wrong1', next: 'choice1',
      title: '🚨 ระวัง!',
      body: 'การให้ที่อยู่/ข้อมูลส่วนตัวกับคนแปลกหน้าออนไลน์ คือความเสี่ยงระดับสูง — ทั้งข้อมูลส่วนตัว ของผิดกฎหมาย และอาจร้ายแรงกว่านั้น',
    },
    {
      type: 'feedback', id: 'okay1', next: 'choice1b',
      title: 'ตรวจสอบดี — แต่...',
      body: 'คนชวนทำเรื่องผิดมักเตรียมคำตอบไว้ — กฎคือ "ไม่ตอบ ไม่คุย ไม่ลังเล" บล็อกแล้วเดินจาก',
    },
    {
      type: 'choice', id: 'choice1b', speaker: 'player',
      prompt: 'เลือกอีกครั้ง',
      choices: [
        { label: 'ตอบไปว่าไม่รู้จัก แล้วบล็อก', next: 'right1', xp: 25 },
      ],
    },
    {
      type: 'dialogue', id: 'right1', speaker: 'narrator', next: 'choice2',
      text: 'คุณบล็อกบัญชีนั้นแล้ว — แต่ 5 นาทีต่อมา มีบัญชีใหม่ทักมาอีก',
    },
    {
      type: 'dialogue', id: 'right1b', speaker: 'dm-stranger', next: 'choice2',
      text: 'น้องๆ ทำไมบล็อกพี่ล่ะ พี่ไม่ใช่คนเลวนะ ขอคุยอีกแป๊บนึง',
    },
    {
      type: 'choice', id: 'choice2', speaker: 'player',
      prompt: 'รุ่นพี่ปลอมตัวมาใหม่ — ทำยังไง?',
      choices: [
        {
          label: 'บล็อก + รายงาน + ตั้งบัญชีเป็น Private',
          next: 'right2', xp: 35,
        },
        {
          label: 'ตอบกลับว่าให้เลิกยุ่ง',
          next: 'okay2', xp: 15,
          reflection: 'การตอบกลับ = การให้ความสนใจ — เขาจะตื๊อต่อ',
        },
        {
          label: 'อ่านเฉยๆ ไม่ตอบ',
          next: 'okay3', xp: 10,
          reflection: 'พอได้ — แต่บล็อก+รายงาน ปลอดภัยกว่ามาก',
        },
      ],
    },
    {
      type: 'feedback', id: 'okay2', next: 'choice2',
      title: 'อย่าตอบกลับ',
      body: 'ทุกการตอบกลับ ไม่ว่าจะดีหรือร้าย คือการเปิดช่องให้เขาคุยต่อ — ตัดบทด้วยการบล็อก ไม่ตอบ',
    },
    {
      type: 'feedback', id: 'okay3', next: 'choice2',
      title: 'ดีกว่านี้ได้',
      body: 'การไม่ตอบดีอยู่แล้ว — แต่บล็อก + รายงานบัญชี ทำให้แพลตฟอร์มลบบัญชีเขาได้ ปกป้องคนอื่นด้วย',
    },
    {
      type: 'dialogue', id: 'right2', speaker: 'narrator', next: 'choice3',
      text: 'คุณบล็อก รายงาน และตั้งบัญชีเป็น Private — บัญชีปลอมของ "Vapor" ถูกระงับใน 24 ชม.',
    },
    {
      type: 'choice', id: 'choice3', speaker: 'player',
      prompt: 'ขั้นสุดท้าย — ควรบอกเรื่องนี้ให้ใครฟัง?',
      choices: [
        { label: 'บอกพ่อแม่/ผู้ปกครอง', next: 'right3', xp: 25 },
        { label: 'เก็บเรื่องไว้คนเดียว ไม่อยากให้พ่อแม่ห้ามเล่นเกม', next: 'okay4', xp: 5,
          reflection: 'เข้าใจว่ากลัวโดนห้ามเล่น — แต่ผู้ใหญ่จะช่วยปกป้องในครั้งต่อไป' },
        { label: 'บอกครู / โพสต์เตือนเพื่อน', next: 'right3', xp: 25 },
      ],
    },
    {
      type: 'feedback', id: 'okay4', next: 'choice3b',
      title: 'อย่ากลัวไป',
      body: 'การบอกผู้ใหญ่ที่ไว้ใจได้ ไม่ใช่การฟ้อง — คือการสร้างเกราะป้องกันให้ตัวเอง พ่อแม่ส่วนใหญ่จะเข้าใจมากกว่าโกรธ',
    },
    {
      type: 'choice', id: 'choice3b', speaker: 'player',
      prompt: 'เลือกใหม่',
      choices: [
        { label: 'บอกพ่อแม่/ผู้ปกครอง', next: 'right3', xp: 20 },
      ],
    },
    {
      type: 'dialogue', id: 'right3', speaker: 'narrator', next: 'mg1',
      text: 'คุณบอกเรื่องนี้ — ผู้ใหญ่ตั้งระบบความปลอดภัยให้เพิ่ม และพ่อแม่ก็ภูมิใจที่ลูกมาบอก',
    },
    {
      type: 'minigame', id: 'mg1', game: 'order-cards',
      title: 'ขั้นตอน "Walk Away" ในโลกออนไลน์',
      cards: [
        { id: 'c1', text: 'หยุด — ไม่ตอบ ไม่ส่งข้อมูลใดๆ' },
        { id: 'c2', text: 'บล็อก — ตัดการติดต่อทันที' },
        { id: 'c3', text: 'รายงาน — แจ้งแพลตฟอร์มเพื่อปกป้องคนอื่น' },
        { id: 'c4', text: 'บอก — แจ้งผู้ใหญ่ที่ไว้ใจได้' },
      ],
      correctOrder: ['c1', 'c2', 'c3', 'c4'],
      next: 'feedback1',
      xpOnSuccess: 90,
      badge: 'walk-away',
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'Detective\'s Note 📓',
      body: 'การ "ถอย" ในโลกออนไลน์ไม่ใช่การยอมแพ้ — แต่คือการปกป้องตัวเอง: หยุด → บล็อก → รายงาน → บอก',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'end1',
      fact: 'มีรายงานคนขายบุหรี่ไฟฟ้าใน DM เกม/IG/TikTok เพิ่มขึ้น 300% ใน 2 ปีที่ผ่านมา — เป้าหมายหลักคือเยาวชน',
      source: 'รายงานสำนักงาน กสทช. 2566',
    },
    {
      type: 'end', id: 'end1',
      title: 'จบด่าน 5!',
      message: 'คุณรู้จักถอยจากภัยออนไลน์ — ทักษะ "Walk Away" ปลดล็อก',
      xp: 60,
      badge: 'walk-away',
    },
  ],
};
