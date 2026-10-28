export type ClippitAnimationName =
  | 'restpose'
  | 'idle'
  | 'thinking'
  | 'writing'
  | 'searching'
  | 'explain'
  | 'alert'
  | 'congratulate'
  | 'wave'
  | 'getattention'
  | 'hearing';

export interface ClippitAnimationDef {
  name: ClippitAnimationName;
  src: string;
  durationMs: number;
  loop: boolean;
  label: string;
}

export const CLIPPIT_ANIMATIONS: Record<ClippitAnimationName, ClippitAnimationDef> = {
  restpose: {
    name: 'restpose',
    src: '/clippy/restpose.png',
    durationMs: 3000,
    loop: true,
    label: 'Repouso',
  },
  idle: {
    name: 'idle',
    src: '/clippy/idle.png',
    durationMs: 4000,
    loop: true,
    label: 'Ocioso',
  },
  thinking: {
    name: 'thinking',
    src: '/clippy/thinking.png',
    durationMs: 3200,
    loop: true,
    label: 'Pensando...',
  },
  writing: {
    name: 'writing',
    src: '/clippy/writing.png',
    durationMs: 3500,
    loop: false,
    label: 'Escrevendo',
  },
  searching: {
    name: 'searching',
    src: '/clippy/searching.png',
    durationMs: 4200,
    loop: false,
    label: 'Pesquisando',
  },
  explain: {
    name: 'explain',
    src: '/clippy/explain.png',
    durationMs: 2800,
    loop: false,
    label: 'Explicando',
  },
  alert: {
    name: 'alert',
    src: '/clippy/alert.png',
    durationMs: 2400,
    loop: false,
    label: 'Alerta',
  },
  congratulate: {
    name: 'congratulate',
    src: '/clippy/congratulate.png',
    durationMs: 3680,
    loop: false,
    label: 'Parabéns!',
  },
  wave: {
    name: 'wave',
    src: '/clippy/wave.png',
    durationMs: 3000,
    loop: false,
    label: 'Acenando',
  },
  getattention: {
    name: 'getattention',
    src: '/clippy/getattention.png',
    durationMs: 2500,
    loop: false,
    label: 'Chamando atenção',
  },
  hearing: {
    name: 'hearing',
    src: '/clippy/hearing.png',
    durationMs: 3000,
    loop: true,
    label: 'Ouvindo',
  },
};

export function getAnimation(name?: string): ClippitAnimationDef {
  if (!name) return CLIPPIT_ANIMATIONS.restpose;
  const normalized = name.toLowerCase().replace(/[^a-z]/g, '') as ClippitAnimationName;
  return CLIPPIT_ANIMATIONS[normalized] || CLIPPIT_ANIMATIONS.restpose;
}

/**
 * Fallback SVG para o Clippit clássico em caso de falha de carregamento de assets
 */
export const CLIPPIT_FALLBACK_SVG = `
<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-md">
  <!-- Sombra inferior -->
  <ellipse cx="60" cy="110" rx="30" ry="6" fill="rgba(0,0,0,0.25)" />
  <!-- Corpo do Clippy em arame metálico curvado -->
  <path d="M42 98 V35 C42 22 55 12 68 12 C81 12 90 22 90 35 V82 C90 92 82 100 72 100 C62 100 54 92 54 82 V40 C54 34 58 30 64 30 C70 30 74 34 74 40 V78"
        stroke="#5A6577" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M42 98 V35 C42 22 55 12 68 12 C81 12 90 22 90 35 V82 C90 92 82 100 72 100 C62 100 54 92 54 82 V40 C54 34 58 30 64 30 C70 30 74 34 74 40 V78"
        stroke="#B4BAC6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Olho esquerdo grande -->
  <ellipse cx="56" cy="42" rx="10" ry="12" fill="#FFFFFF" stroke="#1E293B" stroke-width="2.5" />
  <circle cx="58" cy="42" r="5" fill="#111827" />
  <circle cx="60" cy="40" r="1.8" fill="#FFFFFF" />
  <!-- Olho direito grande -->
  <ellipse cx="76" cy="40" rx="10" ry="12" fill="#FFFFFF" stroke="#1E293B" stroke-width="2.5" />
  <circle cx="74" cy="40" r="5" fill="#111827" />
  <circle cx="76" cy="38" r="1.8" fill="#FFFFFF" />
  <!-- Sobrancelha esquerda expressiva -->
  <path d="M48 28 Q56 24 64 27" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none" />
  <!-- Sobrancelha direita expressiva -->
  <path d="M70 26 Q78 22 86 28" stroke="#1E293B" stroke-width="3" stroke-linecap="round" fill="none" />
</svg>
`;
