'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { AI_STATE_ICONS, AI_STATE_ANIMATION } from '@/data/aiStateIcons';
import type { AIState } from '@/types';

interface AIAvatarProps {
  state: AIState;
  size?: number;
  /** 0..1, громкость голоса пользователя или амплитуда TTS — влияет на пульсацию */
  volume?: number;
  animationsEnabled?: boolean;
}

const PULSE_DURATION: Record<'none' | 'slow' | 'normal' | 'fast', number> = {
  none: 0,
  slow: 3.2,
  normal: 1.8,
  fast: 0.9,
};

export function AIAvatar({ state, size = 180, volume = 0, animationsEnabled = true }: AIAvatarProps) {
  const anim = AI_STATE_ANIMATION[state];
  const icon = AI_STATE_ICONS[state];
  const glowIntensity = Math.min(1, anim.glow + volume * 0.4);
  const scaleBoost = 1 + volume * 0.12;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Внешнее свечение */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle, rgba(124,92,255,${glowIntensity}) 0%, rgba(92,201,255,${
            glowIntensity * 0.5
          }) 45%, transparent 70%)`,
          filter: 'blur(18px)',
        }}
        animate={
          animationsEnabled && anim.pulse !== 'none'
            ? { scale: [1, 1.15 * scaleBoost, 1] }
            : { scale: 1 }
        }
        transition={{
          duration: PULSE_DURATION[anim.pulse] || 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Сфера */}
      <motion.div
        className={clsx(
          'relative rounded-full flex items-center justify-center overflow-hidden',
          'bg-gradient-to-br from-[#1b1b2a] via-[#232336] to-[#141420]',
          'border border-white/10 shadow-soft'
        )}
        style={{ width: size * 0.72, height: size * 0.72 }}
        animate={
          animationsEnabled
            ? { scale: anim.pulse === 'none' ? 1 : [1, scaleBoost, 1] }
            : { scale: 1 }
        }
        transition={{
          duration: PULSE_DURATION[anim.pulse] || 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12), transparent 55%)',
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={icon}
          alt={state}
          width={size * 0.34}
          height={size * 0.34}
          className="relative z-10 select-none"
          draggable={false}
        />
      </motion.div>
    </div>
  );
}
