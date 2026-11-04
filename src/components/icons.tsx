/**
 * v0.3.90 «Гравировка»: встроенные SVG-глифы вместо эмодзи в иконках мостика.
 *
 * Единый штрих: currentColor, stroke-width 1.6, скруглённые концы — как
 * гравюры Кодекса (золото на эмали медальонов). Иконки наследуют цвет
 * контейнера (.wh-pane-icon / .wh-bar-icon задают color), поэтому вставка
 * ничего не ломает в компоновке 25/50/25.
 *
 * ВАЖНО: никаких CSS ::before/::after-символов (уроки v0.3.84/v0.3.85 —
 * глифы из неподключённых шрифтов превращались в «тофу»-квадратики).
 */
import type { ReactNode } from 'react';

export type IconName =
  // имперская геральдика (v0.3.91 «Aquila»)
  | 'aquila' | 'cogwheel' | 'flamedia'
  // системные символы -> гравюры (v0.3.92)
  | 'hourglass' | 'fleur' | 'chevron' | 'music' | 'mute' | 'skip'
  // окна
  | 'dossier' | 'chronicle' | 'gear' | 'candle' | 'swords' | 'eye' | 'crate'
  | 'galaxy' | 'calendar' | 'scales' | 'skull' | 'clipboard'
  // показатели досье
  | 'person' | 'castle' | 'medal' | 'planet' | 'temple' | 'clover'
  // скрытые шкалы
  | 'pray' | 'fox' | 'bicep' | 'flame' | 'dna' | 'waaagh' | 'orb' | 'crown'
  | 'blood' | 'diamond' | 'rat' | 'cross' | 'vortex'
  // снабжение
  | 'coin' | 'bread' | 'ammo'
  // эффекты (effectLabels)
  | 'heart' | 'brain' | 'biohazard' | 'star' | 'dice' | 'warning' | 'sword'
  | 'shield' | 'book' | 'trophy' | 'gem' | 'cake' | 'dove' | 'bolt';

const P: Record<IconName, ReactNode> = {
  // ── Имперская геральдика (v0.3.91 «Aquila») ────────────────────────────
  /* Двуглавый орёл — гравюра в духе aquila Империума: два профиля голов с
     клювами наружу, поднятые зубчатые крылья, имперский череп на щите между
     лапами. Штрих тоньше остальных (1.3), чтобы читалась мелкая механика. */
  aquila: (
    <g strokeWidth={1.3}>
      {/* левая голова + клюв */}
      <path d="M9.7 6.4C8.9 5.2 7.9 4.6 6.9 4.8c-1 .2-1.5 1.1-1.2 2 .2.6.7 1 1.4 1.2" />
      <path d="M5.9 5.4L3.6 4.8l2.2 1.4" />
      {/* правая голова + клюв */}
      <path d="M14.3 6.4c.8-1.2 1.8-1.8 2.8-1.6 1 .2 1.5 1.1 1.2 2-.2.6-.7 1-1.4 1.2" />
      <path d="M18.1 5.4l2.3-.6-2.2 1.4" />
      {/* шея и туловище */}
      <path d="M9.7 6.4c-.4 1.2-.7 2.2-1 3.2M14.3 6.4c.4 1.2.7 2.2 1 3.2" />
      <path d="M8.8 9.4c-.5 2.2-.3 4.2.7 6 .7 1.3 1.6 2.2 2.5 2.9h0c.9-.7 1.8-1.6 2.5-2.9 1-1.8 1.2-3.8.7-6z" />
      {/* перья хвоста */}
      <path d="M10.6 18.3l-.8 2.3M12 18.6v2.6M13.4 18.3l.8 2.3" opacity=".85" />
      {/* левое крыло: верхняя кромка + зубцы перьев */}
      <path d="M8.9 9.2C6.4 7.6 4 6.4 1.8 5.8" />
      <path d="M2.9 6.1l.9 1.9M4.4 6.7l.8 2M5.9 7.4l.8 2.1M7.3 8.2l.7 2.2" opacity=".85" />
      {/* правое крыло */}
      <path d="M15.1 9.2c2.5-1.6 4.9-2.8 7.1-3.4" />
      <path d="M21.1 6.1l-.9 1.9M19.6 6.7l-.8 2M18.1 7.4l-.8 2.1M16.7 8.2l-.7 2.2" opacity=".85" />
      {/* имперский череп на щите */}
      <path d="M12 10.6a1.9 1.9 0 0 0-1.9 1.9c0 .7.3 1.2.8 1.6v.9h2.2v-.9c.5-.4.8-.9.8-1.6a1.9 1.9 0 0 0-1.9-1.9z" opacity=".9" />
      <circle cx="11.2" cy="12.5" r=".45" fill="currentColor" stroke="none" />
      <circle cx="12.8" cy="12.5" r=".45" fill="currentColor" stroke="none" />
    </g>
  ),
  /* Зубчатое колесо Механикус — символ Священной Машины (для окна Снаряжения) */
  cogwheel: (
    <>
      <path d="M12 2.6l1.5 2.2h-3zM12 21.4l-1.5-2.2h3zM2.6 12l2.2-1.5v3zM21.4 12l-2.2 1.5v-3zM5.3 5.3l2.6.5-1.6 1.6zM18.7 5.3l-.5 2.6-1.6-1.6zM5.3 18.7l.5-2.6 1.6 1.6zM18.7 18.7l-2.6-.5 1.6-1.6z" fill="currentColor" stroke="none" opacity=".9" />
      <circle cx="12" cy="12" r="6.6" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 5.4v1.6M12 17v1.6M5.4 12H7M17 12h1.6" opacity=".7" />
    </>
  ),
  /* Пламенное «А» Инквизиции (Ignis Aurea) */
  flamedia: (
    <>
      <path d="M12 3.4c3.2 3.6 5.6 6.2 5.6 9.6a5.6 5.6 0 1 1-11.2 0c0-1.8.8-3.2 2-4.6.2 1.4 1 2.2 2 2.4-.6-2.6.2-5 1.6-7.4z" opacity=".55" />
      <path d="M12 8.6L7.6 18.4M12 8.6l4.4 9.8M9.4 15h5.2" />
    </>
  ),
  dossier: (<><path d="M3 7a1.5 1.5 0 0 1 1.5-1.5H9l1.6 2H19.5A1.5 1.5 0 0 1 21 9v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17z" /><path d="M3 11h18" /></>),
  chronicle: (<><path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5" /></>),
  gear: (<><circle cx="12" cy="12" r="3.1" /><path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.9 1.9M16.6 16.6l1.9 1.9M18.5 5.5l-1.9 1.9M7.4 16.6l-1.9 1.9" /></>),
  candle: (<><path d="M9.6 8.2h4.8v9.4a1.4 1.4 0 0 1-1.4 1.4h-2a1.4 1.4 0 0 1-1.4-1.4z" /><path d="M12 6.8c1.7-1.8 1.1-3.2 0-4.2-1.1 1-1.7 2.4 0 4.2z" /><path d="M7.6 19h8.8" /></>),
  swords: (<><path d="M4.2 4.2L14.6 14.6M4.2 4.2h3.4M4.2 4.2v3.4" /><path d="M19.8 4.2L9.4 14.6M19.8 4.2h-3.4M19.8 4.2v3.4" /><path d="M12.6 16.6l4.8 4.8M17.4 16.6l-4.8 4.8" opacity=".85" /></>),
  eye: (<><path d="M2.6 12S6.4 6.2 12 6.2 21.4 12 21.4 12 17.6 17.8 12 17.8 2.6 12 2.6 12z" /><circle cx="12" cy="12" r="2.7" /></>),
  crate: (<><path d="M3.6 7.8L12 4.2l8.4 3.6v8.4L12 19.8l-8.4-3.6z" /><path d="M3.6 7.8L12 11.4l8.4-3.6M12 11.4v8.4" /></>),
  galaxy: (<><ellipse cx="12" cy="12" rx="8.8" ry="3.4" transform="rotate(-22 12 12)" /><circle cx="12" cy="12" r="2.1" /><circle cx="18.6" cy="6.6" r=".8" fill="currentColor" stroke="none" /><circle cx="5.4" cy="17.4" r=".8" fill="currentColor" stroke="none" /></>),
  calendar: (<><rect x="4" y="5.4" width="16" height="14.2" rx="1.6" /><path d="M4 10h16M8.6 3.4v3.6M15.4 3.4v3.6" /><path d="M8.4 13.4h2.2M13.4 13.4h2.2M8.4 16.4h2.2M13.4 16.4h2.2" opacity=".8" /></>),
  scales: (<><path d="M12 4.4V19.6M6.4 20h11.2M4.6 7.4h14.8" /><path d="M4.6 7.4L2.4 12.6a2.4 2.4 0 0 0 4.4 0zM19.4 7.4l-2.2 5.2a2.4 2.4 0 0 0 4.4 0z" /><circle cx="12" cy="4.4" r="1" fill="currentColor" stroke="none" /></>),
  skull: (<><path d="M5.6 11.4a6.4 6.4 0 1 1 12.8 0c0 2.2-1 3.4-2 4.2v2.2a1 1 0 0 1-1 1H8.6a1 1 0 0 1-1-1v-2.2c-1-.8-2-2-2-4.2z" /><circle cx="9.5" cy="11.2" r="1.5" /><circle cx="14.5" cy="11.2" r="1.5" /><path d="M12 14l-.9 1.9h1.8z" /></>),
  clipboard: (<><rect x="6" y="4.8" width="12" height="15" rx="1.6" /><path d="M9.4 4.8h5.2v2.6H9.4z" /><path d="M9.4 11.4h5.2M9.4 14.6h5.2" opacity=".8" /></>),
  person: (<><circle cx="12" cy="8" r="3.4" /><path d="M5.2 19.6c1.2-3.4 3.8-5 6.8-5s5.6 1.6 6.8 5" /></>),
  castle: (<><path d="M5 20V9.6l2.2 1.4 2.2-1.4 2.4 1.4 2.4-1.4 2.2 1.4L21 9.6V20z" /><path d="M5 9.6V5.4h2.2v2.2M18.8 5.4v2.2M9.4 7.6V5.4h2.2v2.2M14.4 7.6V5.4h2.2v2.2" /><path d="M10.6 20v-4.4a1.4 1.4 0 0 1 2.8 0V20" /></>),
  medal: (<><circle cx="12" cy="14.4" r="4.4" /><path d="M9.2 10.8L7 3.6h10l-2.2 7.2" /><path d="M12 12.4l.7 1.5 1.6.2-1.2 1.2.3 1.6-1.4-.8-1.4.8.3-1.6-1.2-1.2 1.6-.2z" fill="currentColor" stroke="none" opacity=".85" /></>),
  planet: (<><circle cx="12" cy="12" r="5.6" /><ellipse cx="12" cy="12" rx="9.4" ry="3.2" transform="rotate(-20 12 12)" /></>),
  temple: (<><path d="M4 10.2L12 5l8 5.2" /><path d="M6.2 10.6v6.8M10 10.6v6.8M14 10.6v6.8M17.8 10.6v6.8M4.4 19.6h15.2" /></>),
  clover: (<><path d="M12 11.2c0-2.5-1-4-2.7-4-1.4 0-2.3 1.1-2.3 2.4 0 1.5 1.6 2.6 5 2.9" /><path d="M12 11.2c0-2.5 1-4 2.7-4 1.4 0 2.3 1.1 2.3 2.4 0 1.5-1.6 2.6-5 2.9" /><path d="M12 12.5c-1.8 1.6-2.4 3.4-1.4 4.9.9 1.1 2.2 1 2.9-.2.7-1.3.2-3.1-1.5-4.7" /><path d="M12 12.5c1.8 1.6 2.4 3.4 1.4 4.9-.9 1.1-2.2 1-2.9-.2" opacity=".8" /><path d="M12 12.9c0 3.4-.6 5.6-2.4 7.5" /></>),
  pray: (<><path d="M12 3.6v6.6M9 7.4h6" /><path d="M8.4 12.2c0 4.2 1.5 6.6 3.6 8.2 2.1-1.6 3.6-4 3.6-8.2" opacity=".9" /></>),
  fox: (<><path d="M4.4 5.2l2.8 2.6M19.6 5.2l-2.8 2.6" /><path d="M5.6 6.6C4.8 11.4 7.4 15.6 12 19.4 16.6 15.6 19.2 11.4 18.4 6.6c-2 1.6-4.2 2.4-6.4 2.4S7.6 8.2 5.6 6.6z" /><path d="M10.2 11.6l.8.8M13.8 11.6l-.8.8M12 14.6l-.7 1h1.4z" /></>),
  bicep: (<><path d="M6.4 17.6c-1.6-4.4.6-8.6 4.4-10.2 2.8-1.2 5.4-.2 6.6 1.6" /><path d="M7.6 13.4c2.4-1.4 4.6-1.2 6.4.4" opacity=".85" /><path d="M5.4 19.6l2-2M18.6 10.2l1.8-1.8" /></>),
  flame: (<><path d="M12 3.4c3.2 3.6 5.6 6.2 5.6 9.6a5.6 5.6 0 1 1-11.2 0c0-1.8.8-3.2 2-4.6.2 1.4 1 2.2 2 2.4-.6-2.6.2-5 1.6-7.4z" /></>),
  dna: (<><path d="M8 3.6c0 4.8 8 6.4 8 10.8 0 3.2-2.4 5-4 6" /><path d="M16 3.6c0 4.8-8 6.4-8 10.8 0 3.2 2.4 5 4 6" /><path d="M9.2 7.4h5.6M8.4 11.4h7.2M9.6 15.4h4.8" opacity=".8" /></>),
  waaagh: (<><path d="M4.6 4.6L14.8 14.8M4.6 4.6h3.6M4.6 4.6v3.6" /><path d="M19.4 4.6L9.2 14.8M19.4 4.6h-3.6M19.4 4.6v3.6" /><path d="M15 15l4 4M19 15l-4 4" /></>),
  orb: (<><circle cx="12" cy="12" r="4.2" /><path d="M12 3.6v2.2M12 18.2v2.2M3.6 12h2.2M18.2 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6" /></>),
  crown: (<><path d="M4.4 8.2l3.4 3.2 4.2-5.2 4.2 5.2 3.4-3.2-1.6 10.4H6z" /><path d="M6.6 15.8h10.8" opacity=".8" /></>),
  blood: (<><path d="M12 3.6c4.2 5.4 6.2 8.2 6.2 11a6.2 6.2 0 1 1-12.4 0c0-2.8 2-5.6 6.2-11z" /><path d="M9.4 14.6a2.8 2.8 0 0 0 2.4 2.8" opacity=".85" /></>),
  diamond: (<><path d="M12 3.8L19.4 12 12 20.2 4.6 12z" /><path d="M7.6 12h8.8M12 3.8v16.4" opacity=".7" /></>),
  rat: (<><circle cx="16.6" cy="9.4" r="2.6" /><path d="M14 10.6c-3.6.6-6.6 2.8-7.6 5.8" /><path d="M15.6 7.2l.6-2.4 1.8 1.6M18.4 7.6l2.2-1-.8 2.2" /><path d="M6.6 16.6c-1.8.6-3.2 1.8-3.6 3.4 2-.2 3.4-1 4.2-2.4" opacity=".85" /><circle cx="17.6" cy="9" r=".7" fill="currentColor" stroke="none" /></>),
  cross: (<><path d="M12 3.6v16.8M6.8 8.8h10.4" /><path d="M9.6 20.4h4.8" opacity=".8" /></>),
  vortex: (<><path d="M12 4a8 8 0 1 1-7.6 5.5" /><path d="M12 7.6a4.4 4.4 0 1 1-4.1 3" /><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" /></>),
  coin: (<><circle cx="12" cy="12" r="7.8" /><path d="M14.4 9.4a3 3 0 1 0 0 5.2" /><path d="M14.4 9.4H11v5.2h3.4M11 12h2.8" /></>),
  bread: (<><path d="M4.6 10.4a3.4 3.4 0 0 1 3.4-3.4h8a3.4 3.4 0 0 1 3.4 3.4c0 1.2-.8 2-1.8 2.2v3a1.6 1.6 0 0 1-1.6 1.6H8a1.6 1.6 0 0 1-1.6-1.6v-3c-1-.2-1.8-1-1.8-2.2z" /><path d="M9.6 7.2v8M13.2 7.2v8" opacity=".7" /></>),
  ammo: (<><path d="M8.2 10.2V6.8a1.8 1.8 0 0 1 3.6 0v3.4" /><path d="M7 10.2h6v2.2H7z" /><path d="M7.6 12.4h4.8v5.4a1.4 1.4 0 0 1-1.4 1.4H9a1.4 1.4 0 0 1-1.4-1.4z" /><path d="M16.6 13.6v5M15.4 18.6h2.4" opacity=".8" /></>),
  heart: (<><path d="M12 20.2S4.6 15.6 4.6 10.4A4.2 4.2 0 0 1 12 7.8a4.2 4.2 0 0 1 7.4 2.6c0 5.2-7.4 9.8-7.4 9.8z" /></>),
  brain: (<><path d="M12 5.4a3 3 0 0 0-5.6 1.4 2.8 2.8 0 0 0-1.8 4.4 3 3 0 0 0 1.6 4.6A3 3 0 0 0 12 18.6" /><path d="M12 5.4a3 3 0 0 1 5.6 1.4 2.8 2.8 0 0 1 1.8 4.4 3 3 0 0 1-1.6 4.6A3 3 0 0 1 12 18.6" /><path d="M12 5.4v13.2" opacity=".7" /></>),
  biohazard: (<><circle cx="12" cy="12" r="2.4" /><circle cx="12" cy="6.4" r="2.8" /><circle cx="6.6" cy="15.4" r="2.8" /><circle cx="17.4" cy="15.4" r="2.8" /></>),
  star: (<><path d="M12 3.8l2.4 5.2 5.6.6-4.2 3.8 1.2 5.6-5-2.8-5 2.8 1.2-5.6-4.2-3.8 5.6-.6z" /></>),
  dice: (<><rect x="4.6" y="4.6" width="14.8" height="14.8" rx="2.6" /><circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none" /></>),
  warning: (<><path d="M12 4.4L20.6 19H3.4z" /><path d="M12 10v3.8" /><circle cx="12" cy="16.6" r=".9" fill="currentColor" stroke="none" /></>),
  sword: (<><path d="M19.4 4.6L10 14M19.4 4.6h-3.8M19.4 4.6v3.8" /><path d="M7.6 12.4l4 4" /><path d="M4.6 19.4l3-3-1.6-1.6-3 3z" /></>),
  shield: (<><path d="M12 3.6l7 2.6v5.6c0 4.4-3 7.4-7 9.6-4-2.2-7-5.2-7-9.6V6.2z" /><path d="M12 7.4v8.4M8.4 10.4h7.2" opacity=".7" /></>),
  book: (<><path d="M4.4 5.4a1.4 1.4 0 0 1 1.4-1.4H12v16H5.8a1.4 1.4 0 0 0-1.4 1.4z" opacity="0" /><path d="M12 6.2H6.4a2 2 0 0 0-2 2v9.4a1.6 1.6 0 0 1 1.6-1.6H12z" /><path d="M12 6.2h5.6a2 2 0 0 1 2 2v9.4a1.6 1.6 0 0 0-1.6-1.6H12z" /><path d="M12 4.6v12.8" opacity=".7" /></>),
  trophy: (<><path d="M7.6 4.8h8.8v5a4.4 4.4 0 0 1-8.8 0z" /><path d="M7.6 6.2H4.8v1.6a2.8 2.8 0 0 0 2.8 2.8M16.4 6.2h2.8v1.6a2.8 2.8 0 0 1-2.8 2.8" /><path d="M12 14.2v3M8.8 19.6h6.4M9.8 17.2h4.4l.6 2.4H9.2z" /></>),
  gem: (<><path d="M7.4 4.4h9.2l3.4 4.8L12 19.6 2.6 9.2z" /><path d="M2.6 9.2h18.8M7.4 4.4L9.8 9.2 12 19.6M16.6 4.4L14.2 9.2 12 19.6" opacity=".7" /></>),
  cake: (<><path d="M5 12.6h14v5.4a1.4 1.4 0 0 1-1.4 1.4H6.4A1.4 1.4 0 0 1 5 18z" /><path d="M5 12.6c0-2 1.6-3 3.5-3h7c1.9 0 3.5 1 3.5 3" /><path d="M12 9.6V7.4M9.2 9.6V8M14.8 9.6V8" /><circle cx="12" cy="6.2" r=".9" fill="currentColor" stroke="none" /></>),
  dove: (<><path d="M4 14.4c3.6.8 6.8-.2 9-2.6 1.8-1.9 3-4.2 5.4-5.4-.6 2.2-.2 3.8.8 5.2" /><path d="M13 11.8c1.6 2.6 1.2 5.4-.6 7.6" opacity=".85" /><path d="M4 14.4c-.8 1.8 0 3.6 1.6 4.6" opacity=".85" /><circle cx="18.4" cy="6.6" r=".8" fill="currentColor" stroke="none" /></>),
  bolt: (<><path d="M13.4 3.6L6.6 13h4.2l-1.6 7.4 7-9.8h-4.4z" /></>),
  /* v0.3.92: системные символы из футеров/кнопок переведены на гравюры —
     единый SVG-штрих вместо эмодзи/питчфонов, которые на части систем
     рендерились «тофу»-квадратами. */
  hourglass: (<><path d="M6.6 3.6h10.8M6.6 20.4h10.8" /><path d="M7.8 3.6c0 3.4 1.8 5.2 4.2 7 2.4 1.8 4.2 3.6 4.2 7M16.2 3.6c0 3.4-1.8 5.2-4.2 7-2.4 1.8-4.2 3.6-4.2 7" /><path d="M9.4 18.2c.8-1.3 1.6-2 2.6-2.6 1 .6 1.8 1.3 2.6 2.6z" fill="currentColor" stroke="none" opacity=".85" /></>),
  fleur: (<><path d="M12 3.4c1.7 2.2 2.5 4.1 2.5 6 0 1.6-.9 2.9-2.5 3.9-1.6-1-2.5-2.3-2.5-3.9 0-1.9.8-3.8 2.5-6z" /><path d="M6.2 8.4c2.1.5 3.5 1.5 4.3 3 .3.7.4 1.4.4 2.1M17.8 8.4c-2.1.5-3.5 1.5-4.3 3-.3.7-.4 1.4-.4 2.1" /><path d="M9.4 16.4h5.2M8.4 19.4h7.2M12 16.4v3" /></>),
  chevron: (<><path d="M6.8 9.6L12 14.8l5.2-5.2" /></>),
  music: (<><path d="M9.2 17.4V5.8l8.4-1.8v11" /><circle cx="6.9" cy="17.6" r="2.3" /><circle cx="15.3" cy="15.8" r="2.3" /></>),
  mute: (<><path d="M4.4 9.4h3.2l4.4-3.4v11.8l-4.4-3.4H4.4z" /><path d="M16 9.6l4.4 4.8M20.4 9.6L16 14.4" /></>),
  skip: (<><path d="M5.6 5.4L13 12l-7.4 6.6z" /><path d="M17.4 5.2v13.6" /></>),
};

/** Глиф по имени; неизвестное имя рендерит ромб-заглушку (никогда не «тофу»). */
export function GameIcon({ name, className }: { name: string; className?: string }) {
  const paths = P[name as IconName] ?? P.diamond;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? 'w-[72%] h-[72%]'}
    >
      {paths}
    </svg>
  );
}

/** Старые эмодзи-строки -> имена глифов (обратная совместимость пропсов icon). */
const EMOJI_TO_ICON: Record<string, IconName> = {
  '🗂️': 'dossier', '🗂': 'dossier', '📜': 'chronicle', '⚙️': 'gear', '⚙': 'gear',
  '🕯️': 'candle', '🕯': 'candle', '⚔️': 'swords', '⚔': 'swords', '👁️': 'eye', '👁': 'eye',
  '📦': 'crate', '🌌': 'galaxy', '📅': 'calendar', '⚖️': 'scales', '⚖': 'scales',
  '☠️': 'skull', '☠': 'skull', '📋': 'clipboard',
  '👤': 'person', '🏰': 'castle', '🎖️': 'medal', '🎖': 'medal', '🪐': 'planet',
  '🏛️': 'temple', '🏛': 'temple', '🍀': 'clover',
  '🙏': 'pray', '🦊': 'fox', '💪': 'bicep', '🔥': 'flame', '🧬': 'dna',
  '🔮': 'orb', '👑': 'crown', '🩸': 'blood', '🔷': 'diamond', '🐀': 'rat',
  '✝': 'cross', '🌀': 'vortex',
  '💰': 'coin', '🍞': 'bread', '🔩': 'ammo',
  '❤️': 'heart', '❤': 'heart', '🧠': 'brain', '☣️': 'biohazard', '☣': 'biohazard',
  '⭐': 'star', '🎲': 'dice', '⚠️': 'warning', '⚠': 'warning', '🗡️': 'sword', '🗡': 'sword',
  '🛡️': 'shield', '🛡': 'shield', '📚': 'book', '🏆': 'trophy', '💎': 'gem', '🎂': 'cake',
  '🕊️': 'dove', '🕊': 'dove', '⚡': 'bolt',
  // v0.3.92: системные символы из футеров/кнопок — тоже гравюры
  '⏳': 'hourglass', '⌛': 'hourglass', '⚜': 'fleur', '▾': 'chevron', '▿': 'chevron',
  '🎵': 'music', '🔇': 'mute', '⏭': 'skip', '⏭️': 'skip',
};

/** Нормализация: принимает имя глифа или старый эмодзи, всегда возвращает имя глифа. */
export function resolveIcon(icon: string): IconName {
  if (icon in P) return icon as IconName;
  const trimmed = icon.replace(/\uFE0F/g, '');
  for (const [emoji, name] of Object.entries(EMOJI_TO_ICON)) {
    if (emoji.replace(/\uFE0F/g, '') === trimmed) return name;
  }
  return 'diamond';
}
