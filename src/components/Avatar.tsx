import { useState } from 'react';
import { useAvatarStore } from '../store/avatarStore';
import { getPlayerCharacter } from '../lib/characters';

interface Props {
  preset: number;
  customId?: string;
  size?: number;             // px
  className?: string;
  ring?: boolean;
}

// แสดงอวตาร — ลำดับความสำคัญ:
//   1) customId → รูปอัปโหลดของผู้เล่น
//   2) preset → ภาพ PNG ตัวละคร (PLAYER_CHARACTERS) ถ้าโหลดไม่ขึ้นใช้ emoji
//   3) fallback → emoji
export default function Avatar({ preset, customId, size = 48, className = '', ring }: Props) {
  const [pngFailed, setPngFailed] = useState(false);
  const custom = useAvatarStore(s =>
    customId ? s.avatars.find(a => a.id === customId) : undefined
  );

  const ringClass = ring ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-transparent' : '';
  const baseClass = `rounded-full overflow-hidden flex items-center justify-center bg-white ${ringClass} ${className}`;

  // 1) custom uploaded image
  if (custom) {
    return (
      <div className={baseClass} style={{ width: size, height: size }}>
        <img src={custom.dataUrl} alt={custom.name} className="w-full h-full object-cover" />
      </div>
    );
  }

  // 2) preset character PNG
  const character = getPlayerCharacter(preset);
  if (!pngFailed) {
    return (
      <div className={baseClass} style={{ width: size, height: size }}>
        <img
          src={character.src}
          alt={character.label}
          className="w-full h-full object-cover"
          onError={() => setPngFailed(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // 3) emoji fallback
  const emojiSize = Math.round(size * 0.6);
  return (
    <div className={`${baseClass} bg-gradient-to-br from-detective-50 to-detective-100`} style={{ width: size, height: size }}>
      <span style={{ fontSize: emojiSize }} className="leading-none">
        {character.emoji}
      </span>
    </div>
  );
}
