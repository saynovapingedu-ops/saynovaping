import type { Scenario } from '../types';

export const scenario01: Scenario = {
  id: 1,
  title: 'ความจริงที่ถูกซ่อน',
  subtitle: 'พี่หมอเก๋ชวนคุณค้นหาความจริงเกี่ยวกับบุหรี่ไฟฟ้า',
  estMinutes: 5,
  startNode: 'intro1',
  intro: [
    'วันแรกของภารกิจ พี่หมอเก๋นัดคุณที่ห้องสมุด',
    'มีโพสต์ในโลกออนไลน์อ้างหลายอย่างเกี่ยวกับบุหรี่ไฟฟ้า',
    'เราต้องช่วยกันหาว่าอะไรจริง อะไรเท็จ',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'intro1', speaker: 'doctor', next: 'intro2',
      text: 'สวัสดีนักสืบ! พี่หมอเก๋เอง วันนี้พี่มีโพสต์ในเฟซบุ๊กให้ดู — เป็นข้อความเกี่ยวกับบุหรี่ไฟฟ้าที่กำลังแชร์กันเยอะ',
    },
    {
      type: 'dialogue', id: 'intro2', speaker: 'doctor', next: 'intro3',
      text: 'หน้าที่ของเราคือดูว่าแต่ละข่าวสาร — จริงหรือเท็จ พร้อมไหม?',
    },
    {
      type: 'choice', id: 'intro3', speaker: 'player',
      prompt: 'คุณตอบพี่หมอเก๋ว่า...',
      choices: [
        { label: 'พร้อมครับ! ลุยเลย', next: 'mg1', xp: 10 },
        { label: 'ขอดูก่อนค่อยตอบ', next: 'mg1', xp: 5 },
      ],
    },
    {
      type: 'minigame', id: 'mg1', game: 'spot-the-lie',
      title: 'จริง หรือ เท็จ?',
      claims: [
        {
          text: '"บุหรี่ไฟฟ้าไม่มีนิโคติน เลยไม่เสพติด"',
          isLie: true,
          reveal: 'เท็จ — บุหรี่ไฟฟ้าส่วนใหญ่มีนิโคติน บางยี่ห้อมีปริมาณนิโคตินสูงกว่าบุหรี่มวน 1 มวนเสียอีก',
          source: 'ศูนย์วิจัยและจัดการความรู้เพื่อการควบคุมยาสูบ (ศจย.)',
        },
        {
          text: '"การสูบบุหรี่ไฟฟ้าทำลายปอดได้ ถึงแม้จะอ้างว่าเป็นแค่ไอน้ำ"',
          isLie: false,
          reveal: 'จริง — ไอที่ออกมามีสารเคมีอันตราย เช่น ฟอร์มาลดีไฮด์ (formaldehyde) และอะโครลีน (acrolein) ที่ทำลายเนื้อปอด มีรายงานโรค EVALI (โรคปอดอักเสบเฉียบพลันจากบุหรี่ไฟฟ้า)',
          source: 'CDC, US National Library of Medicine',
        },
        {
          text: '"ในประเทศไทย บุหรี่ไฟฟ้าผิดกฎหมาย — นำเข้าและขายมีโทษทั้งจำทั้งปรับ"',
          isLie: false,
          reveal: 'จริง — พ.ร.บ. ศุลกากร พ.ศ. 2560 และคำสั่ง คสช. ห้ามนำเข้า/ขาย/ครอบครอง โทษจำคุกสูงสุด 10 ปี',
          source: 'พ.ร.บ. ศุลกากร พ.ศ. 2560',
        },
      ],
      next: 'feedback1',
      xpOnSuccess: 80,
      badge: 'truth-finder',
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'บันทึกนักสืบ 📓',
      body: 'ก่อนกดแชร์ ถามตัวเองสั้นๆ: ใครเขียน? เชื่อถือได้ไหม? 🤔\nคนเรามักเชื่อสิ่งที่ตรงกับใจอยู่แล้ว เลยต้องเช็กให้ชัวร์\nเช็กจากเว็บหน่วยงานจริง เช่น ศจย., สสส., CDC, WHO ก่อนทุกครั้ง',
      source: 'CRAAP Test — Sarah Blakeslee, CSU Chico (2004) / WHO Tobacco Industry Marketing to Youth 2023',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'end1',
      fact: 'บุหรี่ไฟฟ้า 1 ตัวอาจมีนิโคตินเทียบเท่าบุหรี่มวน 20 มวน ทำให้ติดเร็วและรุนแรง',
      source: 'WHO Tobacco Free Initiative',
    },
    {
      type: 'end', id: 'end1',
      title: 'จบด่าน 1!',
      message: 'คุณค้นพบความจริงที่ถูกซ่อนได้แล้ว — ทักษะ "แยกแยะข้อมูล" ของคุณเพิ่มขึ้น\n\n🔎 พรุ่งนี้พักกลางวัน มีรุ่นพี่รออยู่ในห้องน้ำโรงเรียน... เขาจะยื่นอะไรให้เรานะ?',
      xp: 50,
      badge: 'stage-1-clear',
    },
  ],
  references: [
    'ศูนย์วิจัยและจัดการความรู้เพื่อการควบคุมยาสูบ (ศจย.)',
    'CDC — Centers for Disease Control and Prevention',
    'US National Library of Medicine — รายงาน EVALI',
    'WHO Tobacco Free Initiative',
    'พ.ร.บ. ศุลกากร พ.ศ. 2560 + คำสั่ง คสช.',
  ],
};
