import { CharacterStats } from '../game/types';
import { StatCard } from './StatCard';
import { RaceEmblem } from './RaceEmblem';
import {
  getHealthColor, getHealthBarColor, getSanityColor, getSanityBarColor,
  getWarpCorruptionColor, getWarpCorruptionBarColor,
} from '../game/utils';

type RaceInfo = { name: string; emoji: string; description: string };

interface GameHeaderProps {
  character: CharacterStats;
  raceInfo: RaceInfo;
  onNewGame: () => void;
}

/** Шапка игры: имя персонажа + плитки статов. */
export function GameHeader({ character, raceInfo, onNewGame }: GameHeaderProps) {
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

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 xl:gap-3">
          <StatCard
            label="Здоровье"
            value={`${character.health}/${character.maxHealth}`}
            valueClassName={getHealthColor(character.health, character.maxHealth)}
            showBar
            barValue={character.health}
            barMax={character.maxHealth}
            barColor={getHealthBarColor(character.health, character.maxHealth)}
            danger={character.health / character.maxHealth <= 0.25}
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
          />
          <div className="bg-[#161310] border border-[#c9a227]/25 rounded-sm px-3 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-yellow-400 font-semibold">💰 {character.credits}₡</span>
              <span className="text-green-400 font-semibold">🍖 {character.food}</span>
              <span className="text-red-400 font-semibold">🔫 {character.ammo}</span>
            </div>
          </div>
          <div className="bg-[#161310] border border-[#c9a227]/25 rounded-sm px-3 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">⭐ Влияние:</span>
              <span className="text-orange-400 font-bold">{character.influence}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-gray-400">🍀 Удача:</span>
              <span className="text-green-400 font-bold">{character.luck}</span>
            </div>
          </div>
          <div className="bg-[#161310] border border-[#c9a227]/25 rounded-sm px-3 py-2">
            <div className="text-xs text-gray-400 mb-1">Статус</div>
            <div className="text-sm text-purple-400 font-semibold truncate">{character.status}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
