// ============================================================================
//  certNameStore — "ชื่อจริงสำหรับเกียรติบัตร" (local-only, encrypted at rest)
//
//  เก็บแยกจาก playerStore (ก้อน hd_player) เพื่อ:
//    1) เข้ารหัสเฉพาะก้อนนี้ (obfuscation ผ่าน certName cipher)
//    2) ไม่ให้ชื่อจริงหลุดเข้าไปใน sync payload ที่ส่งขึ้น server
//  ชื่อจริง "ไม่เคย" ถูกส่งออกจากเครื่อง
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { encodeName, decodeName } from '../lib/certName';

interface CertNameState {
  realName: string;
  setRealName: (name: string) => void;
  clearRealName: () => void;
}

// custom storage — เข้ารหัสทั้งก้อน JSON ตอนเขียน, ถอดตอนอ่าน
const encryptedStorage: StateStorage = {
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    return raw ? decodeName(raw) : null;
  },
  setItem: (name, value) => {
    localStorage.setItem(name, encodeName(value));
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

export const useCertNameStore = create<CertNameState>()(
  persist(
    (set) => ({
      realName: '',
      setRealName: (name) => set({ realName: name.trim() }),
      clearRealName: () => set({ realName: '' }),
    }),
    {
      name: 'hd_cert_name_v1',
      storage: createJSONStorage(() => encryptedStorage),
    }
  )
);
