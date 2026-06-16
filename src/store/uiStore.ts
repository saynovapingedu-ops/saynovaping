import { create } from 'zustand';

interface Toast {
  id: number;
  type: 'xp' | 'badge' | 'info';
  message: string;
  emoji?: string;
}

interface UIState {
  toasts: Toast[];
  pushXP: (amount: number) => void;
  pushBadge: (name: string, emoji: string) => void;
  pushInfo: (message: string, emoji?: string) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  pushXP: (amount) => {
    const id = ++counter;
    set(s => ({ toasts: [...s.toasts, { id, type: 'xp', message: `+${amount} แต้ม`, emoji: '⭐' }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 2500);
  },
  pushBadge: (name, emoji) => {
    const id = ++counter;
    set(s => ({ toasts: [...s.toasts, { id, type: 'badge', message: `ได้ Badge: ${name}`, emoji }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3500);
  },
  pushInfo: (message, emoji = 'ℹ️') => {
    const id = ++counter;
    set(s => ({ toasts: [...s.toasts, { id, type: 'info', message, emoji }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 3000);
  },
  dismiss: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
