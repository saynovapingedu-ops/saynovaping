// ============================================================================
//  Admin Store — ระบบจัดการและตั้งค่าสำหรับอาจารย์ (Teacher Admin)
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const TEACHER_PASSCODE = 'wu2535';
export const DEFAULT_GOOGLE_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1djYg5itx5xvVubDCdznPaP6M6gE3sJEXAb-W9trs9Uw/edit?usp=sharing';

export interface StudentRecord {
  no: number;
  userIdHash: string;
  idCode: string;
  realName: string;
  nickname: string;
  lineName?: string;
  grade: string;
  school: string;
  // ก่อนเรียน
  preTestScore?: number;        // ความรู้ %
  preTestSkillScore?: number;   // ทักษะ เต็ม 100
  preTestAt?: string;
  // การเล่นเกม
  stagesCompletedCount: number;
  totalStages: number;
  totalXP: number;
  level: number;
  // หลังเรียน
  postTestScore?: number;       // ความรู้ %
  postTestSkillScore?: number;  // ทักษะ เต็ม 100
  postTestAt?: string;
  gainDelta?: number;           // postTestScore - preTestScore
  skillGainDelta?: number;      // postTestSkillScore - preTestSkillScore
  // การประเมินแชตบอต
  evalPart5Avg?: number;        // เฉลี่ยตอนที่ 5 (1.0 - 5.0)
  // เกียรติบัตร
  certificateNo?: string;
  certificateIssuedAt?: string;
  lastActiveAt: string;
}

export interface AdminSettings {
  // 1. การเข้าถึง Pre / Post Test
  preTestEnabled: boolean;
  postTestEnabled: boolean;
  allowBypassStages: boolean;

  // 2. การเปิด-ปิด และปรับความยาวแต่ละตอน (เพื่อลดเวลาเมื่อข้อสอบเยอะไป)
  part2Enabled: boolean;              // ตอนที่ 2: พฤติกรรมการใช้และประสบการณ์ (3 ข้อ)
  part3Enabled: boolean;              // ตอนที่ 3: แบบทดสอบความรู้ (21 ข้อ)
  knowledgeQuestionCount: number;     // จำนวนข้อความรู้ (21 = เต็มชุด, 10 = ฉบับย่อประหยัดเวลา)
  part4Enabled: boolean;              // ตอนที่ 4: แบบประเมินทักษะการปฏิเสธ (20 ข้อ)
  part5Enabled: boolean;              // ตอนที่ 5: แบบประเมินแชตบอต (7 ข้อ)

  // 3. ระบบทดสอบอื่นๆ ในเกม
  finalExamEnabled: boolean;          // แบบทดสอบรวมประจำหลักสูตร (หน้า /exam)
  dailyChallengeEnabled: boolean;     // ภารกิจควิซรายวัน (หน้า /daily)

  // 4. การแสดงผลและตัวช่วย
  showExplanations: boolean;          // แสดงเฉลยและคำอธิบายละเอียดหลังทำเสร็จ
  randomizeQuestions: boolean;        // สุ่มลำดับข้อสอบป้องกันการลอก
  googleSheetUrl: string;
}

interface AdminState extends AdminSettings {
  isTeacherAuthenticated: boolean;
  loginTeacher: (pass: string) => boolean;
  logoutTeacher: () => void;
  updateSettings: (settings: Partial<AdminSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: AdminSettings = {
  preTestEnabled: true,
  postTestEnabled: true,
  allowBypassStages: false,
  part2Enabled: true,
  part3Enabled: true,
  knowledgeQuestionCount: 21,
  part4Enabled: true,
  part5Enabled: true,
  finalExamEnabled: true,
  dailyChallengeEnabled: true,
  showExplanations: false,
  randomizeQuestions: false,
  googleSheetUrl: DEFAULT_GOOGLE_SHEET_URL,
};

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      isTeacherAuthenticated: false,

      loginTeacher: (pass: string) => {
        const ok = pass.trim() === TEACHER_PASSCODE;
        if (ok) {
          set({ isTeacherAuthenticated: true });
          sessionStorage.setItem('hd_teacher_auth', '1');
        }
        return ok;
      },

      logoutTeacher: () => {
        set({ isTeacherAuthenticated: false });
        sessionStorage.removeItem('hd_teacher_auth');
      },

      updateSettings: (newSettings) => {
        set((state) => ({ ...state, ...newSettings }));
      },

      resetSettings: () => {
        set({ ...defaultSettings });
      },
    }),
    {
      name: 'hd_admin_settings_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preTestEnabled: state.preTestEnabled,
        postTestEnabled: state.postTestEnabled,
        allowBypassStages: state.allowBypassStages,
        part2Enabled: state.part2Enabled,
        part3Enabled: state.part3Enabled,
        knowledgeQuestionCount: state.knowledgeQuestionCount,
        part4Enabled: state.part4Enabled,
        part5Enabled: state.part5Enabled,
        finalExamEnabled: state.finalExamEnabled,
        dailyChallengeEnabled: state.dailyChallengeEnabled,
        showExplanations: state.showExplanations,
        randomizeQuestions: state.randomizeQuestions,
        googleSheetUrl: state.googleSheetUrl,
      }),
    }
  )
);
