interface Props {
  width?: number | string;
  height?: number | string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  className?: string;
  /** label สำหรับ screen reader — ถ้าไม่ใส่จะใช้ aria-hidden */
  label?: string;
}

const roundedMap = {
  sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg',
  xl: 'rounded-xl', '2xl': 'rounded-2xl', '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

export default function Skeleton({
  width, height, rounded = '2xl', className = '', label,
}: Props) {
  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`skeleton-base ${roundedMap[rounded]} ${className}`}
      style={style}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
