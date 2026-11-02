import { useEffect, useState } from 'react';
import { GameEvent, Choice } from '../game/types';
import { PublicStatKey } from '../game/utils';
import { useFit } from '../game/useFit';
import { WindowPane } from './Dashboard';
import { EventCard } from './EventCard';

/**
 * Модуль главного окна «Событие» (v0.3.27).
 * Оборачивает карточку года в окно-иллюминатор с плашкой заголовка и
 * счётчиком строк — игрок всегда понимает, где главное действие экрана.
 * Обновляемый: контент меняется каждый ход, рамка остаётся на месте.
 */
interface EventWindowProps {
  event: GameEvent;
  age: number;
  phase: 'event' | 'result';
  resultText: string;
  lastChoice: Choice | null;
  lastDeltas?: Partial<Record<PublicStatKey, number>> | null;
  onChoice: (choice: Choice) => void;
  onProceed: () => void;
}

export function EventWindow({ event, age, phase, resultText, lastChoice, lastDeltas, onChoice, onProceed }: EventWindowProps) {
  const fit = useFit();
  // Счётчик строк текста события — подсказка объёма в шапке окна.
  const [lines, setLines] = useState<number | null>(null);

  useEffect(() => {
    const el = document.querySelector('.wh-event-card .event-parchment p');
    if (!el) { setLines(null); return; }
    const lh = parseFloat(getComputedStyle(el).lineHeight) || 21;
    setLines(Math.max(1, Math.round(el.clientHeight / lh)));
  }, [event.text, phase]);

  return (
    <WindowPane
      title={phase === 'result' ? 'Исход решения' : 'Событие года'}
      icon={phase === 'result' ? '⚖️' : '📜'}
      extra={
        <span
          className="wh-event-age-badge tabular-nums"
          title={`М41.${String(age).padStart(3, '0')} — год твоей жизни${lines ? ` · текст на ${lines} стр.` : ''}`}
        >
          {age} лет · М41.{String(age).padStart(3, '0')}
        </span>
      }
      scroll={fit}
      stretch
      className="animate-scale-in"
    >
      <EventCard
        event={event}
        age={age}
        phase={phase}
        resultText={resultText}
        lastChoice={lastChoice}
        lastDeltas={lastDeltas}
        onChoice={onChoice}
        onProceed={onProceed}
      />
    </WindowPane>
  );
}
