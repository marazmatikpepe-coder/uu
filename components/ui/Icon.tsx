import { UI_ICONS, type UiIconName } from '@/data/uiIcons';
import clsx from 'clsx';

interface IconProps {
  name: UiIconName;
  size?: number;
  className?: string;
  alt?: string;
}

export function Icon({ name, size = 20, className, alt }: IconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={UI_ICONS[name]}
      width={size}
      height={size}
      alt={alt ?? name}
      className={clsx('inline-block select-none opacity-90', className)}
      draggable={false}
    />
  );
}
