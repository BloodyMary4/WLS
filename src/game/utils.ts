import { CharacterStats, ChoiceEffects } from './types';
import { rng } from './rng';
import { GAME_CONFIG } from './config';
import { findAugmetic } from './augmetics';

/**
 * Установка импланта из лорного каталога (src/game/augmetics.ts):
 * добавляет id в augmentics и один раз применяет пассивные бонусы
 * (maxHealthBonus — расширение тела металлом, luck/influence).
 * Чистая функция без RNG — детерминизм seed-партий сохраняется.
 */
export function installAugmetic(character: CharacterStats, id: string): CharacterStats {
  const aug = findAugmetic(id);
  if (!aug) return { ...character, augmentics: [...character.augmentics, id] };
  const next: CharacterStats = { ...character, augmentics: [...character.augmentics, id] };
  if (aug.passive?.maxHealthBonus) {
    const bonus = aug.passive.maxHealthBonus;
    next.maxHealth = character.maxHealth + bonus;
    next.health = Math.min(next.maxHealth, character.health + bonus);
  }
  if (aug.passive?.luck) next.luck = Math.min(10, character.luck + aug.passive.luck);
  if (aug.passive?.influence) next.influence = Math.min(100, character.influence + aug.passive.influence);
  return next;
}

const { MAX_VALUE, MIN_VALUE } = GAME_CONFIG.STAT_THRESHOLDS;
const { MAX_VALUE: FACTION_MAX_VALUE, MIN_VALUE: FACTION_MIN_VALUE } = GAME_CONFIG.FACTION_RELATIONS;

export function generateWorldEvent(): string {
  const events = [
    'Империум ведет великую войну на сегменте Обскурус',
    'Эпидемия болезни распространяется в соседних системах',
    'Флот ксеносов замечен на границах сектора',
    'Инквизиция начала масштабную чистку ереси',
    'Варп-шторм изолировал несколько систем',
    'Механикус завершил строительство нового титана',
    'Гильдии купцов объявили торговую блокаду',
    'Культы Хаоса активизировались в нижних уровнях',
    'Адептус Арбитрес начали операцию по зачистке',
    'Астероидный пояс богат редкими ресурсами',
    'Космодесант проводит крестовый поход',
    'Торговый караван потерпел крушение в Варпе',
    'Открыта новая планета с ценными ресурсами',
    'Восстание рабочих на промышленном мире',
    'Пираты атакали торговый путь',
  ];
  return events[Math.floor(rng().next() * events.length)];
}

export function applyChoiceEffects(character: CharacterStats, effects: ChoiceEffects): CharacterStats {
  let newChar = { ...character };
  const hp = { ...newChar.hiddenParams };

  // ===== БОЕЗАПАС КАК ЩИТ (v0.3.82 «Логистика») =====
  // Если выбор приносит урон здоровью (перестрелка, засада, ближний бой),
  // часть урона гасится патронами: каждый боеприпас поглощает 1 ед. урона
  // (не более AMMO_SHIELD_MAX за ход). Боезапас наконец РАСХОДУЕТСЯ по
  // назначению — иметь ствол и заряды выгоднее, чем подставлять тело.
  let ammoShield = 0;
  if (effects.health !== undefined && effects.health < 0 && character.ammo > 0) {
    ammoShield = Math.min(character.ammo, Math.abs(effects.health), GAME_CONFIG.SUPPLY.AMMO_SHIELD_MAX);
    if (ammoShield > 0) {
      effects = { ...effects, health: effects.health + ammoShield };
    }
  }

  const paramConfigs: Record<string, { target: string; min: number; max: number }> = {
    health: { target: 'health', min: 0, max: newChar.maxHealth },
    credits: { target: 'credits', min: 0, max: Infinity },
    sanity: { target: 'sanity', min: 0, max: 100 },
    warpCorruption: { target: 'warpCorruption', min: 0, max: 100 },
    warpAttention: { target: 'warpAttention', min: 0, max: 10 },
    luck: { target: 'luck', min: 1, max: 10 },
    food: { target: 'food', min: 0, max: Infinity },
    ammo: { target: 'ammo', min: 0, max: Infinity },
    influence: { target: 'influence', min: 0, max: 100 },
    faith: { target: 'hiddenParams.faith', min: MIN_VALUE, max: MAX_VALUE },
    cunning: { target: 'hiddenParams.cunning', min: MIN_VALUE, max: MAX_VALUE },
    strength: { target: 'hiddenParams.strength', min: MIN_VALUE, max: MAX_VALUE },
    willpower: { target: 'hiddenParams.willpower', min: MIN_VALUE, max: MAX_VALUE },
    mutation: { target: 'hiddenParams.mutation', min: MIN_VALUE, max: MAX_VALUE },
    suspicion: { target: 'hiddenParams.suspicion', min: MIN_VALUE, max: MAX_VALUE },
    waaagh: { target: 'hiddenParams.waaagh', min: MIN_VALUE, max: MAX_VALUE },
    psi: { target: 'hiddenParams.psi', min: MIN_VALUE, max: MAX_VALUE },
    nobility: { target: 'hiddenParams.nobility', min: MIN_VALUE, max: MAX_VALUE },
    cruelty: { target: 'hiddenParams.cruelty', min: MIN_VALUE, max: MAX_VALUE },
    unity: { target: 'hiddenParams.unity', min: MIN_VALUE, max: MAX_VALUE },
    techSkill: { target: 'hiddenParams.techSkill', min: MIN_VALUE, max: MAX_VALUE },
    sneakiness: { target: 'hiddenParams.sneakiness', min: MIN_VALUE, max: MAX_VALUE },
  };

  Object.entries(paramConfigs).forEach(([key, config]) => {
    const value = effects[key as keyof ChoiceEffects];
    if (value !== undefined && value !== 0) {
      const targetParts = config.target.split('.');
      const isHiddenParam = targetParts[0] === 'hiddenParams';
      const propName = isHiddenParam ? targetParts[1] : config.target;
      
      const currentValue = isHiddenParam
        ? (hp[propName as keyof typeof hp] as number) || 0
        : (newChar[propName as keyof CharacterStats] as number) || 0;
      
      const newValue = Math.max(config.min, Math.min(config.max, currentValue + (value as number)));
      
      if (isHiddenParam) {
        (hp as unknown as Record<string, number>)[propName] = newValue;
      } else {
        (newChar as unknown as Record<string, number | string | string[]>)[propName] = newValue;
      }
    }
  });

  newChar.hiddenParams = hp;

  if (effects.addTrait && !newChar.traits.includes(effects.addTrait)) {
    newChar.traits = [...newChar.traits, effects.addTrait];
  }
  if (effects.removeTrait) {
    newChar.traits = newChar.traits.filter(t => t !== effects.removeTrait);
  }
  if (effects.addItem) {
    newChar.inventory = [...(newChar.inventory || []), effects.addItem];
  }
  if (effects.removeItem) {
    newChar.inventory = (newChar.inventory || []).filter(i => i !== effects.removeItem);
  }
  if (effects.addAugmentic && !(newChar.augmentics || []).includes(effects.addAugmentic)) {
    // Лорная интеграция импланта: пассивные бонусы каталога применяются один раз
    // при установке (чистая функция — без RNG, детерминизм seed не затрагивается).
    newChar = installAugmetic(newChar, effects.addAugmentic);
  }
  if (effects.removeAugmentic) {
    newChar.augmentics = (newChar.augmentics || []).filter(a => a !== effects.removeAugmentic);
  }
  if (effects.newStatus) {
    newChar.status = effects.newStatus;
  }
  if (effects.keyChoice) {
    newChar.keyChoices = [...(newChar.keyChoices || []), effects.keyChoice];
  }

  // Отношения с фракциями/сословиями из эффектов выбора.
  // В eldar/dark_eldar-событиях `nobility` — скрытый параметр расы, его не трогаем;
  // для связей с аристократией используется отдельный ключ `nobilityRel`.
  const skipFaction = newChar.race === 'eldar' || newChar.race === 'dark_eldar';
  const factionDeltaKeys = ['imperium', 'chaos', 'xenos', 'criminals'] as const;
  factionDeltaKeys.forEach(faction => {
    const delta = effects[faction];
    if (delta !== undefined && delta !== 0) {
      newChar.factionRelations[faction] = Math.max(FACTION_MIN_VALUE, Math.min(FACTION_MAX_VALUE, newChar.factionRelations[faction] + delta));
    }
  });
  if (!skipFaction && effects.nobility !== undefined && effects.nobility !== 0) {
    newChar.factionRelations.nobility = Math.max(FACTION_MIN_VALUE, Math.min(FACTION_MAX_VALUE, newChar.factionRelations.nobility + effects.nobility));
  }
  if (effects.nobilityRel !== undefined && effects.nobilityRel !== 0) {
    newChar.factionRelations.nobility = Math.max(FACTION_MIN_VALUE, Math.min(FACTION_MAX_VALUE, newChar.factionRelations.nobility + effects.nobilityRel));
  }
  if (effects.commoners !== undefined && effects.commoners !== 0) {
    newChar.factionRelations.commoners = Math.max(FACTION_MIN_VALUE, Math.min(FACTION_MAX_VALUE, newChar.factionRelations.commoners + effects.commoners));
  }

  if (ammoShield > 0) {
    // Патроны израсходованы на подавление огня противника (щит применён выше)
    newChar.ammo = Math.max(0, newChar.ammo - ammoShield);
  }

  // Вера: эффекты `faith` двигают отношение к Господству Империума (0..100).
  // У людей праведность также конвертируется в Верность (imperialCreed 0..10) —
  // скрытый ресурс заступничества «Император защищает», см. rollImperialIntercession().
  // Скрытый параметр hiddenParams.faith остаётся расовой характеристикой (0..10).
  if (effects.faith !== undefined && effects.faith !== 0) {
    const fr = { ...newChar.factionRelations };
    fr.faith = Math.max(0, Math.min(100, fr.faith + effects.faith * 5));
    newChar.factionRelations = fr;
    if (newChar.race === 'human') {
      const creedDelta = effects.faith > 0 ? Math.ceil(effects.faith / 2) : effects.faith;
      newChar.imperialCreed = Math.max(0, Math.min(10, (newChar.imperialCreed ?? 0) + creedDelta));
    }
  }

  // Прямое начисление Верности (creed): крупные акты веры в лорных событиях.
  if (effects.creed !== undefined && effects.creed !== 0 && newChar.race === 'human') {
    newChar.imperialCreed = Math.max(0, Math.min(10, (newChar.imperialCreed ?? 0) + effects.creed));
  }

  return newChar;
}

/**
 * «Император защищает» — шанс чудесного заступничества при смерти от ран.
 * Работает только для людей с высокой Верностью (creed >= 5).
 * Возвращает true, если смерть отвведена (персонаж выживает с 1 HP).
 */
/** Публичные «витринные» параметры для визуальных дельт хода (шапка). */
const DELTA_KEYS = [
  'health', 'sanity', 'warpCorruption', 'luck', 'credits', 'food', 'ammo', 'influence',
] as const;

export type PublicStatKey = typeof DELTA_KEYS[number];

/**
 * Разница публичных характеристик между двумя состояниями персонажа.
 * Используется для наглядных бейджей +/− в шапке после исхода события —
 * игрок видит, чем именно обошёлся выбор, не сравнивая числа глазами.
 */
export function computeStatDeltas(
  before: CharacterStats,
  after: CharacterStats,
): Partial<Record<PublicStatKey, number>> {
  const out: Partial<Record<PublicStatKey, number>> = {};
  for (const key of DELTA_KEYS) {
    const d = after[key] - before[key];
    if (d !== 0) out[key] = d;
  }
  return out;
}

export function rollImperialIntercession(character: CharacterStats): boolean {
  if (character.race !== 'human') return false;
  const creed = character.imperialCreed ?? 0;
  if (creed < 5) return false;
  // 5% за каждый очко Верности сверх 4: creed 5 → 5%, creed 10 → 30%
  return rng().next() < (creed - 4) * 0.05;
}

export interface AgeUpdateResult {
  character: CharacterStats;
  /** Новое глобальное событие мира (если сменилось в этом году) — для хроники */
  newWorldEvent?: string;
  /** Строка логистики снабжения за год (авторазвёртывание пайков/боезапаса) — для хроники */
  supplyNote?: string;
}

export function updateAgeStatus(character: CharacterStats): AgeUpdateResult {
  const newChar = { ...character };
  newChar.age += 1;
  // Кулдаун микро-событий уменьшает triggerMicroEvent (microEvents.ts) —
  // здесь двойной декремент ломал тайминг.

  // Естественное восстановление: раны затягиваются, если есть чем питаться.
  // Без этого даже лёгкие урон-эффекты накапливаются и персонаж умирает к ~30 годам.
  if (newChar.health > 0 && newChar.food > 0 && newChar.health < newChar.maxHealth) {
    const regen = 2 + Math.floor(newChar.hiddenParams.willpower / 3);
    newChar.health = Math.min(newChar.maxHealth, newChar.health + regen);
  }

  // Медленное исцеление рассудка в относительном спокойствии
  if (newChar.sanity < 100 && newChar.warpAttention <= 2 && newChar.warpCorruption < 30) {
    newChar.sanity = Math.min(100, newChar.sanity + 1);
  }

  const currentStatus = newChar.status;
  const isChildStatus = ['Младенец', 'Малыш', 'Ребёнок', 'Подросток'].includes(currentStatus);
  
  if (newChar.age >= GAME_CONFIG.AGE_THRESHOLDS.ADULT && isChildStatus) {
    newChar.status = 'Взрослый';
  } else if (newChar.age >= GAME_CONFIG.AGE_THRESHOLDS.TEEN && isChildStatus) {
    newChar.status = 'Подросток';
  } else if (newChar.age >= GAME_CONFIG.AGE_THRESHOLDS.CHILD && isChildStatus) {
    newChar.status = 'Ребёнок';
  } else if (newChar.age >= GAME_CONFIG.AGE_THRESHOLDS.TODDLER && isChildStatus) {
    newChar.status = 'Малыш';
  }

  if (newChar.hiddenParams.mutation >= GAME_CONFIG.STAT_THRESHOLDS.MUTATION_DAMAGE) {
    newChar.health = Math.max(0, newChar.health - GAME_CONFIG.HEALTH.MUTATION_DAMAGE_PER_YEAR);
  }

  if (newChar.warpCorruption > 50) {
    newChar.sanity = Math.max(0, newChar.sanity - Math.floor(newChar.warpCorruption / 20));
  }

  if (newChar.warpAttention > 5) {
    newChar.warpCorruption = Math.min(100, newChar.warpCorruption + newChar.warpAttention);
  }

  if (newChar.sanity < 30) {
    newChar.warpAttention = Math.min(10, newChar.warpAttention + 1);
  }

  // Лор Warhammer 40K: псайкеры — «маяки для нечестивых» (Ордо Малипус).
  // Сильный пси-потенциал сам по себе привлекает внимание Варпа и Империума:
  // каждый год с psi >= 5 существо понемногу «светится» в Имматериуме.
  const psiLevel = newChar.hiddenParams.psi || 0;
  if (psiLevel >= GAME_CONFIG.STAT_THRESHOLDS.PSI_BEACON) {
    newChar.warpAttention = Math.min(10, newChar.warpAttention + 1);
    // Неприкрытый псайкер-человек неизбежно попадает в поле зрения Ордо Малипус:
    // чем сильнее дар, тем быстрее растёт подозрение (тестирование, допросы, чистка).
    if (newChar.race === 'human') {
      const suspicionGain = psiLevel >= GAME_CONFIG.STAT_THRESHOLDS.PSI_OVERLOAD ? 2 : 1;
      newChar.hiddenParams.suspicion = Math.min(10, newChar.hiddenParams.suspicion + suspicionGain);
    }
  }

  if (newChar.influence > 60) {
    newChar.hiddenParams.suspicion = Math.min(10, newChar.hiddenParams.suspicion + 1);
  }

  // ===== ЛОГИСТИКА СНАБЖЕНИЯ (v0.3.82) =====
  // Продовольствие и боезапас раньше были «мёртвыми» статами: получить их было
  // негде, а списывались они каждый год. Теперь рынок работает: персонаж с
  // кредитами может купить паёк (RATION_PRICE кр.) или пачку патронов —
  // но только ПОСЛЕ годового потребления (сначала съедаем то, что есть).
  let supplyNote: string | undefined;
  {
    const SUP = GAME_CONFIG.SUPPLY;
    if (newChar.food > 0) {
      newChar.food = Math.max(0, newChar.food - SUP.FOOD_CONSUMPTION_PER_YEAR);
    }

    const buys: string[] = [];
    // Голод страшнее траты: пока еды нет, покупаем паёк до минимального запаса.
    while (newChar.food < SUP.AUTO_RATION_TARGET && newChar.credits >= SUP.RATION_PRICE && buys.length < SUP.MAX_AUTO_BUY_PER_YEAR) {
      newChar.credits -= SUP.RATION_PRICE;
      newChar.food += 1;
      buys.push('паёк');
    }
    // Боезапас пополняем только если он когда-либо был нужен (nonzero-контекст):
    // бедняга без оружия не кормит торговцев патронами.
    if (newChar.ammo < SUP.AMMO_MIN_STOCK && newChar.credits >= SUP.AMMO_PACK_PRICE + SUP.AMMO_RESERVE_MIN) {
      newChar.credits -= SUP.AMMO_PACK_PRICE;
      newChar.ammo += SUP.AMMO_PACK_SIZE;
      buys.push('пачка патронов');
    }
    if (buys.length > 0) {
      supplyNote = `Военный рынок: куплено ${buys.join(' и ')}.`;
    }
  }

  if (newChar.food <= GAME_CONFIG.SUPPLY.STARVATION_THRESHOLD) {
    newChar.health = Math.max(0, newChar.health - 5);
  }

  let newWorldEvent: string | undefined;
  if (newChar.age % 5 === 0) {
    newWorldEvent = generateWorldEvent();
    newChar.worldEvent = newWorldEvent;
    // Счётчик уникальных мировых событий — достижение «Путешественник»
    const seen = newChar.worldEventsSeen ?? [];
    if (!seen.includes(newWorldEvent)) {
      newChar.worldEventsSeen = [...seen, newWorldEvent];
    }
  }

  // Старение: после среднего ожидаемого срока жизни тело сдаётся.
  // Предел зависит от расы (лор): эльдар живут столетиями, гретчины — мало.
  const MAX_AGE = GAME_CONFIG.AGE_THRESHOLDS.MAX_EXPECTED_BY_RACE[newChar.race]
    ?? GAME_CONFIG.AGE_THRESHOLDS.MAX_EXPECTED;
  if (newChar.age > MAX_AGE) {
    const frailty = Math.min(12, Math.floor((newChar.age - MAX_AGE) / 5) + 2);
    newChar.health = Math.max(0, newChar.health - frailty);
  }

  return { character: newChar, newWorldEvent, supplyNote };
}

type ColorThreshold = { threshold: number; color: string };

function getColorByThresholds(value: number, thresholds: ColorThreshold[], prefix: 'text' | 'bg'): string {
  for (const { threshold, color } of thresholds) {
    if (value > threshold) return `${prefix}-${color}`;
  }
  return `${prefix}-${thresholds[thresholds.length - 1].color}`;
}

// v0.3.52: палитра по гайдлайну — ядовито-зелёный Necron / плазменный синий /
// старое золото / кроваво-красный вместо кричащих tailwind-дефолтов.
const HEALTH_THRESHOLDS: ColorThreshold[] = [
  { threshold: GAME_CONFIG.HEALTH.LOW_PERCENT, color: 'wh-health' },
  { threshold: GAME_CONFIG.HEALTH.CRITICAL_PERCENT, color: 'wh-caution' },
  { threshold: 0, color: 'wh-blood' }
];

const SANITY_THRESHOLDS: ColorThreshold[] = [
  { threshold: 70, color: 'wh-plasma' },
  { threshold: 40, color: 'wh-caution' },
  { threshold: 0, color: 'wh-blood' }
];

const WARP_CORRUPTION_THRESHOLDS: ColorThreshold[] = [
  { threshold: 70, color: 'wh-warp-high' },
  { threshold: 30, color: 'wh-warp-mid' },
  { threshold: 0, color: 'wh-warp-low' }
];

export function getHealthColor(health: number, maxHealth: number): string {
  return getColorByThresholds(health / maxHealth, HEALTH_THRESHOLDS, 'text');
}

export function getHealthBarColor(health: number, maxHealth: number): string {
  return getColorByThresholds(health / maxHealth, HEALTH_THRESHOLDS, 'bg');
}

export function getSanityColor(sanity: number): string {
  return getColorByThresholds(sanity, SANITY_THRESHOLDS, 'text');
}

export function getSanityBarColor(sanity: number): string {
  return getColorByThresholds(sanity, SANITY_THRESHOLDS, 'bg');
}

export function getWarpCorruptionColor(corruption: number): string {
  return getColorByThresholds(corruption, WARP_CORRUPTION_THRESHOLDS, 'text');
}

export function getWarpCorruptionBarColor(corruption: number): string {
  return getColorByThresholds(corruption, WARP_CORRUPTION_THRESHOLDS, 'bg');
}

export function applyMicroEventEffects(
  character: CharacterStats, 
  effects: {
    health?: number;
    sanity?: number;
    warpCorruption?: number;
    warpAttention?: number;
    luck?: number;
    faith?: number;
    cunning?: number;
    strength?: number;
    willpower?: number;
    mutation?: number;
    suspicion?: number;
    credits?: number;
    food?: number;
    ammo?: number;
    influence?: number;
    imperium?: number;
    chaos?: number;
    xenos?: number;
    criminals?: number;
    nobilityRel?: number;
    commoners?: number;
    waaagh?: number;
    psi?: number;
    nobility?: number;
    cruelty?: number;
    unity?: number;
    techSkill?: number;
    sneakiness?: number;
  }
): CharacterStats {
  const newChar = { ...character };
  
  if (effects.health) {
    newChar.health = Math.max(0, Math.min(newChar.maxHealth, newChar.health + effects.health));
  }
  if (effects.sanity !== undefined) {
    newChar.sanity = Math.max(0, Math.min(100, newChar.sanity + effects.sanity));
  }
  if (effects.warpCorruption !== undefined) {
    newChar.warpCorruption = Math.max(0, Math.min(100, newChar.warpCorruption + effects.warpCorruption));
  }
  if (effects.warpAttention !== undefined) {
    newChar.warpAttention = Math.max(0, Math.min(10, newChar.warpAttention + effects.warpAttention));
  }
  if (effects.luck !== undefined) {
    newChar.luck = Math.max(1, Math.min(10, newChar.luck + effects.luck));
  }
  if (effects.credits) {
    newChar.credits = Math.max(0, newChar.credits + effects.credits);
  }
  if (effects.food !== undefined) {
    newChar.food = Math.max(0, newChar.food + effects.food);
  }
  if (effects.ammo !== undefined) {
    newChar.ammo = Math.max(0, newChar.ammo + effects.ammo);
  }
  if (effects.influence !== undefined) {
    newChar.influence = Math.max(0, Math.min(100, newChar.influence + effects.influence));
  }
  
  const params = [
    'faith', 'cunning', 'strength', 'willpower', 'mutation', 'suspicion',
    'waaagh', 'psi', 'nobility', 'cruelty', 'unity', 'techSkill', 'sneakiness'
  ] as const;
  
  params.forEach(param => {
    if (effects[param] !== undefined) {
      const currentValue = newChar.hiddenParams[param] || 0;
      newChar.hiddenParams[param] = Math.max(MIN_VALUE, Math.min(MAX_VALUE, currentValue + effects[param]!));
    }
  });
  
  // Отношения с фракциями и сословиями: единый диапазон [-100, 100]
  const factionKeys = ['imperium', 'chaos', 'xenos', 'criminals', 'nobility', 'commoners'] as const;
  const effectAliases: Record<string, string> = { nobility: 'nobilityRel', commoners: 'commoners' };
  const { MAX_VALUE: FACTION_MAX, MIN_VALUE: FACTION_MIN } = GAME_CONFIG.FACTION_RELATIONS;

  factionKeys.forEach(faction => {
    const rawEffects = effects as unknown as Record<string, number | undefined>;
    const delta = rawEffects[effectAliases[faction]] ?? rawEffects[faction];
    if (delta !== undefined) {
      const currentValue = newChar.factionRelations[faction];
      newChar.factionRelations[faction] = Math.max(FACTION_MIN, Math.min(FACTION_MAX, currentValue + delta));
    }
  });
  
  return newChar;
}
