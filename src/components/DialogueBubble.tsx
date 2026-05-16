import { motion } from 'framer-motion';
import type { SpeakerKey } from '../types';
import { usePlayerStore } from '../store/playerStore';
import Avatar from './Avatar';
import { NPC_CHARACTERS } from '../lib/characters';

// โทนสีบับเบิลของแต่ละ speaker — คุมโทน TMF: ฟ้า (player) / เขียว (หมอ) / เทา/ส้ม (NPC) / แดง (Vapor)
const SPEAKERS: Record<SpeakerKey, { name: string; emoji: string; align: 'left' | 'right'; bg: string }> = {
  narrator:      { name: 'เล่าเรื่อง',    emoji: '📖', align: 'left',  bg: 'bg-slate-100 text-slate-700 border border-slate-200' },
  player:        { name: 'คุณ',          emoji: '🧒', align: 'right', bg: 'bg-detective-600 text-white shadow-sm' },
  doctor:        { name: 'พี่หมอเก๋',     emoji: '👩‍⚕️', align: 'left',  bg: 'bg-mint-50 text-slate-800 border border-mint-200' },
  baitoey:       { name: 'น้องใบเตย',    emoji: '🌿', align: 'left',  bg: 'bg-warning-50 text-slate-800 border border-warning-200' },
  vapor:         { name: 'Vapor (ตัวร้าย)', emoji: '👤', align: 'left',  bg: 'bg-danger-50 text-slate-800 border border-danger-200' },
  friend1:       { name: 'เพื่อน',       emoji: '🧑', align: 'left',  bg: 'bg-detective-50 text-slate-800 border border-detective-200' },
  friend2:       { name: 'เพื่อน',       emoji: '👦', align: 'left',  bg: 'bg-detective-50 text-slate-800 border border-detective-200' },
  shopkeeper:    { name: 'เจ้าของร้าน',   emoji: '🧓', align: 'left',  bg: 'bg-warning-50 text-slate-800 border border-warning-200' },
  'dm-stranger': { name: 'คนใน DM',     emoji: '💬', align: 'left',  bg: 'bg-danger-50 text-slate-800 border border-danger-200' },
  system:        { name: 'ระบบ',        emoji: '⚙️', align: 'left',  bg: 'bg-slate-200 text-slate-700' },
};

interface Props {
  speaker: SpeakerKey;
  text: string;
}

export default function DialogueBubble({ speaker, text }: Props) {
  const s = SPEAKERS[speaker];
  const player = usePlayerStore();
  const isPlayer = speaker === 'player';
  // ตัวละครหลักที่มีรูป PNG จริง (หมอ + Vapor)
  const npc = NPC_CHARACTERS[speaker];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      className={`flex gap-2 mb-3 ${s.align === 'right' ? 'flex-row-reverse' : ''}`}
    >
      <div className="flex-shrink-0">
        {isPlayer ? (
          <Avatar preset={player.avatar} customId={player.customAvatarId} size={36} />
        ) : npc ? (
          // ใช้รูป PNG จริงของหมอ/Vapor
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white shadow-sm border border-slate-200">
            <img src={npc.src} alt={npc.label} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ) : (
          // NPC ที่เหลือใช้ emoji
          <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-xl">
            {s.emoji}
          </div>
        )}
      </div>
      <div className={`flex flex-col ${s.align === 'right' ? 'items-end' : 'items-start'} max-w-[80%]`}>
        <span className="text-xs text-slate-500 mb-1 px-1">
          {isPlayer ? player.nickname || s.name : s.name}
        </span>
        <div className={`px-4 py-2.5 rounded-2xl ${s.bg} ${s.align === 'right' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
          <p className="leading-relaxed whitespace-pre-line">{text}</p>
        </div>
      </div>
    </motion.div>
  );
}
