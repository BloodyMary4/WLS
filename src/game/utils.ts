import { CharacterStats, ChoiceEffects } from './types';
import { rng } from './rng';
import { GAME_CONFIG } from './config';

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
  const newChar = { ...character };
  const hp = { ...newChar.hiddenParams };

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
  if (effects.addAugmentic && !newChar.augmentics.includes(effects.addAugmentic)) {
    newChar.augmentics = [...newChar.augmentics, effects.addAugmentic];
  }
  if (effects.removeAugmentic) {
    newChar.augmentics = newChar.augmentics.filter(a => a !== effects.removeAugmentic);
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

  // Вера в Императора: человеческие расы накапливают Верность с праведностью.
  // Это скрытый ресурс «заступничества» — см. rollImperialIntercession().
  if ((newChar.race === 'human' || newChar.race === 'gretchin') && effects.faith) {
    const creedDelta = effects.faith > 0 ? Math.ceil(effects.faith / 2) : effects.faith;
    newChar.imperialCreed = Math.max(0, Math.min(10, (newChar.imperialCreed ?? 0) + creedDelta));
  }

  return newChar;
}

/**
 * «Император защищает» — шанс чудесного заступничества при смерти от ран.
 * Работает только для людей с высокой Верностью (creed >= 5).
 * Возвращает true, если смерть отвведена (персонаж выживает с 1 HP).
 */
export function rollImperialIntercession(character: CharacterStats): boolean {
  if (character.race !== 'human') return false;
  const creed = character.imperialCreed ?? 0;
  if (creed < 5) return false;
  // 5% за каждый очко Верности сверх 4: creed 5 → 5%, creed 10 → 30%
  return rng().next() < (creed - 4) * 0.05;
}

export function updateAgeStatus(character: CharacterStats): CharacterStats {
  const newChar = { ...character };
  newChar.age += 1;

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

  if (newChar.influence > 60) {
    newChar.hiddenParams.suspicion = Math.min(10, newChar.hiddenParams.suspicion + 1);
  }

  if (newChar.food <= 0) {
    newChar.health = Math.max(0, newChar.health - 5);
  } else {
    newChar.food = Math.max(0, newChar.food - 1);
  }

  if (newChar.age % 5 === 0) {
    newChar.worldEvent = generateWorldEvent();
  }

  // Старение: после среднего ожидаемого срока жизни тело сдаётся.
  // В мрачной галактике дожить до ста лет — уже чудо, и оно не вечно.
  const MAX_AGE = GAME_CONFIG.AGE_THRESHOLDS.MAX_EXPECTED;
  if (newChar.age > MAX_AGE) {
    const frailty = Math.min(12, Math.floor((newChar.age - MAX_AGE) / 5) + 2);
    newChar.health = Math.max(0, newChar.health - frailty);
  }

  return newChar;
}

type ColorThreshold = { threshold: number; color: string };

function getColorByThresholds(value: number, thresholds: ColorThreshold[], prefix: 'text' | 'bg'): string {
  for (const { threshold, color } of thresholds) {
    if (value > threshold) return `${prefix}-${color}`;
  }
  return `${prefix}-${thresholds[thresholds.length - 1].color}`;
}

const HEALTH_THRESHOLDS: ColorThreshold[] = [
  { threshold: GAME_CONFIG.HEALTH.LOW_PERCENT, color: 'green-400' },
  { threshold: GAME_CONFIG.HEALTH.CRITICAL_PERCENT, color: 'yellow-400' },
  { threshold: 0, color: 'red-400' }
];

const SANITY_THRESHOLDS: ColorThreshold[] = [
  { threshold: 70, color: 'blue-400' },
  { threshold: 40, color: 'yellow-400' },
  { threshold: 0, color: 'red-400' }
];

const WARP_CORRUPTION_THRESHOLDS: ColorThreshold[] = [
  { threshold: 70, color: 'purple-600' },
  { threshold: 30, color: 'purple-500' },
  { threshold: 0, color: 'purple-400' }
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
