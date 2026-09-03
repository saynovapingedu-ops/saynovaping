import type { Scenario } from '../types';
import { asset } from '../lib/asset';

// ด่าน 3 — ปาร์ตี้วันเกิด: ใช้เหตุผลโน้มน้าวเพื่อน
export const scenario03: Scenario = {
  id: 3,
  title: 'ปาร์ตี้วันเกิด',
  subtitle: 'ใช้เหตุผลโน้มน้าวเพื่อนให้ไม่ลอง',
  estMinutes: 7,
  startNode: 'intro1',
  intro: [
    'ในงานปาร์ตี้วันเกิดของเพื่อนร่วมห้อง',
    'เต้หยิบบุหรี่ไฟฟ้าออกมาตัวใหม่ ชวนเพื่อนๆ ลอง',
    'วินเริ่มลังเลและหันมาปรึกษาคุณ — คุณจะเตือนสติเพื่อนอย่างไร?',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'intro1', speaker: 'friend1', speakerName: 'เต้ (เพื่อนร่วมชั้น)', speakerAvatar: asset('characters/player-m1.png'), next: 'intro2',
      text: 'เฮ้ทุกคน! วันเกิดวันนี้เรามีของเจ๋งๆ มาฝากด้วย พอตรสสตรอว์เบอร์รี่ หอมมาก ลองคนละฟอดไหมล่ะ?',
    },
    {
      type: 'dialogue', id: 'intro2', speaker: 'friend2', speakerName: 'วิน (เพื่อนที่ลังเล)', speakerAvatar: asset('characters/player-m4.png'), next: 'intro3',
      text: '(หันมากระซิบถามคุณ) แก... ลองดีไหมอะ? เราก็ไม่เคยลองหรอกนะ แต่เห็นคนอื่นดูเฮฮากันดี',
    },
    {
      type: 'dialogue', id: 'intro3', speaker: 'narrator', next: 'choice1',
      text: 'วิน เพื่อนของคุณกำลังลังเล — ถ้าคุณช่วยเตือนสติเขาตอนนี้ อาจเปลี่ยนใจเขาได้',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'คุณจะพูดเตือนสติวินอย่างไร?',
      choices: [
        {
          label: 'อย่าลองเลยแก นิโคตินมันทำให้ติดง่ายนะ',
          next: 'okay1', xp: 15,
          reflection: 'เป็นเรื่องจริง แต่อาจฟังดูเหมือนการสั่งสอน ทำให้เพื่อนไม่เปิดใจ',
        },
        {
          label: 'แกอยากติดทีมฟุตบอลไม่ใช่เหรอ พอตพวกนี้ทำลายปอดนะ เดี๋ยววิ่งไม่ไหวหรอก',
          next: 'right1', xp: 30,
        },
        {
          label: 'แล้วแต่แกละกัน เราไม่ยุ่งด้วย',
          next: 'wrong1', xp: 0,
          reflection: 'เพื่อนแท้คือคนที่กล้าเตือนสติในเรื่องสำคัญ — การปล่อยเฉยๆ อาจทำให้เพื่อนเสียอนาคต',
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
      prompt: 'ลองเลือกแนวทางที่ใช้เหตุผลส่วนตัวของเพื่อน',
      choices: [
        { label: 'แกอยากคัดตัวติดทีมบอลใช่ไหม อันนี้มันทำลายสมรรถภาพปอดนะ เดี๋ยววิ่งไม่ครบคึ่งแน่', next: 'right1', xp: 25 },
        { label: 'เงินก็แพง สุขภาพก็เสีย ไม่คุ้มหรอกแก', next: 'right1', xp: 25 },
        { label: 'แกเคยบอกว่าอยากฟิตไม่ใช่เหรอ อันนี้มันสวนทางกับเป้าหมายแกเลยนะ', next: 'right1', xp: 28 },
      ],
    },
    {
      type: 'feedback', id: 'okay1', next: 'choice1c',
      title: 'พอใช้ได้ แต่...',
      body: 'การพูดแบบทั่วไปมักไม่ตรงใจ — ลองโยงกับเรื่องส่วนตัวของเพื่อน เช่น เป้าหมาย ครอบครัว หรือสิ่งที่เขารัก',
    },
    {
      type: 'choice', id: 'choice1c', speaker: 'player',
      prompt: 'เลือกใหม่ — เน้นเป้าหมายความฝันของเพื่อน',
      choices: [
        { label: 'แกซ้อมบอลมาตั้งนาน อย่าให้พอตอันเดียวทำลายความฝันเลย', next: 'right1', xp: 25 },
        { label: 'เก็บเงินไว้ซื้อสตั๊ดคู่ใหม่ที่อยากได้ดีกว่าแก', next: 'right1', xp: 25 },
        { label: 'จำที่แกตั้งใจจะพาทีมโรงเรียนคว้าแชมป์ได้ไหม สิ่งนี้จะขัดขวางแกนะ', next: 'right1', xp: 28 },
      ],
    },
    {
      type: 'dialogue', id: 'right1', speaker: 'friend2', speakerName: 'วิน (เพื่อนที่ลังเล)', speakerAvatar: asset('characters/player-m4.png'), next: 'choice2',
      text: '...เออ จริงของแกว่ะ เราอยากติดทีมบอล ไม่อยากให้ปอดพังตั้งแต่ตอนนี้',
    },
    {
      type: 'choice', id: 'choice2', speaker: 'player',
      prompt: 'ตอนนี้วินเริ่มคิดได้ — เสริมอย่างไรให้เขารู้สึกสบายใจและไม่เสียหน้า?',
      choices: [
        {
          label: 'ปะ งั้นเราออกไปหาของอร่อยกินตรงมุมเค้กกันดีกว่า ชวนเพื่อนๆ ด้วย',
          next: 'right2', xp: 30,
        },
        {
          label: 'แกเก่งอยู่แล้ว ไม่จำเป็นต้องทำตามใครหรอก',
          next: 'right2', xp: 25,
        },
        {
          label: 'ถ้าแกแอบลองแล้วครูจับได้ แกจะโดนตัดสิทธิ์แข่งนะ',
          next: 'okay2', xp: 15,
          reflection: 'การใช้ความกลัวเตือนได้ผลชั่วคราว แต่การให้ทางออกเชิงบวกจะดีต่อมิตรภาพมากกว่า',
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
      prompt: 'เลือกแนวทางที่เสนอทางเลือกสนุกๆ ร่วมกัน',
      choices: [
        { label: 'ปะ งั้นเราออกไปหาของอร่อยกินตรงมุมเค้กกันดีกว่า ชวนเพื่อนๆ ด้วย', next: 'right2', xp: 25 },
        { label: 'เดี๋ยวเลิกงานนี้ไปกินชานมหน้าปากซอยกัน เราเลี้ยงเอง', next: 'right2', xp: 25 },
        { label: 'ปะ ไปเล่นเกมกระดานตรงโน้นกัน สนุกกว่าเยอะ', next: 'right2', xp: 28 },
      ],
    },
    {
      type: 'dialogue', id: 'right2', speaker: 'friend2', speakerName: 'วิน (เพื่อนที่ลังเล)', speakerAvatar: asset('characters/player-m4.png'), next: 'mg1',
      text: 'เออ! ไปดิ เค้กร้านนี้น่ากินมาก ขอบใจแกมากนะที่ช่วยเตือนสติเรา!',
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
      title: 'บันทึกนักสืบ 📓',
      body: 'จะห้ามเพื่อนให้ได้ผล: ฟังเขาก่อน → โยงกับสิ่งที่เขาแคร์ → ชวนไปทำอย่างอื่น 🤝\nคนเราต่อต้านเวลาถูกสั่ง แต่ยอมเปลี่ยนเมื่อรู้สึกว่าเราเข้าใจเขา\nอย่าเพิ่งรีบสอน ถามเขาก่อนว่าคิดยังไง',
      source: 'Motivational Interviewing — Miller & Rollnick (Guilford Press, 3rd Ed., 2013)',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'end1',
      fact: 'งานวิจัยพบว่าวัยรุ่นที่มี "เพื่อนสนิทที่ไม่สูบ" มีโอกาสเริ่มสูบลดลงถึง 70%',
      source: 'WHO Youth Risk Behavior Study 2023',
    },
    {
      type: 'end', id: 'end1',
      title: 'จบด่าน 3!',
      message: 'คุณช่วยเพื่อนได้ — ทักษะ "ใช้เหตุผลโน้มน้าว" เพิ่มขึ้น\n\n🏬 วันถัดมาหลังเลิกเรียน เพื่อนชวนแวะห้าง... ชั้นใต้ดินมีร้านที่ซ่อนอะไรบางอย่างไว้',
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
