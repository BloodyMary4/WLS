import { CharacterStats } from '../game/types';
import { StatCard } from './StatCard';
import { RaceEmblem } from './RaceEmblem';
import { useFit, useShortScreen } from '../game/useFit';
import { listCriticalStats } from '../game/critical';
import { STAT_HINTS, STATUS_HINTS, foodCaption } from '../game/statMeta';
import { significantDeltas } from '../game/deltaLabels';
import { PublicStatKey } from '../game/utils';
import { GameIcon } from './icons';
import {
  getHealthColor, getHealthBarColor, getSanityColor, getSanityBarColor,
  getWarpCorruptionColor, getWarpCorruptionBarColor,
} from '../game/utils';

type RaceInfo = { name: string; emoji: string; description: string };

interface GameHeaderProps {
  character: CharacterStats;
  raceInfo: RaceInfo;
  /** Значимые дельты последнего хода — баннер «Итог выбора» рядом с именем. */
  lastDeltas?: Partial<Record<PublicStatKey, number>> | null;
  onNewGame: () => void;
}

/** Подпись под числом запаса — понятный смысл цифры («хватит на 2 года»). */
function SupplyCaption({ text, critical }: { text: string; critical?: boolean }) {
  return (
    <span
      className={`block text-[10px] leading-tight ${critical ? 'text-[#e07a7a]' : 'text-[#b8a878]/80'}`}
    >
      {text}
    </span>
  );
}

/** Компактный HUD-сегмент приборной панели: засечки-метка, значение, микро-шкала. */
function HudChip({ label, value, pct, barClass, danger, hint }: {
  label: string;
  value: string;
  pct: number;
  barClass: string;
  danger?: boolean;
  hint: string;
}) {
  return (
    <div
      title={hint}
      className={`wh-hud-seg${danger ? ' wh-hud-seg-danger' : ''}`}
    >
      <span className="wh-hud-label !normal-case !tracking-normal">{label}</span>
      <span className={`wh-hud-value${danger ? ' !text-[#e07a7a]' : ''}`}>
        {value}
        {danger && <span aria-hidden="true" className="ml-0.5 inline-block w-3 h-3 align-[-2px]"><GameIcon name="warning" className="w-full h-full" /></span>}
      </span>
      <span className="wh-bar overflow-hidden hidden md:block" style={{ width: '44px', height: '3px' }} aria-hidden="true">
        <span className={`block h-full ${barClass}`} style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}></span>
      </span>
    </div>
  );
}

/** Припас/стат одной строкой без эмодзи: текстовая метка + число (v0.3.52). */
function TextChip({ label, value, danger, hint }: { label: string; value: string; danger?: boolean; hint: string }) {
  return (
    <div title={hint} className={`wh-hud-seg${danger ? ' wh-hud-seg-danger' : ''}`}>
      <span className="wh-hud-label !normal-case !tracking-normal">{label}</span>
      <span className={`wh-hud-value whitespace-nowrap${danger ? ' !text-[#e07a7a] font-bold' : ''}`}>{value}</span>
    </div>
  );
}

/** Строка припасов в плитке non-fit HUD: метка — значение, ниже человекочитаемая подпись. */
function HudRow({ label, value, caption, danger, hint }: { label: string; value: string; caption?: string; danger?: boolean; hint: string }) {
  return (
    <span title={hint}>
      <span className={`font-semibold tabular-nums ${danger ? 'text-wh-blood font-bold' : 'text-[#e8d9b0]'}`}>
        {label}: {value}{danger && <span aria-hidden="true" className="ml-0.5 inline-block w-3 h-3 align-[-2px]"><GameIcon name="warning" className="w-full h-full" /></span>}
      </span>
      {caption && <SupplyCaption text={caption} critical={danger} />}
    </span>
  );
}

/** Шапка игры: имя персонажа + плитки статов + предупреждение о критических состояниях. */
export function GameHeader({ character, raceInfo, lastDeltas, onNewGame }: GameHeaderProps) {
  const criticals = listCriticalStats(character);
  const turnResult = significantDeltas(lastDeltas);
  // В fit-режиме шапка — одна приборная строка: вертикаль целиком отдаётся окнам.
  const fit = useFit();
  const short = useShortScreen();

  if (fit) {
    const hpPct = character.maxHealth > 0 ? (character.health / character.maxHealth) * 100 : 0;
    return (
      <header className="wh-hud-strip shrink-0 z-40">
        <div className="mx-auto w-full max-w-[1700px] px-3 py-1 flex items-center gap-2 flex-nowrap overflow-x-auto wh-scroll">
          <RaceEmblem race={character.race} className="w-6 h-6 shrink-0 drop-shadow-[0_0_6px_rgba(201,162,39,0.35)]" />
          <div className="min-w-0 shrink-0 max-w-[220px]">
            <div className="font-gothic text-sm font-bold uppercase tracking-wide bg-gradient-to-b from-[#f0d878] to-[#a8821a] bg-clip-text text-transparent truncate animate-gold-sheen">
              {character.name}
            </div>
            <div className="text-[10px] text-gray-400 truncate" title={`${character.raceName}, ${character.age} лет, планета ${character.planet}`}>
              {character.raceName} • {character.age} лет • {character.planet}
            </div>
          </div>

          <HudChip label="Здоровье" value={`${character.health}/${character.maxHealth}`} pct={hpPct}
            barClass={getHealthBarColor(character.health, character.maxHealth)}
            danger={character.maxHealth > 0 && character.health / character.maxHealth <= 0.25}
            hint={STAT_HINTS.health} />
          <HudChip label="Рассудок" value={`${character.sanity}%`} pct={character.sanity}
            barClass={getSanityBarColor(character.sanity)} danger={character.sanity <= 20} hint={STAT_HINTS.sanity} />
          <HudChip label="Порча" value={`${character.warpCorruption}%`} pct={character.warpCorruption}
            barClass={getWarpCorruptionBarColor(character.warpCorruption)} danger={character.warpCorruption >= 80} hint={STAT_HINTS.warpCorruption} />
          <HudChip label="Влияние" value={`${character.influence}`} pct={Math.min(100, character.influence)}
            barClass="bg-wh-caution" hint={STAT_HINTS.influence} />
          <HudChip label="Удача" value={`${character.luck}`} pct={character.luck * 10}
            barClass="bg-wh-health" danger={character.luck <= 2} hint={STAT_HINTS.luck} />

          {/* Припасы: отдельные текстовые ячейки без эмодзи (v0.3.52) */}
          <TextChip label="Кредиты" value={`${character.credits}₡`} danger={character.credits === 0}
            hint={character.credits === 0 ? 'Кредиты: ни одного — торг и взятки недоступны' : `Кредиты: ${character.credits} ₡ — деньги на торг, взятки и припасы`} />
          <TextChip label="Провизия" value={String(character.food)} danger={character.food <= 1}
            hint={`Провизия: ${character.food} — ${foodCaption(character.food)}. ${STAT_HINTS.food}`} />
          <TextChip label="Боезапас" value={String(character.ammo)} danger={character.ammo <= 0}
            hint={`Боезапас: ${character.ammo}. ${STAT_HINTS.ammo}`} />
          <div className="wh-hud-seg">
            <span className="wh-hud-label !normal-case !tracking-normal">Положение</span>
            <span title={STATUS_HINTS[character.status] ?? `Твоё место в жизни: ${character.status}. Смена положения приходит с судьбоносными выборами.`}
              className="wh-hud-value !text-[#d8c9a3] whitespace-nowrap cursor-help">
              {character.status}
            </span>
          </div>

          {/* Итог последнего выбора — прямо в приборной строке */}
          {!short && turnResult.length > 0 && (
            <div role="status" aria-label={`Итог выбора: ${turnResult.map((d) => d.text).join(', ')}`}
              className="wh-hud-seg !border-[#c9a227]/40 shrink-0 animate-fade-in">
              <span className="wh-hud-label">Итог:</span>
              {turnResult.map((d) => (
                <span key={d.key} className={`wh-hud-value ${d.tone === 'good' ? '!text-[#7fc97f]' : '!text-[#e07a7a]'}`}>{d.text}</span>
              ))}
            </div>
          )}
          {criticals.length > 0 && (
            <div role="alert" title={`Критично: ${criticals.join(', ').toLowerCase()}`}
              className="wh-hud-seg wh-hud-seg-danger !font-gothic !uppercase !tracking-wider !text-[#e07a7a] shrink-0">
              <span aria-hidden="true" className="inline-block w-3.5 h-3.5"><GameIcon name="skull" className="w-full h-full" /></span>
              {criticals.join(' • ')}
            </div>
          )}

          <button onClick={() => { if (confirm('Начать новую игру?')) onNewGame(); }}
            className="btn-modern ml-auto bg-gradient-to-r from-[#1c1913] to-[#2a2517] hover:from-[#2a2517] hover:to-[#38301e] text-[#c9a227] font-gothic text-xs py-1 px-3 rounded-sm border border-[#c9a227]/50 hover:border-[#e8c85a] transition-all shrink-0 whitespace-nowrap">
            Новая игра
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="wh-hud-panel sticky top-0 z-40 shadow-lg">
      <div className="wh-header-compact mx-auto w-full max-w-[1700px] px-4 xl:px-6 py-2.5">
        <div className="header-row flex items-center justify-between mb-2 animate-slide-in-left">
          <div className="flex items-center gap-3 min-w-0">
            <RaceEmblem race={character.race} className="w-9 h-9 xl:w-10 xl:h-10 shrink-0 drop-shadow-[0_0_6px_rgba(201,162,39,0.35)]" />
            <div className="min-w-0">
              <div className="font-gothic text-xl font-bold uppercase tracking-wide bg-gradient-to-b from-[#f0d878] to-[#a8821a] bg-clip-text text-transparent truncate animate-gold-sheen">
                {character.name}
              </div>
              <div className="text-sm text-gray-400 truncate">
                {character.raceName} • {character.age} лет • {character.planet}
              </div>
            </div>
          </div>
          {/* Итог последнего выбора — значимые дельты прямо в шапке (фаза результата) */}
          {turnResult.length > 0 && (
            <div
              role="status"
              aria-label={`Итог выбора: ${turnResult.map((d) => d.text).join(', ')}`}
              className="hidden xl:flex items-center gap-1.5 rounded-sm border border-[#c9a227]/40 bg-[#1c1913]/80 px-3 py-1.5 text-xs font-semibold tabular-nums shrink-0 animate-fade-in"
            >
              <span className="font-gothic uppercase tracking-wider text-[#b8a878]/80">Итог:</span>
              {turnResult.map((d) => (
                <span key={d.key} className={d.tone === 'good' ? 'text-[#7fc97f]' : 'text-[#e07a7a]'}>
                  {d.text}
                </span>
              ))}
            </div>
          )}
          {/* Критические состояния — видно сразу, без прокрутки к полоскам */}
          {criticals.length > 0 && (
            <div
              role="alert"
              title={`Критично: ${criticals.join(', ').toLowerCase()}`}
              className="hidden md:flex items-center gap-1.5 rounded-sm border border-[#a30000]/70 bg-[#2a0d0d]/80 px-3 py-1.5 text-xs font-gothic uppercase tracking-wider text-[#e07a7a] shrink-0"
            >
              <span aria-hidden="true" className="inline-block w-3.5 h-3.5"><GameIcon name="skull" className="w-full h-full" /></span>
              {criticals.join(' • ')}
            </div>
          )}
          <button
            onClick={() => {
              if (confirm('Начать новую игру?')) {
                onNewGame();
              }
            }}
            className="btn-modern bg-gradient-to-r from-[#1c1913] to-[#2a2517] hover:from-[#2a2517] hover:to-[#38301e] text-[#c9a227] font-gothic text-sm py-1.5 px-4 rounded-sm border border-[#c9a227]/50 hover:border-[#e8c85a] transition-all shadow-lg shrink-0"
          >
            Новая игра
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 xl:gap-3">
          <StatCard
            label="Здоровье"
            value={`${character.health}/${character.maxHealth}`}
            valueClassName={getHealthColor(character.health, character.maxHealth)}
            showBar
            barValue={character.health}
            barMax={character.maxHealth}
            barColor={getHealthBarColor(character.health, character.maxHealth)}
            danger={character.health / character.maxHealth <= 0.25}
            hint={STAT_HINTS.health}
          />
          <StatCard
            label="Рассудок"
            value={`${character.sanity}%`}
            valueClassName={getSanityColor(character.sanity)}
            showBar
            barValue={character.sanity}
            barMax={100}
            barColor={getSanityBarColor(character.sanity)}
            danger={character.sanity <= 20}
            hint={STAT_HINTS.sanity}
          />
          <StatCard
            label="Порча"
            value={`${character.warpCorruption}%`}
            valueClassName={getWarpCorruptionColor(character.warpCorruption)}
            showBar
            barValue={character.warpCorruption}
            barMax={100}
            barColor={getWarpCorruptionBarColor(character.warpCorruption)}
            danger={character.warpCorruption >= 80}
            hint={STAT_HINTS.warpCorruption}
          />
          {/* Припасы: чистая таблица без эмодзи (v0.3.52) */}
          <div className="wh-hud-cell grid grid-cols-2 gap-x-3 gap-y-1">
            <span className="wh-hud-label col-span-2 !text-[10px]" aria-hidden="true">Припасы</span>
            <HudRow label="Кредиты" value={`${character.credits}₡`} danger={character.credits === 0}
              caption={character.credits === 0 ? 'нет денег' : 'на торг и взятки'}
              hint={character.credits === 0 ? 'Кредиты: ни одного кредита — торг и взятки недоступны' : `Кредиты: ${character.credits} ₡ — деньги на торг, взятки и припасы`} />
            <HudRow label="Провизия" value={String(character.food)} danger={character.food <= 1}
              caption={foodCaption(character.food)}
              hint={`Провизия: ${character.food} — ${foodCaption(character.food)}. ${STAT_HINTS.food}`} />
            <HudRow label="Боезапас" value={String(character.ammo)} danger={character.ammo <= 0}
              caption={character.ammo <= 0 ? 'оружие молчит!' : 'заряды'}
              hint={`Боезапас: ${character.ammo}. ${STAT_HINTS.ammo}`} />
            <HudRow label="Положение" value={character.status} caption="кто ты сейчас"
              hint={STATUS_HINTS[character.status] ?? `Твоё место в жизни: ${character.status}. Смена ремесла или положения приходит с судьбоносными выборами.`} />
          </div>
          <div className="wh-hud-cell">
            <span className="wh-hud-label !text-[10px]" aria-hidden="true">Судьба</span>
            <div className="flex items-baseline justify-between gap-2 cursor-help" title={STAT_HINTS.influence}>
              <span className="text-[#b8a878]">Влияние</span>
              <span className="text-wh-caution font-bold tabular-nums">{character.influence}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 cursor-help" title={STAT_HINTS.luck}>
              <span className="text-[#b8a878]">Удача{character.luck <= 2 && <span aria-hidden="true" className="ml-0.5 inline-block w-3 h-3 align-[-2px] text-wh-blood"><GameIcon name="warning" className="w-full h-full" /></span>}</span>
              <span className={`font-bold tabular-nums ${character.luck <= 2 ? 'text-wh-blood' : 'text-wh-health'}`}>{character.luck}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
