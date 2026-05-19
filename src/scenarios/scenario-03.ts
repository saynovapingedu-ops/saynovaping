import type { Scenario } from '../types';

// ด่าน 3 — ปาร์ตี้วันเกิด: ใช้เหตุผลโน้มน้าวเพื่อน
export const scenario03: Scenario = {
  id: 3,
  title: 'ปาร์ตี้วันเกิด',
  subtitle: 'ใช้เหตุผลโน้มน้าวเพื่อนให้ไม่ลอง',
  estMinutes: 7,
  startNode: 'intro1',
  intro: [
    'ปาร์ตี้วันเกิดของเพื่อนสนิทที่บ้าน',
    'มีเพื่อนคนหนึ่งหยิบบุหรี่ไฟฟ้าออกมา ชวนทุกคนลอง',
    'เพื่อนคุณเริ่มลังเล — คุณจะช่วยเขายังไง?',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'intro1', speaker: 'friend1', next: 'intro2',
      text: 'เฮ้ ทุกคน! วันเกิดวันนี้ ดูซิเอามาฝาก รสสตรอว์เบอร์รี่ หอมมาก ลองคนละนิดสิ',
    },
    {
      type: 'dialogue', id: 'intro2', speaker: 'friend2', next: 'intro3',
      text: '(หันมาหาคุณ) เออ... ลองเหรอ? ฉันก็ยังไม่เคยลองเลย แต่ดูทุกคนสนุกกัน',
    },
    {
      type: 'dialogue', id: 'intro3', speaker: 'narrator', next: 'choice1',
      text: 'เพื่อนคุณกำลังลังเล — ถ้าคุณช่วยเขาตอนนี้ อาจจะเปลี่ยนใจได้',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'คุณจะพูดกับเพื่อนยังไง?',
      choices: [
        {
          label: 'อย่าลองเลย ลองครั้งเดียวก็ติดได้',
          next: 'okay1', xp: 15,
          reflection: 'เป็นความจริง แต่อาจฟังเหมือนสั่งสอน',
        },
        {
          label: 'นายจำได้ปะ พ่อนายเป็นโรคปอด อันนี้ก็คล้ายๆ กันแหละ',
          next: 'right1', xp: 30,
        },
        {
          label: 'แล้วแต่นาย ฉันไม่ยุ่ง',
          next: 'wrong1', xp: 0,
          reflection: 'เพื่อนแท้คือคนที่กล้าห้ามในเรื่องสำคัญ',
        },
      ],
    },
    {
      type: 'feedback', id: 'wrong1', next: 'choice1b',
      title: 'เพื่อนต้องการคุณ',
      body: 'การปล่อยให้เพื่อนตัดสินใจคนเดียวในจังหวะแบบนี้ อาจทำให้เขาเข้าไปหาความเสี่ยง — เพื่อนแท้กล้าพูดเตือน',
    },
    {
      type: 'choice', id: 'choice1b', speaker: 'player',
      prompt: 'ลองเลือกแนวทางที่ใช้เหตุผลส่วนตัว',
      choices: [
        { label: 'นายจำได้ปะ พ่อนายเป็นโรคปอด อันนี้ก็คล้ายๆ กันแหละ', next: 'right1', xp: 25 },
        { label: 'พ่อนายป่วยปอดอยู่นะ ถ้านายลอง พ่อจะเสียใจขนาดไหน', next: 'right1', xp: 25 },
        { label: 'นายเคยบ่นว่ากลัวเป็นเหมือนพ่อใช่ปะ อันนี้แหละตัวเริ่ม', next: 'right1', xp: 28 },
      ],
    },
    {
      type: 'feedback', id: 'okay1', next: 'choice1c',
      title: 'พอใช้ได้ แต่...',
      body: 'การพูดแบบทั่วไปมักไม่ตรงใจ — ลองโยงกับเรื่องส่วนตัวของเพื่อน เช่น เป้าหมาย ครอบครัว หรือสิ่งที่เขารัก',
    },
    {
      type: 'choice', id: 'choice1c', speaker: 'player',
      prompt: 'เลือกใหม่ — เน้นเรื่องส่วนตัว',
      choices: [
        { label: 'นายจำได้ปะ พ่อนายเป็นโรคปอด อันนี้ก็คล้ายๆ กันแหละ', next: 'right1', xp: 25 },
        { label: 'นายอยากเป็นนักกีฬาใช่ปะ อันนี้พังปอดเลยนะเพื่อน', next: 'right1', xp: 25 },
        { label: 'จำที่นายเล่าให้ฟังเรื่องพ่อได้มั้ย — อันนี้ก็ทำให้เป็นแบบนั้นได้', next: 'right1', xp: 28 },
      ],
    },
    {
      type: 'dialogue', id: 'right1', speaker: 'friend2', next: 'choice2',
      text: '...เออ จริงด้วย พ่อฉันเหนื่อยง่ายมาก ฉันไม่อยากเป็นแบบนั้น',
    },
    {
      type: 'choice', id: 'choice2', speaker: 'player',
      prompt: 'ตอนนี้เพื่อนเริ่มฟัง — เสริมยังไงให้เขามั่นใจ?',
      choices: [
        {
          label: 'ออกไปหากินขนมข้างนอกกันเถอะ ของอร่อยกว่านี้เยอะ',
          next: 'right2', xp: 30,
        },
        {
          label: 'นายเก่งจะตาย ไม่ต้องตามคนอื่น',
          next: 'right2', xp: 25,
        },
        {
          label: 'ถ้าลองแล้วโดนจับ เกมสุดสัปดาห์ของนายก็อด',
          next: 'okay2', xp: 15,
          reflection: 'ใช้ความกลัวก็ได้ผล แต่ระยะยาวให้แรงบันดาลใจดีกว่า',
        },
      ],
    },
    {
      type: 'feedback', id: 'okay2', next: 'choice2b',
      title: 'ใช้ได้ แต่ลองอีกแบบ',
      body: 'ความกลัวทำให้คนหยุดได้ชั่วคราว — แต่การให้ทางออก/ทางเลือกที่ดีกว่า ทำให้คนเลือกถูกต้องในระยะยาว',
    },
    {
      type: 'choice', id: 'choice2b', speaker: 'player',
      prompt: 'เลือกแนวทางที่ให้ทางเลือกบวก',
      choices: [
        { label: 'ออกไปหากินขนมข้างนอกกันเถอะ ของอร่อยกว่านี้เยอะ', next: 'right2', xp: 25 },
        { label: 'ไปร้านชานมหน้าปากซอยกัน ฉันเลี้ยงเอง', next: 'right2', xp: 25 },
        { label: 'ไปเล่นเกมที่บ้านฉันก็ได้ สนุกกว่าอยู่ตรงนี้เยอะ', next: 'right2', xp: 28 },
      ],
    },
    {
      type: 'dialogue', id: 'right2', speaker: 'friend2', next: 'mg1',
      text: 'เออ! ไปกัน ฉันรู้ร้านชานมเด็ดๆ ที่หัวมุม ขอบใจมากนะที่ห้าม',
    },
    {
      type: 'minigame', id: 'mg1', game: 'order-cards',
      title: 'สูตรโน้มน้าวเพื่อน',
      cards: [
        { id: 'c1', text: 'ฟัง — เข้าใจว่าทำไมเขาถึงคิดอยากลอง' },
        { id: 'c2', text: 'เชื่อมโยง — โยงกับเรื่องส่วนตัวของเขา' },
        { id: 'c3', text: 'เสนอ — ทางเลือกที่สนุก/ดีกว่า' },
        { id: 'c4', text: 'ยืนยัน — ย้ำว่าเรายังเป็นเพื่อนกัน' },
      ],
      correctOrder: ['c1', 'c2', 'c3', 'c4'],
      next: 'feedback1',
      xpOnSuccess: 90,
      badge: 'reasoning',
      source: 'Miller & Rollnick — Motivational Interviewing (3rd Ed.) / WHO Adolescent Health',
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'Detective\'s Note 📓',
      body: 'Motivational Interviewing (MI — เทคนิคสัมภาษณ์เพื่อสร้างแรงจูงใจ) ของ Miller & Rollnick เน้น "ฟัง → สะท้อน → เชื่อมโยงค่านิยม → เสนอทางเลือก". มันได้ผลเพราะคนเราต่อต้านเมื่อรู้สึกถูกสั่ง แต่ยอมเปลี่ยนเมื่อรู้สึกถูกเข้าใจและตัดสินใจเอง (autonomy). เริ่มด้วยคำถามเปิด อย่ารีบให้คำแนะนำก่อนเขาพร้อมฟัง',
      source: 'Miller & Rollnick — Motivational Interviewing: Helping People Change (Guilford Press, 3rd Ed., 2013)',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'end1',
      fact: 'งานวิจัยพบว่าวัยรุ่นที่มี "เพื่อนสนิทที่ไม่สูบ" มีโอกาสเริ่มสูบลดลงถึง 70%',
      source: 'WHO Youth Risk Behavior Study 2023',
    },
    {
      type: 'end', id: 'end1',
      title: 'จบด่าน 3!',
      message: 'คุณช่วยเพื่อนได้ — ทักษะ "ใช้เหตุผลโน้มน้าว" เพิ่มขึ้น',
      xp: 60,
      badge: 'stage-3-clear',
    },
  ],
  references: [
    'WHO Youth Risk Behavior Study 2023',
    'American Lung Association — Vaping and Youth (2023)',
    'Motivational Interviewing — Miller & Rollnick',
  ],
};
