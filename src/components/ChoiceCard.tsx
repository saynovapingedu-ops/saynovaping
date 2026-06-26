import { motion } from 'framer-motion';
import type { Choice } from '../types';

interface Props {
  choice: Choice;
  index: number;
  onPick: (c: Choice) => void;
  disabled?: boolean;
}

export default function ChoiceCard({ choice, index, onPick, disabled }: Props) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 220, damping: 22 }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={() => onPick(choice)}
      disabled={disabled}
      className="group w-full text-left bg-[#FFFCF7]
                 hover:bg-detective-50/40 rounded-[22px] p-4 mb-2.5
                 shadow-clay-sm hover:shadow-clay
                 transition-all disabled:opacity-50"
    >
      <div className="flex items-start gap-3">
        <span className="bg-gradient-to-br from-detective-400 to-detective-600 text-white rounded-[14px]
                         w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0
                         shadow-clay-blue group-hover:scale-110 transition-transform">
          {String.fromCharCode(65 + index)}
        </span>
        <span className="text-gray-800 leading-relaxed pt-0.5 flex-1">{choice.label}</span>
        <span className="text-detective-300 group-hover:text-detective-500 transition-colors">→</span>
      </div>
    </motion.button>
  );
}
