import { useEffect, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { usePlayerStore } from '../store/playerStore';
import { SHOP_ITEMS } from '../lib/shopItems';

interface Props {
  /** เริ่มยิง confetti เมื่อ active = true (one-shot) */
  active: boolean;
  /** จำนวนชิ้น */
  count?: number;
  /** ระยะเวลา ms */
  duration?: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  angle: number;
  spin: number;
  color: string;
  shape: 'rect' | 'circle';
  alpha: number;
}

// palette default — ใช้เมื่อ player ไม่ได้สวม theme
const DEFAULT_COLORS = [
  '#008FFF', '#0072CC', '#ABDAFF', '#2BCAAB', '#F59E0B', '#FBBF24',
];

// ดอกไม้ไฟ canvas — ไม่ต้อง dependency ใดๆ
export default function Confetti({ active, count = 80, duration = 2400 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useSettingsStore(s => s.reducedMotion);
  // อ่าน theme ที่สวมอยู่ — ถ้าซื้อ theme แล้วสวม Confetti จะเปลี่ยนสีตาม
  const equippedTheme = usePlayerStore(s => s.equippedTheme);
  const COLORS = (equippedTheme
    ? SHOP_ITEMS.find(i => i.id === equippedTheme)?.themeColors
    : null) || DEFAULT_COLORS;

  useEffect(() => {
    if (!active || reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // สร้าง particles ยิงจากกึ่งกลางล่าง 2 จุด
    const parts: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const fromLeft = i < count / 2;
      parts.push({
        x: fromLeft ? w * 0.25 : w * 0.75,
        y: h * 0.6,
        vx: (Math.random() - 0.5) * 8 + (fromLeft ? 1.5 : -1.5),
        vy: -Math.random() * 9 - 6,
        size: 4 + Math.random() * 6,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        alpha: 1,
      });
    }

    const start = performance.now();
    let raf = 0;

    const draw = (t: number) => {
      const elapsed = t - start;
      ctx.clearRect(0, 0, w, h);

      parts.forEach(p => {
        // physics
        p.vy += 0.18;        // gravity
        p.vx *= 0.99;        // air drag
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.spin;
        p.alpha = Math.max(0, 1 - elapsed / duration);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      if (elapsed < duration) {
        raf = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };
    raf = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(raf);
  }, [active, count, duration, reduced, COLORS]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 w-full h-full"
      aria-hidden="true"
    />
  );
}
