import { useState } from 'react';
import { useAvatarStore } from '../store/avatarStore';
import { usePlayerStore } from '../store/playerStore';
import { getPlayerCharacter } from '../lib/characters';
import { SHOP_ITEMS } from '../lib/shopItems';

interface Props {
  preset: number;
  customId?: string;
  size?: number;             // px
  className?: string;
  ring?: boolean;
  /** override equipped accessory (สำหรับ preview ใน Shop) */
  accessoryId?: string | null;
  /** ปิดการแสดง accessory (เช่นใน thumbnail) */
  hideAccessory?: boolean;
}

// แสดงอวตาร — ลำดับความสำคัญ:
//   1) customId → รูปอัปโหลดของผู้เล่น
//   2) preset → ภาพ PNG ตัวละคร (PLAYER_CHARACTERS) ถ้าโหลดไม่ขึ้นใช้ emoji
//   3) fallback → emoji
//   + accessory overlay (แว่น หมวก โบว์ ฯลฯ) จาก equippedAccessory
export default function Avatar({
  preset, customId, size = 48, className = '', ring,
  accessoryId, hideAccessory,
}: Props) {
  const [pngFailed, setPngFailed] = useState(false);
  const custom = useAvatarStore(s =>
    customId ? s.avatars.find(a => a.id === customId) : undefined
  );
  const equippedAccessoryId = usePlayerStore(s => s.equippedAccessory);

  // accessory: ใช้ override > equipped > none
  const effectiveAccId = accessoryId !== undefined ? accessoryId : equippedAccessoryId;
  const accessory = !hideAccessory && effectiveAccId
    ? SHOP_ITEMS.find(i => i.id === effectiveAccId)?.accessory
    : undefined;

  const ringClass = ring ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-transparent' : '';
  const baseClass = `relative rounded-full overflow-hidden flex items-center justify-center bg-white ${ringClass} ${className}`;

  // accessory overlay node — สเกลตามขนาด avatar
  const accessoryNode = accessory ? (
    <span
      className="absolute pointer-events-none leading-none select-none drop-shadow-sm"
      style={{
        left: `${accessory.x}%`,
        top: `${accessory.y}%`,
        transform: 'translate(-50%, -50%)',
        fontSize: Math.round(size * (accessory.scale || 0.5)),
      }}
      aria-hidden
    >
      {accessory.emoji}
    </span>
  ) : null;

  // 1) custom uploaded image
  if (custom) {
    return (
      <div className={baseClass} style={{ width: size, height: size }}>
        <img src={custom.dataUrl} alt={custom.name} className="w-full h-full object-cover" />
        {accessoryNode}
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
        {accessoryNode}
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
      {accessoryNode}
    </div>
  );
}
