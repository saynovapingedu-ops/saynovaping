import { useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import RunnerGame from '../components/minigames/RunnerGame';
import TapAdsGame from '../components/minigames/TapAdsGame';
import CatchGame from '../components/minigames/CatchGame';
import ShootMythGame from '../components/minigames/ShootMythGame';
import QuickFireGame from '../components/minigames/QuickFireGame';
import FlappyGame from '../components/minigames/FlappyGame';
import LaneRunGame from '../components/minigames/LaneRunGame';
import SnakeGame from '../components/minigames/SnakeGame';
import MazeGame from '../components/minigames/MazeGame';
import JumpUpGame from '../components/minigames/JumpUpGame';
import GameErrorBoundary from '../components/minigames/GameErrorBoundary';
import { usePlayerStore } from '../store/playerStore';
import { sfx } from '../lib/sound';

// ============================================================================
//  Arcade — โหมดเกมสนุก (ไม่ใช่ข้อสอบ) เล่นซ้ำได้ เก็บแต้มจิ๊บๆ
//  ออกแบบให้เพิ่มเกมใหม่ได้ง่าย — เพิ่มใน GAMES + render ใน switch
// ============================================================================

type GameId =
  | 'runner' | 'catch-lungs'
  | 'shoot-myth' | 'quick-fire' | 'flappy' | 'lane-run'
  | 'snake' | 'maze' | 'jump-up';

interface GameMeta {
  id: GameId;
  emoji: string;
  title: string;
  desc: string;
  edu?: boolean;   // เกมที่ได้ความรู้
}

const GAMES: GameMeta[] = [
  { id: 'shoot-myth',  emoji: '🎯', title: 'ยิงจับเท็จ',        desc: 'แตะคำโฆษณาหลอก เว้นข้อมูลจริง', edu: true },
  { id: 'quick-fire',  emoji: '⚡', title: 'ตอบเร็วจับเวลา',    desc: 'จริง/เท็จรัวๆ แข่งกับเวลา',      edu: true },
  { id: 'runner',      emoji: '🏃', title: 'วิ่งหนีบุหรี่ไฟฟ้า', desc: 'กระโดดหลบ เหมือนเกมไดโนเสาร์' },
  { id: 'flappy',      emoji: '🐦', title: 'บินหลบท่อบุหรี่',   desc: 'แตะให้บินหลบท่อ' },
  { id: 'lane-run',    emoji: '🛹', title: 'รูดหลบ 3 เลน',       desc: 'ปัดซ้าย-ขวา หลบบุหรี่ เก็บน้ำ' },
  { id: 'jump-up',     emoji: '⬆️', title: 'กระโดดสะสมสุขภาพ',  desc: 'เด้งขึ้นแพลตฟอร์มให้สูงสุด' },
  { id: 'snake',       emoji: '🐍', title: 'งูกินของดี',         desc: 'บังคับงูกินน้ำ เลี่ยงบุหรี่' },
  { id: 'catch-lungs', emoji: '🫁', title: 'ปอดสะอาด',          desc: 'รับของดี หลบควันพิษ' },
  { id: 'maze',        emoji: '🧩', title: 'เขาวงกตหนีควัน',    desc: 'ลากตัวไปประตู เลี่ยงควัน หลายด่าน' },
];

export default function Arcade() {
  const [active, setActive] = useState<GameId | null>(null);
  const addCoins = usePlayerStore(s => s.addCoins);

  // เล่นจบรอบ → ให้เหรียญเล็กน้อยเป็นกำลังใจ (สูงสุด 10/รอบ, ไม่ให้แต้ม กันปั่นอันดับ)
  const handleRunnerEnd = (_success: boolean, score: number) => {
    const reward = Math.min(10, Math.floor(score / 3));
    if (reward > 0) addCoins(reward);
  };

  if (active) {
    const meta = GAMES.find(g => g.id === active)!;
    return (
      <div className="min-h-screen">
        <PageHeader title={`${meta.emoji} ${meta.title}`} subtitle="โหมดอาร์เคด" onBack={() => { sfx.click(); setActive(null); }} />
        <main className="max-w-md md:max-w-2xl mx-auto p-4">
          <GameErrorBoundary gameName={meta.title} onReset={() => setActive(null)}>
            {active === 'runner' && <RunnerGame onComplete={handleRunnerEnd} />}
            {active === 'catch-lungs' && <CatchGame onComplete={handleRunnerEnd} />}
            {active === 'shoot-myth' && <ShootMythGame onComplete={handleRunnerEnd} />}
            {active === 'quick-fire' && <QuickFireGame onComplete={handleRunnerEnd} />}
            {active === 'flappy' && <FlappyGame onComplete={handleRunnerEnd} />}
            {active === 'lane-run' && <LaneRunGame onComplete={handleRunnerEnd} />}
            {active === 'snake' && <SnakeGame onComplete={handleRunnerEnd} />}
            {active === 'maze' && <MazeGame onComplete={handleRunnerEnd} />}
            {active === 'jump-up' && <JumpUpGame onComplete={handleRunnerEnd} />}
          </GameErrorBoundary>
          <p className="text-[11px] text-slate-400 text-center mt-3">
            เล่นได้ไม่จำกัด · ทำคะแนนเยอะ ได้เหรียญเป็นกำลังใจ 🪙
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10">
      <PageHeader title="🎮 โซนเกมสนุก" subtitle="เล่นพักสมอง ไม่ใช่ข้อสอบ" backTo="/" />
      <main className="max-w-md md:max-w-2xl mx-auto p-4 space-y-3">
        {GAMES.map((g, i) => (
          <motion.button
            key={g.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => { sfx.click(); setActive(g.id); }}
            className="w-full text-left card flex items-center gap-3 py-4 active:scale-[0.98] hover:shadow-glow-sm"
          >
            <div className="icon-tile bg-gradient-to-br from-detective-500 to-detective-700 text-white text-2xl flex-shrink-0">
              {g.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-detective-800 flex items-center gap-1.5">
                {g.title}
                {g.edu && <span className="pill bg-mint-100 text-mint-600 text-[10px]">ได้ความรู้</span>}
              </p>
              <p className="text-xs text-slate-500 leading-snug">{g.desc}</p>
            </div>
            <span className="text-xs font-bold flex-shrink-0 text-detective-500">เล่น →</span>
          </motion.button>
        ))}
      </main>
    </div>
  );
}
