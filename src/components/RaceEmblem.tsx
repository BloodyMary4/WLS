import type { Race } from '../game/types';

/**
 * Готические SVG-эмблемы рас — пришли на смену emoji: стилизованные силуэты
 * в единой палитре (чернь + позолота), масштабируются без потери качества
 * и не зависят от шрифтов эмодзи системы пользователя.
 */

type EmblemProps = { className?: string };

/**
 * ВАЖНО: у каждого <svg> должны быть явные width/height (атрибуты), а не только CSS-класс.
 * Если Tailwind-класс не применился (сбой загрузки стилей), svg без размеров растягивается
 * на весь контейнер и перекрывает интерфейс — игрок видит «одну иконку на весь экран».
 */
const EMBLEM_SVG_BASE = { xmlns: 'http://www.w3.org/2000/svg', width: 64, height: 64 } as const;

function HelmetEmblem({ className }: EmblemProps) {
  // Человек: имперский шлем гвардейца с крыльями аквилы
  return (
    <svg {...EMBLEM_SVG_BASE} viewBox="0 0 64 64" style={{ maxWidth: "100%", maxHeight: "100%" }} className={className} role="img" aria-label="Человек">
      <path d="M8 26c5-3 9-2 12 0M56 26c-5-3-9-2-12 0" fill="none" stroke="#c9a227" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 40c0-14 4-22 12-22s12 8 12 22v6c0 3-2 5-5 5h-2l-2-6h-6l-2 6h-2c-3 0-5-2-5-5z" fill="#1c1913" stroke="#c9a227" strokeWidth="2" />
      <path d="M24 34c2 2 5 3 8 3s6-1 8-3" fill="none" stroke="#e8c85a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="24" r="2.5" fill="#e8c85a" />
    </svg>
  );
}

function TuskEmblem({ className }: EmblemProps) {
  // Орк: клыкастая пасть WAAAGH!
  return (
    <svg {...EMBLEM_SVG_BASE} viewBox="0 0 64 64" style={{ maxWidth: "100%", maxHeight: "100%" }} className={className} role="img" aria-label="Орк">
      <path d="M12 22c8-8 32-8 40 0 4 4 4 12 0 18-6 8-14 12-20 12s-14-4-20-12c-4-6-4-14 0-18z" fill="#1c1913" stroke="#6aa84f" strokeWidth="2.5" />
      <path d="M20 28c4-2 8-2 10 0M34 28c4-2 8-2 10 0" fill="none" stroke="#e8c85a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 40l3 8 3-8zM36 40l3 8 3-8z" fill="#d8c9a3" stroke="#6aa84f" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M18 14l6 6M46 14l-6 6" stroke="#a30000" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function StarEmblem({ className }: EmblemProps) {
  // Эльдар: слеза К'яане среди звёзд
  return (
    <svg {...EMBLEM_SVG_BASE} viewBox="0 0 64 64" style={{ maxWidth: "100%", maxHeight: "100%" }} className={className} role="img" aria-label="Эльдар">
      <path d="M32 8c6 10 14 18 14 28a14 14 0 1 1-28 0c0-10 8-18 14-28z" fill="#1c1913" stroke="#7ec8e3" strokeWidth="2.5" />
      <path d="M32 24c3 5 7 9 7 14a7 7 0 1 1-14 0c0-5 4-9 7-14z" fill="none" stroke="#b57edc" strokeWidth="2" />
      <path d="M14 14l2 4 4 2-4 2-2 4-2-4-4-2 4-2zM50 40l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z" fill="#e8c85a" />
    </svg>
  );
}

function BladeEmblem({ className }: EmblemProps) {
  // Друкхаари: клинок в тенях Коммагота
  return (
    <svg {...EMBLEM_SVG_BASE} viewBox="0 0 64 64" style={{ maxWidth: "100%", maxHeight: "100%" }} className={className} role="img" aria-label="Друкхаари">
      <path d="M32 4l6 14-4 2v26l8 10H36v4h-8v-4H22l8-10V20l-4-2z" fill="#1c1913" stroke="#a30000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M32 22v20" stroke="#e8c85a" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 30c4 4 4 10 0 14M52 30c-4 4-4 10 0 14" fill="none" stroke="#8e44ad" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function DiamondEmblem({ className }: EmblemProps) {
  // Тау: кристалл Высшего Блага
  return (
    <svg {...EMBLEM_SVG_BASE} viewBox="0 0 64 64" style={{ maxWidth: "100%", maxHeight: "100%" }} className={className} role="img" aria-label="Тау">
      <path d="M32 6l20 14-20 38L12 20z" fill="#1c1913" stroke="#4fc3f7" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 6v52M12 20h40" stroke="#4fc3f7" strokeWidth="1.2" opacity="0.7" />
      <path d="M22 20l10 26 10-26z" fill="none" stroke="#e8c85a" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="32" cy="20" r="3" fill="#e8c85a" />
    </svg>
  );
}

function RatEmblem({ className }: EmblemProps) {
  // Гретчин: мелкая крыса в тени орков
  return (
    <svg {...EMBLEM_SVG_BASE} viewBox="0 0 64 64" style={{ maxWidth: "100%", maxHeight: "100%" }} className={className} role="img" aria-label="Гретчин">
      <path d="M14 38c0-10 8-16 18-16 6 0 12 3 15 8l7-3-2 7c1 2 1 4 1 6 0 8-9 14-21 14S14 50 14 42z" fill="#1c1913" stroke="#b8a878" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="26" cy="30" r="2" fill="#e8c85a" />
      <path d="M20 22c-2-4 0-8 4-8M34 22c2-4 0-8-4-8" fill="none" stroke="#b8a878" strokeWidth="2" strokeLinecap="round" />
      <path d="M50 46c6 2 8 6 6 10" fill="none" stroke="#b8a878" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const EMBLEMS: Record<Race, (props: EmblemProps) => JSX.Element> = {
  human: HelmetEmblem,
  ork: TuskEmblem,
  eldar: StarEmblem,
  dark_eldar: BladeEmblem,
  tau: DiamondEmblem,
  gretchin: RatEmblem,
};

export function RaceEmblem({ race, className = 'w-8 h-8' }: { race: Race; className?: string }) {
  const Emblem = EMBLEMS[race] ?? HelmetEmblem;
  return <Emblem className={className} />;
}
