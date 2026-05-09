import { motion } from 'framer-motion';
import type { SpeakerKey } from '../types';
import { usePlayerStore } from '../store/playerStore';
import Avatar from './Avatar';

const SPEAKERS: Record<SpeakerKey, { name: string; emoji: string; align: 'left' | 'right'; bg: string }> = {
  narrator:      { name: 'เล่าเรื่อง',    emoji: '📖', align: 'left',  bg: 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-700' },
  player:        { name: 'คุณ',          emoji: '🧒', align: 'right', bg: 'bg-gradient-to-br from-detective-500 to-detective-600 text-white shadow-md' },
  doctor:        { name: 'พี่หมอเก๋',     emoji: '👩‍⚕️', align: 'left',  bg: 'bg-gradient-to-br from-success-50 to-emerald-50 text-gray-800 border border-success-500/20' },
  baitoey:       { name: 'น้องใบเตย',    emoji: '🌿', align: 'left',  bg: 'bg-gradient-to-br from-warning-50 to-amber-50 text-gray-800 border border-warning-500/20' },
  vapor:         { name: 'Vapor',       emoji: '👤', align: 'left',  bg: 'bg-gradient-to-br from-danger-50 to-red-50 text-gray-800 border border-danger-500/20' },
  friend1:       { name: 'เพื่อน',       emoji: '🧑', align: 'left',  bg: 'bg-gradient-to-br from-blue-50 to-sky-50 text-gray-800 border border-blue-200' },
  friend2:       { name: 'เพื่อน',       emoji: '👦', align: 'left',  bg: 'bg-gradient-to-br from-purple-50 to-fuchsia-50 text-gray-800 border border-purple-200' },
  shopkeeper:    { name: 'เจ้าของร้าน',   emoji: '🧓', align: 'left',  bg: 'bg-gradient-to-br from-yellow-50 to-orange-50 text-gray-800 border border-yellow-200' },
  'dm-stranger': { name: 'คนใน DM',     emoji: '💬', align: 'left',  bg: 'bg-gradient-to-br from-red-50 to-pink-50 text-gray-800 border border-red-200' },
  system:        { name: 'ระบบ',        emoji: '⚙️', align: 'left',  bg: 'bg-gray-200 text-gray-700' },
};

interface Props {
  speaker: SpeakerKey;
  text: string;
}

export default function DialogueBubble({ speaker, text }: Props) {
  const s = SPEAKERS[speaker];
  const player = usePlayerStore();
  const isPlayer = speaker === 'player';

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
        ) : (
          <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">
            {s.emoji}
          </div>
        )}
      </div>
      <div className={`flex flex-col ${s.align === 'right' ? 'items-end' : 'items-start'} max-w-[80%]`}>
        <span className="text-xs text-gray-500 mb-1 px-1">
          {isPlayer ? player.nickname || s.name : s.name}
        </span>
        <div className={`px-4 py-2.5 rounded-2xl ${s.bg} ${s.align === 'right' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
          <p className="leading-relaxed whitespace-pre-line">{text}</p>
        </div>
      </div>
    </motion.div>
  );
}
