import { useState } from 'react';
import { CharacterStats } from '../game/types';
import { findAugmetic } from '../game/augmetics';
import { HiddenStat } from './HiddenStat';
import { RaceEmblem } from './RaceEmblem';

type RaceInfo = { name: string; emoji: string; description: string };

/** Метка судьбоносного выбора в хронике (effects.keyChoice в reducer). */
const FATE_MARK = '**судьба**';

/** Фильтры хроники: все записи / только великие события / только выборы игрока. */
type ChronicleFilter = 'all' | 'fate' | 'choices';

const FILTER_LABELS: Record<ChronicleFilter, string> = {
  all: 'Все',
  fate: 'Судьбоносные',
  choices: 'Выборы',
};

export function filterChronicle(history: string[], filter: ChronicleFilter): string[] {
  if (filter === 'all') return history;
  if (filter === 'fate') return history.filter((h) => h.includes(FATE_MARK));
  return history.filter((h) => /^\[Год \d+\]/.test(h));
}

/** Русская плюрализация: 1 чудо / 2-4 чуда / 5+ чудес */
function declineMiracles(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'чудо';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'чуда';
  return 'чудес';
}

/** Пояснения к скрытым параметрам — тултипы в панели «Характеристики». */
const HIDDEN_HINTS: Record<string, string> = {
  faith: 'Вера в Императора или богов своего народа. Высокая вера смягчает ужасы войны и открывает чудеса заступничества для людей.',
  cunning: 'Хитрость и умение выкрутиться. Влияет на побег, торг и обман сильнее, чем грубая сила.',
  strength: 'Физическая мощь. Решает исход ближних боёв, работ и испытаний выносливости.',
  willpower: 'Стойкость духа. Сопротивление психической порче Варпа, пыткам и безумию.',
  mutation: 'Отметчина Хаоса в плоти. Растёт от порчи Варпа; выше 7 — Инквизиция обратит внимание, выше 9 — почти верная гибель.',
  suspicion: 'Подозрение властей. Копится от ересей и странных слухов; на пределе грозит арест или приговор Инквизиции.',
  waaagh: 'Дух орочьего культа силы: чем громче WAAAGH!, тем увереннее зелёная кожа держится в бою.',
  psi: 'Пси-потенциал. Без контроля растущая сила сожжёт разум: перегруз наступает на пределе шкалы.',
  nobility: 'Честь Дома и кровь аристократов Асул. Открывает пути при дворах Ковчегов.',
  cruelty: 'Жестокость друкхаари — валюта Коморры. Она питает Рамотеп и бережёт свою хозяйку.',
  unity: "Преданность Высшему Благу тау. Сплочённость каст и доверие манд'ва решают судьбу общины.",
  techSkill: 'Мастерство обращения с машинным духом. Нужно пилотам, техникам и огранщикам света.',
  sneakiness: 'Умение гретчина остаться незамеченным: под ногами вааagh-боссов и вождей выживает только ловкий.',
  warpAttention: 'Насколько ты ярок в Имматериуме. Каждый незакрытый пси-дар слышен демонам и Инквизиции: чем выше шкала, тем раньше придут — Ордо Малипус (псайкеры) или костер еретиков.',
  warpCorruption: 'Порча души от контакта с Варпом. Растёт вслед за вниманием Имматериума; на пределе плоть и разум начинают служить Хаосу.',
};

interface SidebarProps {
  character: CharacterStats;
  raceInfo: RaceInfo;
  activeQuests: any[];
  history: string[];
  logRef: React.RefObject<HTMLDivElement>;
}

/** Левая колонка: скрытые параметры, расовые особенности, снаряжение, NPC, квесты, хроника.
 *  Сайдбар всегда виден — панель «Характеристики» сворачивается кнопкой-заголовком
 *  в стиле остальных панелей (единый интерфейс без отдельной кнопки «Скрыть»). */
export function Sidebar({ character, raceInfo, activeQuests, history, logRef }: SidebarProps) {
  const [statsOpen, setStatsOpen] = useState(true);
  const [chronicleFilter, setChronicleFilter] = useState<ChronicleFilter>('all');
  const shownHistory = filterChronicle(history, chronicleFilter);
  const fateCount = filterChronicle(history, 'fate').length;
  return (
    <aside className="fit-col lg:col-span-3 space-y-4 animate-slide-in-left">
      {/* Единая прокрутка сайдбара вместо скролла каждой секции отдельно */}
      <div className="fit-scroll flex-1 space-y-4 pr-1">
      <div className="wh-panel wh-side-panel p-4 xl:p-5">
        <button
          type="button"
          onClick={() => setStatsOpen((v) => !v)}
          aria-expanded={statsOpen}
          className="w-full flex items-center justify-between gap-2 text-left group"
        >
          <span className="wh-panel-title wh-side-title font-bold pb-0 flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">📊</span>
            Характеристики
          </span>
          <span
            className={`text-xs text-[#c9a227]/60 group-hover:text-[#c9a227] transition-transform ${statsOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>
        {statsOpen && (
        <>
        <div className="space-y-3 mt-2.5 pt-2 border-t border-[#c9a227]/15">
          <HiddenStat label="Вера" value={character.hiddenParams.faith} icon="✝️" color="bg-amber-500" hint={HIDDEN_HINTS.faith} />
          <HiddenStat label="Хитрость" value={character.hiddenParams.cunning} icon="🗡️" color="bg-emerald-500" hint={HIDDEN_HINTS.cunning} />
          <HiddenStat label="Сила" value={character.hiddenParams.strength} icon="💪" color="bg-red-500" hint={HIDDEN_HINTS.strength} />
          <HiddenStat label="Воля" value={character.hiddenParams.willpower} icon="🛡️" color="bg-blue-500" hint={HIDDEN_HINTS.willpower} />
          {character.race === 'human' && (
            <>
              <HiddenStat label="Мутация" value={character.hiddenParams.mutation} icon="☣️" color="bg-purple-500" hint={HIDDEN_HINTS.mutation} />
              <HiddenStat label="Подозрение" value={character.hiddenParams.suspicion} icon="👁️" color="bg-orange-500" hint={HIDDEN_HINTS.suspicion} />
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

        {/* Внимание Имматериума — лорная шкала: псайкеры и безумцы «светятся» в Варпе */}
        {character.warpAttention > 0 && (
          <div className={`mt-4 pt-3 border-t border-purple-500/20 ${character.warpAttention >= 5 ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span
                className="font-gothic text-[#b8a878] tracking-wide cursor-help"
                title={HIDDEN_HINTS.warpAttention}
              >
                🔮 Внимание Имматериума
              </span>
              <span className={`font-bold ${character.warpAttention >= 5 ? 'text-purple-300' : 'text-[#d8c9a3]'}`}>
                {character.warpAttention}/10
              </span>
            </div>
            <div className="wh-bar w-full overflow-hidden" style={{ height: '6px' }}>
              <div
                className="wh-bar-fill bg-gradient-to-r from-purple-800 to-fuchsia-500"
                style={{ width: `${(character.warpAttention / 10) * 100}%`, height: '100%' }}
              ></div>
            </div>
            {character.warpAttention >= 4 && (
              <p className="text-[11px] text-purple-300/70 italic mt-1.5 leading-snug">
                Тебя слышат по ту сторону реальности. Чем ярче свет — тем раньше придут: Ордо Малипус или то, что хуже него.
              </p>
            )}
          </div>
        )}
        </>
        )}
      </div>

      <div className="wh-panel wh-side-panel p-4 xl:p-5">
        <h3 className="wh-panel-title wh-side-title font-bold mb-2.5 pb-2 flex items-center gap-2">
          <RaceEmblem race={character.race} className="w-7 h-7" />
          Расовые особенности: {raceInfo.name}
        </h3>
        <div className="space-y-3">
          {character.race === 'ork' && <HiddenStat label="WAAAGH!" value={character.hiddenParams.waaagh || 0} icon="⚔️" color="bg-green-500" hint={HIDDEN_HINTS.waaagh} />}
          {character.race === 'eldar' && <HiddenStat label="Пси-сила" value={character.hiddenParams.psi || 0} icon="🔮" color="bg-purple-500" hint={HIDDEN_HINTS.psi} />}
          {character.race === 'eldar' && <HiddenStat label="Благородство" value={character.hiddenParams.nobility || 0} icon="👑" color="bg-blue-400" hint={HIDDEN_HINTS.nobility} />}
          {character.race === 'dark_eldar' && <HiddenStat label="Жестокость" value={character.hiddenParams.cruelty || 0} icon="🩸" color="bg-red-500" hint={HIDDEN_HINTS.cruelty} />}
          {character.race === 'tau' && <HiddenStat label="Единство" value={character.hiddenParams.unity || 0} icon="🔷" color="bg-cyan-500" hint={HIDDEN_HINTS.unity} />}
          {character.race === 'tau' && <HiddenStat label="Технологии" value={character.hiddenParams.techSkill || 0} icon="⚙️" color="bg-blue-400" hint={HIDDEN_HINTS.techSkill} />}
          {character.race === 'gretchin' && <HiddenStat label="Скрытность" value={character.hiddenParams.sneakiness || 0} icon="🐀" color="bg-yellow-600" hint={HIDDEN_HINTS.sneakiness} />}
        </div>
      </div>

      <div className="wh-panel wh-side-panel p-4 xl:p-5">
        <h3 className="wh-panel-title wh-side-title font-bold mb-2.5 pb-2 flex items-center gap-2">
          <span className="text-xl">🎒</span>
          Снаряжение
        </h3>
        <div className="space-y-3 text-base">
          <div>
            <div className="text-sm text-gray-400 mb-2 font-semibold">Инвентарь</div>
            <div className="text-gray-200">{character.inventory.length > 0 ? character.inventory.join(', ') : 'пусто'}</div>
          </div>
          {character.augmentics.length > 0 && (
            <div>
              <div className="text-sm text-gray-400 mb-2 font-semibold">⚙️ Аугметика ({character.augmentics.length})</div>
              <ul className="space-y-1.5">
                {character.augmentics.map(id => {
                  const aug = findAugmetic(id);
                  return (
                    <li key={id} title={aug?.description ?? id} className="text-[#c9a227] cursor-help">
                      ⚙️ {aug ? aug.name : id}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <div>
            <div className="text-sm text-gray-400 mb-2 font-semibold">Черты</div>
            <div className="text-blue-400">{character.traits.length > 0 ? character.traits.join(', ') : 'нет'}</div>
          </div>
        </div>
      </div>

      {/* Встреченные души (NPC) */}
      {character.npcs.length > 0 && (
        <div className="wh-panel wh-side-panel p-4 xl:p-5">
          <h3 className="wh-panel-title wh-side-title font-bold mb-2.5 pb-2 flex items-center gap-2">
            <span className="text-xl">⚔️</span>
            Встреченные души ({character.npcs.length})
          </h3>
          <div className="space-y-3">
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
        <div className="wh-panel wh-side-panel p-4 xl:p-5">
          <h3 className="wh-panel-title wh-side-title font-bold mb-2.5 pb-2 flex items-center gap-2">
            <span className="text-xl">📜</span>
            Испытания судьбы ({activeQuests.length})
          </h3>
          <div className="space-y-3">
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
        <div className="wh-panel wh-side-panel p-4 xl:p-5 border-l-4 border-l-blue-500/70">
          <h3 className="wh-panel-title font-bold text-lg mb-3 pb-3 flex items-center gap-3">
            <span className="text-xl">🌍</span>
            Состояние Галактики
          </h3>
          <p className="text-sm text-blue-200/90 italic leading-relaxed">{character.worldEvent}</p>
          {(character.worldEventsSeen?.length ?? 0) > 1 && (
            <p className="text-xs text-gray-500 mt-2">Запомнено великих событий: {character.worldEventsSeen!.length}</p>
          )}
        </div>
      )}

      <div className="wh-panel wh-side-panel p-4 xl:p-5">
        <h3 className="wh-panel-title wh-side-title font-bold mb-2.5 pb-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">📜</span>
            Хроника
          </span>
          <span className="text-[11px] font-normal text-gray-500 tabular-nums whitespace-nowrap">
            {shownHistory.length} из {history.length}
          </span>
        </h3>
        {/* Фильтр записей: судьбоносные выделены золотом, но их легко найти и отдельно */}
        <div role="group" aria-label="Фильтр хроники" className="flex flex-wrap gap-1.5 mb-3">
          {(Object.keys(FILTER_LABELS) as ChronicleFilter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setChronicleFilter(f)}
              aria-pressed={chronicleFilter === f}
              className={`px-2 py-1 rounded-sm text-[11px] font-gothic uppercase tracking-wider border transition-colors ${
                chronicleFilter === f
                  ? 'border-[#c9a227] bg-[#c9a227]/15 text-[#e8c85a]'
                  : 'border-[#c9a227]/25 text-[#b8a878]/70 hover:border-[#c9a227]/60 hover:text-[#d8c9a3]'
              }`}
            >
              {FILTER_LABELS[f]}
              {f === 'fate' && fateCount > 0 ? ` (${fateCount})` : ''}
            </button>
          ))}
        </div>
        <div ref={logRef} role="log" aria-live="polite" aria-label="Хроника жизни" className="wh-chronicle space-y-2">
          {history.length === 0 ? (
            <p className="text-gray-500 italic text-sm text-center py-4">Жизнь только начинается...</p>
          ) : shownHistory.length === 0 ? (
            <p className="text-gray-500 italic text-sm text-center py-4">
              {chronicleFilter === 'fate'
                ? 'Судьба пока молчит — великих решений ещё не было.'
                : 'Выборов игрока пока нет.'}
            </p>
          ) : (
            shownHistory.map((entry, i) => (
              <p
                key={`${chronicleFilter}-${i}`}
                title={entry}
                className={`text-sm text-gray-400 border-l-2 pl-3 py-1 transition-colors animate-fade-in ${
                  entry.includes('**судьба**')
                    ? 'border-l-[#d4af37] text-[#e8d9a0] italic'
                    : 'border-yellow-600/50 hover:border-yellow-500'
                }`}
              >
                {entry.replace('**судьба** ', '')}
              </p>
            ))
          )}
        </div>
      </div>
      </div>
    </aside>
  );
}
