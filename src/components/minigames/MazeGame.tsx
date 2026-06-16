import { useEffect, useRef, useState } from 'react';
import { sfx, vibrate } from '../../lib/sound';

// ============================================================================
//  MazeGame — "หนีควันไปให้ถึงประตู" ลากนักสืบเลี่ยงควัน หลายด่านยากขึ้นเรื่อยๆ
//  arcade = เล่นไม่จบ (เก็บด่าน) · ในสเตจ = ผ่านเมื่อถึง goalScore ด่าน
// ============================================================================

interface Props {
  goalScore?: number;
  onComplete?: (success: boolean, score: number) => void;
}

const W = 360;
const H = 320;
const PR = 14;
const SR = 18;

interface Smoke { x: number; y: number; vx: number; vy: number; }

export default function MazeGame({ goalScore, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over' | 'win'>('ready');
  const [level, setLevel] = useState(1);

  const player = useRef({ x: 28, y: H / 2 });
  const target = useRef({ x: 28, y: H / 2 });
  const door = useRef({ x: W - 24, y: H / 2 });
  const smoke = useRef<Smoke[]>([]);
  const levelRef = useRef(1);
  const grace = useRef(0);   // เฟรมปลอดภัยตอนเริ่มด่าน (ชนควันไม่นับ)
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef(0);
  const phaseRef = useRef<'ready' | 'playing' | 'over' | 'win'>('ready');

  const setPhaseBoth = (p: 'ready' | 'playing' | 'over' | 'win') => { phaseRef.current = p; setPhase(p); };

  const setupLevel = (lv: number) => {
    player.current = { x: 28, y: H / 2 }; target.current = { x: 28, y: H / 2 };
    grace.current = 45; // ~0.7 วินาที ให้ตั้งตัวก่อน ควันยังไม่ทำร้าย
    // ประตูสลับตำแหน่งแต่ละด่าน
    const ys = [H / 2, 60, H - 60, H / 3, (H * 2) / 3];
    door.current = { x: W - 24, y: ys[lv % ys.length] };
    const count = lv;               // ด่าน 1 = ควัน 1 ตัว แล้วเพิ่มทีละด่าน
    const spd = 1.3 + lv * 0.28;    // เร็วขึ้นทีละด่าน
    const arr: Smoke[] = [];
    for (let i = 0; i < count; i++) {
      const ang = ((i * 67 + 23) % 360) * Math.PI / 180;
      // เกิดในโซนกลาง-ขวา ห่างจากจุดเริ่ม (ซ้ายสุด) เสมอ
      arr.push({
        x: W * 0.45 + (i * 53) % (W * 0.45 - SR),
        y: 40 + (i * 71) % (H - 80),
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      });
    }
    smoke.current = arr;
  };

  const start = () => { levelRef.current = 1; setLevel(1); setupLevel(1); setPhaseBoth('playing'); };

  const die = () => { setPhaseBoth('over'); sfx.wrong(); vibrate(60); onComplete?.(goalScore ? levelRef.current - 1 >= goalScore : true, levelRef.current - 1); };
  const winAll = () => { setPhaseBoth('win'); sfx.victory(); onComplete?.(true, levelRef.current); };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (phaseRef.current === 'playing') {
        const dt = lastTs.current ? Math.min((ts - lastTs.current) / 16.67, 2.5) : 1;
        lastTs.current = ts;
        player.current.x += (target.current.x - player.current.x) * 0.25 * dt;
        player.current.y += (target.current.y - player.current.y) * 0.25 * dt;
        if (grace.current > 0) grace.current -= dt;
        for (const s of smoke.current) {
          s.x += s.vx * dt; s.y += s.vy * dt;
          if (s.x < SR || s.x > W - SR) s.vx *= -1;
          if (s.y < SR || s.y > H - SR) s.vy *= -1;
          if (grace.current <= 0 && Math.hypot(s.x - player.current.x, s.y - player.current.y) < SR + PR - 6) { die(); return; }
        }
        if (Math.hypot(door.current.x - player.current.x, door.current.y - player.current.y) < 26) {
          levelRef.current += 1; setLevel(levelRef.current); sfx.correct(); vibrate(12);
          if (goalScore && levelRef.current - 1 >= goalScore) { winAll(); return; }
          setupLevel(levelRef.current);
        }
      }
      // draw
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#EAF4FF'; ctx.fillRect(0, 0, W, H);
      // door
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(door.current.x - 12, door.current.y - 28, 26, 56);
      ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🚪', door.current.x + 1, door.current.y);
      // smoke
      ctx.font = '28px serif';
      for (const s of smoke.current) ctx.fillText('💨', s.x, s.y);
      // player (มีวงเขียวตอนช่วงปลอดภัย)
      if (grace.current > 0) {
        ctx.strokeStyle = '#22C55E'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(player.current.x, player.current.y, PR + 6, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.font = '24px serif';
      ctx.fillText('🕵️', player.current.x, player.current.y);
      ctx.textAlign = 'left';
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [goalScore]); // eslint-disable-line react-hooks/exhaustive-deps

  const moveTo = (clientX: number, clientY: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    target.current = {
      x: Math.max(PR, Math.min(W - PR, ((clientX - r.left) / r.width) * W)),
      y: Math.max(PR, Math.min(H - PR, ((clientY - r.top) / r.height) * H)),
    };
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-detective-700">🧩 เขาวงกตหนีควัน</p>
        <p className="text-sm font-bold text-warning-600 tabular-nums">ด่าน {level}{goalScore ? `/${goalScore}` : ''}</p>
      </div>
      <div
        className="relative rounded-2xl overflow-hidden border-2 border-detective-200 shadow-glow-sm"
        onPointerMove={(e) => phase === 'playing' && moveTo(e.clientX, e.clientY, e.currentTarget)}
        onPointerDown={(e) => phase === 'playing' && moveTo(e.clientX, e.clientY, e.currentTarget)}
      >
        <canvas ref={canvasRef} width={W} height={H} className="w-full block" style={{ touchAction: 'none' }} />
        {phase !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px] text-center px-4">
            <p className="text-2xl mb-1">{phase === 'win' ? '🏆 หนีรอดครบ!' : phase === 'over' ? '💨 โดนควัน!' : '🧩'}</p>
            <p className="font-display font-bold text-detective-800">
              {phase === 'ready' ? 'ลากนักสืบ 🕵️ ไปประตู 🚪 เลี่ยงควัน 💨' : `ผ่าน ${Math.max(0, level - 1)} ด่าน`}
            </p>
            <p className="text-xs text-slate-500 mt-1">ยิ่งด่านสูง ควันยิ่งเยอะและเร็วขึ้น</p>
            <button onClick={(e) => { e.stopPropagation(); start(); }} className="btn-primary mt-3 px-6">{phase === 'ready' ? 'เริ่ม! ▶' : 'เล่นอีกครั้ง 🔄'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
