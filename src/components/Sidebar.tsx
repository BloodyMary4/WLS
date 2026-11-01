import { CharacterStats } from '../game/types';
import { HiddenStat } from './HiddenStat';

type RaceInfo = { name: string; emoji: string; description: string };

/** Русская плюрализация: 1 чудо / 2-4 чуда / 5+ чудес */
function declineMiracles(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'чудо';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'чуда';
  return 'чудес';
}

interface SidebarProps {
  character: CharacterStats;
  raceInfo: RaceInfo;
  activeQuests: any[];
  history: string[];
  logRef: React.RefObject<HTMLDivElement>;
  open: boolean;
}

/** Левая колонка: скрытые параметры, расовые особенности, снаряжение, NPC, квесты, хроника. */
export function Sidebar({ character, raceInfo, activeQuests, history, logRef, open }: SidebarProps) {
  return (
    <aside className={`lg:col-span-3 space-y-4 animate-slide-in-left ${open ? 'block' : 'hidden lg:block'}`}>
      <div className="wh-panel p-6">
        <h3 className="wh-panel-title font-bold text-lg mb-4 pb-3 flex items-center gap-3">
          <span className="text-2xl">📊</span>
          Характеристики
        </h3>
        <div className="space-y-3">
          <HiddenStat label="Вера" value={character.hiddenParams.faith} icon="✝️" color="bg-amber-500" />
          <HiddenStat label="Хитрость" value={character.hiddenParams.cunning} icon="🗡️" color="bg-emerald-500" />
          <HiddenStat label="Сила" value={character.hiddenParams.strength} icon="💪" color="bg-red-500" />
          <HiddenStat label="Воля" value={character.hiddenParams.willpower} icon="🛡️" color="bg-blue-500" />
          {character.race === 'human' && (
            <>
              <HiddenStat label="Мутация" value={character.hiddenParams.mutation} icon="☣️" color="bg-purple-500" />
              <HiddenStat label="Подозрение" value={character.hiddenParams.suspicion} icon="👁️" color="bg-orange-500" />
            </>
          )}
        </div>

        {/* Верность Императору — скрытая добродетель людей: при 10 смерть может быть отвращена чудом */}
        {character.race === 'human' && typeof character.imperialCreed === 'number' && (
          <div className={`mt-4 pt-3 border-t ${character.imperialCreed >= 8 ? 'border-yellow-500/60 animate-candle' : 'border-[#c9a227]/20'}`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-gothic text-[#b8a878] tracking-wide">🕊️ Верность Императору</span>
              <span className={`font-bold ${character.imperialCreed >= 8 ? 'text-yellow-300' : 'text-[#d8c9a3]'}`}>
                {character.imperialCreed}/10
              </span>
            </div>
            <div className="wh-bar w-full overflow-hidden" style={{ height: '6px' }}>
              <div
                className="wh-bar-fill bg-gradient-to-r from-yellow-700 to-yellow-400"
                style={{ width: `${(character.imperialCreed / 10) * 100}%`, height: '100%' }}
              ></div>
            </div>
            {character.imperialCreed >= 5 && (
              <p className="text-[11px] text-yellow-500/70 italic mt-1.5 leading-snug">
                {character.intercessionCount
                  ? `Смерть уже отводила взор ${character.intercessionCount} ${declineMiracles(character.intercessionCount)}.`
                  : 'Твоя вера замечена на Троне. В час смерти Он может взглянуть вниз.'}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="wh-panel p-6">
        <h3 className="wh-panel-title font-bold text-lg mb-4 pb-3 flex items-center gap-3">
          <span className="text-2xl">{raceInfo.emoji}</span>
          Расовые особенности
        </h3>
        <div className="space-y-3">
          {character.race === 'ork' && <HiddenStat label="WAAAGH!" value={character.hiddenParams.waaagh || 0} icon="⚔️" color="bg-green-500" />}
          {character.race === 'eldar' && <HiddenStat label="Пси-сила" value={character.hiddenParams.psi || 0} icon="🔮" color="bg-purple-500" />}
          {character.race === 'eldar' && <HiddenStat label="Благородство" value={character.hiddenParams.nobility || 0} icon="👑" color="bg-blue-400" />}
          {character.race === 'dark_eldar' && <HiddenStat label="Жестокость" value={character.hiddenParams.cruelty || 0} icon="🩸" color="bg-red-500" />}
          {character.race === 'tau' && <HiddenStat label="Единство" value={character.hiddenParams.unity || 0} icon="🔷" color="bg-cyan-500" />}
          {character.race === 'tau' && <HiddenStat label="Технологии" value={character.hiddenParams.techSkill || 0} icon="⚙️" color="bg-blue-400" />}
          {character.race === 'gretchin' && <HiddenStat label="Скрытность" value={character.hiddenParams.sneakiness || 0} icon="🐀" color="bg-yellow-600" />}
        </div>
      </div>

      <div className="wh-panel p-6">
        <h3 className="wh-panel-title font-bold text-lg mb-4 pb-3 flex items-center gap-3">
          <span className="text-2xl">🎒</span>
          Снаряжение
        </h3>
        <div className="space-y-3 text-base">
          <div>
            <div className="text-sm text-gray-400 mb-2 font-semibold">Инвентарь</div>
            <div className="text-gray-200">{character.inventory.length > 0 ? character.inventory.join(', ') : 'пусто'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-2 font-semibold">Черты</div>
            <div className="text-blue-400">{character.traits.length > 0 ? character.traits.join(', ') : 'нет'}</div>
          </div>
        </div>
      </div>

      {/* Встреченные души (NPC) */}
      {character.npcs.length > 0 && (
        <div className="wh-panel p-6">
          <h3 className="wh-panel-title font-bold text-lg mb-4 pb-3 flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            Встреченные души ({character.npcs.length})
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {character.npcs.slice(0, 5).map((npc) => (
              <div key={npc.id} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-yellow-600/30 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-100">{npc.name}</div>
                    <div className="text-xs text-yellow-600/80 italic">{npc.role}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold ${
                      npc.relationship >= 50 ? 'text-green-400' :
                      npc.relationship >= 0 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {npc.relationship > 0 ? 'Союзник' :
                       npc.relationship >= 0 ? 'Нейтрал' : 'Враг'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {npc.lastInteraction} лет назад
                    </div>
                  </div>
                </div>
                {npc.description && (
                  <div className="text-xs text-gray-400 italic mb-2">{npc.description}</div>
                )}
                <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      npc.relationship >= 50 ? 'bg-green-500' :
                      npc.relationship >= 0 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.abs(npc.relationship)}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {character.npcs.length > 5 && (
              <div className="text-center text-xs text-gray-500 pt-2 italic">
                ...и ещё {character.npcs.length - 5} душ на твоём пути
              </div>
            )}
          </div>
        </div>
      )}

      {/* Испытания судьбы (квесты) */}
      {activeQuests.length > 0 && (
        <div className="wh-panel p-6">
          <h3 className="wh-panel-title font-bold text-lg mb-4 pb-3 flex items-center gap-3">
            <span className="text-2xl">📜</span>
            Испытания судьбы ({activeQuests.length})
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activeQuests.map((quest) => (
              <div key={quest.id} className="p-4 bg-gray-800/50 rounded-lg border border-yellow-600/30 hover:border-yellow-500/50 transition-all">
                <div className="text-base font-bold text-yellow-400 mb-2">{quest.name}</div>
                <div className="text-xs text-gray-400 italic mb-3 leading-relaxed">{quest.description}</div>
                <div className="space-y-2 mb-3">
                  {quest.objectives.map((obj: any) => (
                    <div key={obj.id} className="flex items-start gap-2 text-xs">
                      <span className={`text-sm ${obj.completed ? 'text-green-400' : 'text-gray-600'}`}>
                        {obj.completed ? '☠' : '○'}
                      </span>
                      <span className={`flex-1 ${obj.completed ? 'text-green-300 line-through' : 'text-gray-400'}`}>
                        {obj.description}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <div className="text-xs text-yellow-600/80 font-semibold mb-2">⚔️ Награды:</div>
                  <div className="flex flex-wrap gap-2">
                    {quest.rewards.credits && (
                      <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded border border-yellow-600/30">
                        💰 {quest.rewards.credits} кредитов
                      </span>
                    )}
                    {quest.rewards.influence && (
                      <span className="text-xs bg-purple-900/30 text-purple-400 px-2 py-1 rounded border border-purple-600/30">
                        ⭐ {quest.rewards.influence} влияния
                      </span>
                    )}
                    {quest.rewards.traits?.map((trait: string, i: number) => (
                      <span key={i} className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-600/30">
                        🎭 {trait}
                      </span>
                    ))}
                    {quest.rewards.items?.map((item: string, i: number) => (
                      <span key={i} className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-600/30">
                        🗡️ {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {character.worldEvent && (
        <div className="wh-panel p-6 border-l-4 border-l-blue-500/70">
          <h3 className="wh-panel-title font-bold text-lg mb-3 pb-3 flex items-center gap-3">
            <span className="text-2xl">🌍</span>
            Состояние Галактики
          </h3>
          <p className="text-sm text-blue-200/90 italic leading-relaxed">{character.worldEvent}</p>
          {(character.worldEventsSeen?.length ?? 0) > 1 && (
            <p className="text-xs text-gray-500 mt-2">Запомнено великих событий: {character.worldEventsSeen!.length}</p>
          )}
        </div>
      )}

      <div className="wh-panel p-6">
        <h3 className="wh-panel-title font-bold text-lg mb-4 pb-3 flex items-center gap-3">
          <span className="text-2xl">📜</span>
          Хроника
        </h3>
        <div ref={logRef} className="max-h-[30vh] lg:max-h-64 overflow-y-auto space-y-2">
          {history.length === 0 ? (
            <p className="text-gray-500 italic text-sm text-center py-4">Жизнь только начинается...</p>
          ) : (
            history.map((entry, i) => (
              <p key={i} className="text-sm text-gray-400 border-l-2 border-yellow-600/50 pl-3 py-1 hover:border-yellow-500 transition-colors">
                {entry}
              </p>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
