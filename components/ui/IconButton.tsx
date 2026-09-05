'use client';

import type React from 'react';
import clsx from 'clsx';
import { Icon } from './Icon';
import type { UiIconName } from '@/data/uiIcons';

interface IconButtonProps {
  icon: UiIconName;
  label: string;
  onClick?: (e?: React.MouseEvent) => void;
  active?: boolean;
  size?: number;
  className?: string;
  disabled?: boolean;
}

export function IconButton({ icon, label, onClick, active, size = 18, className, disabled }: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => onClick?.(e)}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={clsx(
        'flex items-center justify-center rounded-xl p-2.5 transition-all duration-150',
        'hover:bg-white/5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed',
        active && 'bg-accent/20 shadow-glow',
        className
      )}
    >
      <Icon name={icon} size={size} alt={label} />
    </button>
  );
}
