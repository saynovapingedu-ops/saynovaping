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
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  awardItem: (id: string) => boolean;
  equipTitle: (title: string | undefined) => void;
  equipFrame: (frame: string | undefined) => void;
  equipTheme: (theme: string | undefined) => void;
  awardBadge: (id: string) => boolean;
  completeStage: (stageId: number) => void;
  setCertificate: (no: string, issuedAt: string) => void;
  /** เรียกตอนเล่นเกม — อัพเดท streak ถ้าเล่นต่อเนื่องได้ */
  pingDailyPlay: () => void;
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
  coins: 0,
  stagesCompleted: [],
  badges: [],
  ownedItems: [],
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
});

// helper: yyyy-mm-dd ในเขตเวลาท้องถิ่น
const todayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const dateDiffDays = (from: string, to: string) => {
  const a = new Date(from + 'T00:00:00').getTime();
  const b = new Date(to + 'T00:00:00').getTime();
  return Math.round((b - a) / 86400000);
};

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
        // ได้เหรียญ 1:5 ของ XP (ปัดลง)
        const coinReward = Math.floor(amount / 5);
        set({
          totalXP: newXP,
          level: newLevel,
          coins: (get().coins || 0) + coinReward,
          lastActiveAt: new Date().toISOString(),
        });
        get().syncIfReady();
      },

      addCoins: (amount) => {
        if (amount <= 0) return;
        set({ coins: (get().coins || 0) + amount });
        get().syncIfReady();
      },

      spendCoins: (amount) => {
        const cur = get().coins || 0;
        if (cur < amount) return false;
        set({ coins: cur - amount });
        get().syncIfReady();
        return true;
      },

      awardItem: (id) => {
        const cur = get();
        const owned = cur.ownedItems || [];
        if (owned.includes(id)) return false;
        set({ ownedItems: [...owned, id] });
        get().syncIfReady();
        return true;
      },

      equipTitle: (title) => set({ equippedTitle: title }),
      equipFrame: (frame) => set({ equippedFrame: frame }),
      equipTheme: (theme) => set({ equippedTheme: theme }),

      pingDailyPlay: () => {
        const cur = get();
        const today = todayDate();
        if (cur.lastPlayDate === today) return;  // เล่นวันนี้แล้ว
        let streak = 1;
        if (cur.lastPlayDate) {
          const diff = dateDiffDays(cur.lastPlayDate, today);
          if (diff === 1) streak = (cur.streakDays || 0) + 1;
          else streak = 1;  // หลุด streak
        }
        set({ lastPlayDate: today, streakDays: streak });
        // bonus เหรียญรายวัน 5 + streak (สูงสุด +20)
        const bonus = 5 + Math.min(streak, 20);
        set({ coins: (cur.coins || 0) + bonus });
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
        coins: s.coins,
        stagesCompleted: s.stagesCompleted,
        badges: s.badges,
        ownedItems: s.ownedItems,
        equippedTitle: s.equippedTitle,
        equippedFrame: s.equippedFrame,
        equippedTheme: s.equippedTheme,
        streakDays: s.streakDays,
        lastPlayDate: s.lastPlayDate,
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
