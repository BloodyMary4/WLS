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

/** Любая осмысленная запись жизни: выборы, чудеса, наследие. */
const ANY_ENTRY_RE = /^\[(?:Год \d+|Наследие)/;
/** Метка судьбоносного выбора (событие с effects.keyChoice). */
const FATE_MARK = '**судьба**';

/**
 * Выборка итоговой летописи жизни: судьбоносные выборы
 * (записи с меткой «судьба») + последние события жизни.
 * v0.3.85: учитываются не только строки «[Год N]», но и «[Наследие]» /
 * «[Ключевой …]» — раньше при редких форматах записей летопись могла
 * оказаться пустой и весь блок исчезал с экрана смерти.
 */
export function buildLifeChronicle(
  history: string[],
  maxEntries = 8,
): string[] {
  const choiceEntries = history.filter((h) => ANY_ENTRY_RE.test(h));
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
  // v0.3.85: летопись не должна исчезать с экрана смерти. Если отбор пуст
  // (например, гибель до первого завершённого выбора) — показываем последние
  // записи истории, а при полном их отсутствии — запись о рождении и гибели.
  const chronicle = (() => {
    const picked = buildLifeChronicle(history);
    if (picked.length > 0) return picked;
    const recent = history.slice(-8);
    if (recent.length > 0) return recent;
    return [`[Год ${character.age}] ${deathMessage}`];
  })();
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
    /* v0.3.87 «Эпитафия по объёму»: экран смерти растягивается строго на
       всю предоставленную ему область (fit-режим — колонка мостика на всю
       высоту вьюпорта). Верх (чаша с черепом) и низ (кнопка реинкарнации)
       прижаты к краям, середина — равномерный поток колонок-секций;
       лишние отступы py-16/mb-10 убраны, чтобы контент не обрезался и не
       «плыл» внутри рамки. */
    <div className="death-screen flex flex-col text-center animate-fade-in">
      <div className="death-hero shrink-0">
        <div className="relative inline-block mb-4">
          <div className="text-7xl md:text-8xl drop-shadow-[0_0_18px_rgba(163,0,0,0.5)]">☠️</div>
          <div className="absolute inset-0 bg-wh-blood/15 rounded-full blur-3xl"></div>
        </div>
        <h2 className="font-gothic text-4xl md:text-5xl font-bold mb-3 uppercase tracking-[0.25em] bg-gradient-to-b from-[#e74c3c] via-[#a30000] to-[#5c0000] bg-clip-text text-transparent">
          СМЕРТЬ
        </h2>
        <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto text-gray-300">
          {deathMessage}
        </p>
      </div>
      {miracles > 0 && (
        <div className="wh-parchment wh-miracle rounded-sm p-5 mb-6 max-w-2xl mx-auto w-full animate-gold-sheen shrink-0">
          <p className="font-event text-lg italic text-[#e8d9b0]">
            🕊️ Смерть отводила взор {miracles} {miracles === 1 ? 'раз' : miracles < 5 ? 'раза' : 'раз'} — но в последний раз Трон молчал.
          </p>
          <p className="font-gothic text-sm uppercase tracking-[0.2em] text-[#c9a227] mt-2">
            Чудес заступничества за жизнь: {miracles}
          </p>
        </div>
      )}
      {/* v0.3.87: секции летописи уложены в один равномерный поток —
          «Итоги жизни» и пергамент хроники делят среднюю область по объёму,
          каждая со своим внутренним скроллом (летопись не обрезается). */}
      <div className="death-body flex-1 min-h-0 w-full grid gap-4 my-4 place-content-stretch">
      <div className="wh-panel wh-frame p-5 xl:p-6 text-left max-w-2xl mx-auto w-full death-summary min-h-0 overflow-y-auto">
        <h3 className="font-gothic text-xl font-bold text-[#e8c85a] mb-4 uppercase tracking-[0.15em] flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">📜</span>
          Итоги жизни
        </h3>
        <div className="space-y-2 text-base">
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
        <div className="wh-parchment rounded-sm p-5 max-w-2xl mx-auto w-full text-left death-chronicle min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between gap-3 mb-3 sticky top-0 z-10" style={{ background: 'linear-gradient(180deg, #1a1610 70%, rgba(26,22,16,0))', paddingTop: '2px' }}>
            <h3 className="font-gothic text-lg font-bold text-[#c9a227] uppercase tracking-[0.15em] flex items-center gap-3">
              <span className="text-xl" aria-hidden="true">🕯️</span>
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
      </div>{/* /death-body */}
      <button
        onClick={onNewLife}
        className="btn-wh-primary btn-modern font-bold py-3 px-12 rounded-sm text-lg transition-all hover:scale-105 shrink-0 mx-auto"
      >
        ⚔️ Начать новую жизнь
      </button>
    </div>
  );
}
