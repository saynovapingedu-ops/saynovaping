import { useEffect, useRef, useState, useCallback } from 'react';
import { sfx, vibrate } from '../../lib/sound';

// ============================================================================
//  RunnerGame — "วิ่งหนีบุหรี่ไฟฟ้า" เกมแนวไดโนเสาร์ Chrome (endless runner)
//  ใช้ได้ทั้งโหมดอาร์เคดเดี่ยว (ไม่กำหนด goalScore) และมินิเกมในด่าน (กำหนด goalScore)
// ============================================================================

interface Props {
  /** ถ้ากำหนด = โหมดมินิเกมในด่าน (ผ่านเมื่อหลบครบ goalScore ครั้ง) */
  goalScore?: number;
  /** เรียกเมื่อจบเกม — success = ถึงเป้า (โหมดด่าน) หรือ true เสมอ (โหมดอาร์เคด) */
  onComplete?: (success: boolean, score: number) => void;
  /** เกร็ดความรู้สุ่มโชว์ตอนจบ */
  facts?: string[];
}

const W = 640;
const H = 220;
const GROUND_Y = H - 34;
const PLAYER_X = 70;
const PLAYER_SIZE = 40;
const GRAVITY = 0.9;
const JUMP_V = -15;

const DEFAULT_FACTS = [
  'บุหรี่ไฟฟ้า 1 พอต อาจมีนิโคตินเท่าบุหรี่ 20 มวน',
  'ไอบุหรี่ไฟฟ้าไม่ใช่ "ไอน้ำ" — มีสารเคมีและโลหะหนัก',
  'ในไทย บุหรี่ไฟฟ้าผิดกฎหมาย นำเข้า/ขายมีโทษ',
  'ออกกำลังกาย + นอนพอ = ปอดและสมองแข็งแรงกว่า',
];

interface Obstacle { x: number; emoji: string; w: number; }

export default function RunnerGame({ goalScore, onComplete, facts }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'over' | 'win'>('ready');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [endFact, setEndFact] = useState('');

  // ===== mutable game state (refs — ไม่ trigger re-render รายเฟรม) =====
  const playerY = useRef(GROUND_Y - PLAYER_SIZE);
  const vy = useRef(0);
  const grounded = useRef(true);
  const obstacles = useRef<Obstacle[]>([]);
  const speed = useRef(6);
  const spawnTimer = useRef(0);
  const scoreRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef(0);
  const phaseRef = useRef<'ready' | 'playing' | 'over' | 'win'>('ready');

  const factList = facts && facts.length ? facts : DEFAULT_FACTS;

  const setPhaseBoth = (p: 'ready' | 'playing' | 'over' | 'win') => {
    phaseRef.current = p;
    setPhase(p);
  };

  const jump = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    if (grounded.current) {
      vy.current = JUMP_V;
      grounded.current = false;
      sfx.click();
      vibrate(10);
    }
  }, []);

  const reset = () => {
    playerY.current = GROUND_Y - PLAYER_SIZE;
    vy.current = 0;
    grounded.current = true;
    obstacles.current = [];
    speed.current = 5;
    spawnTimer.current = 30;
    scoreRef.current = 0;
    setScore(0);
  };

  const start = () => {
    reset();
    setPhaseBoth('playing');
  };

  const finish = (won: boolean) => {
    setPhaseBoth(won ? 'win' : 'over');
    setBest(b => Math.max(b, scoreRef.current));
    // สุ่มเกร็ดความรู้ตอนจบ (เลี่ยง Math.random ตามนโยบาย → ใช้คะแนนเป็น seed)
    setEndFact(factList[scoreRef.current % factList.length]);
    if (!won) { sfx.wrong(); vibrate(60); } else { sfx.victory(); }
    onComplete?.(won, scoreRef.current);
  };

  // ===== game loop =====
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const OBSTACLE_EMOJI = ['🚬', '💨', '🚬'];

    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (phaseRef.current !== 'playing') { draw(ctx); return; }
      const dt = lastTs.current ? Math.min((ts - lastTs.current) / 16.67, 2.5) : 1;
      lastTs.current = ts;

      // physics
      vy.current += GRAVITY * dt;
      playerY.current += vy.current * dt;
      const floor = GROUND_Y - PLAYER_SIZE;
      if (playerY.current >= floor) {
        playerY.current = floor; vy.current = 0; grounded.current = true;
      }

      // spawn obstacles
      spawnTimer.current -= dt;
      if (spawnTimer.current <= 0) {
        obstacles.current.push({ x: W + 20, emoji: OBSTACLE_EMOJI[obstacles.current.length % 3], w: 28 });
        // ระยะห่าง — แคบลงเล็กน้อยเมื่อเร็วขึ้น แต่ยังกระโดดทัน
        spawnTimer.current = 70 + ((scoreRef.current * 7) % 40);
      }

      // move + score + collision
      const px1 = PLAYER_X + 6, px2 = PLAYER_X + PLAYER_SIZE - 6;
      const py1 = playerY.current + 6, py2 = playerY.current + PLAYER_SIZE - 4;
      for (const o of obstacles.current) {
        o.x -= speed.current * dt;
        if (!('passed' in o) && o.x + o.w < PLAYER_X) {
          (o as Obstacle & { passed?: boolean }).passed = true;
          scoreRef.current += 1;
          setScore(scoreRef.current);
          speed.current = Math.min(11, 5 + scoreRef.current * 0.2);
          if (goalScore && scoreRef.current >= goalScore) { finish(true); return; }
        }
        const ox1 = o.x + 4, ox2 = o.x + o.w - 4;
        const oy1 = GROUND_Y - 30, oy2 = GROUND_Y;
        if (px2 > ox1 && px1 < ox2 && py2 > oy1 && py1 < oy2) { finish(false); return; }
      }
      obstacles.current = obstacles.current.filter(o => o.x > -50);

      draw(ctx);
    };

    const draw = (c: CanvasRenderingContext2D) => {
      c.clearRect(0, 0, W, H);
      // sky
      c.fillStyle = '#EAF4FF';
      c.fillRect(0, 0, W, H);
      // ground
      c.strokeStyle = '#9CC4E8';
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, GROUND_Y); c.lineTo(W, GROUND_Y); c.stroke();
      // player
      c.font = '34px serif';
      c.textBaseline = 'top';
      c.fillText('🕵️', PLAYER_X, playerY.current);
      // obstacles
      c.font = '26px serif';
      for (const o of obstacles.current) {
        c.fillText(o.emoji, o.x, GROUND_Y - 30);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [goalScore]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== keyboard control =====
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (phaseRef.current === 'playing') jump();
        else if (phaseRef.current === 'ready') start();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-detective-700">
          🏃 หลบบุหรี่ไฟฟ้า {goalScore ? `(เป้า ${goalScore})` : ''}
        </p>
        <p className="text-sm font-bold text-warning-600 tabular-nums">หลบได้ {score}</p>
      </div>

      <div
        className="relative w-full max-w-[360px] mx-auto h-[400px] rounded-[24px] overflow-hidden shadow-clay bg-[#EAF4FF] cursor-pointer"
        onPointerDown={() => { if (phase === 'playing') jump(); else if (phase === 'ready') start(); }}
      >
        <canvas ref={canvasRef} width={W} height={H} className="w-full h-full block" style={{ objectFit: 'contain', touchAction: 'none' }} />

        {/* overlay: ready */}
        {phase === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px] text-center px-4">
            <p className="text-3xl mb-1">🕵️➡️</p>
            <p className="font-display font-bold text-detective-800">แตะ / กด Space เพื่อกระโดด</p>
            <p className="text-xs text-slate-500 mt-1">หลบ 🚬 บุหรี่ไฟฟ้าให้ได้มากที่สุด</p>
            <button onClick={(e) => { e.stopPropagation(); start(); }} className="btn-primary mt-3 px-6">
              เริ่ม! ▶
            </button>
          </div>
        )}

        {/* overlay: over / win */}
        {(phase === 'over' || phase === 'win') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px] text-center px-4">
            <p className="text-2xl mb-1">{phase === 'win' ? '🏆 ผ่าน!' : '💥 ชนเข้าแล้ว!'}</p>
            <p className="font-display font-bold text-detective-800">หลบได้ {score} ครั้ง · สถิติ {best}</p>
            <p className="text-[11px] text-slate-600 mt-1 max-w-xs leading-snug">💡 {endFact}</p>
            {phase === 'over' && (
              <button onClick={(e) => { e.stopPropagation(); start(); }} className="btn-primary mt-3 px-6">
                เล่นอีกครั้ง 🔄
              </button>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); if (phase === 'playing') jump(); else if (phase !== 'win') start(); }}
        className="mt-3 w-full max-w-[360px] mx-auto block py-3.5 rounded-[18px] bg-detective-500 text-white font-bold text-lg shadow-clay-blue active:shadow-clay-pressed active:translate-y-px select-none touch-none"
      >
        ⬆️ กระโดด
      </button>
    </div>
  );
}
