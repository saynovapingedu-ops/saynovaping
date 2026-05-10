import type { Scenario } from '../types';

// ด่าน 14 (Pro 2) — TikTok Detective: ปัดจริง/เท็จในคลิป
export const scenario14: Scenario = {
  id: 14,
  title: 'TikTok ขุดความจริง',
  subtitle: 'Pro 2 — ตัดสินจริง/เท็จแบบเร็ว',
  estMinutes: 6,
  startNode: 'd1',
  intro: [
    '📱 Pro 2 — ทักษะรู้เท่าทันสื่อแบบไว',
    'ปาล์มส่งภาพคลิป TikTok ที่กำลังไวรัล — มีข้อกล่าวอ้างเรื่อง vape มากมาย',
    'นักสืบต้อง "ปัด" คัดความจริงออกจากความเท็จ ในเวลาอันสั้น',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'd1', speaker: 'friend1', next: 'd2',
      text: 'พี่! TikTok ตอนนี้มีคลิปบอกเรื่อง vape เยอะมาก — บางอันก็เชื่อ บางอันก็ไม่เชื่อ ช่วยสอนหนูแยกหน่อย!',
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
          text: 'vape ช่วยให้นอนหลับสบายขึ้น',
          isTrue: false,
          reveal: 'เท็จ — นิโคตินใน vape เป็นสารกระตุ้น รบกวนวงจรการนอนและทำให้ตื่นกลางดึก',
          emoji: '😴',
        },
        {
          text: 'กลิ่นรสผลไม้ใน vape ออกแบบมาเพื่อดึงดูดเยาวชน',
          isTrue: true,
          reveal: 'จริง — รายงาน CDC ปี 2023 ยืนยันว่ารสผลไม้/ขนมเป็นกลยุทธ์ตลาดเยาวชน',
          emoji: '🍓',
        },
        {
          text: 'ไอน้ำของ vape เป็นแค่ไอน้ำ ไม่อันตราย',
          isTrue: false,
          reveal: 'เท็จ — ไอน้ำมีโลหะหนัก (นิกเกิล/ตะกั่ว) สารระเหย และนิโคติน — ไม่ใช่น้ำเปล่า',
          emoji: '💨',
        },
        {
          text: 'การใช้ vape ทุกวันในวัยรุ่น เพิ่มโอกาสติดบุหรี่ปกติ',
          isTrue: true,
          reveal: 'จริง — งานวิจัย Pediatrics 2023: เพิ่มโอกาสถึง 4 เท่า',
          emoji: '🚬',
        },
        {
          text: 'อายุ 18 ปีในไทย ซื้อ vape ได้แล้ว',
          isTrue: false,
          reveal: 'เท็จ — vape ผิดกฎหมายในไทยทุกอายุ ตั้งแต่นำเข้าจนถึงครอบครอง',
          emoji: '⚖️',
        },
        {
          text: 'การฟังเพื่อนระบายเรื่องเครียด ก่อนสอน = วิธีที่ดี',
          isTrue: true,
          reveal: 'จริง — สูตร Listen-Validate-Care-Lead เริ่มจาก "ฟัง" เสมอ',
          emoji: '👂',
        },
        {
          text: 'นักร้องดังใส่ vape บนเวที = ปลอดภัย เพราะคนดังก็ใช้',
          isTrue: false,
          reveal: 'เท็จ — Influencer ≠ ผู้เชี่ยวชาญด้านสุขภาพ คนดังหลายคนได้ค่าโฆษณา',
          emoji: '🎤',
        },
        {
          text: 'สายด่วนเลิกบุหรี่ 1600 ปรึกษาฟรี ไม่มีค่าใช้จ่าย',
          isTrue: true,
          reveal: 'จริง — บริการของกระทรวงสาธารณสุข ตลอด 24 ชั่วโมง',
          emoji: '☎️',
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
      fact: 'TikTok และ Reels รายงานว่ามีคลิปเกี่ยวกับ vape ที่ผ่านการ moderate ออกแล้วกว่า 1.4 ล้านคลิปในปี 2023 — แต่ยังเหลืออีกหลายแสนคลิปในระบบ',
      source: 'TikTok Transparency Report 2023',
    },
    {
      type: 'dialogue', id: 'd-end', speaker: 'friend1', next: 'end1',
      text: 'ขอบคุณพี่! ตอนนี้หนูรู้แล้ว — ก่อนกดไลก์ ต้องคิดก่อนเลย ✨',
    },
    {
      type: 'end', id: 'end1',
      title: '📱 Pro 2 ผ่าน!',
      message: 'คุณคือ TikTok Detective ตัวจริง — รู้เท่าทันสื่อแม้คลิปจะไหลเร็ว',
      xp: 90,
      badge: 'media-literate',
    },
  ],
};
