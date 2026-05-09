// ============================================================================
//  Player Store — XP, Level, Badges, Progress + Auto cloud sync
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlayerProfile } from '../types';
import { syncProgress } from '../lib/cloudSync';
import { getLevelByXP } from '../lib/levels';

interface PlayerState extends PlayerProfile {
  // ----- mutations -----
  initProfile: (data: Partial<PlayerProfile>) => void;
  updateNickname: (nickname: string) => void;
  setUserHash: (hash: string) => void;
  setAvatar: (preset: number, customId?: string) => void;
  addXP: (amount: number) => void;
  awardBadge: (id: string) => boolean;
  completeStage: (stageId: number) => void;
  setCertificate: (no: string, issuedAt: string) => void;
  reset: () => void;

  // ----- internal -----
  isInitialized: boolean;
  setInitialized: (v: boolean) => void;
  syncIfReady: () => void;
}

const blankProfile = (): PlayerProfile => ({
  userIdHash: '',
  nickname: '',
  grade: '',
  school: '',
  avatar: 1,
  totalXP: 0,
  level: 1,
  stagesCompleted: [],
  badges: [],
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
});

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      ...blankProfile(),
      isInitialized: false,
      setInitialized: (v) => set({ isInitialized: v }),

      initProfile: (data) => {
        const cur = get();
        set({
          ...cur,
          ...data,
          createdAt: cur.createdAt || new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        });
        get().syncIfReady();
      },

      setUserHash: (hash) => {
        set({ userIdHash: hash });
      },

      updateNickname: (nickname) => {
        set({ nickname, lastActiveAt: new Date().toISOString() });
        get().syncIfReady();
      },

      setAvatar: (preset, customId) => {
        set({
          avatar: preset,
          customAvatarId: customId,
          lastActiveAt: new Date().toISOString(),
        });
        get().syncIfReady();
      },

      addXP: (amount) => {
        if (amount <= 0) return;
        const newXP = get().totalXP + amount;
        const newLevel = getLevelByXP(newXP).level;
        set({ totalXP: newXP, level: newLevel, lastActiveAt: new Date().toISOString() });
        get().syncIfReady();
      },

      awardBadge: (id) => {
        const cur = get();
        if (cur.badges.includes(id)) return false;
        set({ badges: [...cur.badges, id], lastActiveAt: new Date().toISOString() });
        get().syncIfReady();
        return true;
      },

      completeStage: (stageId) => {
        const cur = get();
        if (cur.stagesCompleted.includes(stageId)) return;
        set({
          stagesCompleted: [...cur.stagesCompleted, stageId].sort((a, b) => a - b),
          lastActiveAt: new Date().toISOString(),
        });
        get().syncIfReady();
      },

      setCertificate: (no, issuedAt) => {
        set({ certificateNo: no, certificateIssuedAt: issuedAt });
        get().syncIfReady();
      },

      reset: () => {
        set({ ...blankProfile(), isInitialized: false });
      },

      // ส่ง progress ไป Backend (เรียกอัตโนมัติทุกครั้งที่ state เปลี่ยน)
      // ใช้ debounce เบาๆ — ถ้าเรียกซ้ำในรอบเดียว ส่งครั้งเดียว
      syncIfReady: (() => {
        let timer: ReturnType<typeof setTimeout> | null = null;
        return () => {
          const s = usePlayerStore.getState();
          if (!s.userIdHash || !s.nickname) return;
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => {
            syncProgress({
              userIdHash: s.userIdHash,
              nickname: s.nickname,
              grade: s.grade,
              school: s.school,
              totalXP: s.totalXP,
              level: s.level,
              stagesCompleted: s.stagesCompleted,
              badges: s.badges,
            }).catch(() => { /* silent */ });
          }, 800);
        };
      })(),
    }),
    {
      name: 'hd_player',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        userIdHash: s.userIdHash,
        nickname: s.nickname,
        grade: s.grade,
        school: s.school,
        avatar: s.avatar,
        customAvatarId: s.customAvatarId,
        totalXP: s.totalXP,
        level: s.level,
        stagesCompleted: s.stagesCompleted,
        badges: s.badges,
        certificateNo: s.certificateNo,
        certificateIssuedAt: s.certificateIssuedAt,
        createdAt: s.createdAt,
        lastActiveAt: s.lastActiveAt,
        consentAt: s.consentAt,
        isInitialized: s.isInitialized,
      }),
    }
  )
);
