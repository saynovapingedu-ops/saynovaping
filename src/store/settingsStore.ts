// ============================================================================
//  Settings Store — เสียง / ขนาดอักษร / สั่น / theme
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type FontSize = 'sm' | 'md' | 'lg';

interface SettingsState {
  soundEnabled: boolean;       // เสียงประกอบ (click/success/fail)
  musicEnabled: boolean;       // BGM (ปล่อยตอนเล่น scenario)
  vibrationEnabled: boolean;   // haptic feedback บนมือถือ
  fontSize: FontSize;
  reducedMotion: boolean;      // ลด animation สำหรับคนที่เวียนหัว

  toggleSound: () => void;
  toggleMusic: () => void;
  toggleVibration: () => void;
  setFontSize: (size: FontSize) => void;
  toggleReducedMotion: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      musicEnabled: false,         // ปิดเริ่มต้น (ไม่ทุกคนชอบ BGM)
      vibrationEnabled: true,
      fontSize: 'md',
      reducedMotion: false,

      toggleSound:        () => set(s => ({ soundEnabled: !s.soundEnabled })),
      toggleMusic:        () => set(s => ({ musicEnabled: !s.musicEnabled })),
      toggleVibration:    () => set(s => ({ vibrationEnabled: !s.vibrationEnabled })),
      setFontSize:        (fontSize) => set({ fontSize }),
      toggleReducedMotion:() => set(s => ({ reducedMotion: !s.reducedMotion })),
    }),
    {
      name: 'hd_settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
