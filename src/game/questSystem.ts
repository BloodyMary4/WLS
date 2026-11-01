import { CharacterStats, Race } from './types';

export interface Quest {
  id: string;
  name: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestRewards;
  completed: boolean;
  failed: boolean;
  startedAt: number;
}

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  type: 'stat' | 'item' | 'npc' | 'location' | 'event';
  target: string;
  targetValue?: number;
}

export interface QuestRewards {
  credits?: number;
  influence?: number;
  traits?: string[];
  items?: string[];
  /** Верность Императору (imperialCreed), только для людей */
  faith?: number;
  factionRelations?: {
    imperium?: number;
    chaos?: number;
    xenos?: number;
    criminals?: number;
  };
  /** Изменения скрытых параметров (cunning, strength, willpower, faith, ...) */
  hiddenParams?: Partial<CharacterStats['hiddenParams']>;
}

/** Требования для появления квеста в списке доступных (без хардкода id) */
export interface QuestRequirements {
  /** Квест доступен только пока возраст персонажа строго меньше этого значения */
  maxAge?: number;
  /** Если задан список — квест предлагают только представителям этих рас */
  races?: Race[];
}

// Доступные квесты в духе Warhammer 40,000
export const AVAILABLE_QUESTS: (Omit<Quest, 'completed' | 'failed' | 'startedAt'> & { requirements?: QuestRequirements })[] = [
  {
    id: 'quest_survivor',
    name: 'Выживший в окопах',
    description: 'Пережить первые 10 лет в этом мрачном мире. Смерть подстерегает на каждом шагу.',
    requirements: { maxAge: 10 },
    objectives: [
      {
        id: 'obj_age_10',
        description: 'Достичь 10 лет',
        completed: false,
        type: 'stat',
        target: 'age',
        targetValue: 10,
      },
    ],
    rewards: {
      credits: 10,
      traits: ['Закалённый войной'],
      faith: 1,
    },
  },
  {
    id: 'quest_believer',
    name: 'Слуга Императора',
    description: 'Посвятить свою жизнь служению Императору. Вера - твой щит против тьмы.',
    requirements: { races: ['human'] },
      objectives: [
      {
        id: 'obj_faith_8',
        description: 'Достичь 8 веры',
        completed: false,
        type: 'stat',
        target: 'faith',
        targetValue: 8,
      },
    ],
    rewards: {
      traits: ['Благочестивый', 'Фанатик'],
      factionRelations: { imperium: 10 },
      faith: 2,
      hiddenParams: { faith: 2 },
    },
  },
  {
    id: 'quest_warrior',
    name: 'Молот Императора',
    description: 'Стать оружием в руках Бога-Императора. Сила и воля - твои союзники.',
    requirements: { races: ['human', 'gretchin'] },
      objectives: [
      {
        id: 'obj_strength_8',
        description: 'Достичь 8 силы',
        completed: false,
        type: 'stat',
        target: 'strength',
        targetValue: 8,
      },
      {
        id: 'obj_willpower_5',
        description: 'Достичь 5 воли',
        completed: false,
        type: 'stat',
        target: 'willpower',
        targetValue: 5,
      },
    ],
    rewards: {
      credits: 25,
      traits: ['Воин Императора', 'Безжалостный'],
      items: ['Церемониальный меч'],
      factionRelations: { imperium: 15 },
    },
  },
  {
    id: 'quest_scholar',
    name: 'Хранитель знаний',
    description: 'Познать тайны Вселенной. Знание - сила, но также и проклятие.',
    objectives: [
      {
        id: 'obj_cunning_8',
        description: 'Достичь 8 хитрости',
        completed: false,
        type: 'stat',
        target: 'cunning',
        targetValue: 8,
      },
      {
        id: 'obj_faith_5',
        description: 'Достичь 5 веры',
        completed: false,
        type: 'stat',
        target: 'faith',
        targetValue: 5,
      },
    ],
    rewards: {
      credits: 15,
      traits: ['Учёный', 'Мудрец'],
      items: ['Запретный гримуар'],
    },
  },
  {
    id: 'quest_rich',
    name: 'Торговец смерти',
    description: 'Накопить богатство в мире, где деньги - это кровь и порох.',
    objectives: [
      {
        id: 'obj_credits_100',
        description: 'Накопить 100 кредитов',
        completed: false,
        type: 'stat',
        target: 'credits',
        targetValue: 100,
      },
    ],
    rewards: {
      traits: ['Богач', 'Безжалостный делец'],
      factionRelations: { criminals: 10 },
    },
  },
  {
    id: 'quest_influential',
    name: 'Тень в Императоре',
    description: 'Достичь влияния, которое заставит трепетать даже Инквизицию.',
    objectives: [
      {
        id: 'obj_influence_50',
        description: 'Достичь 50 влияния',
        completed: false,
        type: 'stat',
        target: 'influence',
        targetValue: 50,
      },
    ],
    rewards: {
      credits: 50,
      traits: ['Влиятельный', 'Опасный'],
      factionRelations: { imperium: -5, criminals: 15 },
    },
  },
  {
    id: 'quest_inquisitor',
    name: 'Молот Инквизиции',
    description: 'Служить Инквизиции. Выслеживать еретиков и очищать Империум от скверны.',
    requirements: { races: ['human'] },
      objectives: [
      {
        id: 'obj_suspicion_5',
        description: 'Достичь 5 подозрения (выслеживать еретиков)',
        completed: false,
        type: 'stat',
        target: 'suspicion',
        targetValue: 5,
      },
      {
        id: 'obj_faith_6',
        description: 'Достичь 6 веры',
        completed: false,
        type: 'stat',
        target: 'faith',
        targetValue: 6,
      },
      {
        id: 'obj_chaos_minus20',
        description: 'Достичь -20 отношений с Хаосом (ересь выжжена из тебя)',
        completed: false,
        type: 'stat',
        target: 'chaos',
        targetValue: -20,
      },
    ],
    rewards: {
      credits: 30,
      traits: ['Инквизитор', 'Охотник на еретиков'],
      items: ['Печать Инквизиции'],
      factionRelations: { imperium: 20, chaos: -20 },
      faith: 2,
      hiddenParams: { suspicion: 1 },
    },
  },
  {
    id: 'quest_mutant',
    name: 'Отметина Варпа',
    description: 'Принять мутации как дар Тёмных Богов. Стань тем, чего боятся люди.',
    requirements: { races: ['human', 'gretchin'] },
      objectives: [
      {
        id: 'obj_mutation_5',
        description: 'Достичь 5 мутаций',
        completed: false,
        type: 'stat',
        target: 'mutation',
        targetValue: 5,
      },
    ],
    rewards: {
      traits: ['Мутант', 'Избранный Хаосом'],
      factionRelations: { chaos: 20, imperium: -30 },
    },
  },
  {
    id: 'quest_psyker',
    name: 'Провидец',
    description: 'Развить псионические способности. Власть над Варпом - власть над реальностью.',
    requirements: { races: ['human', 'eldar', 'dark_eldar'] },
      objectives: [
      {
        id: 'obj_psi_8',
        description: 'Достичь 8 пси-силы',
        completed: false,
        type: 'stat',
        target: 'psi',
        targetValue: 8,
      },
    ],
    rewards: {
      traits: ['Псайкер', 'Провидец'],
      items: ['Фокус-кристалл'],
      factionRelations: { imperium: -10 },
    },
  },
  {
    id: 'quest_heretic',
    name: 'Путь Ереси',
    description: 'Отвергнуть ложь Империума. Принять истину Хаоса.',
    requirements: { races: ['human', 'gretchin', 'dark_eldar'] },
    objectives: [
      {
        id: 'obj_imperium_minus10',
        description: 'Достичь -10 отношений с Империумом',
        completed: false,
        type: 'stat',
        target: 'maxImperium',
        targetValue: -10,
      },
      {
        id: 'obj_chaos_10',
        description: 'Достичь 10 отношений с Хаосом',
        completed: false,
        type: 'stat',
        target: 'chaos',
        targetValue: 10,
      },
    ],
    rewards: {
      traits: ['Еретик', 'Слуга Тёмных Богов'],
      items: ['Метка Хаоса'],
      factionRelations: { imperium: -50, chaos: 30 },
    },
  },
  {
    id: 'quest_waaagh',
    name: 'Путь WAAAGH!',
    description: 'Для орка и гоблина жизнь — одна большая драка. Собери орду, подними вой и покачи зелёным знаменем над чужими мирами.',
    requirements: { races: ['ork', 'gretchin'] },
    objectives: [
      {
        id: 'obj_waaagh_6',
        description: 'Достичь 6 WAAAGH! (вой орды зовёт тебя)',
        completed: false,
        type: 'stat',
        target: 'waaagh',
        targetValue: 6,
      },
      {
        id: 'obj_strength_7',
        description: 'Быть по-настоящему большим и сильным (7 силы)',
        completed: false,
        type: 'stat',
        target: 'strength',
        targetValue: 7,
      },
    ],
    rewards: {
      traits: ['Война! Война никогда не меняется', 'Босс в сборе'],
      items: ['Чоппа с зубцами'],
      hiddenParams: { waaagh: 1 },
    },
  },
];

/**
 * Разрешает имя числовой цели квеста в текущее значение персонажа.
 * Поддерживает: age, credits, influence, npcs (кол-во знакомств), imperialCreed/creed,
 * любую фракцию из factionRelations и любой скрытый параметр из hiddenParams.
 */
/**
 * Разрешает имя числовой цели квеста в текущее значение персонажа.
 * Префикс `max` (например `maxImperium`) меняет знак сравнения: цель достигается,
 * когда значение НЕ ВЫШЕ targetValue (для «пасть во тьму» — отношения ниже порога).
 */
export function isObjectiveSatisfied(character: CharacterStats, target: string, targetValue: number): boolean {
  if (target.startsWith('max') && target.length > 3) {
    // 'maxImperium' -> 'imperium': только первая буква в lowerCamelCase, остальное как есть
    const rest = target.slice(3);
    const value = resolveNumericTarget(character, rest[0].toLowerCase() + rest.slice(1));
    return value !== undefined && value <= targetValue;
  }
  const value = resolveNumericTarget(character, target);
  return value !== undefined && value >= targetValue;
}

export function resolveNumericTarget(character: CharacterStats, target: string): number | undefined {
  switch (target) {
    case 'age': return character.age;
    case 'credits': return character.credits;
    case 'influence': return character.influence;
    case 'npcs': return character.npcs.length;
    case 'imperialCreed':
    case 'creed': return character.imperialCreed ?? 0;
  }
  const factions = character.factionRelations as unknown as Record<string, number>;
  if (typeof factions[target] === 'number') return factions[target];
  const hidden = character.hiddenParams as Record<string, number | undefined>;
  if (typeof hidden[target] === 'number') return hidden[target];
  return undefined;
}

/**
 * Проверяет и обновляет квесты
 */
export function checkQuests(character: CharacterStats, activeQuests: Quest[]): { updatedQuests: Quest[]; completedQuests: Quest[] } {
  const updatedQuests: Quest[] = [];
  const completedQuests: Quest[] = [];

  for (const quest of activeQuests) {
    if (quest.completed || quest.failed) {
      updatedQuests.push(quest);
      continue;
    }

    let allObjectivesCompleted = true;
    const updatedObjectives = quest.objectives.map(obj => {
      let completed = false;

      switch (obj.type) {
        case 'stat': {
          // Единый решатель числовых целей: age/credits/influence, отношения со ВСЕМИ
          // фракциями (включая chaos/xenos/criminals/nobility/commoners/faith), скрытые
          // параметры и Верность Императору. Раньше хардкодился только imperium, из-за
          // чего цель «Достичь 10 отношений с Хаосом» никогда не выполнялась.
          const targetValue = obj.targetValue ?? 0;
          completed = isObjectiveSatisfied(character, obj.target, targetValue);
          break;
        }
        case 'item':
          completed = character.inventory.includes(obj.target);
          break;
        case 'npc':
          completed = character.npcs.some(npc => npc.name.toLowerCase().includes(obj.target.toLowerCase()));
          break;
      }

      if (!completed) {
        allObjectivesCompleted = false;
      }

      return { ...obj, completed };
    });

    const updatedQuest = {
      ...quest,
      objectives: updatedObjectives,
      completed: allObjectivesCompleted,
    };

    if (allObjectivesCompleted) {
      completedQuests.push(updatedQuest);
    }

    updatedQuests.push(updatedQuest);
  }

  return { updatedQuests, completedQuests };
}

/**
 * Применяет награды за завершённый квест
 */
export function applyQuestRewards(character: CharacterStats, quest: Quest): CharacterStats {
  const newChar = { ...character };
  const rewards = quest.rewards;

  if (rewards.credits) {
    newChar.credits += rewards.credits;
  }

  if (rewards.influence) {
    newChar.influence = Math.min(100, newChar.influence + rewards.influence);
  }

  if (rewards.traits) {
    rewards.traits.forEach(trait => {
      if (!newChar.traits.includes(trait)) {
        newChar.traits.push(trait);
      }
    });
  }

  if (rewards.items) {
    rewards.items.forEach(item => {
      if (!newChar.inventory.includes(item)) {
        newChar.inventory.push(item);
      }
    });
  }

  if (rewards.faith) {
    // Награда за благочестие усиливает Верность Императору (люди) и связь с Империумом (все)
    if (newChar.race === 'human') {
      newChar.imperialCreed = Math.max(0, Math.min(10, (newChar.imperialCreed ?? 0) + rewards.faith));
    }
    newChar.factionRelations = { ...newChar.factionRelations };
    newChar.factionRelations.faith = Math.max(-100, Math.min(100, newChar.factionRelations.faith + rewards.faith * 10));
  }

  if (rewards.hiddenParams) {
    newChar.hiddenParams = { ...newChar.hiddenParams };
    for (const key of Object.keys(rewards.hiddenParams) as (keyof CharacterStats['hiddenParams'])[]) {
      const delta = rewards.hiddenParams[key];
      if (typeof delta === 'number') {
        newChar.hiddenParams[key] = Math.max(0, Math.min(10, (newChar.hiddenParams[key] ?? 0) + delta));
      }
    }
  }

  if (rewards.factionRelations) {
    if (rewards.factionRelations.imperium) {
      newChar.factionRelations.imperium = Math.max(-100, Math.min(100, newChar.factionRelations.imperium + rewards.factionRelations.imperium));
    }
    if (rewards.factionRelations.chaos) {
      newChar.factionRelations.chaos = Math.max(-100, Math.min(100, newChar.factionRelations.chaos + rewards.factionRelations.chaos));
    }
    if (rewards.factionRelations.xenos) {
      newChar.factionRelations.xenos = Math.max(-100, Math.min(100, newChar.factionRelations.xenos + rewards.factionRelations.xenos));
    }
    if (rewards.factionRelations.criminals) {
      newChar.factionRelations.criminals = Math.max(-100, Math.min(100, newChar.factionRelations.criminals + rewards.factionRelations.criminals));
    }
  }

  return newChar;
}

/**
 * Получает доступные квесты для персонажа
 */
export function getAvailableQuests(character: CharacterStats, activeQuests: Quest[]): Omit<Quest, 'completed' | 'failed' | 'startedAt'>[] {
  const activeQuestIds = activeQuests.map(q => q.id);
  
  return AVAILABLE_QUESTS.filter(quest => {
    // Не показывать уже активные квесты
    if (activeQuestIds.includes(quest.id)) {
      return false;
    }

    // Требования из шаблона (без хардкода id)
    if (quest.requirements?.maxAge !== undefined && character.age >= quest.requirements.maxAge) {
      return false;
    }
    if (quest.requirements?.races && !quest.requirements.races.includes(character.race)) {
      return false;
    }

    return true;
  });
}

/**
 * Детерминированный выбор следующего квеста (без Math.random — воспроизводимость партий).
 * Чётный год жизни — чётные индексы шаблонов, нечётный — нечётные; смещение задаётся seed'ом.
 */
export function pickNextQuest(
  available: Omit<Quest, 'completed' | 'failed' | 'startedAt'>[],
  seedOffset: number,
  age: number
): Omit<Quest, 'completed' | 'failed' | 'startedAt'> | undefined {
  if (available.length === 0) return undefined;
  const parity = age % 2;
  const matching = available.map((q, i) => ({ q, i })).filter(({ i }) => i % 2 === parity);
  const pool = matching.length > 0 ? matching : available.map((q, i) => ({ q, i }));
  const idx = pool[(seedOffset + Math.floor(age / 2)) % pool.length];
  return idx.q;
}

/**
 * Создаёт новый квест
 */
export function createQuest(questTemplate: Omit<Quest, 'completed' | 'failed' | 'startedAt'>, currentAge: number): Quest {
  return {
    ...questTemplate,
    completed: false,
    failed: false,
    startedAt: currentAge,
  };
}
