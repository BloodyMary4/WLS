import { CharacterStats } from './types';

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
  factionRelations?: {
    imperium?: number;
    chaos?: number;
    xenos?: number;
    criminals?: number;
  };
}

// Доступные квесты в духе Warhammer 40,000
export const AVAILABLE_QUESTS: Omit<Quest, 'completed' | 'failed' | 'startedAt'>[] = [
  {
    id: 'quest_survivor',
    name: 'Выживший в окопах',
    description: 'Пережить первые 10 лет в этом мрачном мире. Смерть подстерегает на каждом шагу.',
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
    },
  },
  {
    id: 'quest_believer',
    name: 'Слуга Императора',
    description: 'Посвятить свою жизнь служению Императору. Вера - твой щит против тьмы.',
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
    },
  },
  {
    id: 'quest_warrior',
    name: 'Молот Императора',
    description: 'Стать оружием в руках Бога-Императора. Сила и воля - твои союзники.',
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
    ],
    rewards: {
      credits: 30,
      traits: ['Инквизитор', 'Охотник на еретиков'],
      items: ['Печать Инквизиции'],
      factionRelations: { imperium: 20, chaos: -20 },
    },
  },
  {
    id: 'quest_mutant',
    name: 'Отметина Варпа',
    description: 'Принять мутации как дар Тёмных Богов. Стань тем, чего боятся люди.',
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
    objectives: [
      {
        id: 'obj_imperium_minus10',
        description: 'Достичь -10 отношений с Империумом',
        completed: false,
        type: 'stat',
        target: 'imperium',
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
];

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
        case 'stat':
          if (obj.target === 'age') {
            completed = character.age >= (obj.targetValue || 0);
          } else if (obj.target === 'credits') {
            completed = character.credits >= (obj.targetValue || 0);
          } else if (obj.target === 'influence') {
            completed = character.influence >= (obj.targetValue || 0);
          } else if (obj.target === 'npcs') {
            completed = character.npcs.length >= (obj.targetValue || 0);
          } else if (obj.target === 'imperium') {
            completed = character.factionRelations.imperium >= (obj.targetValue || 0);
          } else if (obj.target in character.hiddenParams) {
            const value = character.hiddenParams[obj.target as keyof typeof character.hiddenParams];
            completed = (value || 0) >= (obj.targetValue || 0);
          }
          break;
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

    // Проверка требований к возрасту
    if (quest.id === 'quest_survivor' && character.age >= 10) {
      return false;
    }

    return true;
  });
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
