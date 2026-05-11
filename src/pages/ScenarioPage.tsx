import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getScenarioById, SCENARIO_META, isStageUnlocked } from '../scenarios';
import { getBadge } from '../lib/badges';
import { usePlayerStore } from '../store/playerStore';
import { useUIStore } from '../store/uiStore';
import DialogueBubble from '../components/DialogueBubble';
import ChoiceCard from '../components/ChoiceCard';
import SpotTheLie from '../components/minigames/SpotTheLie';
import OrderCards from '../components/minigames/OrderCards';
import WordMatch from '../components/minigames/WordMatch';
import FillBlank from '../components/minigames/FillBlank';
import SwipeDecide from '../components/minigames/SwipeDecide';
import MemoryMatch from '../components/minigames/MemoryMatch';
import RiskRank from '../components/minigames/RiskRank';
import Confetti from '../components/Confetti';
import { sfx, vibrate } from '../lib/sound';
import { useProgressStore } from '../store/progressStore';
import type { Choice, ScenarioNode } from '../types';

export default function ScenarioPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const stageId = Number(id);
  const scenario = getScenarioById(stageId);
  const addXP = usePlayerStore(s => s.addXP);
  const awardBadge = usePlayerStore(s => s.awardBadge);
  const completeStage = usePlayerStore(s => s.completeStage);
  const pushXP = useUIStore(s => s.pushXP);
  const pushBadge = useUIStore(s => s.pushBadge);

  const [showIntro, setShowIntro] = useState(true);
  const [history, setHistory] = useState<ScenarioNode[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string>(scenario?.startNode || '');
  const [confettiActive, setConfettiActive] = useState(false);
  const [askResume, setAskResume] = useState(false);

  const saveProgress  = useProgressStore(s => s.saveProgress);
  const getProgress   = useProgressStore(s => s.getProgress);
  const clearProgress = useProgressStore(s => s.clearProgress);

  // reset state เมื่อเปลี่ยน stage + เช็คว่ามี save ค้างไว้ไหม
  useEffect(() => {
    setHistory([]);
    setCurrentNodeId(scenario?.startNode || '');
    const saved = getProgress(stageId);
    if (saved && scenario) {
      // ตรวจสอบว่า save ยัง valid (node ยังอยู่)
      const nodeExists = scenario.nodes.some(n => n.id === saved.currentNodeId);
      if (nodeExists && saved.currentNodeId !== scenario.startNode) {
        setAskResume(true);
        setShowIntro(true);
        return;
      }
    }
    setAskResume(false);
    setShowIntro(true);
  }, [stageId, scenario, getProgress]);

  // กดเล่นต่อจาก save
  const handleResume = () => {
    const saved = getProgress(stageId);
    if (!saved || !scenario) return;
    // คืน history จาก historyIds + reconstruct player echoes
    const restored: ScenarioNode[] = [];
    for (const id of saved.historyIds) {
      if (id.startsWith('__pick_')) {
        // re-create player echo
        const sourceNodeId = id.split('_')[2];
        const text = saved.pickedChoices[sourceNodeId];
        if (text) {
          restored.push({
            type: 'dialogue', id, speaker: 'player', text, next: '',
          });
        }
      } else {
        const n = scenario.nodes.find(node => node.id === id);
        if (n) restored.push(n);
      }
    }
    setHistory(restored);
    setCurrentNodeId(saved.currentNodeId);
    setShowIntro(false);
    setAskResume(false);
    sfx.click();
  };

  const handleStartFresh = () => {
    clearProgress(stageId);
    setAskResume(false);
    setShowIntro(true);
    setHistory([]);
    setCurrentNodeId(scenario?.startNode || '');
  };

  // auto-save ทุกครั้งที่ history เปลี่ยน (ยกเว้นเมื่อจบด่าน)
  useEffect(() => {
    if (!scenario || showIntro || history.length === 0) return;
    const cur = scenario.nodes.find(n => n.id === currentNodeId);
    if (!cur || cur.type === 'end') return;
    saveProgress({
      stageId,
      currentNodeId,
      historyIds: history.map(h => h.id),
      pickedChoices: history.reduce<Record<string, string>>((acc, h) => {
        if (h.id.startsWith('__pick_') && h.type === 'dialogue') {
          const sourceNodeId = h.id.split('_')[2];
          acc[sourceNodeId] = h.text;
        }
        return acc;
      }, {}),
    });
  }, [history, currentNodeId, stageId, scenario, showIntro, saveProgress]);

  useEffect(() => {
    if (!scenario) return;
    if (!showIntro && history.length === 0) {
      const startNode = scenario.nodes.find(n => n.id === scenario.startNode);
      if (startNode) {
        setHistory([startNode]);
        setCurrentNodeId(startNode.id);
      }
    }
  }, [showIntro, scenario, history.length]);

  // ตอนเข้าหน้า end → เล่น confetti + เสียงชัยชนะ
  useEffect(() => {
    const node = scenario?.nodes.find(n => n.id === currentNodeId);
    if (node?.type === 'end') {
      setConfettiActive(true);
      sfx.victory();
      vibrate([30, 50, 30, 50, 60]);
      const t = setTimeout(() => setConfettiActive(false), 2600);
      return () => clearTimeout(t);
    }
  }, [currentNodeId, scenario]);

  if (!scenario) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-600 mb-4">ด่านนี้ยังไม่พร้อมเล่น</p>
        <button onClick={() => nav('/')} className="btn-primary">กลับหน้าแรก</button>
      </div>
    );
  }

  const currentNode = scenario.nodes.find(n => n.id === currentNodeId);

  const goToNext = (nextId: string) => {
    const next = scenario.nodes.find(n => n.id === nextId);
    if (!next) return;
    setHistory(prev => [...prev, next]);
    setCurrentNodeId(nextId);
  };

  const handleChoice = (choice: Choice) => {
    sfx.pick();
    vibrate(15);
    if (choice.xp && choice.xp > 0) {
      addXP(choice.xp);
      pushXP(choice.xp);
      sfx.xp();
    }
    if (choice.badge) {
      const newly = awardBadge(choice.badge);
      const b = getBadge(choice.badge);
      if (newly && b) {
        pushBadge(b.name, b.emoji);
        sfx.badge();
        vibrate([20, 40, 20]);
      }
    }
    // แสดง choice ที่เลือก เป็น bubble ฝั่งผู้เล่น (เหมือนแชท Messenger/LINE)
    const playerEcho: ScenarioNode = {
      type: 'dialogue',
      id: `__pick_${currentNodeId}_${Date.now()}`,
      speaker: 'player',
      text: choice.label,
      next: choice.next,
    };
    const next = scenario.nodes.find(n => n.id === choice.next);
    if (next) {
      setHistory(prev => [...prev, playerEcho, next]);
      setCurrentNodeId(choice.next);
    }
  };

  const handleMinigameComplete = (success: boolean) => {
    if (!currentNode || currentNode.type !== 'minigame') return;
    if (success) {
      sfx.correct();
      vibrate([20, 30, 20]);
      addXP(currentNode.xpOnSuccess);
      pushXP(currentNode.xpOnSuccess);
      if (currentNode.badge) {
        const newly = awardBadge(currentNode.badge);
        const b = getBadge(currentNode.badge);
        if (newly && b) {
          pushBadge(b.name, b.emoji);
          sfx.badge();
        }
      }
    } else {
      sfx.wrong();
      vibrate(50);
      // ตอบไม่ครบ — ให้ XP บางส่วน
      const partial = Math.floor(currentNode.xpOnSuccess / 2);
      addXP(partial);
      pushXP(partial);
    }
    goToNext(currentNode.next);
  };

  // claim XP/badge เมื่อจบด่าน (ไม่ navigate)
  const claimEndRewards = () => {
    if (!currentNode || currentNode.type !== 'end') return;
    addXP(currentNode.xp);
    pushXP(currentNode.xp);
    if (currentNode.badge) {
      const newly = awardBadge(currentNode.badge);
      const b = getBadge(currentNode.badge);
      if (newly && b) pushBadge(b.name, b.emoji);
    }
    completeStage(stageId);
    clearProgress(stageId);  // ลบ save mid-stage หลังจบ
  };

  // ไปด่านถัดไป — useEffect บน stageId จะ reset state ให้อัตโนมัติ
  const goNextStage = (nextId: number) => {
    claimEndRewards();
    nav(`/scenario/${nextId}`, { replace: true });
  };

  const goHome = () => {
    claimEndRewards();
    nav('/');
  };

  // หาด่านถัดไปที่จะปลดล็อกหลังจบด่านนี้
  const completedAfter = (() => {
    const cur = usePlayerStore.getState().stagesCompleted;
    return cur.includes(stageId) ? cur : [...cur, stageId];
  })();
  const nextMeta = SCENARIO_META.find(m => m.unlockAfter === stageId);
  const canPlayNext = nextMeta && nextMeta.available && isStageUnlocked(nextMeta.id, completedAfter);

  // ---- Intro screen ----
  if (showIntro) {
    return (
      <div className="min-h-screen flex flex-col p-6 max-w-md mx-auto relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-10 -right-20 w-72 h-72 bg-detective-300/30 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-10 -left-16 w-64 h-64 bg-warning-500/20 rounded-full blur-3xl" />
        </div>

        <button
          onClick={() => nav('/')}
          className="self-start text-detective-500 font-semibold mb-4 active:opacity-70"
        >
          ← กลับ
        </button>

        <div className="flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="self-start mb-3 inline-flex items-center gap-2 bg-gradient-to-r from-detective-500
                       to-detective-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-glow"
          >
            <span>🎯</span> ด่านที่ {scenario.id}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-display font-bold text-detective-700 mb-2 leading-tight"
          >
            {scenario.title}
          </motion.h1>
          {scenario.subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 mb-6"
            >
              {scenario.subtitle}
            </motion.p>
          )}

          <div className="space-y-3 mb-6">
            {(scenario.intro || []).map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.35 }}
                className="card-hero relative pl-5"
              >
                <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b
                                 from-detective-500 to-warning-500 rounded-l-2xl" />
                <p className="text-gray-700 leading-relaxed">{line}</p>
              </motion.div>
            ))}
          </div>
        </div>
        {askResume ? (
          <div className="space-y-2">
            <div className="card-hero text-center">
              <p className="text-sm text-detective-700 font-semibold mb-1">💾 พบข้อมูลที่บันทึกไว้</p>
              <p className="text-xs text-gray-500">เล่นต่อจากตำแหน่งล่าสุด หรือเริ่มใหม่ทั้งด่าน?</p>
            </div>
            <button onClick={handleResume} className="btn-primary w-full text-base">
              ▶ เล่นต่อจากที่ค้างไว้
            </button>
            <button onClick={handleStartFresh} className="btn-secondary w-full">
              🔄 เริ่มใหม่ทั้งด่าน
            </button>
          </div>
        ) : (
          <button
            onClick={() => { sfx.click(); setShowIntro(false); }}
            className="btn-primary w-full text-base"
          >
            เริ่มภารกิจ →
          </button>
        )}
      </div>
    );
  }

  // ---- Game loop ----
  return (
    <div className="min-h-full pb-8 relative">
      <Confetti active={confettiActive} count={100} duration={2600} />
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 -right-32 w-80 h-80 bg-detective-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-64 h-64 bg-warning-500/15 rounded-full blur-3xl" />
      </div>
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md shadow-sm border-b border-detective-100/50
                         p-3 flex items-center gap-3">
        <button
          onClick={() => nav('/')}
          className="text-detective-500 px-3 py-1.5 rounded-lg hover:bg-detective-50 active:scale-95"
        >
          ←
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-detective-400 font-semibold">ด่าน {scenario.id}</p>
          <p className="font-semibold text-sm text-detective-700 truncate">{scenario.title}</p>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        {/* แสดง history dialogue/feedback */}
        <div className="space-y-1 mb-4">
          <AnimatePresence>
            {history.slice(0, -1).map((node) => (
              node.type === 'dialogue' ? (
                <DialogueBubble key={node.id} speaker={node.speaker} text={node.text} />
              ) : node.type === 'feedback' ? (
                <motion.div key={node.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="card bg-warning-50 border-l-4 border-warning-500 mb-3">
                  <p className="font-semibold text-warning-600 mb-1">{node.title}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{node.body}</p>
                </motion.div>
              ) : node.type === 'educationalPopup' ? (
                <motion.div key={node.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="card bg-success-50 border-l-4 border-success-500 mb-3">
                  <p className="font-semibold text-success-600 mb-1">💡 รู้หรือไม่?</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{node.fact}</p>
                  <p className="text-xs text-gray-500 mt-1">📚 {node.source}</p>
                </motion.div>
              ) : null
            ))}
          </AnimatePresence>
        </div>

        {/* current node */}
        {currentNode && (
          <AnimatePresence mode="wait">
            <motion.div key={currentNode.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {currentNode.type === 'dialogue' && (
                <>
                  <DialogueBubble speaker={currentNode.speaker} text={currentNode.text} />
                  <button onClick={() => goToNext(currentNode.next)}
                    className="btn-primary w-full mt-2">ต่อไป →</button>
                </>
              )}

              {currentNode.type === 'choice' && (
                <div>
                  <div className="bg-gradient-to-r from-detective-50 to-warning-50 border-l-4
                                  border-detective-400 rounded-r-xl px-3 py-2 mb-3">
                    <p className="text-[11px] text-detective-500 font-semibold mb-0.5">เลือกคำตอบ</p>
                    <p className="text-sm text-detective-700 font-semibold leading-snug">
                      {currentNode.prompt}
                    </p>
                  </div>
                  {currentNode.choices.map((c, i) => (
                    <ChoiceCard key={i} choice={c} index={i} onPick={handleChoice} />
                  ))}
                </div>
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'spot-the-lie' && currentNode.claims && (
                <SpotTheLie title={currentNode.title} claims={currentNode.claims}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'order-cards' && currentNode.cards && currentNode.correctOrder && (
                <OrderCards title={currentNode.title} cards={currentNode.cards}
                  correctOrder={currentNode.correctOrder}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'word-match' && currentNode.pairs && (
                <WordMatch title={currentNode.title} pairs={currentNode.pairs}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'fill-blank' && currentNode.questions && (
                <FillBlank title={currentNode.title} questions={currentNode.questions}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'swipe-decide' && currentNode.swipeCards && (
                <SwipeDecide title={currentNode.title} cards={currentNode.swipeCards}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'memory-match' && currentNode.memoryPairs && (
                <MemoryMatch title={currentNode.title} pairs={currentNode.memoryPairs}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'risk-rank' && currentNode.buckets && currentNode.riskItems && (
                <RiskRank title={currentNode.title} buckets={currentNode.buckets}
                  items={currentNode.riskItems}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'feedback' && (
                <>
                  <div className="card bg-warning-50 border-l-4 border-warning-500 mb-3">
                    <p className="font-semibold text-warning-600 mb-1">{currentNode.title}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{currentNode.body}</p>
                  </div>
                  <button onClick={() => goToNext(currentNode.next)} className="btn-primary w-full">
                    ต่อไป →
                  </button>
                </>
              )}

              {currentNode.type === 'educationalPopup' && (
                <>
                  <div className="card bg-success-50 border-l-4 border-success-500 mb-3">
                    <p className="font-semibold text-success-600 mb-1">💡 รู้หรือไม่?</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{currentNode.fact}</p>
                    <p className="text-xs text-gray-500 mt-1">📚 {currentNode.source}</p>
                  </div>
                  <button onClick={() => goToNext(currentNode.next)} className="btn-primary w-full">
                    ต่อไป →
                  </button>
                </>
              )}

              {currentNode.type === 'end' && (
                <div className="relative card-hero text-center py-10 overflow-hidden">
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-warning-500/20 rounded-full blur-2xl" />
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-detective-300/30 rounded-full blur-2xl" />
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="text-7xl mb-3 relative inline-block"
                  >
                    🎉
                  </motion.div>
                  <h2 className="font-display text-2xl font-bold text-detective-700 mb-2 relative">
                    {currentNode.title}
                  </h2>
                  <p className="text-gray-600 mb-6 leading-relaxed relative">{currentNode.message}</p>
                  <motion.p
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                    className="inline-block bg-gradient-to-r from-warning-400 to-warning-500
                               text-white font-bold text-xl px-6 py-2 rounded-full shadow-glow mb-6 relative"
                  >
                    +{currentNode.xp} XP
                  </motion.p>

                  <div className="space-y-2 relative">
                    {canPlayNext && nextMeta && (
                      <button
                        onClick={() => goNextStage(nextMeta.id)}
                        className="btn-primary w-full"
                      >
                        ▶ ไปด่าน {nextMeta.id}: {nextMeta.title}
                      </button>
                    )}
                    <button
                      onClick={goHome}
                      className={canPlayNext ? 'btn-secondary w-full' : 'btn-primary w-full'}
                    >
                      🏠 กลับหน้าหลัก
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
