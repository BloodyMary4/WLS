import { CharacterStats } from '../game/types';
import { findAugmetic } from '../game/augmetics';
import { isCritical } from '../game/critical';
import { RaceEmblem } from './RaceEmblem';
import { WindowCard, ReadoutRow, BarStat } from './Dashboard';

type RaceInfo = { name: string; emoji: string; description: string };

/** Русская плюрализация: 1 чудо / 2-4 чуда / 5+ чудес */
function declineMiracles(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'чудо';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'чуда';
  return 'чудес';
}

/** Пояснения к скрытым параметрам — тултипы в окне «Скрытые свойства». */
export const HIDDEN_HINTS: Record<string, string> = {
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

interface CodexPanelProps {
  character: CharacterStats;
  raceInfo: RaceInfo;
  activeQuests: any[];
}

/**
 * Левый отсек «Кодекс» — стопка окон-карточек (v0.3.29).
 * Каждое окно занимает своё место, второстепенные свёрнуты в плашки-заголовки —
 * колонка всегда умещается во вьюпорт без скролла. Хроника живёт отдельно,
 * в собственном окне правого отсека.
 */
export function CodexPanel({ character, raceInfo, activeQuests }: CodexPanelProps) {
  const hp = character.hiddenParams;
  const raceBars: { label: string; value: number; icon: string; color: string; hint: string }[] = [];
  if (character.race === 'ork') raceBars.push({ label: 'WAAAGH!', value: hp.waaagh || 0, icon: '⚔️', color: 'bg-green-500', hint: HIDDEN_HINTS.waaagh });
  if (character.race === 'eldar') raceBars.push({ label: 'Пси-сила', value: hp.psi || 0, icon: '🔮', color: 'bg-purple-500', hint: HIDDEN_HINTS.psi });
  if (character.race === 'eldar') raceBars.push({ label: 'Благородство', value: hp.nobility || 0, icon: '👑', color: 'bg-blue-400', hint: HIDDEN_HINTS.nobility });
  if (character.race === 'dark_eldar') raceBars.push({ label: 'Жестокость', value: hp.cruelty || 0, icon: '🩸', color: 'bg-red-500', hint: HIDDEN_HINTS.cruelty });
  if (character.race === 'tau') raceBars.push({ label: 'Единство', value: hp.unity || 0, icon: '🔷', color: 'bg-cyan-500', hint: HIDDEN_HINTS.unity });
  if (character.race === 'tau') raceBars.push({ label: 'Технологии', value: hp.techSkill || 0, icon: '⚙️', color: 'bg-blue-400', hint: HIDDEN_HINTS.techSkill });
  if (character.race === 'gretchin') raceBars.push({ label: 'Скрытность', value: hp.sneakiness || 0, icon: '🐀', color: 'bg-yellow-600', hint: HIDDEN_HINTS.sneakiness });

  return (
    <div className="wh-codex flex flex-col gap-1">
      {/* Досье: кто ты в этой галактике — всегда на виду */}
      <WindowCard title={<><RaceEmblem race={character.race} className="inline-block w-4 h-4 align-[-2px] mr-1" />Досье</>} defaultOpen>
        <ReadoutRow label="Раса" value={raceInfo.name} hint={`${raceInfo.emoji} ${raceInfo.description}`} />
        <ReadoutRow label="Сословие" value={character.caste} hint="Сословие определяет доступные события и профессии." />
        <ReadoutRow label="Положение" value={character.status} hint="Твоё место в жизни меняется судьбоносными выборами." />
        <ReadoutRow label="Планета" value={character.planet} hint="Место рождения — там начинался твой путь." />
        <div className="grid grid-cols-2 gap-x-3 mt-1">
          <BarStat label="Влияние" value={character.influence} max={100} icon="⭐" color="bg-orange-500"
            hint="Влияние в имперских кругах: открывает связи, торг и покровительство." />
          <BarStat label="Удача" value={character.luck} max={10} icon="🍀" color="bg-green-500" danger={character.luck <= 2}
            hint="Удача: ниже 2 — звёзды против тебя, торг и взятки дают сбой." />
        </div>
      </WindowCard>

      {/* Скрытые свойства: все шкалы в одном окне, критичные — красные */}
      <WindowCard title="📊 Скрытые свойства" defaultOpen badge="0–10">
        <BarStat label="Вера" value={hp.faith} icon="✝️" color="bg-amber-500" hint={HIDDEN_HINTS.faith} />
        <BarStat label="Хитрость" value={hp.cunning} icon="🗡️" color="bg-emerald-500" hint={HIDDEN_HINTS.cunning} />
        <BarStat label="Сила" value={hp.strength} icon="💪" color="bg-red-500" hint={HIDDEN_HINTS.strength} />
        <BarStat label="Воля" value={hp.willpower} icon="🛡️" color="bg-blue-500" hint={HIDDEN_HINTS.willpower} />
        {character.race === 'human' && (
          <>
            <BarStat label="Мутация" value={hp.mutation} icon="☣️" color="bg-purple-500"
              danger={isCritical('Мутация', hp.mutation)} hint={HIDDEN_HINTS.mutation} />
            <BarStat label="Подозрение" value={hp.suspicion} icon="👁️" color="bg-orange-500"
              danger={isCritical('Подозрение', hp.suspicion)} hint={HIDDEN_HINTS.suspicion} />
          </>
        )}
        {raceBars.map((b) => (
          <BarStat key={b.label} label={b.label} value={b.value} icon={b.icon} color={b.color} hint={b.hint} />
        ))}

        {/* Верность Императору — скрытая добродетель людей: при 10 смерть может быть отвращена чудом */}
        {character.race === 'human' && typeof character.imperialCreed === 'number' && (
          <div className={`mt-1.5 pt-1.5 border-t ${character.imperialCreed >= 8 ? 'border-yellow-500/60 animate-candle' : 'border-[#c9a227]/20'}`}>
            <BarStat label="Верность Императору" value={character.imperialCreed} icon="🕊️" color="bg-gradient-to-r from-yellow-700 to-yellow-400"
              hint="Преданность Трону. При высокой верности смерть иногда отводит взор — чудо заступничества." />
            {character.imperialCreed >= 5 && (
              <p className="text-[10px] text-yellow-500/70 italic leading-snug">
                {character.intercessionCount
                  ? `Смерть уже отводила взор ${character.intercessionCount} ${declineMiracles(character.intercessionCount)}.`
                  : 'Твоя вера замечена на Троне. В час смерти Он может взглянуть вниз.'}
              </p>
            )}
          </div>
        )}

        {/* Внимание Имматериума — лорная шкала: псайкеры и безумцы «светятся» в Варпе */}
        {character.warpAttention > 0 && (
          <div className={`mt-1.5 pt-1.5 border-t border-purple-500/20 ${character.warpAttention >= 5 ? 'animate-pulse' : ''}`}>
            <BarStat label="Внимание Имматериума" value={character.warpAttention} icon="🔮" color="bg-gradient-to-r from-purple-800 to-fuchsia-500"
              danger={character.warpAttention >= 7} hint={HIDDEN_HINTS.warpAttention} />
            {character.warpAttention >= 4 && (
              <p className="text-[10px] text-purple-300/70 italic leading-snug">
                Тебя слышат по ту сторону реальности. Чем ярче свет — тем раньше придут: Ордо Малипус или то, что хуже него.
              </p>
            )}
          </div>
        )}
      </WindowCard>

      {/* Снаряжение — свёрнуто, раскрывается по клику на плашку */}
      <WindowCard title="🎒 Снаряжение"
        badge={[
          character.inventory.length ? `${character.inventory.length} предм.` : null,
          character.augmentics.length ? `⚙️${character.augmentics.length}` : null,
          character.traits.length ? `🎭${character.traits.length}` : null,
        ].filter(Boolean).join(' · ')}>
        <div className="space-y-1.5 text-xs">
          <div>
            <span className="text-[#b8a878] font-semibold">Инвентарь: </span>
            <span className="text-gray-200">{character.inventory.length > 0 ? character.inventory.join(', ') : 'пусто'}</span>
          </div>
          {character.augmentics.length > 0 && (
            <div>
              <span className="text-[#b8a878] font-semibold">Аугметика: </span>
              {character.augmentics.map((id) => {
                const aug = findAugmetic(id);
                return (
                  <span key={id} title={aug?.description ?? id} className="text-[#c9a227] cursor-help mr-1.5">
                    ⚙️ {aug ? aug.name : id}
                  </span>
                );
              })}
            </div>
          )}
          <div>
            <span className="text-[#b8a878] font-semibold">Черты: </span>
            <span className="text-blue-400">{character.traits.length > 0 ? character.traits.join(', ') : 'нет'}</span>
          </div>
        </div>
      </WindowCard>

      {/* Встреченные души */}
      {character.npcs.length > 0 && (
        <WindowCard title="⚔️ Встреченные души" badge={character.npcs.length}>
          <div className="space-y-1.5">
            {character.npcs.slice(0, 5).map((npc) => (
              <div key={npc.id} className="rounded-sm border border-gray-700/50 bg-black/25 px-2 py-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold text-gray-100 truncate">{npc.name}</span>
                  <span className={`text-[10px] font-bold shrink-0 ${
                    npc.relationship >= 50 ? 'text-green-400' : npc.relationship >= 0 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {npc.relationship > 0 ? 'Союзник' : npc.relationship >= 0 ? 'Нейтрал' : 'Враг'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2 text-[10px] text-gray-400">
                  <span className="truncate italic">{npc.role}</span>
                  <span className="shrink-0" title={`Вы пересеклись с этой душой, когда тебе было ${npc.lastInteraction} лет от роду`}>
                    встречены в {npc.lastInteraction} лет
                  </span>
                </div>
                <div className="wh-bar w-full overflow-hidden mt-1" style={{ height: '4px' }} aria-hidden="true">
                  <div className={`h-full ${npc.relationship >= 50 ? 'bg-green-500' : npc.relationship >= 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.abs(npc.relationship)}%` }} />
                </div>
              </div>
            ))}
            {character.npcs.length > 5 && (
              <div className="text-center text-[10px] text-gray-400 italic">…и ещё {character.npcs.length - 5} душ на твоём пути</div>
            )}
          </div>
        </WindowCard>
      )}

      {/* Испытания судьбы (квесты) */}
      {activeQuests.length > 0 && (
        <WindowCard title="📜 Испытания судьбы" badge={activeQuests.length}>
          <div className="space-y-1.5">
            {activeQuests.map((quest) => (
              <div key={quest.id} className="rounded-sm border border-yellow-600/30 bg-black/25 px-2 py-1.5">
                <div className="text-xs font-bold text-yellow-400">{quest.name}</div>
                <div className="text-[10px] text-gray-400 italic leading-snug my-1">{quest.description}</div>
                <div className="space-y-0.5">
                  {quest.objectives.map((obj: any) => (
                    <div key={obj.id} className="flex items-start gap-1.5 text-[10px]">
                      <span className={obj.completed ? 'text-green-400' : 'text-gray-400'}>{obj.completed ? '☠' : '○'}</span>
                      <span className={`flex-1 ${obj.completed ? 'text-green-300 line-through' : 'text-gray-400'}`}>{obj.description}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-gray-700/60 text-[10px]">
                  {quest.rewards.credits && <span className="text-yellow-400">💰 {quest.rewards.credits}</span>}
                  {quest.rewards.influence && <span className="text-purple-400">⭐ {quest.rewards.influence}</span>}
                  {quest.rewards.traits?.map((trait: string, i: number) => <span key={i} className="text-red-400">🎭 {trait}</span>)}
                  {quest.rewards.items?.map((item: string, i: number) => <span key={i} className="text-blue-400">🗡️ {item}</span>)}
                </div>
              </div>
            ))}
          </div>
        </WindowCard>
      )}

      {/* Состояние Галактики */}
      {character.worldEvent && (
        <WindowCard title="🌍 Состояние Галактики" badge={(character.worldEventsSeen?.length ?? 0) > 1 ? `${character.worldEventsSeen!.length} зап.` : undefined}>
          <p className="text-xs text-blue-200/90 italic leading-snug">{character.worldEvent}</p>
        </WindowCard>
      )}
    </div>
  );
}
