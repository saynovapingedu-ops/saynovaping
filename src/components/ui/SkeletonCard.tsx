import Skeleton from './Skeleton';

type Variant = 'row' | 'card' | 'stat' | 'cert';

interface Props {
  variant?: Variant;
  count?: number;
  /** label สำหรับ wrapper เดียว เผื่อ screen reader */
  label?: string;
  className?: string;
}

/**
 * SkeletonCard — preset shapes ที่ใช้แทน loading state ทั่วไป
 *   row  = แถว leaderboard (rank/avatar/name/score)
 *   card = card หลัก (header + 2 lines + footer)
 *   stat = stat block (label + big number)
 *   cert = ใบประกาศ aspect 1/1.414
 */
export default function SkeletonCard({
  variant = 'card', count = 1, label, className = '',
}: Props) {
  const items = Array.from({ length: count }, (_, i) => (
    <SkeletonItem key={i} variant={variant} />
  ));

  return (
    <div
      className={`space-y-2 ${className}`}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {items}
    </div>
  );
}

function SkeletonItem({ variant }: { variant: Variant }) {
  if (variant === 'row') {
    return (
      <div className="card flex items-center gap-3 py-3">
        <Skeleton width={28} height={28} rounded="full" />
        <Skeleton width={36} height={36} rounded="full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton height={12} width="60%" rounded="md" />
          <Skeleton height={10} width="40%" rounded="md" />
        </div>
        <Skeleton width={48} height={20} rounded="md" />
      </div>
    );
  }
  if (variant === 'stat') {
    return (
      <div className="card text-center py-4 space-y-2">
        <Skeleton height={10} width="40%" rounded="md" className="mx-auto" />
        <Skeleton height={28} width="60%" rounded="md" className="mx-auto" />
      </div>
    );
  }
  if (variant === 'cert') {
    return (
      <div
        className="bg-white shadow-2xl relative"
        style={{ aspectRatio: '1 / 1.414' }}
      >
        <div className="absolute inset-3 border-[3px] border-slate-200" />
        <div className="absolute inset-[18px] border border-slate-200" />
        <div className="relative px-8 pt-12 pb-12 h-full flex flex-col items-center text-center gap-3">
          <Skeleton width={120} height={36} rounded="md" />
          <Skeleton width="60%" height={28} rounded="md" />
          <Skeleton width={80} height={2} rounded="md" />
          <Skeleton width="80%" height={14} rounded="md" />
          <Skeleton width="50%" height={28} rounded="md" />
          <Skeleton width="70%" height={12} rounded="md" />
          <div className="mt-auto w-full flex justify-between items-end">
            <Skeleton width={48} height={48} rounded="md" />
            <Skeleton width={48} height={48} rounded="md" />
          </div>
        </div>
      </div>
    );
  }
  // 'card' default
  return (
    <div className="card space-y-2">
      <div className="flex items-center gap-3">
        <Skeleton width={36} height={36} rounded="xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton height={12} width="55%" rounded="md" />
          <Skeleton height={10} width="35%" rounded="md" />
        </div>
      </div>
      <Skeleton height={10} width="90%" rounded="md" />
      <Skeleton height={10} width="75%" rounded="md" />
    </div>
  );
}
