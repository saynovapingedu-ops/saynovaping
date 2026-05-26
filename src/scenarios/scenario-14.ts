import type { Scenario } from '../types';

// ด่าน 14 (Pro 2) — TikTok Detective: ปัดจริง/เท็จในคลิป
export const scenario14: Scenario = {
  id: 14,
  title: 'TikTok ขุดความจริง',
  subtitle: 'เชี่ยวชาญ 2 — ตัดสินจริง/เท็จแบบเร็ว',
  estMinutes: 6,
  startNode: 'd1',
  intro: [
    '📱 Pro 2 — ทักษะรู้เท่าทันสื่อแบบไว',
    'ปาล์มส่งภาพคลิป TikTok ที่กำลังไวรัล — มีข้อกล่าวอ้างเรื่องบุหรี่ไฟฟ้ามากมาย',
    'นักสืบต้อง "ปัด" คัดความจริงออกจากความเท็จ ในเวลาอันสั้น',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'd1', speaker: 'friend1', next: 'd2',
      text: 'พี่! TikTok ตอนนี้มีคลิปบอกเรื่องบุหรี่ไฟฟ้าเยอะมาก — บางอันก็เชื่อ บางอันก็ไม่เชื่อ ช่วยสอนหนูแยกหน่อย!',
    },
    {
      type: 'dialogue', id: 'd2', speaker: 'narrator', next: 'mg1',
      text: 'นักสืบเปิดฟีดและเริ่ม — "ปัดขวา = จริง, ปัดซ้าย = เท็จ" ทีละคลิป',
    },
    // มินิเกมหลัก — SwipeDecide
    {
      type: 'minigame', id: 'mg1', game: 'swipe-decide',
      title: 'ปัด TikTok แห่งความจริง',
      swipeCards: [
        {
          text: 'บุหรี่ไฟฟ้าช่วยให้นอนหลับสบายขึ้น',
          isTrue: false,
          reveal: 'เท็จ — นิโคตินในบุหรี่ไฟฟ้าเป็นสารกระตุ้น รบกวนวงจรการนอนและทำให้ตื่นกลางดึก',
          emoji: '😴',
          source: 'Sleep Research Society — Nicotine & Sleep Disruption 2022',
        },
        {
          text: 'กลิ่นรสผลไม้ในบุหรี่ไฟฟ้าออกแบบมาเพื่อดึงดูดเยาวชน',
          isTrue: true,
          reveal: 'จริง — รายงาน CDC ปี 2023 ยืนยันว่ารสผลไม้/ขนมเป็นกลยุทธ์ตลาดเยาวชน',
          emoji: '🍓',
          source: 'CDC Youth Vaping Report 2023',
        },
        {
          text: 'ไอน้ำของบุหรี่ไฟฟ้าเป็นแค่ไอน้ำ ไม่อันตราย',
          isTrue: false,
          reveal: 'เท็จ — ไอน้ำมีโลหะหนัก (นิกเกิล/ตะกั่ว) สารระเหย และนิโคติน — ไม่ใช่น้ำเปล่า',
          emoji: '💨',
          source: 'American Lung Association 2023 / คณะแพทยศาสตร์ ม.มหิดล',
        },
        {
          text: 'การใช้บุหรี่ไฟฟ้าทุกวันในวัยรุ่น เพิ่มโอกาสติดบุหรี่ปกติ',
          isTrue: true,
          reveal: 'จริง — งานวิจัย Pediatrics 2023: เพิ่มโอกาสถึง 4 เท่า',
          emoji: '🚬',
          source: 'Pediatrics 2023 — Vape to Tobacco Transition Study',
        },
        {
          text: 'อายุ 18 ปีในไทย ซื้อบุหรี่ไฟฟ้าได้แล้ว',
          isTrue: false,
          reveal: 'เท็จ — บุหรี่ไฟฟ้าผิดกฎหมายในไทยทุกอายุ ตั้งแต่นำเข้าจนถึงครอบครอง',
          emoji: '⚖️',
          source: 'พ.ร.บ. ศุลกากร พ.ศ. 2560 + คำสั่ง คสช. ที่ 24/2557',
        },
        {
          text: 'การฟังเพื่อนระบายเรื่องเครียด ก่อนสอน = วิธีที่ดี',
          isTrue: true,
          reveal: 'จริง — สูตร "ฟัง-ยอมรับ-ห่วงใย-นำพา" (LVCL) เริ่มจาก "ฟัง" เสมอ',
          emoji: '👂',
          source: 'Mental Health First Aid (MHFA) Youth Module',
        },
        {
          text: 'นักร้องดังใส่บุหรี่ไฟฟ้าบนเวที = ปลอดภัย เพราะคนดังก็ใช้',
          isTrue: false,
          reveal: 'เท็จ — อินฟลูเอนเซอร์ (คนดังในโซเชียล) ≠ ผู้เชี่ยวชาญด้านสุขภาพ คนดังหลายคนได้ค่าโฆษณา',
          emoji: '🎤',
          source: 'รายงาน กสทช. 2566 — Influencer Marketing & Public Health',
        },
        {
          text: 'สายด่วนเลิกบุหรี่ 1600 ปรึกษาฟรี ไม่มีค่าใช้จ่าย',
          isTrue: true,
          reveal: 'จริง — 1600 คือ Quit Line ของศูนย์บริการเลิกบุหรี่ทางโทรศัพท์แห่งชาติ (กรมการแพทย์) คุยกับนักจิตวิทยา ปรึกษาเลิก vape/บุหรี่ ฟรี 24 ชม. เก็บข้อมูลเป็นความลับ',
          emoji: '☎️',
          source: 'ศูนย์บริการเลิกบุหรี่ทางโทรศัพท์แห่งชาติ (Quit Line)',
        },
      ],
      next: 'feedback1',
      xpOnSuccess: 120,
      badge: 'media-literate',
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'ปัดเก่งแล้ว!',
      body: 'การคิดเร็ว = ทักษะนักสืบยุคใหม่ — แต่ก่อนปัด ให้ถามตัวเอง "แหล่งอ้างอิงคือใคร?"',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'd-end',
      fact: 'TikTok และ Reels รายงานว่ามีคลิปเกี่ยวกับบุหรี่ไฟฟ้าที่ถูกตรวจสอบและลบออกจากระบบไปแล้วกว่า 1.4 ล้านคลิปในปี 2023 — แต่ก็ยังเหลืออีกหลายแสนคลิปที่ยังตรวจไม่พบ',
      source: 'TikTok Transparency Report 2023',
    },
    {
      type: 'dialogue', id: 'd-end', speaker: 'friend1', next: 'end1',
      text: 'ขอบคุณพี่! ตอนนี้หนูรู้แล้ว — ก่อนกดไลก์ ต้องคิดก่อนเลย ✨',
    },
    {
      type: 'end', id: 'end1',
      title: '📱 บทเชี่ยวชาญ 2 ผ่าน!',
      message: 'คุณคือนักสืบจับโกหกใน TikTok ตัวจริง — รู้เท่าทันสื่อแม้คลิปจะไหลเร็ว',
      xp: 90,
      badge: 'media-literate',
    },
  ],
  references: [
    'TikTok Transparency Report 2023',
    'CDC Youth Vaping Report 2023',
    'Pediatrics 2023 — Vape to Cigarette Transition',
    'รายงาน กสทช. 2566 — โฆษณาแฝงในโซเชียลมีเดีย',
    'กระทรวงสาธารณสุข — สายด่วน 1600',
  ],
};
