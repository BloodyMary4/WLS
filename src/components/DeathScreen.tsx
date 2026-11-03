import { useState } from 'react';
import { CharacterStats } from '../game/types';
import { RaceEmblem } from './RaceEmblem';

type RaceInfo = { name: string; emoji: string; description: string };

interface DeathScreenProps {
  character: CharacterStats;
  raceInfo: RaceInfo;
  deathMessage: string;
  history: string[];
  onNewLife: () => void;
}

/** Хроника-запись о выборе в событии (формат reducer.handleChoice). */
const CHOICE_ENTRY_RE = /^\[Год \d+\]/;
/** Метка судьбоносного выбора (событие с effects.keyChoice). */
const FATE_MARK = '**судьба**';

/**
 * Выборка итоговой летописи жизни: судьбоносные выборы
 * (записи с меткой «судьба») + последние события жизни.
 */
export function buildLifeChronicle(
  history: string[],
  maxEntries = 8,
): string[] {
  const choiceEntries = history.filter((h) => CHOICE_ENTRY_RE.test(h));
  const fateEntries = choiceEntries.filter((h) => h.includes(FATE_MARK));
  const tail = choiceEntries.slice(-4);
  const merged = [...new Set([...fateEntries, ...tail])];
  return merged.slice(-maxEntries);
}

/** Убирает служебную markdown-метку судьбы из строки хроники (с нормализацией пробелов). */
export function cleanChronicleEntry(entry: string): string {
  return entry.replace(FATE_MARK, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Текстовая версия летописи для экспорта в буфер обмена
 * (дорожная карта UI/UX п.5): заголовок, итоги и отформатированные записи.
 */
export function buildChronicleExport(
  character: Pick<CharacterStats, 'raceName' | 'age' | 'planet' | 'caste' | 'status'>,
  deathMessage: string,
  chronicle: string[],
): string {
  const lines = [
    '⚔️ WARHAMMER LIFE SIMULATOR — ЛЕТОПИСЬ ЖИЗНИ',
    `${character.raceName} • ${character.age} лет • ${character.planet} • ${character.caste} • ${character.status}`,
    `Гибель: ${deathMessage}`,
    '',
    ...chronicle.map((entry) => {
      const isFate = entry.includes(FATE_MARK);
      return `- ${isFate ? '🏵 СУДЬБА: ' : ''}${cleanChronicleEntry(entry)}`;
    }),
    '',
    '«Во тьме грядущего есть лишь война.» — Warhammer 40,000',
  ];
  return lines.join('\n');
}

/** Эпитафия: итоги жизни, экспорт летописи и кнопка новой реинкарнации. */
export function DeathScreen({ character, raceInfo, deathMessage, history, onNewLife }: DeathScreenProps) {
  const miracles = character.intercessionCount ?? 0;
  const chronicle = buildLifeChronicle(history);
  const [copied, setCopied] = useState(false);

  /** Копирование полной летописи жизни в буфер обмена (дорожная карта п.5). */
  const copyChronicle = async () => {
    const text = buildChronicleExport(character, deathMessage, chronicle);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Фолбэк для Electron/старых окружений без Clipboard API
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="relative inline-block mb-8">
        <div className="text-8xl drop-shadow-[0_0_18px_rgba(163,0,0,0.5)]">☠️</div>
        <div className="absolute inset-0 bg-wh-blood/15 rounded-full blur-3xl"></div>
      </div>
      <h2 className="font-gothic text-5xl font-bold mb-6 uppercase tracking-[0.25em] bg-gradient-to-b from-[#e74c3c] via-[#a30000] to-[#5c0000] bg-clip-text text-transparent">
        СМЕРТЬ
      </h2>
      <p className="text-lg leading-relaxed mb-10 max-w-2xl mx-auto text-gray-300">
        {deathMessage}
      </p>
      {miracles > 0 && (
        <div className="wh-parchment wh-miracle rounded-sm p-5 mb-10 max-w-2xl mx-auto animate-gold-sheen">
          <p className="font-event text-lg italic text-[#e8d9b0]">
            🕊️ Смерть отводила взор {miracles} {miracles === 1 ? 'раз' : miracles < 5 ? 'раза' : 'раз'} — но в последний раз Трон молчал.
          </p>
          <p className="font-gothic text-sm uppercase tracking-[0.2em] text-[#c9a227] mt-2">
            Чудес заступничества за жизнь: {miracles}
          </p>
        </div>
      )}
      <div className="wh-panel wh-frame p-8 mb-10 text-left max-w-2xl mx-auto">
        <h3 className="font-gothic text-2xl font-bold text-[#e8c85a] mb-6 uppercase tracking-[0.15em] flex items-center gap-3">
          <span className="text-3xl">📜</span>
          Итоги жизни
        </h3>
        <div className="space-y-4 text-lg">
          <div className="flex justify-between items-center py-3 border-b border-gray-700">
            <span className="text-gray-400">Раса:</span>
            <span className="flex items-center gap-2 font-bold text-wh-caution text-xl">
              <RaceEmblem race={character.race} className="w-7 h-7" />
              {character.raceName}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-700">
            <span className="text-gray-400">Прожито лет:</span>
            <span className="font-bold text-white text-3xl">{character.age}</span>
          </div>
          {miracles > 0 && (
            <div className="flex justify-between items-center py-3 border-b border-gray-700">
              <span className="text-gray-400">Чудес Императора:</span>
              <span className="font-bold text-[#e8c85a] text-xl">🕊️ ×{miracles}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-3 border-b border-gray-700">
            <span className="text-gray-400">Планета:</span>
            <span className="font-semibold text-cyan-400 text-lg">{character.planet}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-700">
            <span className="text-gray-400">Сословие:</span>
            <span className="font-semibold text-wh-caution text-lg">{character.caste}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-400">Статус:</span>
            <span className="font-semibold text-wh-warp-low text-lg">{character.status}</span>
          </div>
        </div>
      </div>
      {chronicle.length > 0 && (
        <div className="wh-parchment rounded-sm p-6 mb-10 max-w-2xl mx-auto text-left">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-gothic text-xl font-bold text-[#c9a227] uppercase tracking-[0.15em] flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">🕯️</span>
              Летопись жизни
            </h3>
            <button
              type="button"
              onClick={copyChronicle}
              aria-live="polite"
              title="Скопировать летопись в буфер обмена"
              className={`shrink-0 px-3 py-1.5 rounded-sm text-xs font-gothic uppercase tracking-wider border transition-colors ${
                copied
                  ? 'border-green-500/70 text-green-300 bg-green-900/20'
                  : 'border-[#c9a227]/50 text-[#e8c85a] hover:border-[#c9a227] hover:bg-[#c9a227]/10'
              }`}
            >
              {copied ? '✓ Скопировано' : '📋 Скопировать'}
            </button>
          </div>
          <ul className="space-y-2">
            {chronicle.map((entry, i) => {
              const isFate = entry.includes('**судьба**');
              const clean = entry.replace('**судьба**', '').trim();
              return (
                <li
                  key={i}
                  className={`font-event text-sm leading-relaxed border-l-2 pl-3 ${
                    isFate
                      ? 'border-[#c9a227] text-[#e8d9b0] italic'
                      : 'border-gray-500 text-gray-400'
                  }`}
                >
                  {isFate && <span className="not-italic font-gothic text-[10px] uppercase tracking-[0.2em] text-[#c9a227] mr-2">Судьба</span>}
                  {clean}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <button
        onClick={onNewLife}
        className="btn-wh-primary btn-modern font-bold py-4 px-14 rounded-sm text-xl transition-all hover:scale-105"
      >
        ⚔️ Начать новую жизнь
      </button>
    </div>
  );
}
