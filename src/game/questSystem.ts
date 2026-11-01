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

// Доступные квесты
export const AVAILABLE_QUESTS: Omit<Quest, 'completed' | 'failed' | 'startedAt'>[] = [
  {
    id: 'quest_survivor',
    name: 'Выживший',
    description: 'Пережить первые 10 лет жизни',
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
      credits: 20,
      influence: 5,
      traits: ['Выживший'],
    },
  },
  {
    id: 'quest_believer',
    name: 'Истинно верующий',
    description: 'Достичь 8+ веры',
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
      influence: 10,
      traits: ['Благочестивый'],
    },
  },
  {
    id: 'quest_warrior',
    name: 'Воин Империума',
    description: 'Достичь 8+ силы и 5+ воли',
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
      credits: 50,
      influence: 15,
      traits: ['Воин'],
      items: ['Церемониальный меч'],
    },
  },
  {
    id: 'quest_scholar',
    name: 'Учёный',
    description: 'Достичь 8+ хитрости и 5+ веры',
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
      credits: 30,
      influence: 20,
      traits: ['Учёный'],
      items: ['Древний свиток'],
    },
  },
  {
    id: 'quest_rich',
    name: 'Богач',
    description: 'Накопить 100+ кредитов',
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
      influence: 10,
      traits: ['Богач'],
    },
  },
  {
    id: 'quest_influential',
    name: 'Влиятельная личность',
    description: 'Достичь 50+ влияния',
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
      credits: 100,
      traits: ['Влиятельный'],
    },
  },
  {
    id: 'quest_diplomat',
    name: 'Дипломат',
    description: 'Достичь 5+ отношений с Империумом',
    objectives: [
      {
        id: 'obj_imperium_5',
        description: 'Достичь 5 отношений с Империумом',
        completed: false,
        type: 'stat',
        target: 'imperium',
        targetValue: 5,
      },
    ],
    rewards: {
      credits: 40,
      influence: 15,
      traits: ['Дипломат'],
    },
  },
  {
    id: 'quest_social',
    name: 'Душа компании',
    description: 'Встретить 10+ NPC',
    objectives: [
      {
        id: 'obj_npcs_10',
        description: 'Встретить 10 NPC',
        completed: false,
        type: 'stat',
        target: 'npcs',
        targetValue: 10,
      },
    ],
    rewards: {
      credits: 25,
      influence: 10,
      traits: ['Общительный'],
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
