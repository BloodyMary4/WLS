import { CharacterStats } from '../game/types';
import { StatCard } from './StatCard';
import { RaceEmblem } from './RaceEmblem';
import { listCriticalStats } from '../game/critical';
import { STAT_HINTS, foodCaption } from '../game/statMeta';
import { significantDeltas } from '../game/deltaLabels';
import { PublicStatKey } from '../game/utils';
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

/** Плитка припасов: значение + человекочитаемая подпись; краснеет, когда ресурс на исходе. */
function SupplyValue({ icon, value, unit, caption, critical, hint }: { icon: string; value: number; unit?: string; caption: string; critical?: boolean; hint: string }) {
  return (
    <span title={hint}>
      <span className={`font-semibold tabular-nums ${critical ? 'text-[#e07a7a] font-bold' : ''}`}>
        {icon} {value}{unit}
        {critical && <span aria-hidden="true" className="ml-0.5">⚠</span>}
      </span>
      <SupplyCaption text={caption} critical={critical} />
    </span>
  );
}

/** Шапка игры: имя персонажа + плитки статов + предупреждение о критических состояниях. */
export function GameHeader({ character, raceInfo, lastDeltas, onNewGame }: GameHeaderProps) {
  const criticals = listCriticalStats(character);
  const turnResult = significantDeltas(lastDeltas);
  return (
    <header className="sticky top-0 z-40 border-b border-[#c9a227]/30 shadow-lg" style={{ background: 'linear-gradient(180deg, rgba(28,24,14,0.95) 0%, rgba(11,10,8,0.95) 100%)', backdropFilter: 'blur(8px)' }}>
      <div className="wh-header-compact mx-auto w-full max-w-[1700px] px-4 xl:px-6 py-3">
        <div className="header-row flex items-center justify-between mb-3 animate-slide-in-left">
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
              className="hidden md:flex items-center gap-1.5 rounded-sm border border-[#a30000]/70 bg-[#2a0d0d]/80 px-3 py-1.5 text-xs font-gothic uppercase tracking-wider text-[#e07a7a] animate-glow shrink-0"
            >
              <span aria-hidden="true">☠</span>
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
            🔄 Новая игра
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
          {/* Припасы: 4 ячейки 2×2 — голод и боезапас подсвечиваются, когда на исходе */}
          <div className="bg-[#161310] border border-[#c9a227]/25 rounded-sm px-3 py-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <span title={character.credits === 0 ? '💰 Кредиты: ни одного кредита — торг и взятки недоступны' : `💰 Кредиты: ${character.credits} ₡ — деньги на торг, взятки и припасы`}>
              <span className={`font-semibold tabular-nums ${character.credits === 0 ? 'text-[#e07a7a] font-bold' : 'text-yellow-400'}`}>
                💰 {character.credits}₡{character.credits === 0 && <span aria-hidden="true" className="ml-0.5">⚠</span>}
              </span>
              <SupplyCaption text={character.credits === 0 ? 'нет денег' : 'кредиты'} critical={character.credits === 0} />
            </span>
            <SupplyValue
              icon="🍖" value={character.food} critical={character.food <= 1}
              caption={foodCaption(character.food)}
              hint={`🍖 Провизия: ${character.food} — ${foodCaption(character.food)}. ${STAT_HINTS.food}`}
            />
            <SupplyValue
              icon="🔫" value={character.ammo} unit="" critical={character.ammo <= 0}
              caption={character.ammo <= 0 ? 'оружие молчит!' : 'заряды'}
              hint={`🔫 Боезапас: ${character.ammo}. ${STAT_HINTS.ammo}`}
            />
            <span title={`Текущее положение персонажа: ${character.status}`}>
              <span className="text-[#d8c9a3]">{character.status}</span>
              <SupplyCaption text="положение" />
            </span>
          </div>
          <div className="bg-[#161310] border border-[#c9a227]/25 rounded-sm px-3 py-2 flex flex-col justify-center gap-1 text-xs">
            <div className="flex items-baseline justify-between gap-2 cursor-help" title={STAT_HINTS.influence}>
              <span className="text-[#b8a878]">⭐ Влияние</span>
              <span className="text-orange-400 font-bold tabular-nums">{character.influence}</span>
            </div>
            <div className="flex items-baseline justify-between gap-2 cursor-help" title={STAT_HINTS.luck}>
              <span className="text-[#b8a878]">🍀 Удача{character.luck <= 2 && <span aria-hidden="true" className="ml-0.5 text-[#e07a7a]">⚠</span>}</span>
              <span className={`font-bold tabular-nums ${character.luck <= 2 ? 'text-[#e07a7a]' : 'text-green-400'}`}>{character.luck}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
