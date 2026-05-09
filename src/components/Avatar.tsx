import { useAvatarStore } from '../store/avatarStore';

const EMOJI = ['🧒', '👧', '👦', '🧑'];

interface Props {
  preset: number;
  customId?: string;
  size?: number;             // px
  className?: string;
  ring?: boolean;
}

// แสดงอวตาร: ถ้ามี customId → ใช้รูปอัปโหลด, ไม่งั้นใช้ emoji preset
export default function Avatar({ preset, customId, size = 48, className = '', ring }: Props) {
  const custom = useAvatarStore(s =>
    customId ? s.avatars.find(a => a.id === customId) : undefined
  );

  const ringClass = ring ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-transparent' : '';
  const baseClass = `rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-detective-100 to-detective-200 ${ringClass} ${className}`;

  if (custom) {
    return (
      <div className={baseClass} style={{ width: size, height: size }}>
        <img
          src={custom.dataUrl}
          alt={custom.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // emoji preset
  const emojiSize = Math.round(size * 0.6);
  return (
    <div className={baseClass} style={{ width: size, height: size }}>
      <span style={{ fontSize: emojiSize }} className="leading-none">
        {EMOJI[(preset || 1) - 1] || '🧒'}
      </span>
    </div>
  );
}
