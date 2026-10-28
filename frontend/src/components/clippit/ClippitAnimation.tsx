import React, { useEffect, useState } from 'react';
import {
  CLIPPIT_ANIMATIONS,
  CLIPPIT_FALLBACK_SVG,
  ClippitAnimationName,
  getAnimation,
} from './animations';

interface ClippitAnimationProps {
  animation?: ClippitAnimationName | string;
  size?: number;
  className?: string;
  onClick?: () => void;
  title?: string;
}

export const ClippitAnimation: React.FC<ClippitAnimationProps> = ({
  animation = 'restpose',
  size = 100,
  className = '',
  onClick,
  title = 'Clippit',
}) => {
  const targetDef = getAnimation(animation);
  const [overrideAnim, setOverrideAnim] = useState<ClippitAnimationName | null>(null);
  const [hasImgError, setHasImgError] = useState<boolean>(false);

  useEffect(() => {
    // Se a animação não for contínua (loop), agenda retorno suave para 'idle' após sua duração
    if (!targetDef.loop) {
      const timer = setTimeout(() => {
        setOverrideAnim('idle');
      }, targetDef.durationMs);
      return () => clearTimeout(timer);
    }
  }, [animation, targetDef.loop, targetDef.durationMs]);

  const activeDef = overrideAnim
    ? CLIPPIT_ANIMATIONS[overrideAnim] || CLIPPIT_ANIMATIONS.idle
    : targetDef;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`relative inline-flex items-center justify-center select-none ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      title={title}
    >
      {!hasImgError ? (
        <img
          key={`${activeDef.name}-${animation}`}
          src={activeDef.src}
          alt={`Clippit - ${activeDef.label}`}
          width={size}
          height={size}
          className="w-full h-full object-contain pointer-events-none drop-shadow-md"
          onError={() => setHasImgError(true)}
          draggable={false}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: CLIPPIT_FALLBACK_SVG }}
        />
      )}
    </div>
  );
};
