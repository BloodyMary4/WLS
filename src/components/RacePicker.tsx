import { useState } from 'react';
import { RACE_INFO } from '../game/data';
import type { Race } from '../game/types';
import { RaceEmblem } from './RaceEmblem';

/** Лорные бонусы расы для отображения на карточке (совпадают с generateCharacterByRace). */
export const RACE_BONUSES: Record<Race, string[]> = {
  human: ['Служба Инквизиции', 'Аугметика Mechanicus', 'Кредиты Империума'],
  ork: ['+30 к здоровью (130 HP)', 'WAAAGH! и драки', 'Гретчины-прислужники'],
  eldar: ['+20 к ловкости', 'Звёздные врата и паутинная звезда', 'Прорицание'],
  dark_eldar: ['Пираты Коммагота', 'Жестокость как валюта', 'Высокая хитрость'],
  tau: ['+20 к интеллекту', 'Этика Высшего Блага', 'Дальние бои и технологии'],
  gretchin: ['Мал, но живуч', 'Хитрость раба', 'Шанс вырасти до орка'],
};

/** Ключевые опасности расы — честное предупреждение игроку. */
export const RACE_DANGERS: Record<Race, string> = {
  human: 'Хрупкое тело. Мутации и Инквизиция следят за каждым шагом.',
  ork: 'Короткая память, длинная драка. Смерть от «смешной» раны — обычное дело.',
  eldar: 'Ваша раса угасает. Один неверный выбор — и Пагуба поглотит душу.',
  dark_eldar: 'Коммагот требует боли. Чаще чужой — но иногда и твоей.',
  tau: 'Высшее Благо не спрашивает разрешения. Философия — или пламя.',
  gretchin: 'Ты — расходный материал даже для орков. Выживи, если сможешь.',
};

interface RacePickerProps {
  /** Выбранная раса или null, если игрок хочет случайную судьбу. */
  race: Race | null;
  onSelect: (race: Race | null) => void;
}

/**
 * Карточки выбора расы для стартового экрана.
 * Чистый presentational-компонент: состояние выбора живёт у родителя.
 */
export function RacePicker({ race, onSelect }: RacePickerProps) {
  const [hovered, setHovered] = useState<Race | null>(null);
  const races = Object.keys(RACE_INFO) as Race[];
  const active = hovered ?? race;

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4" role="radiogroup" aria-label="Выбор расы">
        {races.map((key) => {
          const info = RACE_INFO[key];
          const selected = race === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(selected ? null : key)}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(key)}
              onBlur={() => setHovered(null)}
              className={`wh-panel p-4 text-left transition-all cursor-pointer focus:outline-none ${
                selected
                  ? 'border-[#e8c85a] shadow-[0_0_16px_rgba(232,200,90,0.35)] scale-[1.02]'
                  : 'hover:border-[#c9a227]/60 hover:-translate-y-0.5'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 shrink-0">
                  <RaceEmblem race={key} className="w-8 h-8 opacity-90" />
                </div>
                <h3 className="font-gothic text-lg font-bold text-[#e8c85a] uppercase tracking-wide leading-tight">
                  {info.name}
                </h3>
              </div>
              <p className="font-event text-sm text-[#a89870] leading-snug line-clamp-2">{info.description}</p>
            </button>
          );
        })}

        {/* Случайная судьба */}
        <button
          type="button"
          role="radio"
          aria-checked={race === null}
          onClick={() => onSelect(null)}
          onMouseEnter={() => setHovered(null)}
          onMouseLeave={() => setHovered(null)}
          className={`wh-panel p-4 text-left transition-all cursor-pointer focus:outline-none ${
            race === null
              ? 'border-[#e8c85a] shadow-[0_0_16px_rgba(232,200,90,0.35)] scale-[1.02]'
              : 'hover:border-[#c9a227]/60 hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center text-2xl">🎲</div>
            <h3 className="font-gothic text-lg font-bold text-[#e8c85a] uppercase tracking-wide leading-tight">
              Судьба решит
            </h3>
          </div>
          <p className="font-event text-sm text-[#a89870] leading-snug line-clamp-2">
            Золотая машина судьбы сама выберет, кем ты родишься.
          </p>
        </button>
      </div>

      {/* Детальная панель выбранной/наведённой расы */}
      <div className="wh-panel p-4 min-h-[88px]" aria-live="polite">
        {active ? (
          <div>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-gothic text-base font-bold text-[#e8c85a] uppercase tracking-wide">
                {RACE_INFO[active].name}
              </span>
              <span className="font-event text-xs italic text-gray-400">{RACE_DANGERS[active]}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {RACE_BONUSES[active].map((b) => (
                <span
                  key={b}
                  className="px-3 py-1 rounded-sm border border-[#c9a227]/40 bg-[#1c1913] text-[#d4b854] font-event text-sm"
                >
                  ✦ {b}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="font-event text-sm text-gray-400 italic self-center">
            Выбери расу — или доверься случайности. Происхождение определит события, ветки и саму твою смерть.
          </p>
        )}
      </div>
    </div>
  );
}
