// ============================================================================
//  Types — Health Detective
// ============================================================================

export type SpeakerKey =
  | 'narrator' | 'player' | 'doctor' | 'baitoey' | 'vapor'
  | 'friend1' | 'friend2' | 'shopkeeper' | 'dm-stranger' | 'system';

export interface DialogueNode {
  type: 'dialogue';
  id: string;
  speaker: SpeakerKey;
  text: string;
  next: string;
}

export interface Choice {
  label: string;
  next: string;
  xp?: number;
  badge?: string;
  // ตัวเลือกถูก: ส่งผลด้านบวก
  // ตัวเลือกผิด: feedback น่ารักๆ ให้ลองใหม่
  reflection?: string;
}

export interface ChoiceNode {
  type: 'choice';
  id: string;
  prompt: string;
  speaker?: SpeakerKey;
  choices: Choice[];
}

export interface SpotTheLieClaim {
  text: string;
  isLie: boolean;
  reveal: string;
  source?: string;
}

export interface MinigameNode {
  type: 'minigame';
  id: string;
  game: 'spot-the-lie' | 'order-cards';
  title: string;
  // สำหรับ spot-the-lie
  claims?: SpotTheLieClaim[];
  // สำหรับ order-cards
  cards?: { id: string; text: string }[];
  correctOrder?: string[];
  next: string;
  xpOnSuccess: number;
  badge?: string;
}

export interface FeedbackNode {
  type: 'feedback';
  id: string;
  title: string;
  body: string;
  next: string;
}

export interface EduPopupNode {
  type: 'educationalPopup';
  id: string;
  fact: string;
  source: string;
  next: string;
}

export interface EndNode {
  type: 'end';
  id: string;
  title: string;
  message: string;
  xp: number;
  badge?: string;
}

export type ScenarioNode =
  | DialogueNode | ChoiceNode | MinigameNode
  | FeedbackNode | EduPopupNode | EndNode;

export interface Scenario {
  id: number;
  title: string;
  subtitle?: string;
  estMinutes: number;
  startNode: string;
  intro?: string[];
  nodes: ScenarioNode[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'skill' | 'progress' | 'social';
  emoji: string;
}

export interface PlayerProfile {
  userIdHash: string;       // SHA-256 ของ LINE userId (หรือ random ใน mock mode)
  nickname: string;
  grade: string;
  school?: string;
  avatar: number;           // 1-4 (preset emoji avatars)
  customAvatarId?: string;  // ถ้า set แปลว่ากำลังใช้รูปที่อัปโหลด (จาก avatarStore)
  totalXP: number;
  level: number;            // 1-5
  stagesCompleted: number[];
  badges: string[];
  certificateNo?: string;
  certificateIssuedAt?: string;
  createdAt: string;
  lastActiveAt: string;
  consentAt?: string;
}

// รูปอวตารที่ผู้เล่นอัปโหลด — เก็บเป็น base64 data URL ใน localStorage
export interface CustomAvatar {
  id: string;
  name: string;
  dataUrl: string;          // base64 data URL ของรูป
  createdAt: string;
}
